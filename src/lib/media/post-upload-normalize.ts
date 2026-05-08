/**
 * Post-upload server-side normalization for assets that came in via the
 * presigned-URL flow (direct client → R2, bypassing the server).
 *
 * Why this exists:
 *   The /api/media/upload route normalizes images server-side before they
 *   land in R2 (Sharp resize + EXIF strip + HEIC→JPEG). But files going
 *   through /api/media/presign don't pass through the server at all — the
 *   browser PUTs them straight into R2. So:
 *     - Large HEIC photos (browser can't decode → no client resize)
 *     - Photos that escape the client resize fallback
 *     - Originals that don't get any compression
 *   …all land in R2 at full size.
 *
 * What this does:
 *   After the client confirms via PATCH /api/media/presign, we run this
 *   asynchronously (via `after()`):
 *     1. Skip videos and small images (≤ 1.5 MB).
 *     2. Download the R2 object.
 *     3. Run normalizeImage() — resize to ≤ 2160 px, JPEG q=85, strip EXIF.
 *     4. If the normalized version is smaller, upload over the same key.
 *     5. Update media_assets row: file_size, mime_type, width/height,
 *        file_name (extension may have changed e.g. .heic → .jpg).
 *
 * Failure modes are silent:
 *   - R2 download fails → skip, leave original in place.
 *   - Sharp throws (corrupt file, unsupported codec) → skip.
 *   - Re-upload fails → skip, original is still usable.
 *   The media_asset row stays valid either way; AI tagging is unaffected.
 */

import { supabase } from '@/lib/supabase/client';
import { downloadFromR2, uploadToR2 } from '@/lib/storage/cloudflare-r2';
import { normalizeImage } from '@/lib/media/normalize-image';
import { logError } from '@/lib/api/error-log';

const SKIP_BELOW_BYTES = 1.5 * 1024 * 1024;

interface MediaAssetRow {
  id: string;
  storage_path: string | null;
  public_url: string | null;
  file_name: string;
  file_type: string;
  mime_type: string | null;
  file_size: number | null;
  project_id: string | null;
}

export async function normalizeAssetIfNeeded(assetId: string): Promise<void> {
  if (!supabase) return;

  // Re-fetch the row inside the worker so we always have the latest values.
  const { data: row, error } = await supabase
    .from('media_assets')
    .select('id, storage_path, public_url, file_name, file_type, mime_type, file_size, project_id')
    .eq('id', assetId)
    .single<MediaAssetRow>();

  if (error || !row) return;

  // Only photos go through Sharp normalize. Videos, PDFs, etc. are skipped.
  if (row.file_type !== 'image' && row.file_type !== 'graphic') return;
  if (!row.storage_path) return;

  // Cheap pre-check: if it's already small, skip the full download/decode cycle.
  if (typeof row.file_size === 'number' && row.file_size <= SKIP_BELOW_BYTES) return;

  try {
    const buffer = await downloadFromR2(row.storage_path);
    if (!buffer || buffer.length === 0) {
      console.warn(`[post-upload] No buffer for ${row.storage_path}, skipping normalize`);
      return;
    }

    const normalized = await normalizeImage(
      buffer,
      row.file_name,
      row.mime_type || 'application/octet-stream',
    );

    if (!normalized.modified) {
      // Sharp passed it through unchanged (e.g. corrupt file). Nothing to do.
      return;
    }

    // Don't replace if normalized version is bigger (rare — small input PNG, etc.)
    if (normalized.buffer.length >= buffer.length) {
      console.log(
        `[post-upload] Normalized version of ${row.storage_path} is not smaller ` +
          `(${normalized.buffer.length} vs ${buffer.length}), keeping original`,
      );
      return;
    }

    // Upload normalized version. We allow the storage_path to change because
    // HEIC → JPEG renames the extension; the bucket key stays inside the same
    // project folder, just with the new filename.
    if (!row.project_id) {
      console.warn(`[post-upload] Missing project_id for asset ${assetId}, skipping replace`);
      return;
    }

    const folder = inferFolderFromKey(row.storage_path) || 'photos';
    const uploadResult = await uploadToR2(
      normalized.buffer,
      normalized.fileName,
      {
        projectId: row.project_id,
        folder,
        contentType: normalized.contentType,
      },
    );

    if (!uploadResult.success) {
      console.warn(`[post-upload] Re-upload failed for ${assetId}: ${uploadResult.error}`);
      return;
    }

    // Update the DB row to point at the new key + smaller dimensions.
    const update: Record<string, unknown> = {
      storage_path: uploadResult.key,
      public_url: uploadResult.public_url || row.public_url,
      file_size: normalized.buffer.length,
      mime_type: normalized.contentType,
    };
    if (normalized.width) update.width = normalized.width;
    if (normalized.height) update.height = normalized.height;
    // Keep original display name unless extension changed (HEIC → JPG)
    const origExt = row.file_name.split('.').pop()?.toLowerCase();
    const newExt = normalized.fileName.split('.').pop()?.toLowerCase();
    if (origExt !== newExt) {
      update.file_name = stripExt(row.file_name) + '.' + (newExt || 'jpg');
    }

    await supabase.from('media_assets').update(update).eq('id', assetId);

    console.log(
      `[post-upload] Normalized ${assetId}: ` +
        `${(buffer.length / 1024).toFixed(0)}KB → ${(normalized.buffer.length / 1024).toFixed(0)}KB, ` +
        `${normalized.width}×${normalized.height}`,
    );
  } catch (err) {
    await logError(err, {
      source: 'post-upload-normalize',
      entityId: assetId,
      meta: { storage_path: row.storage_path },
    });
  }
}

function inferFolderFromKey(key: string): string | null {
  // Keys are shaped like {projectId}/{folder}/{timestamp}-{filename}
  const parts = key.split('/');
  return parts.length >= 2 ? parts[1] : null;
}

function stripExt(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot < 0 ? name : name.slice(0, dot);
}
