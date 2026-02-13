/**
 * Content Engine
 * 
 * Generuje obsah pomocí Gemini AI s modulárním prompt builderem.
 * Implementuje 4-1-1 kadenci a self-rating.
 */

import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { supabase } from '@/lib/supabase/client';
import { buildContentPrompt, type PromptContext } from './prompt-builder';
import { generateVisualAssets, type VisualAssets } from '@/lib/visual/visual-agent';
import { findMatchingMedia, markMediaUsed } from '@/lib/ai/vision-engine';

export interface GeneratedContent {
  text: string;
  image_prompt?: string;
  alt_text?: string;
  matched_image_url?: string | null;
  matched_media_id?: string | null;
  scores: {
    creativity: number;
    tone_match: number;
    hallucination_risk: number;
    value_score: number;
    overall: number;
  };
  visual?: VisualAssets;
}

export interface GenerateRequest {
  projectId: string;
  platform: string;
  contentType?: string;
  patternId?: string;
}

/**
 * Determine next content type based on 4-1-1 rule and post history
 */
export async function getNextContentType(
  projectId: string,
  contentMix: Record<string, number>
): Promise<string> {
  if (!supabase) return 'educational';

  // Get last 6 posts
  const { data: history } = await supabase
    .from('post_history')
    .select('content_type')
    .eq('project_id', projectId)
    .order('posted_at', { ascending: false })
    .limit(6);

  if (!history || history.length === 0) return 'educational';

  // Count types in recent history
  const counts: Record<string, number> = {};
  for (const h of history) {
    counts[h.content_type] = (counts[h.content_type] || 0) + 1;
  }

  // Find the type that's most underrepresented vs target mix
  let bestType = 'educational';
  let bestGap = -Infinity;

  for (const [type, targetRatio] of Object.entries(contentMix)) {
    const actual = (counts[type] || 0) / Math.max(history.length, 1);
    const gap = targetRatio - actual;
    if (gap > bestGap) {
      bestGap = gap;
      bestType = type;
    }
  }

  return bestType;
}

/**
 * Load project context from DB
 */
async function loadProjectContext(projectId: string): Promise<{
  project: Record<string, unknown>;
  kbEntries: Array<{ category: string; title: string; content: string }>;
  recentPosts: string[];
} | null> {
  if (!supabase) return null;

  const [projectRes, kbRes, recentRes] = await Promise.all([
    supabase.from('projects').select('*').eq('id', projectId).single(),
    supabase.from('knowledge_base').select('category, title, content').eq('project_id', projectId).eq('is_active', true),
    supabase.from('content_queue').select('text_content').eq('project_id', projectId).in('status', ['approved', 'sent', 'scheduled', 'published', 'review']).order('created_at', { ascending: false }).limit(50),
  ]);

  if (!projectRes.data) return null;

  return {
    project: projectRes.data,
    kbEntries: kbRes.data || [],
    recentPosts: (recentRes.data || []).map((p: { text_content: string }) => p.text_content),
  };
}

/**
 * Generate content for a project
 */
export async function generateContent(req: GenerateRequest): Promise<GeneratedContent> {
  const ctx = await loadProjectContext(req.projectId);
  if (!ctx) throw new Error('Project not found');

  const project = ctx.project;

  // Determine content type
  const contentType = (req.contentType || await getNextContentType(
    req.projectId,
    (project.content_mix as Record<string, number>) || { educational: 0.66, soft_sell: 0.17, hard_sell: 0.17 }
  )) as PromptContext['contentType'];

  // Load pattern if specified
  let patternTemplate: string | undefined;
  if (req.patternId && supabase) {
    const { data: pattern } = await supabase
      .from('content_patterns')
      .select('structure_template')
      .eq('id', req.patternId)
      .single();
    patternTemplate = pattern?.structure_template;
  }

  // Load news context (Contextual Pulse)
  let newsContext: string | undefined;
  if (supabase) {
    try {
      const { data: news } = await supabase
        .from('project_news')
        .select('title, summary, source_name')
        .eq('project_id', req.projectId)
        .eq('is_used_in_post', false)
        .order('published_at', { ascending: false })
        .limit(3);
      if (news && news.length > 0) {
        newsContext = news.map((n: { title: string; summary: string; source_name: string }) =>
          `- [${n.source_name}] ${n.title}: ${n.summary}`
        ).join('\n');
      }
    } catch {
      // project_news table may not exist yet
    }
  }

  // Build prompt
  const prompt = await buildContentPrompt({
    projectId: req.projectId,
    projectName: project.name as string,
    contentType,
    patternTemplate,
    platform: req.platform,
    moodSettings: (project.mood_settings as PromptContext['moodSettings']) || { tone: 'professional', energy: 'medium', style: 'informative' },
    styleRules: (project.style_rules as Record<string, unknown>) || {},
    constraints: (project.constraints as PromptContext['constraints']) || { forbidden_topics: [], mandatory_terms: [], max_hashtags: 5 },
    semanticAnchors: (project.semantic_anchors as string[]) || [],
    kbEntries: ctx.kbEntries,
    recentPosts: ctx.recentPosts,
    newsContext,
  });

  // Generate with Gemini
  const { text: rawResponse } = await generateText({
    model: google('gemini-2.0-flash'),
    prompt,
    temperature: 0.8,
  });

  // Parse JSON response
  let content: GeneratedContent;
  try {
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');
    content = JSON.parse(jsonMatch[0]) as GeneratedContent;
  } catch {
    // Fallback: treat entire response as text
    content = {
      text: rawResponse,
      scores: {
        creativity: 5,
        tone_match: 5,
        hallucination_risk: 5,
        value_score: 5,
        overall: 5,
      },
    };
  }

  // Generate visual assets (chart/card/photo)
  try {
    const visualIdentity = (project.visual_identity as Record<string, string>) || {};
    const visual = await generateVisualAssets({
      text: content.text,
      projectName: project.name as string,
      platform: req.platform,
      visualIdentity,
      kbEntries: ctx.kbEntries,
    });
    content.visual = visual;
  } catch {
    // Visual generation failed, continue without
    content.visual = { visual_type: 'none', chart_url: null, card_url: null, image_prompt: content.image_prompt || null };
  }

  // Media matching: find best photo from Media Library (pgvector)
  try {
    const matches = await findMatchingMedia(req.projectId, content.text, {
      limit: 5,
      fileType: 'image',
      excludeRecentlyUsed: true,
    });
    if (matches.length > 0) {
      content.matched_image_url = matches[0].public_url;
      content.matched_media_id = matches[0].id;
      await markMediaUsed(matches[0].id);
    }
  } catch {
    // Media matching failed (no media_assets table or no processed photos)
  }

  return content;
}
