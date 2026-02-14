/**
 * Visual Agent
 * 
 * Hugo rozhodne, jaký vizuál post potřebuje, a automaticky ho vygeneruje.
 * 
 * 4 vrstvy:
 * 1. QuickChart.io – grafy z demografických dat (zdarma)
 * 2. Textová karta (@vercel/og) – hook číslo na pozadí s logem
 * 3. Imagen 4 – AI generování fotek (Google Gemini API)
 * 4. Image prompt fallback – textový popis pokud Imagen selže
 */

import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { generateChartUrl, CHART_TEMPLATES, type ChartData, type VisualIdentity } from './quickchart';
import { generateAndStoreImage, buildCleanImagePrompt } from './imagen';
import { generateMediaEmbedding } from '@/lib/ai/vision-engine';
import { supabase } from '@/lib/supabase/client';

export interface VisualAssets {
  visual_type: 'chart' | 'card' | 'photo' | 'generated_photo' | 'matched_photo' | 'none';
  chart_url: string | null;
  card_url: string | null;
  image_prompt: string | null;
  generated_image_url?: string | null;
  media_asset_id?: string | null;
  match_similarity?: number;
}

interface VisualContext {
  text: string;
  projectName: string;
  platform: string;
  visualIdentity: Partial<VisualIdentity>;
  kbEntries: Array<{ category: string; title: string; content: string }>;
  projectId?: string;
  logoUrl?: string | null;
}

/**
 * Hugo decides what visual the post needs and generates it
 */
export async function generateVisualAssets(ctx: VisualContext): Promise<VisualAssets> {
  // Step 1: Ask Hugo what visual type this post needs
  const decision = await decideVisualType(ctx);

  // Step 2: Generate the visual based on decision
  switch (decision.visual_type) {
    case 'card':
      return generateCardVisual(decision, ctx);
    case 'photo':
      return generatePhotoVisual(decision, ctx);
    default:
      return { visual_type: 'none', chart_url: null, card_url: null, image_prompt: null };
  }
}

/**
 * Hugo analyzes the post text and decides what visual to create
 */
async function decideVisualType(ctx: VisualContext): Promise<{
  visual_type: 'chart' | 'card' | 'photo' | 'none';
  chart_data?: ChartData;
  card_hook?: string;
  card_body?: string;
  card_subtitle?: string;
  image_prompt?: string;
  template_key?: string;
}> {
  const prompt = `Analyzuj tento post a rozhodni, jaký vizuál potřebuje.

POST:
"""
${ctx.text}
"""

PROJEKT: ${ctx.projectName}
PLATFORMA: ${ctx.platform}

PRAVIDLA:
- LinkedIn: Preferuj "card" (textová karta s velkým číslem) nebo "photo".
- Instagram: VŽDY potřebuje vizuál. Preferuj "card" nebo "photo".
- Facebook: "card" pokud jsou čísla, "photo" pro lifestyle, jinak "none".
- X/Twitter: Většinou "none" (text stačí), "card" jen pro silná čísla.

TYPY VIZUÁLŮ:
1. "card" – pokud post začíná VELKÝM ČÍSLEM (hook). Číslo se zobrazí velké na tmavém pozadí.
2. "photo" – pokud post potřebuje realistickou fotku (lifestyle, architektura, lidi).
3. "none" – pokud text funguje sám o sobě.

Vrať POUZE JSON:
{
  "visual_type": "card|photo|none",
  "card_hook": "1,37" | null,
  "card_body": "dětí na ženu v ČR" | null,
  "card_subtitle": "Pro udržení populace je potřeba 2,1" | null,
  "image_prompt": "popis fotky v angličtině" | null
}`;

  const { text: rawResponse } = await generateText({
    model: google('gemini-2.0-flash'),
    prompt,
    temperature: 0.2,
  });

  try {
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch {
    // Parse failed
  }

  // Fallback: try to extract a number from the first line for a card
  const firstLine = ctx.text.split('\n')[0].trim();
  const numberMatch = firstLine.match(/^[\d,.\s%]+/);
  if (numberMatch) {
    return {
      visual_type: 'card',
      card_hook: numberMatch[0].trim(),
      card_body: ctx.text.split('\n').slice(1, 3).join(' ').substring(0, 80),
    };
  }

  return { visual_type: 'none' };
}

/**
 * Generate chart visual using QuickChart.io
 */
function generateChartVisual(
  decision: { template_key?: string; chart_data?: ChartData },
  ctx: VisualContext,
): VisualAssets {
  let chartUrl: string;

  // Use pre-built template if available
  if (decision.template_key && decision.template_key in CHART_TEMPLATES) {
    const templateFn = CHART_TEMPLATES[decision.template_key as keyof typeof CHART_TEMPLATES];
    chartUrl = templateFn(ctx.visualIdentity);
  } else if (decision.chart_data) {
    // Custom chart data from Hugo
    chartUrl = generateChartUrl(decision.chart_data, ctx.visualIdentity);
  } else {
    // Fallback to worker ratio
    chartUrl = CHART_TEMPLATES.workerRatio(ctx.visualIdentity);
  }

  return {
    visual_type: 'chart',
    chart_url: chartUrl,
    card_url: null,
    image_prompt: null,
  };
}

/**
 * Generate text card visual using /api/visual/card endpoint
 */
function generateCardVisual(
  decision: { card_hook?: string; card_body?: string; card_subtitle?: string },
  ctx: VisualContext,
): VisualAssets {
  const vi = ctx.visualIdentity;
  const params = new URLSearchParams({
    hook: decision.card_hook || '',
    body: decision.card_body || '',
    subtitle: decision.card_subtitle || '',
    project: ctx.projectName,
    bg: (vi.primary_color || '#1a1a2e').replace('#', ''),
    accent: (vi.accent_color || '#e94560').replace('#', ''),
    text: (vi.text_color || '#ffffff').replace('#', ''),
  });

  // Platform-specific dimensions
  const dimensions: Record<string, { w: number; h: number }> = {
    linkedin: { w: 1200, h: 630 },
    instagram: { w: 1080, h: 1080 },
    facebook: { w: 1200, h: 630 },
    x: { w: 1200, h: 675 },
  };

  const dim = dimensions[ctx.platform] || dimensions.linkedin;
  params.set('w', String(dim.w));
  params.set('h', String(dim.h));

  // This URL will be resolved by the app itself
  const cardUrl = `/api/visual/card?${params.toString()}`;

  return {
    visual_type: 'card',
    chart_url: null,
    card_url: cardUrl,
    image_prompt: null,
  };
}

// ============================================
// Media Library matching (pgvector similarity)
// ============================================

const MATCH_THRESHOLD = 0.45; // Minimum similarity to use a library photo

async function matchMediaFromLibrary(
  projectId: string,
  postText: string,
  imagePrompt: string,
  platform: string,
): Promise<{ public_url: string; asset_id: string; similarity: number } | null> {
  if (!supabase) return null;

  try {
    // Generate embedding from post text + image prompt
    const searchText = `${postText.substring(0, 200)} ${imagePrompt}`;
    const embedding = await generateMediaEmbedding(searchText, []);
    if (!embedding) return null;

    // Call pgvector RPC
    const { data, error } = await supabase.rpc('match_media_assets', {
      query_embedding: JSON.stringify(embedding),
      match_project_id: projectId,
      match_threshold: MATCH_THRESHOLD,
      match_count: 3,
      filter_file_type: 'image',
      exclude_recently_used: true,
    });

    if (error || !data || data.length === 0) return null;

    const best = data[0];
    console.log(`[visual-agent] Media match: ${best.file_name} (similarity: ${best.similarity.toFixed(3)}, quality: ${best.ai_quality_score})`);

    // Increment usage counter
    await supabase.rpc('increment_media_usage', { asset_id: best.id });

    return {
      public_url: best.public_url,
      asset_id: best.id,
      similarity: best.similarity,
    };
  } catch (err) {
    console.error('[visual-agent] Media match error:', err);
    return null;
  }
}

/**
 * Generate photo visual:
 * 1. Try matching from Media Library (pgvector)
 * 2. If no match → generate with Imagen 4
 * 3. Fallback → return image_prompt text only
 */
async function generatePhotoVisual(
  decision: { image_prompt?: string },
  ctx: VisualContext,
): Promise<VisualAssets> {
  const rawPrompt = decision.image_prompt || '';
  if (!rawPrompt) {
    return { visual_type: 'none', chart_url: null, card_url: null, image_prompt: null };
  }

  // Build clean English prompt without marketing buzzwords
  const cleanPrompt = buildCleanImagePrompt({
    rawPrompt,
    projectName: ctx.projectName,
    platform: ctx.platform,
    visualIdentity: ctx.visualIdentity,
  });

  // If no projectId, return prompt only (can't store without project)
  if (!ctx.projectId) {
    return {
      visual_type: 'photo',
      chart_url: null,
      card_url: null,
      image_prompt: cleanPrompt,
    };
  }

  // Step 1: Try Media Library match (pgvector)
  const match = await matchMediaFromLibrary(ctx.projectId, ctx.text, rawPrompt, ctx.platform);
  if (match) {
    console.log(`[visual-agent] Using library photo (similarity: ${match.similarity.toFixed(3)})`);
    return {
      visual_type: 'matched_photo',
      chart_url: null,
      card_url: null,
      image_prompt: cleanPrompt,
      generated_image_url: match.public_url,
      media_asset_id: match.asset_id,
      match_similarity: match.similarity,
    };
  }

  // Step 2: Generate with Imagen 4
  console.log('[visual-agent] No library match, generating with Imagen 4...');
  const result = await generateAndStoreImage({
    projectId: ctx.projectId,
    imagePrompt: cleanPrompt,
    platform: ctx.platform,
    logoUrl: ctx.logoUrl,
  });

  if (result.success && result.public_url) {
    return {
      visual_type: 'generated_photo',
      chart_url: null,
      card_url: null,
      image_prompt: cleanPrompt,
      generated_image_url: result.public_url,
      media_asset_id: result.media_asset_id,
    };
  }

  // Step 3: Fallback — return prompt text only
  return {
    visual_type: 'photo',
    chart_url: null,
    card_url: null,
    image_prompt: cleanPrompt,
  };
}
