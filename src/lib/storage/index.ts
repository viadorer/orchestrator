/**
 * Unified Storage Adapter
 * 
 * Automaticky přepíná mezi Cloudflare R2 a Supabase Storage.
 * Pokud jsou nastaveny R2 env vars → používá R2.
 * Jinak fallback na Supabase Storage.
 * 
 * Usage:
 *   import { storage } from '@/lib/storage';
 *   const result = await storage.upload(buffer, 'photo.jpg', { projectId: '...' });
 *   const url = storage.getPublicUrl(result.key);
 *   await storage.delete(result.key);
 */

import { uploadToR2, deleteFromR2, getR2PublicUrl, getR2SignedUrl, listR2Files, isR2Configured, type R2UploadResult, type R2ListItem } from './cloudflare-r2';
import { supabase } from '@/lib/supabase/client';

export interface StorageUploadResult {
  success: boolean;
  key: string;
  public_url: string | null;
  size: number;
  content_type: string;
  provider: 'r2' | 'supabase';
  error?: string;
}

export interface StorageListItem {
  key: string;
  size: number;
  lastModified: Date | undefined;
  public_url: string | null;
}

const SUPABASE_BUCKET = 'media-assets';

// ─── Upload ──────────────────────────────────────────────────

async function upload(
  buffer: Buffer,
  filename: string,
  options: {
    projectId: string;
    folder?: string;
    contentType?: string;
  }
): Promise<StorageUploadResult> {
  // Try R2 first
  if (isR2Configured()) {
    const result = await uploadToR2(buffer, filename, options);
    return { ...result, provider: 'r2' };
  }

  // Fallback to Supabase Storage
  if (!supabase) {
    return { success: false, key: '', public_url: null, size: 0, content_type: '', provider: 'supabase', error: 'No storage configured' };
  }

  try {
    const timestamp = Date.now();
    const sanitized = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const folder = options.folder || 'photos';
    const key = `${options.projectId}/${folder}/${timestamp}-${sanitized}`;

    const ext = filename.toLowerCase().split('.').pop() || 'png';
    const mimeTypes: Record<string, string> = {
      jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
      webp: 'image/webp', gif: 'image/gif', mp4: 'video/mp4',
    };
    const contentType = options.contentType || mimeTypes[ext] || 'application/octet-stream';

    const { error: uploadError } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .upload(key, buffer, { contentType, upsert: false });

    if (uploadError) {
      return { success: false, key, public_url: null, size: 0, content_type: contentType, provider: 'supabase', error: uploadError.message };
    }

    const { data: urlData } = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(key);
    const publicUrl = urlData?.publicUrl || null;

    console.log(`[storage:supabase] Uploaded: ${key} (${(buffer.length / 1024).toFixed(1)} KB)`);

    return {
      success: true,
      key,
      public_url: publicUrl,
      size: buffer.length,
      content_type: contentType,
      provider: 'supabase',
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, key: '', public_url: null, size: 0, content_type: '', provider: 'supabase', error: msg };
  }
}

// ─── Delete ──────────────────────────────────────────────────

async function remove(key: string): Promise<boolean> {
  // Detect provider from URL or key pattern
  if (isR2Configured()) {
    return deleteFromR2(key);
  }

  if (!supabase) return false;

  try {
    const { error } = await supabase.storage.from(SUPABASE_BUCKET).remove([key]);
    if (error) {
      console.error(`[storage:supabase] Delete failed:`, error.message);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

// ─── Get URL ─────────────────────────────────────────────────

function getPublicUrl(key: string): string | null {
  if (isR2Configured()) {
    return getR2PublicUrl(key);
  }

  if (!supabase) return null;
  const { data } = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(key);
  return data?.publicUrl || null;
}

async function getSignedUrl(key: string, expiresIn = 3600): Promise<string | null> {
  if (isR2Configured()) {
    return getR2SignedUrl(key, expiresIn);
  }

  if (!supabase) return null;
  const { data } = await supabase.storage.from(SUPABASE_BUCKET).createSignedUrl(key, expiresIn);
  return data?.signedUrl || null;
}

// ─── List ────────────────────────────────────────────────────

async function list(projectId: string, folder?: string): Promise<StorageListItem[]> {
  if (isR2Configured()) {
    return listR2Files(projectId, folder);
  }

  if (!supabase) return [];

  try {
    const path = folder ? `${projectId}/${folder}` : projectId;
    const { data, error } = await supabase.storage.from(SUPABASE_BUCKET).list(path, { limit: 100 });
    if (error || !data) return [];

    return data.map(f => ({
      key: `${path}/${f.name}`,
      size: f.metadata?.size || 0,
      lastModified: f.updated_at ? new Date(f.updated_at) : undefined,
      public_url: getPublicUrl(`${path}/${f.name}`),
    }));
  } catch {
    return [];
  }
}

// ─── Info ────────────────────────────────────────────────────

function getProvider(): 'r2' | 'supabase' {
  return isR2Configured() ? 'r2' : 'supabase';
}

// ─── Export ──────────────────────────────────────────────────

export const storage = {
  upload,
  delete: remove,
  getPublicUrl,
  getSignedUrl,
  list,
  getProvider,
};
