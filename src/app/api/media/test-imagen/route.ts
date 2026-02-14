/**
 * Test endpoint pro Imagen 4 API
 * 
 * POST /api/media/test-imagen
 * Body: { projectId, prompt, platform? }
 * 
 * Testuje celý flow:
 * 1. Imagen 4 API call (generování obrázku)
 * 2. Upload do Supabase Storage
 * 3. Vision analýza (tagy, popis, mood)
 * 4. Embedding (pgvector)
 * 5. Insert do media_assets
 */

import { NextResponse } from 'next/server';
import { generateAndStoreImage, buildCleanImagePrompt } from '@/lib/visual/imagen';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { projectId, prompt, platform = 'linkedin' } = body;

    if (!projectId || !prompt) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, prompt' },
        { status: 400 }
      );
    }

    // Build clean prompt
    const cleanPrompt = buildCleanImagePrompt({
      rawPrompt: prompt,
      projectName: 'Test',
      platform,
    });

    console.log('[test-imagen] Starting generation...');
    console.log('[test-imagen] Clean prompt:', cleanPrompt);
    console.log('[test-imagen] Platform:', platform);

    const startTime = Date.now();

    // Generate + store
    const result = await generateAndStoreImage({
      projectId,
      imagePrompt: cleanPrompt,
      platform,
    });

    const duration = Date.now() - startTime;

    console.log('[test-imagen] Result:', JSON.stringify(result, null, 2));
    console.log(`[test-imagen] Duration: ${duration}ms`);

    return NextResponse.json({
      ...result,
      clean_prompt: cleanPrompt,
      platform,
      duration_ms: duration,
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[test-imagen] Error:', errorMsg);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: 'POST /api/media/test-imagen',
    description: 'Test Imagen 4 API - generování + uložení obrázku',
    body: {
      projectId: 'UUID projektu (povinné)',
      prompt: 'Popis obrázku v angličtině nebo češtině (povinné)',
      platform: 'linkedin | instagram | facebook | x (volitelné, default: linkedin)',
    },
    example: {
      projectId: 'a1b2c3d4-0002-4000-8000-000000000002',
      prompt: 'Modern apartment building in Prague, aerial view, sunny day',
      platform: 'instagram',
    },
    flow: [
      '1. buildCleanImagePrompt() - vyčistí prompt, přidá platformní styl',
      '2. callImagenAPI() - Imagen 4 REST API, vrátí base64 PNG',
      '3. compositeWithLogo() - přidá logo (pokud je v projektu)',
      '4. Supabase Storage upload - media-assets/{projectId}/generated/',
      '5. analyzeImage() - Gemini Vision tagy, popis, mood, scene',
      '6. generateMediaEmbedding() - text-embedding-004 pro pgvector',
      '7. Insert do media_assets tabulky',
    ],
  });
}
