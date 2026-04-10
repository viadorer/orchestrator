import { supabase } from '@/lib/supabase/client';
import { storage } from '@/lib/storage';
import { processMediaAsset } from '@/lib/ai/vision-engine';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/require-auth';
import { checkRateLimit } from '@/lib/api/rate-limit';

/** Max file size: 10 MB */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/** Allowed MIME types */
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
  'video/mp4', 'video/quicktime', 'video/webm',
  'application/pdf',
]);

/**
 * Media Upload API
 * POST /api/media/upload
 *
 * Accepts multipart/form-data with:
 * - files: File[] (images, videos, documents)
 * - project_id: string
 *
 * Uploads to Supabase Storage bucket 'project-media'
 * Path: {project_id}/{timestamp}_{filename}
 */
export async function POST(request: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const rl = checkRateLimit(auth.userId, 'upload');
  if (!rl.ok) return rl.response;

  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });

  const formData = await request.formData();
  const projectId = formData.get('project_id') as string | null;
  const isShared = formData.get('is_shared') === 'true';

  if (!projectId && !isShared) {
    return NextResponse.json({ error: 'Either project_id or is_shared=true is required' }, { status: 400 });
  }

  // For shared uploads, use 'shared' as folder prefix
  const effectiveProjectId = projectId || 'shared';

  // Optional metadata fields
  const manualTags = (formData.get('tags') as string || '').split(',').map(t => t.trim()).filter(Boolean);
  const description = formData.get('description') as string || null;
  const autoAnalyze = formData.get('auto_analyze') !== 'false';

  // Collect all files from form data (getAll handles multiple files with same key)
  const files = formData.getAll('files').filter((v): v is File => v instanceof File);

  if (files.length === 0) {
    return NextResponse.json({ error: 'No files provided' }, { status: 400 });
  }

  // Validate file sizes and MIME types
  for (const file of files) {
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File "${file.name}" exceeds max size of ${MAX_FILE_SIZE / 1024 / 1024} MB` },
        { status: 400 },
      );
    }
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: `File "${file.name}" has unsupported type: ${file.type}` },
        { status: 400 },
      );
    }
  }

  const results: Array<{ file_name: string; success: boolean; asset_id?: string; public_url?: string; error?: string }> = [];

  for (const file of files) {
    try {
      // Read file as buffer
      const arrayBuf = await file.arrayBuffer();
      const buffer = new Uint8Array(arrayBuf);
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');

      // Determine file type
      let fileType = 'image';
      if (file.type.startsWith('video/')) fileType = 'video';
      else if (file.type === 'application/pdf') fileType = 'document';
      else if (file.type.startsWith('image/svg') || file.type.includes('illustrator')) fileType = 'graphic';

      // Determine folder based on file type
      const folder = fileType === 'video' ? 'videos' : fileType === 'document' ? 'documents' : 'photos';

      // Upload to storage (Cloudflare R2 or Supabase fallback)
      const uploadResult = await storage.upload(Buffer.from(buffer), safeName, {
        projectId: effectiveProjectId,
        folder,
        contentType: file.type,
      });

      if (!uploadResult.success) {
        results.push({ file_name: file.name, success: false, error: uploadResult.error });
        continue;
      }

      const storagePath = uploadResult.key;
      const publicUrl = uploadResult.public_url || '';

      // Insert into media_assets
      const insertData: Record<string, unknown> = {
        project_id: projectId,
        storage_path: storagePath,
        public_url: publicUrl,
        file_name: file.name,
        file_type: fileType,
        mime_type: file.type,
        file_size: file.size,
      };
      if (manualTags.length > 0) insertData.manual_tags = manualTags;
      if (description) insertData.ai_description = description;
      if (isShared) insertData.is_shared = true;

      const { data: asset, error: dbError } = await supabase
        .from('media_assets')
        .insert(insertData)
        .select('id')
        .single();

      if (dbError) {
        results.push({ file_name: file.name, success: false, error: dbError.message });
        continue;
      }

      // Fire-and-forget AI analysis (Gemini Vision + embedding generation)
      if (autoAnalyze && asset.id) {
        processMediaAsset(asset.id).catch(err =>
          console.error(`[upload] Async analysis failed for ${asset.id}:`, err)
        );
      }

      results.push({ file_name: file.name, success: true, asset_id: asset.id, public_url: publicUrl });
    } catch (err) {
      results.push({ file_name: file.name, success: false, error: err instanceof Error ? err.message : 'Unknown error' });
    }
  }

  const succeeded = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  return NextResponse.json({
    uploaded: succeeded,
    failed,
    total: files.length,
    results,
  });
}
