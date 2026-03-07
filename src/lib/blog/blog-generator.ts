/**
 * Blog Generator
 *
 * Generuje blogové články přes Gemini AI a ukládá do content_queue.
 * Využívá KB, entity profily a RSS pulse pro kontext.
 */

import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { supabase } from '@/lib/supabase/client';
import {
  BLOG_SYSTEM_PROMPT,
  BLOG_HTML_FORMAT_PROMPT,
  BLOG_MARKDOWN_FORMAT_PROMPT,
  BLOG_META_PROMPT,
} from './blog-prompts';
import type { BlogMeta, BlogConfig, BlogGenerateResult } from './types';
import { DEFAULT_BLOG_CONFIG } from './types';

export interface BlogGenerateRequest {
  projectId: string;
  topic?: string;
  category?: string;
  postFormat?: 'html' | 'markdown';
}

function resolveBlogConfig(orchestratorConfig: Record<string, unknown> | null): BlogConfig {
  if (!orchestratorConfig?.blog_config) return DEFAULT_BLOG_CONFIG;
  return { ...DEFAULT_BLOG_CONFIG, ...(orchestratorConfig.blog_config as Partial<BlogConfig>) };
}

function formatCzechDate(dateStr: string): string {
  const months = [
    'ledna', 'února', 'března', 'dubna', 'května', 'června',
    'července', 'srpna', 'září', 'října', 'listopadu', 'prosince',
  ];
  const d = new Date(dateStr);
  return `${d.getDate()}. ${months[d.getMonth()]} ${d.getFullYear()}`;
}

async function loadProjectContext(projectId: string): Promise<{
  project: Record<string, unknown>;
  kb: Array<{ category: string; title: string; content: string }>;
  entityProfile: Record<string, unknown> | null;
  recentBlogSlugs: string[];
  rssContext: string | null;
}> {
  if (!supabase) throw new Error('Supabase not configured');

  const [projectRes, kbRes, entityRes, recentRes, rssRes] = await Promise.all([
    supabase.from('projects').select('*').eq('id', projectId).single(),
    supabase
      .from('knowledge_base')
      .select('category, title, content')
      .eq('project_id', projectId)
      .eq('is_active', true),
    supabase
      .from('aio_entity_profiles')
      .select('*')
      .eq('project_id', projectId)
      .single(),
    supabase
      .from('content_queue')
      .select('blog_meta')
      .eq('project_id', projectId)
      .eq('content_type', 'blog')
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('rss_articles')
      .select('title, summary, source_name')
      .eq('project_id', projectId)
      .order('published_at', { ascending: false })
      .limit(10),
  ]);

  if (!projectRes.data) throw new Error(`Project ${projectId} not found`);

  const recentBlogSlugs = (recentRes.data || [])
    .map((r) => (r.blog_meta as Record<string, unknown>)?.slug as string)
    .filter(Boolean);

  const rssArticles = rssRes.data || [];
  const rssContext = rssArticles.length > 0
    ? rssArticles.map((a) => `- ${a.title} (${a.source_name}): ${a.summary || ''}`).join('\n')
    : null;

  return {
    project: projectRes.data as Record<string, unknown>,
    kb: (kbRes.data || []) as Array<{ category: string; title: string; content: string }>,
    entityProfile: (entityRes.data as Record<string, unknown>) || null,
    recentBlogSlugs,
    rssContext,
  };
}

function buildBlogPrompt(
  ctx: Awaited<ReturnType<typeof loadProjectContext>>,
  config: BlogConfig,
  request: BlogGenerateRequest,
): string {
  const parts: string[] = [BLOG_SYSTEM_PROMPT];

  // Project identity
  const entityName = (ctx.entityProfile?.official_name as string) || (ctx.project.name as string);
  const entityDesc = (ctx.entityProfile?.short_description as string) || '';
  parts.push(`\nPROJEKT: ${entityName}`);
  if (entityDesc) parts.push(`POPIS: ${entityDesc}`);
  if (ctx.project.website_url) parts.push(`WEB: ${ctx.project.website_url as string}`);

  // KB context
  if (ctx.kb.length > 0) {
    parts.push('\nZNALOSTNÍ BÁZE:');
    const byCategory: Record<string, string[]> = {};
    for (const entry of ctx.kb) {
      if (!byCategory[entry.category]) byCategory[entry.category] = [];
      byCategory[entry.category].push(`  - ${entry.title}: ${entry.content.substring(0, 300)}`);
    }
    for (const [cat, entries] of Object.entries(byCategory)) {
      parts.push(`[${cat}]`);
      parts.push(entries.join('\n'));
    }
  }

  // RSS pulse context
  if (ctx.rssContext) {
    parts.push('\nAKTUÁLNÍ ZPRÁVY (RSS Pulse) — můžeš využít jako inspiraci:');
    parts.push(ctx.rssContext);
  }

  // Avoid duplicates
  if (ctx.recentBlogSlugs.length > 0) {
    parts.push(`\nUŽ EXISTUJÍCÍ ČLÁNKY (vyhni se stejným tématům): ${ctx.recentBlogSlugs.join(', ')}`);
  }

  // Categories
  if (config.categories.length > 0) {
    parts.push(`\nDOSTUPNÉ KATEGORIE: ${config.categories.map((c) => `${c.id} (${c.name})`).join(', ')}`);
  }

  // Format instructions
  const formatPrompt = request.postFormat === 'markdown' || config.post_format === 'markdown'
    ? BLOG_MARKDOWN_FORMAT_PROMPT
    : BLOG_HTML_FORMAT_PROMPT;
  parts.push(`\n${formatPrompt}`);

  // Meta instructions
  parts.push(`\n${BLOG_META_PROMPT}`);

  // Topic
  if (request.topic) {
    parts.push(`\nTÉMA ČLÁNKU: ${request.topic}`);
  } else {
    parts.push('\nVyber téma, které je relevantní pro projekt a jeho cílovou skupinu. Využij KB a aktuální zprávy.');
  }

  if (request.category) {
    parts.push(`KATEGORIE: ${request.category}`);
  }

  parts.push(`\nVýstup ve formátu:
---META---
{JSON metadata}
---BODY---
{obsah článku}`);

  return parts.join('\n');
}

function parseAiResponse(raw: string): { meta: BlogMeta; body: string } {
  const metaMatch = raw.match(/---META---\s*([\s\S]*?)\s*---BODY---/);
  const bodyMatch = raw.match(/---BODY---\s*([\s\S]*)/);

  if (!metaMatch || !bodyMatch) {
    throw new Error('AI response format invalid — missing ---META--- or ---BODY--- markers');
  }

  let metaJson = metaMatch[1].trim();
  // Strip markdown code fences if present
  metaJson = metaJson.replace(/^```json?\s*/i, '').replace(/\s*```$/, '');

  let parsedMeta: Record<string, unknown>;
  try {
    parsedMeta = JSON.parse(metaJson);
  } catch {
    throw new Error(`Failed to parse blog meta JSON: ${metaJson.substring(0, 200)}`);
  }

  const today = new Date().toISOString().split('T')[0];

  const meta: BlogMeta = {
    title: (parsedMeta.title as string) || 'Bez názvu',
    slug: (parsedMeta.slug as string) || 'untitled',
    excerpt: (parsedMeta.excerpt as string) || '',
    seoTitle: (parsedMeta.seoTitle as string) || (parsedMeta.title as string) || '',
    seoDescription: (parsedMeta.seoDescription as string) || '',
    category: (parsedMeta.category as string) || 'tips',
    categoryName: (parsedMeta.categoryName as string) || 'Tipy & Triky',
    image: '',
    imageAlt: (parsedMeta.imageAlt as string) || '',
    date: today,
    dateFormatted: formatCzechDate(today),
    readTime: (parsedMeta.readTime as number) || 8,
    keywords: (parsedMeta.keywords as string) || '',
    featured: (parsedMeta.featured as boolean) || false,
  };

  const body = bodyMatch[1].trim();

  return { meta, body };
}

export async function generateBlogPost(
  request: BlogGenerateRequest,
): Promise<BlogGenerateResult> {
  if (!supabase) throw new Error('Supabase not configured');

  const ctx = await loadProjectContext(request.projectId);
  const orchConfig = (ctx.project.orchestrator_config as Record<string, unknown>) || null;
  const blogConfig = resolveBlogConfig(orchConfig);
  const postFormat = request.postFormat || blogConfig.post_format;

  const prompt = buildBlogPrompt(ctx, blogConfig, { ...request, postFormat });

  const { text: rawResponse, usage } = await generateText({
    model: google('gemini-2.0-flash'),
    prompt,
    temperature: 0.7,
  });

  const { meta, body } = parseAiResponse(rawResponse);

  // Save to content_queue
  const { data: inserted, error } = await supabase
    .from('content_queue')
    .insert({
      project_id: request.projectId,
      content_type: 'blog',
      text_content: meta.excerpt,
      markdown_body: body,
      blog_meta: meta,
      status: 'review',
      platforms: ['blog'],
      ai_scores: {
        blog: true,
        word_count: body.split(/\s+/).length,
        format: postFormat,
      },
      generation_context: {
        topic: request.topic || 'auto',
        category: request.category || 'auto',
        tokens: usage?.totalTokens || 0,
      },
    })
    .select('id')
    .single();

  if (error || !inserted) {
    throw new Error(`Failed to save blog post: ${error?.message || 'unknown'}`);
  }

  // Log
  await supabase.from('agent_log').insert({
    project_id: request.projectId,
    action: 'generate_blog_post',
    details: {
      queue_id: inserted.id,
      title: meta.title,
      slug: meta.slug,
      word_count: body.split(/\s+/).length,
      tokens: usage?.totalTokens || 0,
    },
  });

  return {
    queueId: inserted.id as string,
    blogMeta: meta,
    body,
  };
}
