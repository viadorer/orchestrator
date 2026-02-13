/**
 * Visual Agent
 * 
 * Hugo rozhodne, jaký vizuál post potřebuje, a automaticky ho vygeneruje.
 * 
 * 3 vrstvy:
 * 1. QuickChart.io – grafy z demografických dat (zdarma)
 * 2. Textová karta (@vercel/og) – hook číslo na pozadí s logem
 * 3. Image prompt – popis pro budoucí AI generátor (DALL-E 3 apod.)
 */

import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { generateChartUrl, CHART_TEMPLATES, type ChartData, type VisualIdentity } from './quickchart';

export interface VisualAssets {
  visual_type: 'chart' | 'card' | 'photo' | 'none';
  chart_url: string | null;
  card_url: string | null;
  image_prompt: string | null;
}

interface VisualContext {
  text: string;
  projectName: string;
  platform: string;
  visualIdentity: Partial<VisualIdentity>;
  kbEntries: Array<{ category: string; title: string; content: string }>;
}

/**
 * Hugo decides what visual the post needs and generates it
 */
export async function generateVisualAssets(ctx: VisualContext): Promise<VisualAssets> {
  // Step 1: Ask Hugo what visual type this post needs
  const decision = await decideVisualType(ctx);

  // Step 2: Generate the visual based on decision
  switch (decision.visual_type) {
    case 'chart':
      return generateChartVisual(decision, ctx);
    case 'card':
      return generateCardVisual(decision, ctx);
    case 'photo':
      return {
        visual_type: 'photo',
        chart_url: null,
        card_url: null,
        image_prompt: decision.image_prompt || null,
      };
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
- LinkedIn: Preferuj "card" (textová karta s velkým číslem) nebo "chart" (graf).
- Instagram: VŽDY potřebuje vizuál. Preferuj "card" nebo "chart".
- Facebook: "card" nebo "chart" pokud jsou čísla, jinak "none".
- X/Twitter: Většinou "none" (text stačí), "card" jen pro silná čísla.

TYPY VIZUÁLŮ:
1. "chart" – pokud post obsahuje SROVNÁNÍ čísel nebo TREND (např. porodnost klesá, poměr pracujících).
   Dostupné šablony: workerRatio, fertilityRate, agingPopulation, pensionVsRent.
   Nebo vlastní data pro graf.
2. "card" – pokud post začíná VELKÝM ČÍSLEM (hook). Číslo se zobrazí velké na tmavém pozadí.
3. "photo" – pokud post potřebuje realistickou fotku (lifestyle, architektura).
4. "none" – pokud text funguje sám o sobě.

Vrať POUZE JSON:
{
  "visual_type": "chart|card|photo|none",
  "template_key": "workerRatio|fertilityRate|agingPopulation|pensionVsRent|null",
  "chart_data": { "type": "bar", "title": "...", "labels": [...], "datasets": [...] } | null,
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
