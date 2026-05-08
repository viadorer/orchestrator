import { supabase } from '@/lib/supabase/client';
import { getR2PresignedUploadUrl, getR2PublicUrl, isR2Configured } from '@/lib/storage/cloudflare-r2';
import { processMediaAsset } from '@/lib/ai/vision-engine';
import { requireAuth } from '@/lib/api/require-auth';
import { checkRateLimit } from '@/lib/api/rate-limit';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/** Max single file size for direct R2 upload — 500 MB (videos) */
const MAX_FILE_SIZE = 500 * 1024 * 1024;

/** Max files per presign request to prevent abuse */
const MAX_FILES_PER_REQUEST = 50;

/** Allowed MIME types — same superset as /api/media/upload (incl. iPhone HEIC + video formats) */
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
  'image/heic', 'image/heif',
  'video/mp4', 'video/quicktime', 'video/webm',
  'video/avi', 'video/x-msvideo', 'video/x-matroska',
  'application/pdf',
]);

const ALLOWED_FALLBACK_EXTENSIONS = new Set([
  'jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'heic', 'heif',
  'mp4', 'mov', 'webm', 'avi', 'mkv', 'm4v',
  'pdf',
]);

function isAllowedMime(name: string, type: string): boolean {
  if (ALLOWED_MIME_TYPES.has(type)) return true;
  if (type === 'application/octet-stream' || type === '') {
    const ext = name.split('.').pop()?.toLowerCase() ?? '';
    return ALLOWED_FALLBACK_EXTENSIONS.has(ext);
  }
  return false;
}

/**
 * Presigned Upload API — direct client→R2 (bypasses server body limit)
 * Used for large files like iPhone videos (often 50–300 MB).
 *
 * POST /api/media/presign — create upload URLs + DB records
 * PATCH /api/media/presign — confirm uploads, trigger AI analysis
 */
export async function POST(request: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const rl = checkRateLimit(auth.userId, 'upload');
  if (!rl.ok) return rl.response;

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

  if (files.length > MAX_FILES_PER_REQUEST) {
    return NextResponse.json({ error: `Max ${MAX_FILES_PER_REQUEST} files per request` }, { status: 400 });
  }

  if (!project_id && !shared) {
    return NextResponse.json({ error: 'project_id or shared=true required' }, { status: 400 });
  }

  // Validate each file's name + type + size before generating any presigned URLs.
  for (const f of files) {
    if (!f?.name || typeof f.size !== 'number') {
      return NextResponse.json({ error: 'Each file requires { name, type, size }' }, { status: 400 });
    }
    if (f.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File "${f.name}" exceeds ${MAX_FILE_SIZE / 1024 / 1024} MB` },
        { status: 400 },
      );
    }
    if (!isAllowedMime(f.name, f.type || '')) {
      return NextResponse.json(
        { error: `File "${f.name}" has unsupported type: ${f.type}` },
        { status: 400 },
      );
    }
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
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });

  const { asset_ids } = await request.json() as { asset_ids: string[] };

  if (!asset_ids || !Array.isArray(asset_ids) || asset_ids.length === 0) {
    return NextResponse.json({ error: 'asset_ids array required' }, { status: 400 });
  }

  if (asset_ids.length > MAX_FILES_PER_REQUEST) {
    return NextResponse.json({ error: `Max ${MAX_FILES_PER_REQUEST} asset_ids per request` }, { status: 400 });
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
