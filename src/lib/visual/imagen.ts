/**
 * Imagen Engine – AI generování obrázků přes Google Imagen API
 * 
 * Používá Imagen 4 přes Gemini API (stejný API klíč jako pro Gemini).
 * 
 * Flow:
 * 1. Hugo vygeneruje image_prompt (anglicky, čistý popis)
 * 2. Imagen 4 vygeneruje obrázek ve správném aspect ratio per platforma
 * 3. Obrázek se uloží do Supabase Storage
 * 4. Záznam se vytvoří v media_assets (s AI analýzou + embedding)
 * 5. URL se vrátí pro přiřazení k postu
 */

import { supabase } from '@/lib/supabase/client';
import { storage } from '@/lib/storage';
import { analyzeImage, generateMediaEmbedding } from '@/lib/ai/vision-engine';
import { getDefaultImageSpec } from '@/lib/platforms';
import { type PhotographyPreset, DEFAULT_PHOTOGRAPHY_PRESET } from '@/lib/visual/quickchart';

const GEMINI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY || '';
const IMAGEN_MODEL = 'imagen-4.0-generate-001';
const IMAGEN_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${IMAGEN_MODEL}:predict`;

/**
 * Get aspect ratio for a platform from PLATFORM_LIMITS (single source of truth).
 * Maps custom ratios to Imagen-supported values: 1:1, 9:16, 16:9, 4:3, 3:4
 * Falls back to '4:3' if platform is unknown.
 */
function getPlatformAspectRatio(platform: string): string {
  const spec = getDefaultImageSpec(platform);
  const ratio = spec?.aspectRatio || '4:3';
  
  // Map custom aspect ratios to Imagen-supported values
  const imagenSupportedRatios: Record<string, string> = {
    '1.91:1': '16:9',  // LinkedIn/Facebook landscape → closest match
    '1:1': '1:1',      // Instagram square
    '9:16': '9:16',    // Instagram/TikTok stories
    '16:9': '16:9',    // YouTube/landscape
    '4:3': '4:3',      // Classic
    '3:4': '3:4',      // Portrait
    '4:5': '3:4',      // Instagram portrait → closest match
  };
  
  return imagenSupportedRatios[ratio] || '4:3';
}

export interface ImagenResult {
  success: boolean;
  public_url: string | null;
  media_asset_id: string | null;
  storage_path: string | null;
  error?: string;
}

/**
 * Generate image with Imagen 4 and save to Supabase Storage + media_assets
 */
export interface TextOverlayConfig {
  enabled: boolean;
  position: 'top' | 'center' | 'bottom';
  max_chars: number;
  max_lines: number;
  uppercase: boolean;
  font_size_ratio: number;
  font_weight: 'normal' | 'bold';
  bg_style: 'box' | 'gradient' | 'shadow_only' | 'none';
  bg_opacity: number;
  text_color: string;
  accent_color: string;
  padding_ratio: number;
  highlight_numbers: boolean;
}

export const DEFAULT_TEXT_OVERLAY: TextOverlayConfig = {
  enabled: false,
  position: 'bottom',
  max_chars: 50,
  max_lines: 2,
  uppercase: true,
  font_size_ratio: 0.045,
  font_weight: 'bold',
  bg_style: 'gradient',
  bg_opacity: 0.6,
  text_color: '#FFFFFF',
  accent_color: '#FACC15',
  padding_ratio: 0.06,
  highlight_numbers: true,
};

export async function generateAndStoreImage(options: {
  projectId: string;
  imagePrompt: string;
  platform: string;
  postId?: string;
  logoUrl?: string | null;
  overlayText?: string | null;
  textOverlayConfig?: Partial<TextOverlayConfig> | null;
  photographyPreset?: Partial<PhotographyPreset> | null;
}): Promise<ImagenResult> {
  const { projectId, imagePrompt, platform, postId, logoUrl, overlayText, textOverlayConfig } = options;
  const preset: PhotographyPreset = { ...DEFAULT_PHOTOGRAPHY_PRESET, ...options.photographyPreset };

  if (!GEMINI_API_KEY) {
    return { success: false, public_url: null, media_asset_id: null, storage_path: null, error: 'GOOGLE_GENERATIVE_AI_API_KEY not set' };
  }
  if (!supabase) {
    return { success: false, public_url: null, media_asset_id: null, storage_path: null, error: 'Supabase not configured' };
  }

  try {
    // 1. Generate image(s) via Imagen API — with negativePrompt and sampleCount from preset
    const aspectRatio = getPlatformAspectRatio(platform);
    const sampleCount = Math.min(Math.max(preset.sample_count, 1), 4);
    const allImages = await callImagenAPI(imagePrompt, aspectRatio, preset.negative_prompt, sampleCount);
    if (!allImages || allImages.length === 0) {
      return { success: false, public_url: null, media_asset_id: null, storage_path: null, error: 'Imagen API returned no image' };
    }

    // 2. Pick best image: if multiple samples, use Gemini Vision to score and select
    let imageBytes: string;
    if (allImages.length > 1) {
      imageBytes = await pickBestImage(allImages, imagePrompt, preset.quality_threshold);
      console.log(`[imagen] Picked best from ${allImages.length} samples`);
    } else {
      imageBytes = allImages[0];
    }

    // 3. Enforce platform aspect ratio FIRST (crop+resize to exact platform dimensions)
    // Must happen BEFORE logo overlay — otherwise logo gets cropped off!
    let finalImageBuffer: Buffer = Buffer.from(imageBytes, 'base64') as Buffer;
    try {
      finalImageBuffer = await enforceAspectRatio(finalImageBuffer, platform);
    } catch {
      // Crop failed, continue with original
    }

    // 4. Post-processing pipeline (per-project settings from preset)
    try {
      finalImageBuffer = await applyPostProcessing(finalImageBuffer, preset.post_processing);
    } catch (e) {
      console.error('[imagen] Post-processing failed, using unprocessed:', e);
    }

    // 5. Compose final image (add logo overlay AFTER crop — logo stays intact)
    if (logoUrl) {
      try {
        finalImageBuffer = await compositeWithLogo(finalImageBuffer, logoUrl);
      } catch {
        // Logo compositing failed, use original image
      }
    }

    // 5b. Text overlay (AFTER logo — text should be on top of everything)
    const mergedOverlayConfig = { ...DEFAULT_TEXT_OVERLAY, ...textOverlayConfig };
    if (overlayText && mergedOverlayConfig.enabled) {
      try {
        finalImageBuffer = await compositeWithText(finalImageBuffer, overlayText, mergedOverlayConfig);
      } catch (e) {
        console.error('[imagen] Text overlay failed:', e);
      }
    }

    // 4. Upload to storage (Cloudflare R2 or Supabase fallback)
    const timestamp = Date.now();
    const fileName = `generated_${platform}_${timestamp}.png`;

    const uploadResult = await storage.upload(finalImageBuffer, fileName, {
      projectId,
      folder: 'generated',
      contentType: 'image/png',
    });

    if (!uploadResult.success) {
      return { success: false, public_url: null, media_asset_id: null, storage_path: null, error: `Storage upload failed: ${uploadResult.error}` };
    }

    const storagePath = uploadResult.key;
    const publicUrl = uploadResult.public_url;
    if (!publicUrl) {
      return { success: false, public_url: null, media_asset_id: null, storage_path: null, error: 'Failed to get public URL' };
    }

    console.log(`[imagen] Uploaded via ${uploadResult.provider}: ${storagePath}`);

    // 5. Analyze with Gemini Vision (tags, description, embedding)
    let aiDescription = imagePrompt;
    let aiTags: string[] = [];
    let aiMood = 'neutral';
    let aiScene = 'unknown';
    let qualityScore = 7;
    let embedding: number[] | null = null;

    try {
      const analysis = await analyzeImage(publicUrl);
      aiDescription = analysis.description || imagePrompt;
      aiTags = analysis.tags;
      aiMood = analysis.mood;
      aiScene = analysis.scene;
      qualityScore = analysis.quality_score;
    } catch {
      // Vision analysis failed, use prompt as description
      aiTags = extractTagsFromPrompt(imagePrompt);
    }

    try {
      embedding = await generateMediaEmbedding(aiDescription, aiTags);
    } catch {
      // Embedding failed
    }

    // 6. Insert into media_assets
    const coreAssetData: Record<string, unknown> = {
      project_id: projectId,
      storage_path: storagePath,
      public_url: publicUrl,
      file_name: fileName,
      file_type: 'image/png',
      file_size: finalImageBuffer.length,
      ai_description: aiDescription,
      ai_tags: aiTags,
      ai_mood: aiMood,
      ai_scene: aiScene,
      ai_quality_score: qualityScore,
      is_processed: true,
      is_active: true,
      times_used: postId ? 1 : 0,
      last_used_at: postId ? new Date().toISOString() : null,
      last_used_in: postId || null,
    };

    if (embedding) {
      coreAssetData.embedding = JSON.stringify(embedding);
    }

    // Try full insert with optional columns (source, generation_prompt)
    const fullAssetData = { ...coreAssetData, source: 'imagen_generated', generation_prompt: imagePrompt };

    let insertedAsset: { id: string } | null = null;
    const { data: fullData, error: fullError } = await supabase
      .from('media_assets')
      .insert(fullAssetData)
      .select('id')
      .single();

    if (fullError) {
      // Retry with core columns only (source/generation_prompt may not exist yet)
      const { data: coreData, error: coreError } = await supabase
        .from('media_assets')
        .insert(coreAssetData)
        .select('id')
        .single();

      if (coreError) {
        await logImagenEvent(projectId, 'imagen_asset_insert_error', { error: coreError.message, full_error: fullError.message, storage_path: storagePath });
        return { success: true, public_url: publicUrl, media_asset_id: null, storage_path: storagePath };
      }
      insertedAsset = coreData;
    } else {
      insertedAsset = fullData;
    }

    if (!insertedAsset) {
      return { success: true, public_url: publicUrl, media_asset_id: null, storage_path: storagePath };
    }

    // 7. Log success
    await logImagenEvent(projectId, 'imagen_generated', {
      asset_id: insertedAsset.id,
      platform,
      aspect_ratio: aspectRatio,
      prompt_length: imagePrompt.length,
      file_size: finalImageBuffer.length,
      has_logo: !!logoUrl,
      has_text_overlay: !!(overlayText && mergedOverlayConfig.enabled),
      post_id: postId || null,
    });

    return {
      success: true,
      public_url: publicUrl,
      media_asset_id: insertedAsset.id,
      storage_path: storagePath,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[imagen] Generation failed:', errorMsg, err);
    await logImagenEvent(projectId, 'imagen_error', { error: errorMsg, platform });
    return { success: false, public_url: null, media_asset_id: null, storage_path: null, error: errorMsg };
  }
}

/**
 * Call Imagen 4 REST API
 * Returns array of base64 image bytes (1-4 samples)
 * Uses negativePrompt as separate API parameter (not mixed into prompt)
 */
async function callImagenAPI(
  prompt: string,
  aspectRatio: string,
  negativePrompt?: string,
  sampleCount: number = 1,
): Promise<string[]> {
  const parameters: Record<string, unknown> = {
    sampleCount: Math.min(Math.max(sampleCount, 1), 4),
    aspectRatio,
    personGeneration: 'allow_adult',
  };

  // negativePrompt as separate API parameter — much more effective than mixing into prompt
  if (negativePrompt) {
    parameters.negativePrompt = negativePrompt;
  }

  const response = await fetch(IMAGEN_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': GEMINI_API_KEY,
    },
    body: JSON.stringify({
      instances: [{ prompt }],
      parameters,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => 'Unknown');
    console.error(`[imagen] API error ${response.status}:`, errorBody);
    throw new Error(`Imagen API error ${response.status}: ${errorBody}`);
  }

  const data = await response.json();
  console.log(`[imagen] API returned ${data.predictions?.length || 0} samples`);
  
  const predictions = data.predictions;
  if (!predictions || predictions.length === 0) {
    console.error('[imagen] No predictions in response');
    return [];
  }

  // Collect all valid base64 images
  const images: string[] = [];
  for (const pred of predictions) {
    if (pred.bytesBase64Encoded) {
      images.push(pred.bytesBase64Encoded);
    }
  }
  return images;
}

/**
 * Pick the best image from multiple samples using Gemini Vision scoring.
 * Scores each image for: photorealism, composition, relevance to prompt, absence of AI artifacts.
 * Returns the best base64 image.
 */
async function pickBestImage(
  images: string[],
  originalPrompt: string,
  qualityThreshold: number,
): Promise<string> {
  if (images.length <= 1) return images[0];

  try {
    const { google } = await import('@ai-sdk/google');
    const { generateText } = await import('ai');

    // Score each image with Gemini Vision
    const scores: Array<{ index: number; score: number }> = [];

    for (let i = 0; i < images.length; i++) {
      try {
        const { text } = await generateText({
          model: google('gemini-2.0-flash'),
          messages: [{
            role: 'user',
            content: [
              {
                type: 'image',
                image: Buffer.from(images[i], 'base64'),
              },
              {
                type: 'text',
                text: `Rate this photo on a scale of 1-10 for use as a social media post image.
                
Original prompt: "${originalPrompt.substring(0, 200)}"

Score based on:
- Photorealism (does it look like a real photo, not AI-generated?)
- Composition (good framing, rule of thirds, visual balance?)
- Relevance (does it match the prompt description?)
- Technical quality (sharp, well-lit, no artifacts, no extra fingers?)
- Emotional impact (does it evoke feeling, tell a story?)

Return ONLY a JSON: {"score": N, "reason": "one sentence"}`,
              },
            ],
          }],
          temperature: 0.1,
        });

        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          scores.push({ index: i, score: parsed.score || 5 });
          console.log(`[imagen] Sample ${i + 1}: score=${parsed.score}, reason=${parsed.reason}`);
        } else {
          scores.push({ index: i, score: 5 });
        }
      } catch {
        scores.push({ index: i, score: 5 });
      }
    }

    // Sort by score descending, pick best
    scores.sort((a, b) => b.score - a.score);
    const best = scores[0];

    if (best.score < qualityThreshold) {
      console.log(`[imagen] Best score ${best.score} below threshold ${qualityThreshold} — using anyway (no retry budget here)`);
    }

    return images[best.index];
  } catch (err) {
    console.error('[imagen] pickBestImage failed, using first sample:', err);
    return images[0];
  }
}

/**
 * Apply post-processing pipeline to image buffer using Sharp.
 * All settings are per-project from PhotographyPreset.post_processing.
 */
async function applyPostProcessing(
  imageBuffer: Buffer,
  settings: PhotographyPreset['post_processing'],
): Promise<Buffer> {
  const sharp = (await import('sharp')).default;
  let pipeline = sharp(imageBuffer);

  // Denoise (median filter — removes AI noise without losing detail)
  if (settings.denoise) {
    pipeline = pipeline.median(3);
  }

  // Sharpening (subtle unsharp mask for crisp details)
  if (settings.sharpen) {
    pipeline = pipeline.sharpen({ sigma: 0.8, m1: 0.5, m2: 0.3 });
  }

  // Color adjustments: saturation, contrast, warmth
  const needsModulate = settings.saturation !== 1.0 || settings.warmth !== 0;
  if (needsModulate) {
    pipeline = pipeline.modulate({
      saturation: settings.saturation,
      // warmth: shift hue slightly toward warm (positive) or cool (negative)
      hue: Math.round(settings.warmth * 15), // ±0.1 → ±1.5 degree hue shift
    });
  }

  // Contrast adjustment via linear transform
  if (settings.contrast !== 1.0) {
    pipeline = pipeline.linear(settings.contrast, -(128 * (settings.contrast - 1)));
  }

  // Film grain (adds realism — AI images are too clean)
  if (settings.film_grain > 0) {
    // Generate noise overlay and composite
    const metadata = await sharp(imageBuffer).metadata();
    const w = metadata.width || 1080;
    const h = metadata.height || 1080;
    const grainIntensity = Math.round(settings.film_grain * 40); // 0.15 → ~6

    // Create noise buffer (random grayscale pixels)
    const noisePixels = Buffer.alloc(w * h);
    for (let i = 0; i < noisePixels.length; i++) {
      noisePixels[i] = Math.round(128 + (Math.random() - 0.5) * grainIntensity * 2);
    }

    const noiseBuffer = await sharp(noisePixels, { raw: { width: w, height: h, channels: 1 } })
      .png()
      .toBuffer();

    // Composite noise as soft-light blend (subtle grain effect)
    pipeline = pipeline.composite([{
      input: noiseBuffer,
      blend: 'soft-light' as const,
      gravity: 'center',
    }]);
  }

  const result = await pipeline.png().toBuffer();
  console.log(`[imagen] Post-processing applied: sharpen=${settings.sharpen}, denoise=${settings.denoise}, grain=${settings.film_grain}, sat=${settings.saturation}, contrast=${settings.contrast}`);
  return result as Buffer;
}

/**
 * Enforce platform-specific aspect ratio constraints.
 * Crops the image (center crop) if it exceeds the platform's allowed range.
 * 
 * Instagram: min 4:5 (0.80), max 1.91:1 — we target 4:5 for portrait
 * Facebook: 1.91:1 landscape or 1:1 square
 * LinkedIn: 1.91:1 landscape
 * Others: no strict enforcement
 */
async function enforceAspectRatio(imageBuffer: Buffer, platform: string): Promise<Buffer> {
  // Exact target dimensions per platform (width × height)
  // These are the pixel-perfect sizes that platforms expect
  const PLATFORM_TARGETS: Record<string, { width: number; height: number; ratio: number }> = {
    instagram: { width: 1080, height: 1350, ratio: 0.80 },  // 4:5 portrait
    facebook:  { width: 1200, height: 630,  ratio: 1.905 }, // 1.91:1 landscape
    linkedin:  { width: 1200, height: 628,  ratio: 1.91 },  // 1.91:1 landscape
    x:         { width: 1200, height: 675,  ratio: 1.78 },  // 16:9 landscape
    tiktok:    { width: 1080, height: 1920, ratio: 0.5625 }, // 9:16 portrait
    pinterest: { width: 1000, height: 1500, ratio: 0.667 },  // 2:3 portrait
  };

  const target = PLATFORM_TARGETS[platform];
  if (!target) return imageBuffer;

  try {
    const sharp = (await import('sharp')).default;
    const metadata = await sharp(imageBuffer).metadata();
    const w = metadata.width;
    const h = metadata.height;
    if (!w || !h) return imageBuffer;

    const currentRatio = w / h;
    const targetRatio = target.ratio;
    const ratioDiff = Math.abs(currentRatio - targetRatio);

    // If ratio is close enough (within 2%), just resize to exact dimensions
    if (ratioDiff < 0.02) {
      console.log(`[imagen] Resize ${platform}: ${w}×${h} → ${target.width}×${target.height} (ratio OK: ${currentRatio.toFixed(3)})`);
      return await sharp(imageBuffer)
        .resize(target.width, target.height, { fit: 'fill' })
        .png()
        .toBuffer();
    }

    // Need to crop first, then resize
    let cropW = w;
    let cropH = h;

    if (currentRatio < targetRatio) {
      // Too tall (portrait) — crop height to match target ratio
      cropH = Math.round(w / targetRatio);
      cropW = w;
    } else {
      // Too wide (landscape) — crop width to match target ratio
      cropW = Math.round(h * targetRatio);
      cropH = h;
    }

    cropW = Math.min(cropW, w);
    cropH = Math.min(cropH, h);

    const left = Math.round((w - cropW) / 2);
    const top = Math.round((h - cropH) / 2);

    console.log(`[imagen] Crop+resize ${platform}: ${w}×${h} (${currentRatio.toFixed(2)}) → crop ${cropW}×${cropH} → resize ${target.width}×${target.height}`);

    return await sharp(imageBuffer)
      .extract({ left, top, width: cropW, height: cropH })
      .resize(target.width, target.height)
      .png()
      .toBuffer();
  } catch {
    // sharp not available or crop failed
    return imageBuffer;
  }
}

/**
 * Composite generated image with project logo (bottom-right corner)
 * Uses Canvas API via sharp or simple overlay
 */
async function compositeWithLogo(imageBuffer: Buffer, logoUrl: string): Promise<Buffer> {
  // Fetch logo
  const logoResponse = await fetch(logoUrl);
  if (!logoResponse.ok) return imageBuffer;
  const logoArrayBuffer = await logoResponse.arrayBuffer();
  const logoBuffer = Buffer.from(logoArrayBuffer);

  // Try to use sharp for compositing (if available)
  try {
    const sharp = (await import('sharp')).default;
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();
    const imgWidth = metadata.width || 1200;
    const imgHeight = metadata.height || 900;

    // Logo: max 12% of image width, positioned bottom-right with safe padding (5%)
    const logoMaxWidth = Math.round(imgWidth * 0.12);
    const padding = Math.round(imgWidth * 0.05);

    const resizedLogo = await sharp(logoBuffer)
      .resize({ width: logoMaxWidth, withoutEnlargement: true })
      .png()
      .toBuffer();

    const logoMeta = await sharp(resizedLogo).metadata();
    const logoW = logoMeta.width || logoMaxWidth;
    const logoH = logoMeta.height || logoMaxWidth;

    const result = await image
      .composite([{
        input: resizedLogo,
        top: imgHeight - logoH - padding,
        left: imgWidth - logoW - padding,
      }])
      .png()
      .toBuffer();

    return result;
  } catch {
    // sharp not available — return image without logo
    return imageBuffer;
  }
}

/**
 * Composite text overlay on image using Sharp + SVG
 * Supports: position (top/center/bottom), background style (box/gradient/shadow_only/none),
 * uppercase, number highlighting, configurable font size and padding.
 */
async function compositeWithText(
  imageBuffer: Buffer,
  text: string,
  config: TextOverlayConfig
): Promise<Buffer> {
  const sharp = (await import('sharp')).default;
  const meta = await sharp(imageBuffer).metadata();
  const w = meta.width || 1080;
  const h = meta.height || 1350;

  // Truncate text to max_chars
  let displayText = text.slice(0, config.max_chars);
  if (config.uppercase) displayText = displayText.toUpperCase();

  // Escape XML entities
  const escapeXml = (s: string) => s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  const fontSize = Math.round(w * config.font_size_ratio);
  const lineHeight = Math.round(fontSize * 1.45);
  const padding = Math.round(w * config.padding_ratio);
  const fontWeight = config.font_weight === 'bold' ? 'bold' : 'normal';

  // Word-wrap into lines
  const words = displayText.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';
  const maxCharsPerLine = Math.floor((w - padding * 2) / (fontSize * 0.55));

  for (const word of words) {
    if (currentLine && (currentLine + ' ' + word).length > maxCharsPerLine) {
      lines.push(currentLine);
      currentLine = word;
      if (lines.length >= config.max_lines) break;
    } else {
      currentLine = currentLine ? currentLine + ' ' + word : word;
    }
  }
  if (currentLine && lines.length < config.max_lines) lines.push(currentLine);

  const totalTextHeight = lines.length * lineHeight;
  const boxHeight = totalTextHeight + padding * 1.5;

  // Calculate Y position based on config.position
  let boxY: number;
  if (config.position === 'top') {
    boxY = 0;
  } else if (config.position === 'center') {
    boxY = Math.round((h - boxHeight) / 2);
  } else {
    boxY = h - boxHeight;
  }

  // Build background SVG element
  let bgSvg = '';
  if (config.bg_style === 'box') {
    bgSvg = `<rect x="0" y="${boxY}" width="${w}" height="${boxHeight}" fill="rgba(0,0,0,${config.bg_opacity})" />`;
  } else if (config.bg_style === 'gradient') {
    const gradY1 = config.position === 'top' ? '0%' : `${Math.round((boxY - h * 0.1) / h * 100)}%`;
    const gradY2 = config.position === 'top' ? `${Math.round(boxHeight / h * 100 + 10)}%` : '100%';
    const stops = config.position === 'top'
      ? `<stop offset="0%" stop-color="black" stop-opacity="${config.bg_opacity}"/><stop offset="100%" stop-color="black" stop-opacity="0"/>`
      : `<stop offset="0%" stop-color="black" stop-opacity="0"/><stop offset="100%" stop-color="black" stop-opacity="${config.bg_opacity}"/>`;
    bgSvg = `
      <defs><linearGradient id="tg" x1="0" y1="${gradY1}" x2="0" y2="${gradY2}" gradientUnits="userSpaceOnUse">${stops}</linearGradient></defs>
      <rect x="0" y="${config.position === 'top' ? 0 : boxY - h * 0.1}" width="${w}" height="${boxHeight + h * 0.1}" fill="url(#tg)" />`;
  }
  // shadow_only and none: no background element

  // Build text lines with optional number highlighting
  const textStartY = boxY + padding * 0.75 + fontSize;
  const textLines = lines.map((line, i) => {
    const y = textStartY + i * lineHeight;
    const x = padding;

    if (config.highlight_numbers) {
      // Split line into segments: numbers vs text
      const parts = line.split(/(\d[\d\s,.%×x+−-]*\d|\d+\s*%|\d+)/g);
      let svgLine = `<text x="${x}" y="${y}" font-family="sans-serif" font-size="${fontSize}" font-weight="${fontWeight}" fill="${escapeXml(config.text_color)}">`;
      for (const part of parts) {
        if (/\d/.test(part)) {
          svgLine += `<tspan fill="${escapeXml(config.accent_color)}">${escapeXml(part)}</tspan>`;
        } else {
          svgLine += escapeXml(part);
        }
      }
      svgLine += '</text>';
      return svgLine;
    }

    return `<text x="${x}" y="${y}" font-family="sans-serif" font-size="${fontSize}" font-weight="${fontWeight}" fill="${escapeXml(config.text_color)}">${escapeXml(line)}</text>`;
  }).join('\n    ');

  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    ${bgSvg}
    ${textLines}
  </svg>`;

  console.log(`[imagen] Text overlay: ${lines.length} lines, pos=${config.position}, bg=${config.bg_style}, fontSize=${fontSize}`);

  return sharp(imageBuffer)
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .png()
    .toBuffer();
}

/**
 * Build a rich, brand-aware image prompt from Hugo's decision.
 * 
 * Uses PhotographyPreset (per-project) to produce images that look like they belong
 * to the brand — not generic AI stock photos.
 * 
 * NO hardcoded fallbacks — everything comes from the preset (which has sensible defaults).
 * Legacy visual identity fields are migrated to preset format automatically.
 */
export function buildCleanImagePrompt(options: {
  rawPrompt: string;
  projectName: string;
  platform: string;
  photographyPreset?: Partial<PhotographyPreset> | null;
  visualIdentity?: Partial<{
    primary_color: string;
    style: string;
    photography_style: string;
    photography_mood: string;
    photography_subjects: string;
    photography_avoid: string;
    photography_lighting: string;
    photography_color_grade: string;
    photography_reference: string;
    brand_visual_keywords: string;
  }>;
}): { prompt: string; negativePrompt: string } {
  const { rawPrompt, platform, visualIdentity: vi } = options;

  // Merge: explicit preset > legacy VI fields > defaults
  const preset: PhotographyPreset = {
    ...DEFAULT_PHOTOGRAPHY_PRESET,
    // Migrate legacy VI fields if no explicit preset provided
    ...(vi?.photography_style && !options.photographyPreset?.style ? { style: vi.photography_style } : {}),
    ...(vi?.photography_mood && !options.photographyPreset?.mood ? { mood: vi.photography_mood } : {}),
    ...(vi?.photography_lighting && !options.photographyPreset?.lighting ? { lighting: vi.photography_lighting } : {}),
    ...(vi?.photography_color_grade && !options.photographyPreset?.color_grade ? { color_grade: vi.photography_color_grade } : {}),
    ...(vi?.photography_subjects && !options.photographyPreset?.typical_subjects ? { typical_subjects: vi.photography_subjects } : {}),
    ...(vi?.photography_avoid && !options.photographyPreset?.negative_prompt ? { negative_prompt: vi.photography_avoid } : {}),
    ...(vi?.photography_reference && !options.photographyPreset?.composition ? { composition: vi.photography_reference } : {}),
    ...options.photographyPreset,
  };

  // 1. Clean the raw prompt from AI
  const cleanedPrompt = rawPrompt
    .replace(/[!]{2,}/g, '.')
    .replace(/\b(amazing|incredible|revolutionary|life-changing|guaranteed|passive income|financial freedom|best ever|number one|world class)\b/gi, '')
    .replace(/\b(stock photo|generic|placeholder|sample|example image)\b/gi, '')
    .trim();

  // 2. Build positive prompt — concise, structured layers from preset
  const parts: string[] = [];

  // Core scene description from Hugo AI (this is the per-post, per-topic part)
  parts.push(cleanedPrompt);

  // Per-project photography directives from preset
  parts.push(`${preset.style} photography.`);
  parts.push(`Mood: ${preset.mood}.`);
  parts.push(`Lighting: ${preset.lighting}.`);
  parts.push(`Color grade: ${preset.color_grade}.`);
  parts.push(`Composition: ${preset.composition}.`);

  if (preset.typical_subjects) {
    parts.push(`Subjects: ${preset.typical_subjects}.`);
  }
  if (preset.typical_settings) {
    parts.push(`Setting: ${preset.typical_settings}.`);
  }

  // Brand visual keywords from legacy VI (if present)
  if (vi?.brand_visual_keywords) {
    parts.push(`Visual themes: ${vi.brand_visual_keywords}.`);
  }

  // Camera/technical style from preset
  parts.push(`${preset.camera_style}, photorealistic.`);

  // Platform composition hint — minimal, just aspect ratio guidance
  const platformComposition: Record<string, string> = {
    instagram: 'Strong visual center, works in square crop.',
    linkedin: 'Clean professional framing.',
    facebook: 'Inviting, community-oriented framing.',
    x: 'Bold framing, high contrast.',
    tiktok: 'Vertical framing, dynamic.',
    pinterest: 'Vertical, aspirational.',
  };
  if (platformComposition[platform]) {
    parts.push(platformComposition[platform]);
  }

  // 3. Negative prompt — separate, sent as negativePrompt API parameter
  const negativePrompt = preset.negative_prompt;

  return {
    prompt: parts.join(' ').replace(/\s{2,}/g, ' ').trim(),
    negativePrompt,
  };
}

/**
 * Extract basic tags from an English prompt
 */
function extractTagsFromPrompt(prompt: string): string[] {
  const stopWords = new Set(['a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
    'may', 'might', 'must', 'shall', 'can', 'for', 'and', 'nor', 'but', 'or',
    'yet', 'so', 'at', 'by', 'in', 'of', 'on', 'to', 'up', 'with', 'no', 'not']);

  return prompt
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 3 && !stopWords.has(w))
    .slice(0, 10);
}

/**
 * Log Imagen events to agent_log
 */
async function logImagenEvent(projectId: string, action: string, details: Record<string, unknown>): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.from('agent_log').insert({
      project_id: projectId,
      action,
      details: { ...details, timestamp: new Date().toISOString() },
    });
  } catch {
    // Logging should never fail the main flow
  }
}
