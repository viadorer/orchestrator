/**
 * Blog GitHub Publisher
 *
 * Publikuje blogové články do GitHub repozitářů přes GitHub API.
 * Využívá existující readFile/writeFile z aio/github-injector.
 */

import { readFile, writeFile } from '@/lib/aio/github-injector';
import { supabase } from '@/lib/supabase/client';
import type { BlogMeta, BlogConfig, BlogPublishResult } from './types';
import { DEFAULT_BLOG_CONFIG } from './types';

interface AioSiteInfo {
  github_repo: string;
  github_branch: string;
}

function resolveBlogConfig(orchestratorConfig: Record<string, unknown> | null): BlogConfig {
  if (!orchestratorConfig?.blog_config) return DEFAULT_BLOG_CONFIG;
  return { ...DEFAULT_BLOG_CONFIG, ...(orchestratorConfig.blog_config as Partial<BlogConfig>) };
}

async function findAioSite(projectId: string): Promise<AioSiteInfo | null> {
  if (!supabase) return null;

  const { data } = await supabase
    .from('aio_sites')
    .select('github_repo, github_branch')
    .eq('project_id', projectId)
    .eq('is_active', true)
    .single();

  return data as AioSiteInfo | null;
}

async function uploadCoverImage(
  repo: string,
  branch: string,
  imagePath: string,
  imageUrl: string,
  slug: string,
): Promise<{ commitSha: string; imageFinalPath: string } | null> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) return null;

    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const ext = imageUrl.match(/\.(png|jpg|jpeg|webp|avif)(\?|$)/i)?.[1] || 'png';
    const fileName = `${slug}.${ext}`;
    const filePath = `${imagePath}/${fileName}`;

    const existing = await readFile(repo, filePath, branch);

    const url = `https://api.github.com/repos/${repo}/contents/${encodeURIComponent(filePath)}`;
    const token = process.env.GITHUB_PAT;
    if (!token) throw new Error('GITHUB_PAT not configured');

    const body: Record<string, unknown> = {
      message: `Blog: Add cover image for ${slug}`,
      content: base64,
      branch,
    };
    if (existing) body.sha = existing.sha;

    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Image upload failed: ${res.status} ${errText}`);
    }

    const data = await res.json();
    return {
      commitSha: data.commit?.sha || '',
      imageFinalPath: `/${imagePath}/${fileName}`,
    };
  } catch (err) {
    console.error('Cover image upload failed:', err);
    return null;
  }
}

async function updatePostsJson(
  repo: string,
  branch: string,
  postsJsonPath: string,
  newEntry: BlogMeta,
): Promise<string | null> {
  try {
    const existing = await readFile(repo, postsJsonPath, branch);

    let postsData: { posts: BlogMeta[] } = { posts: [] };
    if (existing) {
      try {
        postsData = JSON.parse(existing.content) as { posts: BlogMeta[] };
      } catch {
        postsData = { posts: [] };
      }
    }

    // Remove existing entry with same slug (update case)
    postsData.posts = postsData.posts.filter((p) => p.slug !== newEntry.slug);

    // Prepend new entry
    postsData.posts.unshift(newEntry);

    const updatedJson = JSON.stringify(postsData, null, 2);

    const { commitSha } = await writeFile(
      repo,
      postsJsonPath,
      updatedJson,
      `Blog: Update posts.json with "${newEntry.title}"`,
      branch,
      existing?.sha,
    );

    return commitSha;
  } catch (err) {
    console.error('posts.json update failed:', err);
    return null;
  }
}

export async function publishBlogToGitHub(
  queueItemId: string,
): Promise<BlogPublishResult> {
  if (!supabase) {
    return { success: false, repo: '', commitShas: [], error: 'Supabase not configured' };
  }

  // Load queue item
  const { data: item } = await supabase
    .from('content_queue')
    .select('*, projects!inner(name, website_url, orchestrator_config)')
    .eq('id', queueItemId)
    .single();

  if (!item) {
    return { success: false, repo: '', commitShas: [], error: 'Queue item not found' };
  }

  if (item.content_type !== 'blog') {
    return { success: false, repo: '', commitShas: [], error: 'Item is not a blog post' };
  }

  const projectId = item.project_id as string;
  const blogMeta = item.blog_meta as BlogMeta;
  const body = item.markdown_body as string;
  const orchConfig = ((item.projects as Record<string, unknown>)?.orchestrator_config as Record<string, unknown>) || null;
  const blogConfig = resolveBlogConfig(orchConfig);

  // Find GitHub repo
  const site = await findAioSite(projectId);
  if (!site) {
    return { success: false, repo: '', commitShas: [], error: `No AIO site configured for project ${projectId}` };
  }

  const { github_repo: repo, github_branch: branch } = site;
  const commitShas: string[] = [];

  // 1. Upload cover image (if image_url exists on queue item)
  let imageFinalPath = blogMeta.image;
  const imageUrl = item.image_url as string | null;
  if (imageUrl) {
    const imageResult = await uploadCoverImage(
      repo,
      branch,
      blogConfig.image_path,
      imageUrl,
      blogMeta.slug,
    );
    if (imageResult) {
      imageFinalPath = imageResult.imageFinalPath;
      commitShas.push(imageResult.commitSha);
      // Rate limit
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }

  // Update meta with final image path
  const finalMeta: BlogMeta = { ...blogMeta, image: imageFinalPath };

  // 2. Push post file
  const fileExt = blogConfig.post_format === 'markdown' ? 'md' : 'html';
  const postFilePath = `${blogConfig.posts_path}/${blogMeta.slug}.${fileExt}`;

  try {
    const existing = await readFile(repo, postFilePath, branch);
    const { commitSha } = await writeFile(
      repo,
      postFilePath,
      body,
      `Blog: Add "${blogMeta.title}"`,
      branch,
      existing?.sha,
    );
    commitShas.push(commitSha);
  } catch (err) {
    return {
      success: false,
      repo,
      commitShas,
      error: `Post file push failed: ${err instanceof Error ? err.message : 'unknown'}`,
    };
  }

  // Rate limit
  await new Promise((resolve) => setTimeout(resolve, 300));

  // 3. Update posts.json (if configured)
  let postsJsonUpdated = false;
  if (blogConfig.posts_json_path) {
    const jsonSha = await updatePostsJson(repo, branch, blogConfig.posts_json_path, finalMeta);
    if (jsonSha) {
      commitShas.push(jsonSha);
      postsJsonUpdated = true;
    }
  }

  // 4. Trigger deploy webhook (optional)
  if (orchConfig?.blog_config && (orchConfig.blog_config as Record<string, unknown>).deploy_hook_url) {
    try {
      await fetch((orchConfig.blog_config as Record<string, unknown>).deploy_hook_url as string, {
        method: 'POST',
      });
    } catch {
      // Non-critical
    }
  }

  // 5. Update queue item status
  await supabase
    .from('content_queue')
    .update({
      status: 'sent',
      blog_meta: finalMeta,
      sent_at: new Date().toISOString(),
    })
    .eq('id', queueItemId);

  // 6. Log
  await supabase.from('agent_log').insert({
    project_id: projectId,
    action: 'publish_blog_to_github',
    details: {
      queue_id: queueItemId,
      repo,
      post_file: postFilePath,
      posts_json_updated: postsJsonUpdated,
      commits: commitShas.length,
      last_commit: commitShas[commitShas.length - 1],
    },
  });

  return {
    success: true,
    repo,
    postFile: postFilePath,
    imageFile: imageFinalPath,
    postsJsonUpdated,
    commitShas,
  };
}
