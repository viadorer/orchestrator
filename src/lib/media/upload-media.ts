/**
 * Shared upload logic for media endpoints.
 * Used by both /api/media/upload and /api/media/bulk-upload.
 */

import { supabase } from '@/lib/supabase/client';
import { storage } from '@/lib/storage';
import { processMediaAsset } from '@/lib/ai/vision-engine';

export interface UploadOptions {
  projectId: string;
  manualTags?: string[];
  description?: string | null;
  isShared?: boolean;
  autoAnalyze?: boolean;
}

export interface UploadResult {
  file_name: string;
  success: boolean;
  asset_id?: string;
  public_url?: string;
  error?: string;
}

export async function uploadMediaFile(file: File, options: UploadOptions): Promise<UploadResult> {
  if (!supabase) {
    return { file_name: file.name, success: false, error: 'Supabase not configured' };
  }

  try {
    const arrayBuf = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuf);
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');

    // Determine file type
    let fileType = 'image';
    if (file.type.startsWith('video/')) fileType = 'video';
    else if (file.type === 'application/pdf') fileType = 'document';
    else if (file.type.startsWith('image/svg') || file.type.includes('illustrator')) fileType = 'graphic';

    const folder = fileType === 'video' ? 'videos' : fileType === 'document' ? 'documents' : 'photos';

    // Upload to storage (Cloudflare R2 or Supabase fallback)
    const uploadResult = await storage.upload(Buffer.from(buffer), safeName, {
      projectId: options.projectId,
      folder,
      contentType: file.type,
    });

    if (!uploadResult.success) {
      return { file_name: file.name, success: false, error: uploadResult.error };
    }

    const storagePath = uploadResult.key;
    const publicUrl = uploadResult.public_url || '';

    // Insert into media_assets
    const insertData: Record<string, unknown> = {
      project_id: options.projectId,
      storage_path: storagePath,
      public_url: publicUrl,
      file_name: file.name,
      file_type: fileType,
      mime_type: file.type,
      file_size: file.size,
    };
    if (options.manualTags && options.manualTags.length > 0) insertData.manual_tags = options.manualTags;
    if (options.description) insertData.ai_description = options.description;
    if (options.isShared) insertData.is_shared = true;

    const { data: asset, error: dbError } = await supabase
      .from('media_assets')
      .insert(insertData)
      .select('id')
      .single();

    if (dbError) {
      return { file_name: file.name, success: false, error: dbError.message };
    }

    // Fire-and-forget AI analysis
    if (options.autoAnalyze !== false && asset.id) {
      processMediaAsset(asset.id).catch(err =>
        console.error(`[upload-media] Async analysis failed for ${asset.id}:`, err)
      );
    }

    return { file_name: file.name, success: true, asset_id: asset.id, public_url: publicUrl };
  } catch (err) {
    return { file_name: file.name, success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
