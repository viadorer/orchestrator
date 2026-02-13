/**
 * Vision Engine – AI rozpoznávání obsahu fotek/videí
 * 
 * Gemini 2.0 Flash Vision:
 * 1. Popis fotky (ai_description)
 * 2. Tagy (ai_tags)
 * 3. Objekty (ai_objects)
 * 4. Nálada (ai_mood)
 * 5. Scéna (ai_scene)
 * 6. Kvalita (ai_quality_score)
 * 7. Barvy (ai_colors)
 * 
 * + Embedding pro sémantické vyhledávání (pgvector)
 */

import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { supabase } from '@/lib/supabase/client';

// ============================================
// Types
// ============================================

export interface MediaAnalysis {
  description: string;
  tags: string[];
  objects: string[];
  colors: string[];
  mood: string;
  scene: string;
  quality_score: number;
}

export interface MediaAsset {
  id: string;
  project_id: string;
  storage_path: string;
  public_url: string;
  file_name: string;
  file_type: string;
  ai_description: string | null;
  ai_tags: string[];
  ai_mood: string | null;
  ai_scene: string | null;
  embedding: number[] | null;
  times_used: number;
  is_processed: boolean;
}

// ============================================
// Analyze image with Gemini Vision
// ============================================

export async function analyzeImage(imageUrl: string, projectContext?: string): Promise<MediaAnalysis> {
  const contextHint = projectContext
    ? `\nKontext projektu: ${projectContext}`
    : '';

  const prompt = `Analyzuj tento obrázek pro použití v marketingovém obsahu na sociálních sítích.${contextHint}

Vrať POUZE JSON (žádný markdown, žádný text okolo):
{
  "description": "Detailní popis obrázku v češtině, 1-2 věty. Co je na obrázku, jaká je atmosféra.",
  "tags": ["tag1", "tag2", ...],  // 5-15 relevantních tagů v češtině
  "objects": ["object1", "object2", ...],  // Identifikované objekty v angličtině
  "colors": ["#hex1", "#hex2", "#hex3"],  // 3-5 dominantních barev
  "mood": "professional|casual|happy|dramatic|warm|cold|energetic|calm|luxurious|minimalist",
  "scene": "office|outdoor|home|studio|abstract|city|nature|event|product|food",
  "quality_score": 7.5  // 0-10, technická kvalita + vhodnost pro sociální sítě
}`;

  const { text: rawResponse } = await generateText({
    model: google('gemini-2.0-flash'),
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image', image: new URL(imageUrl) },
        ],
      },
    ],
    temperature: 0.2,
  });

  try {
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        description: parsed.description || '',
        tags: Array.isArray(parsed.tags) ? parsed.tags : [],
        objects: Array.isArray(parsed.objects) ? parsed.objects : [],
        colors: Array.isArray(parsed.colors) ? parsed.colors : [],
        mood: parsed.mood || 'neutral',
        scene: parsed.scene || 'unknown',
        quality_score: typeof parsed.quality_score === 'number' ? parsed.quality_score : 5,
      };
    }
  } catch {
    // Parse failed
  }

  return {
    description: 'Analýza selhala',
    tags: [],
    objects: [],
    colors: [],
    mood: 'unknown',
    scene: 'unknown',
    quality_score: 0,
  };
}

// ============================================
// Generate embedding for media description
// ============================================

export async function generateMediaEmbedding(description: string, tags: string[]): Promise<number[] | null> {
  if (!description && tags.length === 0) return null;

  const textForEmbedding = `${description} ${tags.join(' ')}`;

  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': process.env.GOOGLE_GENERATIVE_AI_API_KEY || '',
      },
      body: JSON.stringify({
        model: 'models/text-embedding-004',
        content: { parts: [{ text: textForEmbedding }] },
        taskType: 'RETRIEVAL_DOCUMENT',
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data.embedding?.values || null;
  } catch {
    return null;
  }
}

// ============================================
// Process single media asset (analyze + embed)
// ============================================

export async function processMediaAsset(assetId: string): Promise<boolean> {
  if (!supabase) return false;

  const { data: asset } = await supabase
    .from('media_assets')
    .select('*')
    .eq('id', assetId)
    .single();

  if (!asset) return false;

  // Get project context for better tagging
  const { data: project } = await supabase
    .from('projects')
    .select('name, description, semantic_anchors')
    .eq('id', asset.project_id)
    .single();

  const projectContext = project
    ? `${project.name}: ${project.description || ''} Klíčová slova: ${(project.semantic_anchors as string[] || []).join(', ')}`
    : undefined;

  try {
    // 1. Analyze image with Gemini Vision
    const analysis = await analyzeImage(asset.public_url, projectContext);

    // 2. Generate embedding
    const embedding = await generateMediaEmbedding(analysis.description, analysis.tags);

    // 3. Update asset in DB
    const updateData: Record<string, unknown> = {
      ai_description: analysis.description,
      ai_tags: analysis.tags,
      ai_objects: analysis.objects,
      ai_colors: analysis.colors,
      ai_mood: analysis.mood,
      ai_scene: analysis.scene,
      ai_quality_score: analysis.quality_score,
      is_processed: true,
      processing_error: null,
    };

    if (embedding) {
      updateData.embedding = JSON.stringify(embedding);
    }

    await supabase
      .from('media_assets')
      .update(updateData)
      .eq('id', assetId);

    // Log
    await supabase.from('agent_log').insert({
      project_id: asset.project_id,
      action: 'media_processed',
      details: {
        asset_id: assetId,
        description: analysis.description.substring(0, 100),
        tags_count: analysis.tags.length,
        quality: analysis.quality_score,
        has_embedding: !!embedding,
      },
    });

    return true;
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    await supabase
      .from('media_assets')
      .update({ processing_error: errorMsg })
      .eq('id', assetId);
    return false;
  }
}

// ============================================
// Batch process unprocessed assets
// ============================================

export async function processUntaggedMedia(limit = 20): Promise<{ processed: number; failed: number }> {
  if (!supabase) return { processed: 0, failed: 0 };

  const { data: assets } = await supabase
    .from('media_assets')
    .select('id')
    .eq('is_processed', false)
    .is('processing_error', null)
    .eq('is_active', true)
    .limit(limit);

  if (!assets || assets.length === 0) return { processed: 0, failed: 0 };

  let processed = 0;
  let failed = 0;

  for (const asset of assets) {
    const success = await processMediaAsset(asset.id);
    if (success) processed++;
    else failed++;
  }

  return { processed, failed };
}

// ============================================
// Find best matching media for post text
// ============================================

export async function findMatchingMedia(
  projectId: string,
  postText: string,
  options: { limit?: number; fileType?: string; excludeRecentlyUsed?: boolean } = {}
): Promise<MediaAsset[]> {
  if (!supabase) return [];

  const { limit = 5, fileType, excludeRecentlyUsed = true } = options;

  // 1. Generate embedding for post text
  const embedding = await generateMediaEmbedding(postText, []);
  if (!embedding) return [];

  // 2. Query pgvector for similar media
  // Using Supabase RPC for vector similarity search
  const { data, error } = await supabase.rpc('match_media_assets', {
    query_embedding: JSON.stringify(embedding),
    match_project_id: projectId,
    match_threshold: 0.3,
    match_count: limit,
    filter_file_type: fileType || null,
    exclude_recently_used: excludeRecentlyUsed,
  });

  if (error || !data) return [];

  return data as MediaAsset[];
}

// ============================================
// Mark media as used in a post
// ============================================

export async function markMediaUsed(assetId: string, postId?: string): Promise<void> {
  if (!supabase) return;

  await supabase.rpc('increment_media_usage', { asset_id: assetId });

  await supabase
    .from('media_assets')
    .update({
      last_used_at: new Date().toISOString(),
      last_used_in: postId || null,
    })
    .eq('id', assetId);
}
