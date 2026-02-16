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
import { hugoEditorReview, type EditorContext } from './hugo-editor';

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
  editor_review?: {
    changes: string[];
    original_score: number;
    editor_score: number;
  };
  reasoning_steps?: Record<string, unknown>;
  prompt_performance?: Record<string, unknown>;
}

export interface GenerateRequest {
  projectId: string;
  platform: string;
  contentType?: string;
  patternId?: string;
  forcePhoto?: boolean;
}

/**
 * Determine next content type based on 4-1-1 rule and post history.
 * Checks both post_history (published) AND content_queue (pending/review)
 * to ensure variety even before any posts are published.
 */
export async function getNextContentType(
  projectId: string,
  contentMix: Record<string, number>
): Promise<string> {
  if (!supabase) return 'educational';

  // Get last 6 published posts
  const { data: history } = await supabase
    .from('post_history')
    .select('content_type')
    .eq('project_id', projectId)
    .order('posted_at', { ascending: false })
    .limit(6);

  // Also check content_queue (review/approved/scheduled) for unpublished posts
  const { data: queueHistory } = await supabase
    .from('content_queue')
    .select('content_type')
    .eq('project_id', projectId)
    .in('status', ['review', 'approved', 'scheduled'])
    .order('created_at', { ascending: false })
    .limit(10);

  // Merge both sources (queue first as it's more recent)
  const allPosts = [
    ...(queueHistory || []),
    ...(history || []),
  ].slice(0, 12);

  if (allPosts.length === 0) {
    // No posts at all — pick randomly weighted by content mix
    const types = Object.entries(contentMix);
    const rand = Math.random();
    let cumulative = 0;
    for (const [type, ratio] of types) {
      cumulative += ratio;
      if (rand <= cumulative) return type;
    }
    return types[0]?.[0] || 'educational';
  }

  // Count types in combined history
  const counts: Record<string, number> = {};
  for (const h of allPosts) {
    counts[h.content_type] = (counts[h.content_type] || 0) + 1;
  }

  // Find the type that's most underrepresented vs target mix
  let bestType = 'educational';
  let bestGap = -Infinity;

  for (const [type, targetRatio] of Object.entries(contentMix)) {
    const actual = (counts[type] || 0) / Math.max(allPosts.length, 1);
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
  feedbackHistory: Array<{ original_text: string; edited_text: string; feedback_note: string }>;
} | null> {
  if (!supabase) return null;

  const [projectRes, kbRes, recentRes, feedbackRes] = await Promise.all([
    supabase.from('projects').select('*').eq('id', projectId).single(),
    supabase.from('knowledge_base').select('category, title, content').eq('project_id', projectId).eq('is_active', true),
    supabase.from('content_queue').select('text_content').eq('project_id', projectId).in('status', ['approved', 'sent', 'scheduled', 'published', 'review']).order('created_at', { ascending: false }).limit(50),
    // Feedback loop: load recent human edits for learning
    supabase.from('content_queue')
      .select('text_content, edited_text, feedback_note')
      .eq('project_id', projectId)
      .not('edited_text', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(5),
  ]);

  if (!projectRes.data) return null;

  return {
    project: projectRes.data,
    kbEntries: kbRes.data || [],
    recentPosts: (recentRes.data || []).map((p: { text_content: string }) => p.text_content),
    feedbackHistory: (feedbackRes.data || []).map((f: Record<string, unknown>) => ({
      original_text: (f.text_content as string) || '',
      edited_text: (f.edited_text as string) || '',
      feedback_note: (f.feedback_note as string) || '',
    })),
  };
}

/**
 * Generate content for a project
 */
export async function generateContent(req: GenerateRequest): Promise<GeneratedContent> {
  const startTime = Date.now();
  const reasoning: Record<string, unknown> = {};
  const performance: Record<string, unknown> = { model: 'gemini-2.0-flash', temperature: 0.8 };

  const ctx = await loadProjectContext(req.projectId);
  if (!ctx) throw new Error('Project not found');

  const project = ctx.project;

  // Determine content type
  const contentMix = (project.content_mix as Record<string, number>) || { educational: 0.66, soft_sell: 0.17, hard_sell: 0.17 };
  const wasExplicit = !!req.contentType;
  const contentType = (req.contentType || await getNextContentType(req.projectId, contentMix)) as PromptContext['contentType'];
  
  reasoning.content_type_decision = {
    chosen: contentType,
    source: wasExplicit ? 'explicit' : 'auto_4-1-1',
    target_mix: contentMix,
  };

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
  let newsCount = 0;
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
        newsCount = news.length;
        newsContext = news.map((n: { title: string; summary: string; source_name: string }) =>
          `- [${n.source_name}] ${n.title}: ${n.summary}`
        ).join('\n');
      }
    } catch {
      // project_news table may not exist yet
    }
  }
  reasoning.news_context = { available: newsCount, used: newsCount > 0 };

  // Build feedback context from human edits
  let feedbackContext: string | undefined;
  if (ctx.feedbackHistory.length > 0) {
    const parts: string[] = [];
    parts.push('FEEDBACK OD ADMINA (uč se z těchto úprav):');
    for (const fb of ctx.feedbackHistory) {
      parts.push(`PŮVODNÍ: "${fb.original_text.substring(0, 100)}..."`);
      parts.push(`UPRAVENO NA: "${fb.edited_text.substring(0, 100)}..."`);
      if (fb.feedback_note) parts.push(`POZNÁMKA: ${fb.feedback_note}`);
      parts.push('---');
    }
    parts.push('Poučení: Přizpůsob styl a obsah podle těchto úprav. Opakuj vzory, které admin preferuje.');
    feedbackContext = parts.join('\n');
  }
  reasoning.feedback_loop = { edits_available: ctx.feedbackHistory.length, used: ctx.feedbackHistory.length > 0 };
  reasoning.kb_facts = { total: ctx.kbEntries.length, used_in_prompt: ctx.kbEntries.length };
  reasoning.dedup_context = { recent_posts: ctx.recentPosts.length };

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
    newsContext: [newsContext, feedbackContext].filter(Boolean).join('\n\n---\n'),
  });

  // Generate with Gemini
  const { text: rawResponse } = await generateText({
    model: google('gemini-2.0-flash'),
    prompt,
    temperature: 0.8,
  });

  // Parse JSON response (strip markdown code blocks if present)
  const cleanedResponse = rawResponse
    .replace(/^```(?:json)?\s*\n?/i, '')
    .replace(/\n?\s*```\s*$/i, '')
    .trim();
  let content: GeneratedContent;
  try {
    // Try 1: Direct parse
    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');
    const parsed = JSON.parse(jsonMatch[0]);
    // Ensure text field exists and is a string (not nested JSON)
    if (typeof parsed.text !== 'string') throw new Error('text field is not a string');
    content = parsed as GeneratedContent;
  } catch {
    // Try 2: Extract "text" field with regex if JSON is malformed
    const textMatch = cleanedResponse.match(/"text"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    if (textMatch) {
      const extractedText = textMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
      // Try to get scores too
      let scores = { creativity: 5, tone_match: 5, hallucination_risk: 5, value_score: 5, overall: 5 };
      const scoresMatch = cleanedResponse.match(/"scores"\s*:\s*(\{[^}]+\})/);
      if (scoresMatch) {
        try { scores = JSON.parse(scoresMatch[1]); } catch { /* use defaults */ }
      }
      content = { text: extractedText, scores };
    } else {
      // Fallback: treat entire response as text (strip any JSON artifacts)
      const fallbackText = rawResponse
        .replace(/^[\s\S]*?"text"\s*:\s*"/i, '')
        .replace(/"\s*,\s*"image_prompt[\s\S]*$/i, '')
        .replace(/\\n/g, '\n')
        .replace(/\\"/g, '"')
        .trim();
      content = {
        text: fallbackText || rawResponse,
        scores: { creativity: 5, tone_match: 5, hallucination_risk: 5, value_score: 5, overall: 5 },
      };
    }
  }

  // Sanitize text: remove hashtags, trailing emoji, URLs
  if (content.text) {
    content.text = content.text
      .replace(/\s*#\w[\w\u00C0-\u024F]*/g, '')  // Remove #hashtags
      .replace(/https?:\/\/\S+/g, '')              // Remove URLs
      .replace(/\s+$/gm, '')                       // Trim trailing whitespace per line
      .trim();
  }

  // Hugo-Editor: self-correction 2nd pass
  const MIN_QUALITY_SCORE = 7;
  if (content.scores.overall >= MIN_QUALITY_SCORE) {
    try {
      // Build EditorContext for hugoEditorReview
      const editorCtx: EditorContext = {
        project,
        kbEntries: ctx.kbEntries,
        feedbackHistory: ctx.feedbackHistory,
      };
      const editorResult = await hugoEditorReview(content.text, editorCtx, req.platform);
      if (editorResult.editor_scores.overall >= content.scores.overall) {
        content.editor_review = {
          changes: editorResult.changes,
          original_score: content.scores.overall,
          editor_score: editorResult.editor_scores.overall,
        };
        content.text = editorResult.improved_text;
        content.scores = {
          ...content.scores,
          ...editorResult.editor_scores as GeneratedContent['scores'],
        };
        reasoning.editor_review = {
          triggered: true,
          changes_made: editorResult.changes.length,
          score_improvement: editorResult.editor_scores.overall - content.scores.overall,
          accepted: true,
        };
      } else {
        reasoning.editor_review = {
          triggered: true,
          changes_made: editorResult.changes.length,
          score_improvement: editorResult.editor_scores.overall - content.scores.overall,
          accepted: false,
          reason: 'editor_score_lower',
        };
      }
    } catch {
      // Editor failed, continue with original
      reasoning.editor_review = { triggered: true, accepted: false, reason: 'editor_failed' };
    }
  } else {
    reasoning.editor_review = { triggered: false, reason: `score_too_low (${content.scores.overall} < ${MIN_QUALITY_SCORE})` };
  }

  // Read media_strategy from project's orchestrator_config
  const orchConfig = (project.orchestrator_config as Record<string, unknown>) || {};
  const mediaStrategy = (orchConfig.media_strategy as string) || 'auto';

  // Generate visual assets (chart/card/photo)
  if (mediaStrategy !== 'none' || req.forcePhoto) {
    try {
      const visualIdentity = (project.visual_identity as Record<string, string>) || {};
      const visual = await generateVisualAssets({
        text: content.text,
        projectName: project.name as string,
        platform: req.platform,
        visualIdentity,
        kbEntries: ctx.kbEntries,
        projectId: req.projectId,
        logoUrl: (visualIdentity as Record<string, string>).logo_url || null,
        forcePhoto: req.forcePhoto,
      });
      content.visual = visual;
      reasoning.visual_decision = {
        type: visual.visual_type,
        reason: req.forcePhoto ? 'forcePhoto=true' : `media_strategy=${mediaStrategy}`,
        generated_image: !!visual.generated_image_url,
        chart: !!visual.chart_url,
        card: !!visual.card_url,
      };
    } catch {
      // Visual generation failed, continue without
      content.visual = { visual_type: 'none', chart_url: null, card_url: null, image_prompt: content.image_prompt || null };
      reasoning.visual_decision = { type: 'none', reason: 'generation_failed' };
    }
  }

  // Media matching: find best photo from Media Library (pgvector)
  if (mediaStrategy === 'auto') {
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
        reasoning.media_matching = {
          matched: true,
          similarity: (matches[0] as { similarity?: number }).similarity || 0,
          total_candidates: matches.length,
        };
      }
    } catch {
      // Media matching failed (no media_assets table or no processed photos)
    }
  }

  // Performance metrics
  const duration = Date.now() - startTime;
  performance.latency_ms = duration;
  performance.scores = content.scores;

  // Attach reasoning and performance to content
  content.reasoning_steps = reasoning;
  content.prompt_performance = performance;

  return content;
}
