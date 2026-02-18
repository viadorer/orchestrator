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
import { analyzeImage, generateMediaEmbedding } from '@/lib/ai/vision-engine';
import { getDefaultImageSpec } from '@/lib/platforms';

const GEMINI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY || '';
const IMAGEN_MODEL = 'imagen-4.0-generate-001';
const IMAGEN_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${IMAGEN_MODEL}:predict`;

/**
 * Get aspect ratio for a platform from PLATFORM_LIMITS (single source of truth).
 * Falls back to '4:3' if platform is unknown.
 */
function getPlatformAspectRatio(platform: string): string {
  const spec = getDefaultImageSpec(platform);
  return spec?.aspectRatio || '4:3';
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
export async function generateAndStoreImage(options: {
  projectId: string;
  imagePrompt: string;
  platform: string;
  postId?: string;
  logoUrl?: string | null;
}): Promise<ImagenResult> {
  const { projectId, imagePrompt, platform, postId, logoUrl } = options;

  if (!GEMINI_API_KEY) {
    return { success: false, public_url: null, media_asset_id: null, storage_path: null, error: 'GOOGLE_GENERATIVE_AI_API_KEY not set' };
  }
  if (!supabase) {
    return { success: false, public_url: null, media_asset_id: null, storage_path: null, error: 'Supabase not configured' };
  }

  try {
    // 1. Generate image via Imagen API
    const aspectRatio = getPlatformAspectRatio(platform);
    const imageBytes = await callImagenAPI(imagePrompt, aspectRatio);
    if (!imageBytes) {
      return { success: false, public_url: null, media_asset_id: null, storage_path: null, error: 'Imagen API returned no image' };
    }

    // 2. Compose final image (add logo overlay if provided)
    let finalImageBuffer: Buffer = Buffer.from(imageBytes, 'base64') as Buffer;
    if (logoUrl) {
      try {
        finalImageBuffer = await compositeWithLogo(finalImageBuffer, logoUrl);
      } catch {
        // Logo compositing failed, use original image
      }
    }

    // 3. Upload to Supabase Storage
    const timestamp = Date.now();
    const fileName = `generated_${platform}_${timestamp}.png`;
    const storagePath = `${projectId}/generated/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('media-assets')
      .upload(storagePath, finalImageBuffer, {
        contentType: 'image/png',
        upsert: false,
      });

    if (uploadError) {
      return { success: false, public_url: null, media_asset_id: null, storage_path: null, error: `Storage upload failed: ${uploadError.message}` };
    }

    // 4. Get public URL
    const { data: urlData } = supabase.storage
      .from('media-assets')
      .getPublicUrl(storagePath);

    const publicUrl = urlData?.publicUrl || null;
    if (!publicUrl) {
      return { success: false, public_url: null, media_asset_id: null, storage_path: null, error: 'Failed to get public URL' };
    }

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
 * Returns base64 image bytes or null
 */
async function callImagenAPI(prompt: string, aspectRatio: string): Promise<string | null> {
  const response = await fetch(IMAGEN_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': GEMINI_API_KEY,
    },
    body: JSON.stringify({
      instances: [{ prompt }],
      parameters: {
        sampleCount: 1,
        aspectRatio,
        personGeneration: 'allow_adult',
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => 'Unknown');
    console.error(`[imagen] API error ${response.status}:`, errorBody);
    throw new Error(`Imagen API error ${response.status}: ${errorBody}`);
  }

  const data = await response.json();
  const predictions = data.predictions;
  if (!predictions || predictions.length === 0) return null;

  // Imagen returns base64 encoded image in bytesBase64Encoded field
  return predictions[0].bytesBase64Encoded || null;
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

    // Logo: max 10% of image width, positioned bottom-right with padding
    const logoMaxWidth = Math.round(imgWidth * 0.10);
    const padding = Math.round(imgWidth * 0.03);

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
 * Build a rich, brand-aware image prompt from Hugo's decision.
 * 
 * Uses the full visual identity (photography style, mood, subjects, lighting,
 * color grading, negative prompts) to produce images that look like they belong
 * to the brand — not generic AI stock photos.
 */
export function buildCleanImagePrompt(options: {
  rawPrompt: string;
  projectName: string;
  platform: string;
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
}): string {
  const { rawPrompt, projectName, platform, visualIdentity: vi } = options;

  // 1. Clean the raw prompt from AI
  const cleanedPrompt = rawPrompt
    .replace(/[!]{2,}/g, '.')
    .replace(/\b(amazing|incredible|revolutionary|life-changing|guaranteed|passive income|financial freedom|best ever|number one|world class)\b/gi, '')
    .replace(/\b(stock photo|generic|placeholder|sample|example image)\b/gi, '')
    .trim();

  // 2. Build prompt layers
  const parts: string[] = [];

  // Core scene description from AI
  parts.push(cleanedPrompt);

  // Photography style (documentary > editorial > lifestyle > corporate)
  if (vi?.photography_style) {
    parts.push(`Photography style: ${vi.photography_style}.`);
  } else {
    parts.push('Candid documentary-style photography, not posed.');
  }

  // Mood & atmosphere
  if (vi?.photography_mood) {
    parts.push(`Mood: ${vi.photography_mood}.`);
  }

  // Lighting
  if (vi?.photography_lighting) {
    parts.push(`Lighting: ${vi.photography_lighting}.`);
  } else {
    parts.push('Natural ambient lighting.');
  }

  // Color grading
  if (vi?.photography_color_grade) {
    parts.push(`Color grade: ${vi.photography_color_grade}.`);
  } else if (vi?.primary_color) {
    parts.push(`Subtle color accent: ${vi.primary_color}.`);
  }

  // Subject guidance
  if (vi?.photography_subjects) {
    parts.push(`Subjects: ${vi.photography_subjects}.`);
  }

  // Brand keywords for visual coherence
  if (vi?.brand_visual_keywords) {
    parts.push(`Visual themes: ${vi.brand_visual_keywords}.`);
  }

  // Reference style
  if (vi?.photography_reference) {
    parts.push(`Reference: ${vi.photography_reference}.`);
  }

  // Platform-specific composition hints (minimal, not overriding brand)
  const platformHint: Record<string, string> = {
    instagram: 'Composed for square crop, strong visual center.',
    linkedin: 'Clean composition, professional context.',
    facebook: 'Warm, inviting composition, community feel.',
    x: 'High contrast, bold framing, minimal background.',
    tiktok: 'Vertical framing, dynamic energy.',
    pinterest: 'Vertical composition, aspirational aesthetic.',
  };
  if (platformHint[platform]) {
    parts.push(platformHint[platform]);
  }

  // Anti-AI / anti-stock quality directives
  const avoidParts: string[] = [];
  if (vi?.photography_avoid) {
    avoidParts.push(vi.photography_avoid);
  }
  avoidParts.push('No text overlays, no watermarks, no logos in the image');
  avoidParts.push('Avoid: overly saturated colors, plastic skin, symmetrical stock poses, fake smiles, AI artifacts, extra fingers');
  parts.push(avoidParts.join('. ') + '.');

  // Technical quality
  parts.push('Shot on high-end mirrorless camera, shallow depth of field where appropriate, photorealistic, 4K resolution.');

  return parts.join(' ').replace(/\s{2,}/g, ' ').trim();
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
