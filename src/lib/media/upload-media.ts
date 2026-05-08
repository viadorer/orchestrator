/**
 * Shared upload logic for media endpoints.
 * Used by both /api/media/upload and /api/media/bulk-upload.
 */

import { supabase } from '@/lib/supabase/client';
import { storage } from '@/lib/storage';
import { processMediaAsset } from '@/lib/ai/vision-engine';
import { normalizeImage } from '@/lib/media/normalize-image';
import { after } from 'next/server';

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
    const originalBuffer = Buffer.from(arrayBuf);
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');

    // Determine file type from original MIME (pre-normalization)
    let fileType = 'image';
    if (file.type.startsWith('video/')) fileType = 'video';
    else if (file.type === 'application/pdf') fileType = 'document';
    else if (file.type.startsWith('image/svg') || file.type.includes('illustrator')) fileType = 'graphic';

    const folder = fileType === 'video' ? 'videos' : fileType === 'document' ? 'documents' : 'photos';

    // Normalize images for social-network delivery (HEIC→JPEG, resize, strip EXIF, q=85).
    // Videos and documents pass through.
    const normalized = (fileType === 'image' || fileType === 'graphic')
      ? await normalizeImage(originalBuffer, safeName, file.type)
      : { buffer: originalBuffer, contentType: file.type, fileName: safeName, width: 0, height: 0, modified: false };

    // Upload to storage (Cloudflare R2 or Supabase fallback)
    const uploadResult = await storage.upload(normalized.buffer, normalized.fileName, {
      projectId: options.projectId,
      folder,
      contentType: normalized.contentType,
    });

    if (!uploadResult.success) {
      return { file_name: file.name, success: false, error: uploadResult.error };
    }

    const storagePath = uploadResult.key;
    const publicUrl = uploadResult.public_url || '';

    // Insert into media_assets — record normalized dimensions/size.
    const insertData: Record<string, unknown> = {
      project_id: options.projectId,
      storage_path: storagePath,
      public_url: publicUrl,
      file_name: file.name, // original display name
      file_type: fileType,
      mime_type: normalized.contentType,
      file_size: normalized.buffer.length,
    };
    if (normalized.width) insertData.width = normalized.width;
    if (normalized.height) insertData.height = normalized.height;
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

    // Schedule AI analysis to run AFTER the response is sent.
    // next/server `after()` survives the function exit in Vercel serverless;
    // plain fire-and-forget gets cancelled.
    if (options.autoAnalyze !== false && asset.id) {
      const analysisAssetId = asset.id as string;
      after(async () => {
        try {
          await processMediaAsset(analysisAssetId);
        } catch (err) {
          console.error(`[upload-media] AI analysis failed for ${analysisAssetId}:`, err instanceof Error ? err.message : err);
        }
      });
    }

    return { file_name: file.name, success: true, asset_id: asset.id, public_url: publicUrl };
  } catch (err) {
    return { file_name: file.name, success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
