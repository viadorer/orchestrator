/**
 * Browser-side image preprocessing for upload.
 *
 * Reduces a 10–15 MB iPhone photo to ~600 KB JPEG before it ever leaves the
 * device. Saves bandwidth and Vercel function memory, gets uploads under the
 * 8 MB threshold so the simple server route can handle them.
 *
 * Limitations:
 *   - HEIC: browsers cannot decode HEIC. We pass HEIC through unchanged and
 *     let server normalize it via Sharp/libheif.
 *   - GIF / SVG: passed through (would lose animation / become raster).
 *   - Videos: never touched here.
 *
 * Algorithm:
 *   1. Decode the file via createImageBitmap (handles EXIF auto-rotate in Safari/Chrome).
 *   2. Compute a target size such that max(width, height) ≤ MAX_LONG_SIDE.
 *   3. Draw onto an OffscreenCanvas (or HTMLCanvasElement fallback).
 *   4. Encode as JPEG quality 0.85.
 */

const MAX_LONG_SIDE = 2160;
const JPEG_QUALITY = 0.85;
const RESIZE_THRESHOLD_BYTES = 1.5 * 1024 * 1024; // skip resize if file is already ≤ 1.5 MB

/**
 * Returns true when this file is an image we can safely process in the browser.
 * HEIC, GIF, SVG fall back to server-side normalization.
 */
export function isClientResizable(file: File): boolean {
  const t = (file.type || '').toLowerCase();
  if (!t.startsWith('image/')) return false;
  if (t === 'image/heic' || t === 'image/heif') return false;
  if (t === 'image/gif' || t === 'image/svg+xml') return false;
  return true;
}

/**
 * Resize an image File to fit within MAX_LONG_SIDE × MAX_LONG_SIDE and re-encode as JPEG.
 *
 * If the file is small or not resizable, returns the original File unchanged.
 * Never throws — falls back to original on any decode/encode error so the
 * upload pipeline keeps working.
 */
export async function resizeImageForUpload(file: File): Promise<File> {
  if (!isClientResizable(file)) return file;
  if (file.size <= RESIZE_THRESHOLD_BYTES) return file;

  try {
    // imageOrientation: 'from-image' makes Safari + Chrome respect EXIF rotation.
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });

    const longSide = Math.max(bitmap.width, bitmap.height);
    if (longSide <= MAX_LONG_SIDE) {
      // Already small enough — but re-encode anyway to drop EXIF + standardise to JPEG.
      // (Keeps the upload pipeline predictable.)
    }

    const scale = Math.min(1, MAX_LONG_SIDE / longSide);
    const targetW = Math.round(bitmap.width * scale);
    const targetH = Math.round(bitmap.height * scale);

    const canvas = createCanvas(targetW, targetH);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      bitmap.close?.();
      return file;
    }

    // Better quality downscale than Canvas's default linear filter.
    if ('imageSmoothingQuality' in ctx) {
      (ctx as CanvasRenderingContext2D).imageSmoothingQuality = 'high';
    }
    ctx.drawImage(bitmap, 0, 0, targetW, targetH);
    bitmap.close?.();

    const blob = await canvasToBlob(canvas, 'image/jpeg', JPEG_QUALITY);
    if (!blob || blob.size >= file.size) {
      // Resize made it bigger (rare — small input, large alpha PNG, etc.) — keep original.
      return file;
    }

    const baseName = stripExtension(file.name);
    return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg', lastModified: Date.now() });
  } catch (err) {
    console.warn('[client-resize] Failed to resize, uploading original:', err instanceof Error ? err.message : err);
    return file;
  }
}

// ─── Canvas helpers ─────────────────────────────────────────

type AnyCanvas = HTMLCanvasElement | OffscreenCanvas;

function createCanvas(w: number, h: number): AnyCanvas {
  if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(w, h);
  }
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

async function canvasToBlob(canvas: AnyCanvas, type: string, quality: number): Promise<Blob | null> {
  if ('convertToBlob' in canvas) {
    // OffscreenCanvas
    return canvas.convertToBlob({ type, quality });
  }
  // HTMLCanvasElement
  return new Promise((resolve) => {
    (canvas as HTMLCanvasElement).toBlob((b) => resolve(b), type, quality);
  });
}

function stripExtension(fileName: string): string {
  const dot = fileName.lastIndexOf('.');
  return dot < 0 ? fileName : fileName.slice(0, dot);
}
