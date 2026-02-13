import { supabase } from '@/lib/supabase/client';
import { NextResponse } from 'next/server';

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
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });

  const formData = await request.formData();
  const projectId = formData.get('project_id') as string;

  if (!projectId) {
    return NextResponse.json({ error: 'project_id is required' }, { status: 400 });
  }

  // Collect all files from form data
  const files: File[] = [];
  for (const [key, value] of formData.entries()) {
    if (key === 'files' && value instanceof File) {
      files.push(value);
    }
  }

  if (files.length === 0) {
    return NextResponse.json({ error: 'No files provided' }, { status: 400 });
  }

  const results: Array<{ file_name: string; success: boolean; asset_id?: string; error?: string }> = [];

  for (const file of files) {
    try {
      // Read file as buffer
      const arrayBuf = await file.arrayBuffer();
      const buffer = new Uint8Array(arrayBuf);
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 8);
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `${projectId}/${timestamp}_${random}_${safeName}`;

      // Determine file type
      let fileType = 'image';
      if (file.type.startsWith('video/')) fileType = 'video';
      else if (file.type === 'application/pdf') fileType = 'document';
      else if (file.type.startsWith('image/svg') || file.type.includes('illustrator')) fileType = 'graphic';

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('project-media')
        .upload(storagePath, buffer, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        results.push({ file_name: file.name, success: false, error: uploadError.message });
        continue;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('project-media')
        .getPublicUrl(storagePath);

      const publicUrl = urlData.publicUrl;

      // Insert into media_assets
      const { data: asset, error: dbError } = await supabase
        .from('media_assets')
        .insert({
          project_id: projectId,
          storage_path: storagePath,
          public_url: publicUrl,
          file_name: file.name,
          file_type: fileType,
          mime_type: file.type,
          file_size: file.size,
        })
        .select('id')
        .single();

      if (dbError) {
        results.push({ file_name: file.name, success: false, error: dbError.message });
        continue;
      }

      results.push({ file_name: file.name, success: true, asset_id: asset.id });
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
