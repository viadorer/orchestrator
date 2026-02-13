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

export interface GeneratedContent {
  text: string;
  image_prompt?: string;
  alt_text?: string;
  scores: {
    creativity: number;
    tone_match: number;
    hallucination_risk: number;
    value_score: number;
    overall: number;
  };
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
    supabase.from('content_queue').select('text_content').eq('project_id', projectId).in('status', ['approved', 'sent']).order('created_at', { ascending: false }).limit(5),
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

  // Load news context
  let newsContext: string | undefined;
  if (supabase) {
    const { data: news } = await supabase
      .from('project_news')
      .select('title, summary')
      .eq('project_id', req.projectId)
      .eq('is_used', false)
      .order('fetched_at', { ascending: false })
      .limit(3);
    if (news && news.length > 0) {
      newsContext = news.map((n: { title: string; summary: string }) => `- ${n.title}: ${n.summary}`).join('\n');
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
  try {
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');
    const parsed = JSON.parse(jsonMatch[0]) as GeneratedContent;
    return parsed;
  } catch {
    // Fallback: treat entire response as text
    return {
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
}
