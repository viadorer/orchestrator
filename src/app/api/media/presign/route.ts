import { supabase } from '@/lib/supabase/client';
import { getR2PresignedUploadUrl, getR2PublicUrl, isR2Configured } from '@/lib/storage/cloudflare-r2';
import { processMediaAsset } from '@/lib/ai/vision-engine';
import { NextResponse } from 'next/server';

/**
 * Presigned Upload API — direct client→R2 (bypasses server)
 *
 * POST /api/media/presign
 * Body: { files: [{ name, type, size }], project_id?, tags?, shared?, description? }
 *
 * Returns presigned PUT URLs. Client uploads directly to R2.
 * After upload, client calls POST /api/media/presign/confirm with asset IDs.
 *
 * Flow:
 * 1. Server generates presigned URLs + creates media_assets records (is_processed=false)
 * 2. Client uploads files directly to R2 using PUT <presigned_url>
 * 3. Client calls /api/media/presign/confirm to trigger AI analysis
 */
export async function POST(request: Request) {
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  if (!isR2Configured()) return NextResponse.json({ error: 'R2 not configured' }, { status: 500 });

  const body = await request.json();
  const { files, project_id, tags, shared, description } = body as {
    files: Array<{ name: string; type: string; size: number }>;
    project_id?: string;
    tags?: string;
    shared?: boolean;
    description?: string;
  };

  if (!files || !Array.isArray(files) || files.length === 0) {
    return NextResponse.json({ error: 'files array is required' }, { status: 400 });
  }

  if (!project_id && !shared) {
    return NextResponse.json({ error: 'project_id or shared=true required' }, { status: 400 });
  }

  const manualTags = (tags || '').split(',').map(t => t.trim()).filter(Boolean);
  const effectiveProjectId = project_id || 'shared';

  const results: Array<{
    name: string;
    upload_url: string;
    public_url: string;
    asset_id: string;
    key: string;
  }> = [];

  for (const file of files) {
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');

    // Determine folder
    let fileType = 'image';
    if (file.type.startsWith('video/')) fileType = 'video';
    else if (file.type === 'application/pdf') fileType = 'document';
    const folder = fileType === 'video' ? 'videos' : fileType === 'document' ? 'documents' : 'photos';

    const key = `${effectiveProjectId}/${folder}/${timestamp}-${safeName}`;

    // Generate presigned PUT URL (valid 1 hour)
    const uploadUrl = await getR2PresignedUploadUrl(key, file.type, 3600);
    if (!uploadUrl) {
      return NextResponse.json({ error: `Failed to generate upload URL for ${file.name}` }, { status: 500 });
    }

    const publicUrl = getR2PublicUrl(key) || '';

    // Create media_assets record immediately (is_processed=false, will be confirmed after upload)
    const insertData: Record<string, unknown> = {
      project_id: project_id || null,
      storage_path: key,
      public_url: publicUrl,
      file_name: file.name,
      file_type: fileType,
      mime_type: file.type,
      file_size: file.size,
      is_processed: false,
      is_shared: shared || false,
    };
    if (manualTags.length > 0) insertData.manual_tags = manualTags;
    if (description) insertData.ai_description = description;

    const { data: asset, error: dbError } = await supabase
      .from('media_assets')
      .insert(insertData)
      .select('id')
      .single();

    if (dbError) {
      return NextResponse.json({ error: `DB error for ${file.name}: ${dbError.message}` }, { status: 500 });
    }

    results.push({
      name: file.name,
      upload_url: uploadUrl,
      public_url: publicUrl,
      asset_id: asset.id,
      key,
    });
  }

  return NextResponse.json({ files: results });
}

/**
 * PATCH /api/media/presign — confirm upload completed, trigger AI analysis
 * Body: { asset_ids: string[] }
 */
export async function PATCH(request: Request) {
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });

  const { asset_ids } = await request.json() as { asset_ids: string[] };

  if (!asset_ids || !Array.isArray(asset_ids) || asset_ids.length === 0) {
    return NextResponse.json({ error: 'asset_ids array required' }, { status: 400 });
  }

  // Trigger AI analysis for each confirmed asset (fire-and-forget)
  let queued = 0;
  for (const id of asset_ids) {
    processMediaAsset(id).catch(err =>
      console.error(`[presign] AI analysis failed for ${id}:`, err)
    );
    queued++;
  }

  return NextResponse.json({ confirmed: asset_ids.length, analysis_queued: queued });
}
