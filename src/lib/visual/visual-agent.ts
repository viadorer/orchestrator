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
import { generateChartUrl, CHART_TEMPLATES, type ChartData, type VisualIdentity, type PhotographyPreset, DEFAULT_PHOTOGRAPHY_PRESET } from './quickchart';
import { generateAndStoreImage, buildCleanImagePrompt } from './imagen';
import { generateMediaEmbedding } from '@/lib/ai/vision-engine';
import { supabase } from '@/lib/supabase/client';
import { getDefaultImageSpec, PLATFORM_LIMITS } from '@/lib/platforms';

export interface VisualAssets {
  visual_type: 'chart' | 'card' | 'photo' | 'generated_photo' | 'matched_photo' | 'none';
  chart_url: string | null;
  card_url: string | null;
  image_prompt: string | null;
  generated_image_url?: string | null;
  media_asset_id?: string | null;
  match_similarity?: number;
  template_url?: string | null;
}

interface VisualContext {
  text: string;
  projectName: string;
  platform: string;
  visualIdentity: Partial<VisualIdentity>;
  kbEntries: Array<{ category: string; title: string; content: string }>;
  projectId?: string;
  logoUrl?: string | null;
  forcePhoto?: boolean;
  photographyPreset?: Partial<PhotographyPreset> | null;
}

/**
 * Hugo decides what visual the post needs and generates it
 */
export async function generateVisualAssets(ctx: VisualContext): Promise<VisualAssets> {
  // Auto-generate photography preset if project doesn't have one yet
  if (!ctx.photographyPreset && ctx.projectId) {
    try {
      const generated = await autoGeneratePhotographyPreset(ctx);
      if (generated) {
        ctx.photographyPreset = generated;
      }
    } catch (e) {
      console.error('[visual-agent] Auto-generate preset failed:', e);
    }
  }

  // Force photo mode: skip Hugo's decision, generate image prompt and go straight to photo
  if (ctx.forcePhoto) {
    console.log('[visual-agent] forcePhoto mode — generating photo directly');
    const decision = await decideVisualType(ctx);
    // Use Hugo's image_prompt if available, otherwise generate a generic one
    const imagePrompt = decision.image_prompt || `Professional photo related to: ${ctx.text.substring(0, 150)}`;
    // If Hugo picked bold_card, override to photo_strip (forcePhoto = we want a photo template)
    const templateKey = (decision.template_key === 'bold_card') ? 'photo_strip' : (decision.template_key || 'photo_strip');
    return generatePhotoVisual({
      image_prompt: imagePrompt,
      template_key: templateKey,
      aspect_ratio: decision.aspect_ratio,
      card_hook: decision.card_hook,
      card_body: decision.card_body,
      card_subtitle: decision.card_subtitle,
    }, ctx);
  }

  // Step 1: Ask Hugo what visual type this post needs + template selection
  const decision = await decideVisualType(ctx);
  console.log(`[visual-agent] Hugo decision: type=${decision.visual_type}, template=${decision.template_key || 'auto'}, reason=${decision.template_reason || '-'}`);

  // Step 2: Generate the visual based on decision
  switch (decision.visual_type) {
    case 'card':
      return generateCardVisual(decision, ctx);
    case 'photo':
      return generatePhotoVisual(decision, ctx);
    case 'none': {
      // X/Twitter can skip visuals, all other platforms MUST have one
      const noVisualPlatforms = ['x', 'twitter'];
      if (noVisualPlatforms.includes(ctx.platform)) {
        return { visual_type: 'none', chart_url: null, card_url: null, image_prompt: null };
      }
      // Force a photo visual for platforms that require imagery (photo > card priority)
      console.log(`[visual-agent] Platform ${ctx.platform} requires visual — forcing photo`);
      const fallbackPrompt = decision.image_prompt || `Professional photo related to: ${ctx.text.substring(0, 150)}`;
      return generatePhotoVisual({
        image_prompt: fallbackPrompt,
        template_key: decision.template_key || 'photo_strip',
        aspect_ratio: decision.aspect_ratio,
      }, ctx);
    }
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
  template_reason?: string;
  aspect_ratio?: string;
}> {
  // Build brand context for visual decision
  const vi = ctx.visualIdentity as Record<string, string>;
  const brandContext: string[] = [];
  if (vi?.photography_style) brandContext.push(`Photography style: ${vi.photography_style}`);
  if (vi?.photography_mood) brandContext.push(`Mood: ${vi.photography_mood}`);
  if (vi?.photography_subjects) brandContext.push(`Typical subjects: ${vi.photography_subjects}`);
  if (vi?.photography_lighting) brandContext.push(`Lighting: ${vi.photography_lighting}`);
  if (vi?.photography_color_grade) brandContext.push(`Color grade: ${vi.photography_color_grade}`);
  if (vi?.photography_avoid) brandContext.push(`AVOID: ${vi.photography_avoid}`);
  if (vi?.brand_visual_keywords) brandContext.push(`Brand keywords: ${vi.brand_visual_keywords}`);
  const brandBlock = brandContext.length > 0
    ? `\nVIZUÁLNÍ IDENTITA ZNAČKY:\n${brandContext.join('\n')}`
    : '';

  // Build template catalog from registry
  const photoTemplates = TEMPLATE_REGISTRY.filter(t => t.visual_type === 'photo');
  const cardTemplates = TEMPLATE_REGISTRY.filter(t => t.visual_type === 'card');

  const photoList = photoTemplates.map(t =>
    `- "${t.key}" → ${t.description} TAGY: [${t.tags.join(', ')}]. PRO: ${t.best_for}`
  ).join('\n');

  const cardList = cardTemplates.map(t =>
    `- "${t.key}" → ${t.description} TAGY: [${t.tags.join(', ')}]. PRO: ${t.best_for}`
  ).join('\n');

  // Build platform table from registry
  const PLATFORM_CONFIG: Record<string, { aspect: string; dims: string }> = {
    facebook: { aspect: 'portrait', dims: '1080×1350' },
    instagram: { aspect: 'portrait', dims: '1080×1350' },
    linkedin: { aspect: 'landscape', dims: '1200×627' },
    x: { aspect: 'landscape', dims: '1600×900' },
    tiktok: { aspect: 'story', dims: '1080×1920' },
    pinterest: { aspect: 'portrait', dims: '1000×1500' },
    threads: { aspect: 'square', dims: '1080×1080' },
    youtube: { aspect: 'landscape', dims: '1280×720' },
    telegram: { aspect: 'landscape', dims: '1280×720' },
    bluesky: { aspect: 'landscape', dims: '1200×675' },
  };

  const platformTable = Object.entries(PLATFORM_CONFIG).map(([plat, cfg]) => {
    const good = TEMPLATE_REGISTRY.filter(t => t.good_platforms.includes(plat)).map(t => t.key).join(', ');
    const avoid = TEMPLATE_REGISTRY.filter(t => t.avoid_platforms.includes(plat)).map(t => t.key).join(', ') || '—';
    return `| ${plat.padEnd(11)} | ${(`"${cfg.aspect}"`).padEnd(11)} | ${cfg.dims.padEnd(12)} | ${good} | ${avoid} |`;
  }).join('\n');

  const allKeys = TEMPLATE_REGISTRY.map(t => `"${t.key}"`).join('|');

  const prompt = `Analyzuj tento post a rozhodni, jaký vizuál potřebuje. Vyber KONKRÉTNÍ šablonu.

POST:
"""
${ctx.text}
"""

PROJEKT: ${ctx.projectName}
PLATFORMA: ${ctx.platform}
${brandBlock}

=== PRIORITA VÝBĚRU VIZUÁLU (DODŘŽUJ TOTO POŘADÍ!) ===

🥇 PRIORITA 1 — FOTKA + TEXT + LOGO (visual_type: "photo")
VŽDY preferuj reálnou fotku s textem. Toto je DEFAULTNÍ volba.
NIKDY nepoužívej fotku bez textu — hlavní sdělení MUSÍ být na fotce!

Šablony (VŽDY s hook + body textem):
${photoList}

DŮLEŽITÉ: card_hook a card_body jsou POVINNÉ pro všechny photo šablony!
- card_hook = hlavní sdělení (1. řádek, výrazný, krátký)
- card_body = doplňující informace (2. řádek, kontext)

VÝBĚR ŠABLONY PODLE TAGŮ:
- Post obsahuje citát/výrok osoby → hledej tagy: quote, podcast, interview, testimonial
- Post je reklamní/CTA → hledej tagy: cta, promo, dynamic
- Post je emocionální/atmosférický → hledej tagy: emotional, atmospheric
- Post je vzdělávací/profesionální → hledej tagy: educational, professional
- Post je zpráva/novinka → hledej tagy: news, universal

🥈 PRIORITA 2 — INFOGRAFIKA: ČÍSLO + TEXT (visual_type: "card")
POUZE když je v postu KONKRÉTNÍ ČÍSLO jako hlavní hook (statistika, procento, cena).
${cardList}
Použij JEN když číslo je skutečně hlavní sdělení postu. Jinak preferuj fotku.

=== PLATFORMA → FORMÁT ===
(MUSÍŠ dodržet aspect_ratio pro danou platformu!)

| Platforma   | aspect_ratio | Rozměry      | Preferované šablony | NEPOUŽÍVAT |
|-------------|-------------|--------------|---------------------|------------|
${platformTable}

DŮLEŽITÉ:
- aspect_ratio z tabulky je POVINNÝ pro danou platformu — neměň ho!
- Imagen API podporuje jen: 1:1, 3:4, 4:3, 9:16, 16:9 — mapování je automatické

=== PRAVIDLA PRO image_prompt (KRITICKÉ) ===
- VŽDY generuj image_prompt, i pro "bold_card" (použije se jako fallback)
- Piš v ANGLIČTINĚ, jako pokyn pro fotografa na place
- Popisuj KONKRÉTNÍ scénu: kdo, kde, co dělá, jaké prostředí
- Uveď KONKRÉTNÍ detaily: materiály, barvy, textury, počasí, denní dobu
- Piš jako filmový režisér: "Close-up of weathered hands signing a document on oak desk, morning light through window, shallow depth of field"
- NIKDY nepiš genericky: "Professional photo of business" nebo "Happy people in office"
- Zaměř se na EMOCI a PŘÍBĚH, ne na popis produktu
- Pro šablony s overlay textem: fotka musí mít VOLNÝ PROSTOR pro text

Vrať POUZE JSON:
{
  "visual_type": "photo|card|none",
  "template_key": ${allKeys},
  "aspect_ratio": "portrait|square|landscape|story",
  "card_hook": "krátký hook text pro šablonu (1. řádek)" | null,
  "card_body": "druhý řádek textu pro šablonu" | null,
  "card_subtitle": "volitelný třetí řádek" | null,
  "image_prompt": "VŽDY vyplň — detailed English scene description for photographer" | null,
  "template_reason": "Krátké zdůvodnění (1 věta česky)"
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
 * Generate text card visual using /api/visual/template endpoint (Bold Card template)
 * Replaces the old /api/visual/card with richer, more branded design.
 */
function generateCardVisual(
  decision: { card_hook?: string; card_body?: string; card_subtitle?: string; template_key?: string; aspect_ratio?: string },
  ctx: VisualContext,
): VisualAssets {
  const vi = ctx.visualIdentity;

  // Use Hugo's template_key if valid, otherwise default to bold_card
  let template: TemplateKey = 'bold_card';
  if (decision.template_key && VALID_TEMPLATES.includes(decision.template_key as TemplateKey)) {
    template = decision.template_key as TemplateKey;
  }

  // Resolve platform variant from aspect_ratio (e.g. facebook_portrait)
  const platformVariant = resolvePlatformVariant(ctx.platform, decision.aspect_ratio);

  const params = new URLSearchParams({
    t: template,
    hook: decision.card_hook || '',
    body: decision.card_body || '',
    subtitle: decision.card_subtitle || '',
    project: ctx.projectName,
    platform: platformVariant,
    bg: (vi.primary_color || '#0f0f23').replace('#', ''),
    accent: (vi.accent_color || '#e94560').replace('#', ''),
    text: (vi.text_color || '#ffffff').replace('#', ''),
  });

  if (vi.logo_url) {
    params.set('logo', vi.logo_url);
  }

  const cardUrl = `/api/visual/template-v2?${params.toString()}`;

  return {
    visual_type: 'card',
    chart_url: null,
    card_url: cardUrl,
    image_prompt: null,
    template_url: cardUrl,
  };
}

// ─── Template Registry ──────────────────────────────────────
// Single source of truth for all templates. Adding a new template = adding 1 entry here.
// Hugo's prompt, UI previews, and validation all read from this registry.

interface TemplateEntry {
  key: string;
  label: string;
  visual_type: 'photo' | 'card';
  tags: string[];
  best_for: string;
  description: string;
  requires: ('photo' | 'hook' | 'body' | 'subtitle' | 'number')[];
  good_platforms: string[];
  avoid_platforms: string[];
}

const TEMPLATE_REGISTRY: TemplateEntry[] = [
  {
    key: 'bold_card',
    label: 'Bold Card',
    visual_type: 'card',
    tags: ['stats', 'number', 'infographic'],
    best_for: 'Konkrétní číslo jako hlavní sdělení (statistika, procento, cena)',
    description: 'Velké číslo uprostřed, glow efekt, dekorativní rohy. Bez fotky.',
    requires: ['hook', 'body'],
    good_platforms: ['linkedin', 'x', 'threads'],
    avoid_platforms: ['facebook', 'instagram'],
  },
  {
    key: 'photo_strip',
    label: 'Photo Strip',
    visual_type: 'photo',
    tags: ['news', 'universal', 'safe'],
    best_for: 'Univerzální šablona, funguje vždy. Fotka nahoře, brand pás dole.',
    description: 'Fotka nahoře (72%), brand pás dole s hook textem + logo.',
    requires: ['photo', 'hook', 'body'],
    good_platforms: ['linkedin', 'x', 'youtube', 'telegram', 'bluesky'],
    avoid_platforms: [],
  },
  {
    key: 'split',
    label: 'Split',
    visual_type: 'photo',
    tags: ['educational', 'professional', 'long_text'],
    best_for: 'Profesionální obsah s delším textem. Půlka fotka, půlka text.',
    description: 'Půlka fotka, půlka bold text vedle sebe + logo.',
    requires: ['photo', 'hook', 'body'],
    good_platforms: ['linkedin'],
    avoid_platforms: ['instagram', 'tiktok', 'pinterest', 'threads', 'bluesky'],
  },
  {
    key: 'gradient',
    label: 'Gradient',
    visual_type: 'photo',
    tags: ['emotional', 'atmospheric', 'instagram'],
    best_for: 'Atmosférické, emocionální sdělení. Fotka přes celou plochu s gradient overlay.',
    description: 'Fotka přes celou plochu, tmavý gradient overlay, bold text dole + logo.',
    requires: ['photo', 'hook', 'body'],
    good_platforms: ['facebook', 'instagram', 'x', 'tiktok', 'pinterest', 'threads', 'youtube', 'telegram', 'bluesky'],
    avoid_platforms: [],
  },
  {
    key: 'text_logo',
    label: 'Text + Logo',
    visual_type: 'photo',
    tags: ['cta', 'promo', 'branding', 'headline'],
    best_for: 'Krátký výrazný headline s brandingem. Fotka na pozadí.',
    description: 'Fotka na pozadí, text vlevo nahoře, logo vpravo dole.',
    requires: ['photo', 'hook', 'body'],
    good_platforms: ['facebook', 'instagram', 'tiktok', 'pinterest', 'threads', 'youtube', 'telegram', 'bluesky'],
    avoid_platforms: [],
  },
  {
    key: 'quote_card',
    label: 'Quote Card',
    visual_type: 'photo',
    tags: ['quote', 'opinion', 'statement', 'elegant'],
    best_for: 'Citáty, výroky, silná tvrzení. Barevný panel s textem + fotka.',
    description: 'Barevný panel s citátem nahoře + fotka dole (portrait) nebo vedle (landscape).',
    requires: ['photo', 'hook', 'body', 'subtitle'],
    good_platforms: ['facebook', 'instagram', 'linkedin'],
    avoid_platforms: [],
  },
  {
    key: 'diagonal',
    label: 'Diagonal',
    visual_type: 'photo',
    tags: ['cta', 'promo', 'dynamic', 'remax'],
    best_for: 'Reklamní look, CTA posty, dynamický vizuál. Diagonální řez.',
    description: 'Velký barevný panel s textem vlevo nahoře, diagonální řez odhaluje fotku vpravo dole, bílý logo pás s křivkou.',
    requires: ['photo', 'hook', 'body'],
    good_platforms: ['facebook', 'instagram', 'tiktok', 'pinterest', 'linkedin'],
    avoid_platforms: [],
  },
  {
    key: 'quote_overlay',
    label: 'Quote Overlay',
    visual_type: 'photo',
    tags: ['quote', 'podcast', 'interview', 'person', 'testimonial'],
    best_for: 'Citát přes fotku osoby. Podcast, rozhovor, testimonial.',
    description: 'Fotka na pozadí (osoba), tmavý gradient dole, velká uvozovka, citát + autor.',
    requires: ['photo', 'hook', 'body'],
    good_platforms: ['facebook', 'instagram', 'linkedin', 'threads'],
    avoid_platforms: [],
  },
  {
    key: 'cta_card',
    label: 'CTA Card',
    visual_type: 'photo',
    tags: ['cta', 'download', 'lead_magnet', 'guide', 'ebook', 'webinar'],
    best_for: 'Lead magnet, stažení průvodce, registrace na webinář. Fotka nahoře, accent panel dole s CTA.',
    description: 'Fotka na pozadí nahoře, accent barevný panel dole se zaoblenými rohy, hook text + CTA tlačítko + logo.',
    requires: ['photo', 'hook', 'body'],
    good_platforms: ['facebook', 'instagram', 'linkedin', 'threads'],
    avoid_platforms: [],
  },
  {
    key: 'circle_cta',
    label: 'Circle CTA',
    visual_type: 'photo',
    tags: ['cta', 'promo', 'bold', 'modern', 'real_estate'],
    best_for: 'Reklamní post s výrazným CTA. Velký bílý kruh přes fotku s textem a tlačítkem.',
    description: 'Fotka na pozadí, velký bílý kruh vlevo dole s hook textem + accent CTA tlačítko, logo badge vpravo nahoře.',
    requires: ['photo', 'hook', 'body'],
    good_platforms: ['facebook', 'instagram', 'linkedin', 'threads'],
    avoid_platforms: [],
  },
];

const VALID_TEMPLATES = TEMPLATE_REGISTRY.map(t => t.key);
type TemplateKey = string;

/**
 * Resolve platform variant string from base platform + aspect_ratio.
 * E.g. ('facebook', 'portrait') → 'facebook_portrait'
 * Falls back to base platform if no aspect_ratio.
 */
function resolvePlatformVariant(platform: string, aspectRatio?: string): string {
  if (!aspectRatio) return platform;
  const ASPECT_SUFFIX: Record<string, string> = {
    portrait: '_portrait',
    square: '_square',
    landscape: '_landscape',
    story: '_story',
  };
  const suffix = ASPECT_SUFFIX[aspectRatio];
  if (!suffix) return platform;
  // Only add suffix for platforms that have variants (facebook, instagram, linkedin)
  const VARIANT_PLATFORMS = ['facebook', 'instagram', 'linkedin'];
  if (!VARIANT_PLATFORMS.includes(platform)) return platform;
  return `${platform}${suffix}`;
}

/**
 * Build a brand template URL for a photo visual.
 * Uses Hugo's dynamic template_key selection. Falls back to platform-based heuristic.
 */
function buildPhotoTemplateUrl(
  photoUrl: string,
  ctx: VisualContext,
  opts?: { hookText?: string; bodyText?: string; subtitleText?: string; templateKey?: string; aspectRatio?: string },
): string {
  const vi = ctx.visualIdentity;

  // Use Hugo's choice if valid, otherwise fall back to platform heuristic
  let template: TemplateKey;
  if (opts?.templateKey && VALID_TEMPLATES.includes(opts.templateKey as TemplateKey)) {
    template = opts.templateKey as TemplateKey;
  } else {
    const verticalPlatforms = ['instagram', 'tiktok', 'pinterest', 'threads'];
    template = verticalPlatforms.includes(ctx.platform) ? 'gradient' : 'photo_strip';
  }

  // Resolve platform variant from aspect_ratio
  const platformVariant = resolvePlatformVariant(ctx.platform, opts?.aspectRatio);

  const params = new URLSearchParams({
    t: template,
    platform: platformVariant,
    photo: photoUrl,
    bg: (vi.primary_color || '#0f0f23').replace('#', ''),
    accent: (vi.accent_color || '#e94560').replace('#', ''),
    text: (vi.text_color || '#ffffff').replace('#', ''),
    project: ctx.projectName,
  });

  if (opts?.hookText) {
    const hook = opts.hookText.split(/[.!?\n]/)[0]?.trim().substring(0, 60) || '';
    params.set('hook', hook);
  }
  if (opts?.bodyText) {
    params.set('body', opts.bodyText.substring(0, 120));
  }
  if (opts?.subtitleText) {
    params.set('subtitle', opts.subtitleText.substring(0, 80));
  }

  if (vi.logo_url) {
    params.set('logo', vi.logo_url);
  }

  return `/api/visual/template-v2?${params.toString()}`;
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
  decision: { image_prompt?: string; template_key?: string; aspect_ratio?: string; card_hook?: string; card_body?: string; card_subtitle?: string },
  ctx: VisualContext,
): Promise<VisualAssets> {
  const rawPrompt = decision.image_prompt || '';
  if (!rawPrompt) {
    return { visual_type: 'none', chart_url: null, card_url: null, image_prompt: null };
  }

  // Build clean English prompt without marketing buzzwords
  // Returns { prompt, negativePrompt } — negativePrompt sent separately to Imagen API
  const { prompt: cleanPrompt, negativePrompt } = buildCleanImagePrompt({
    rawPrompt,
    projectName: ctx.projectName,
    platform: ctx.platform,
    photographyPreset: ctx.photographyPreset,
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

  // Use Gemini-generated hook/body text for template, fall back to first line of post
  const hookText = decision.card_hook || ctx.text.split('\n')[0]?.trim();
  const bodyText = decision.card_body || undefined;
  const subtitleText = decision.card_subtitle || undefined;

  // Step 1: Try Media Library match (pgvector)
  const match = await matchMediaFromLibrary(ctx.projectId, ctx.text, rawPrompt, ctx.platform);
  if (match) {
    console.log(`[visual-agent] Using library photo (similarity: ${match.similarity.toFixed(3)})`);
    const templateUrl = buildPhotoTemplateUrl(match.public_url, ctx, { hookText, bodyText, subtitleText, templateKey: decision.template_key, aspectRatio: decision.aspect_ratio });
    return {
      visual_type: 'matched_photo',
      chart_url: null,
      card_url: null,
      image_prompt: cleanPrompt,
      generated_image_url: match.public_url,
      media_asset_id: match.asset_id,
      match_similarity: match.similarity,
      template_url: templateUrl,
    };
  }

  // Step 2: Generate with Imagen 4 (with per-project preset for quality control)
  // NOTE: Do NOT pass logoUrl here — template adds logo itself. Sharp logo overlay would cause double logo.
  // Use platform variant (e.g. facebook_portrait) so Imagen generates correct aspect ratio
  const imagenPlatform = resolvePlatformVariant(ctx.platform, decision.aspect_ratio);
  console.log(`[visual-agent] No library match, generating with Imagen 4... (platform: ${imagenPlatform})`);
  const result = await generateAndStoreImage({
    projectId: ctx.projectId,
    imagePrompt: cleanPrompt,
    platform: imagenPlatform,
    photographyPreset: ctx.photographyPreset,
  });

  if (result.success && result.public_url) {
    const templateUrl = buildPhotoTemplateUrl(result.public_url, ctx, { hookText, bodyText, subtitleText, templateKey: decision.template_key, aspectRatio: decision.aspect_ratio });
    return {
      visual_type: 'generated_photo',
      chart_url: null,
      card_url: null,
      image_prompt: cleanPrompt,
      generated_image_url: result.public_url,
      media_asset_id: result.media_asset_id,
      template_url: templateUrl,
    };
  }

  // Step 3: Fallback — Imagen failed, use placeholder image for template
  // Generate template URL with a placeholder photo (will show brand frame with text+logo)
  const placeholderUrl = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1080&h=1350&fit=crop';
  const templateUrl = buildPhotoTemplateUrl(placeholderUrl, ctx, { hookText, bodyText, subtitleText, templateKey: decision.template_key, aspectRatio: decision.aspect_ratio });
  
  return {
    visual_type: 'photo',
    chart_url: null,
    card_url: null,
    image_prompt: cleanPrompt,
    template_url: templateUrl,
  };
}

/**
 * Auto-generate a PhotographyPreset for a project that doesn't have one yet.
 * Uses Hugo AI to analyze the project's KB entries and create a tailored preset.
 * Saves the preset to the project's visual_identity in the database.
 * 
 * This runs ONCE per project — after generation, the preset is stored and reused.
 */
async function autoGeneratePhotographyPreset(
  ctx: VisualContext,
): Promise<Partial<PhotographyPreset> | null> {
  if (!supabase || !ctx.projectId) return null;

  // Build context from KB entries for Hugo to understand the project
  const kbSummary = ctx.kbEntries
    .slice(0, 10)
    .map(e => `[${e.category}] ${e.title}: ${e.content.substring(0, 200)}`)
    .join('\n');

  if (!kbSummary) return null;

  console.log(`[visual-agent] Auto-generating photography preset for project "${ctx.projectName}"...`);

  try {
    const { text } = await generateText({
      model: google('gemini-2.0-flash'),
      prompt: `Jsi expert na vizuální identitu značek. Na základě informací o projektu vytvoř photography preset pro AI generování fotek na sociální sítě.

PROJEKT: ${ctx.projectName}

ZNALOSTNÍ BÁZE:
${kbSummary}

Vytvoř JSON preset, který definuje fotografický styl pro tento konkrétní projekt.
Buď SPECIFICKÝ — ne generický. Přizpůsob styl oboru a cílové skupině projektu.

Vrať POUZE validní JSON (žádný markdown, žádné komentáře):
{
  "style": "konkrétní fotografický styl (documentary/editorial/lifestyle/architectural/product/portrait/street)",
  "mood": "nálada a atmosféra fotek",
  "lighting": "typ osvětlení",
  "color_grade": "barevné ladění",
  "composition": "kompoziční pravidla",
  "typical_subjects": "typické subjekty pro tento projekt",
  "typical_settings": "typická prostředí a lokace",
  "negative_prompt": "co se NESMÍ objevit na fotkách (anglicky, pro Imagen API)",
  "camera_style": "technický styl fotoaparátu"
}`,
      temperature: 0.3,
    });

    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      console.error('[visual-agent] Auto-generate preset: no JSON in response');
      return null;
    }

    const generated = JSON.parse(match[0]);

    // Merge with defaults (generated values override defaults)
    const preset: PhotographyPreset = {
      ...DEFAULT_PHOTOGRAPHY_PRESET,
      ...generated,
      // Keep quality control defaults — don't let AI override these
      sample_count: DEFAULT_PHOTOGRAPHY_PRESET.sample_count,
      quality_threshold: DEFAULT_PHOTOGRAPHY_PRESET.quality_threshold,
      max_retries: DEFAULT_PHOTOGRAPHY_PRESET.max_retries,
      post_processing: DEFAULT_PHOTOGRAPHY_PRESET.post_processing,
    };

    // Save to project's visual_identity in database
    const { data: project } = await supabase
      .from('projects')
      .select('visual_identity')
      .eq('id', ctx.projectId)
      .single();

    if (project) {
      const currentVI = (project.visual_identity as Record<string, unknown>) || {};
      await supabase
        .from('projects')
        .update({
          visual_identity: {
            ...currentVI,
            photography_preset: preset,
          },
        })
        .eq('id', ctx.projectId);

      console.log(`[visual-agent] Photography preset auto-generated and saved for "${ctx.projectName}": style=${preset.style}, mood=${preset.mood}`);
    }

    return preset;
  } catch (err) {
    console.error('[visual-agent] Auto-generate preset error:', err);
    return null;
  }
}
