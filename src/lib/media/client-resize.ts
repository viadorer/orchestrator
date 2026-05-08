/**
 * Browser-side image preprocessing for upload.
 *
 * Reduces a 10–15 MB iPhone photo to ~600 KB JPEG before it ever leaves the
 * device. Saves bandwidth and Vercel function memory, gets uploads under the
 * 8 MB threshold so the simple server route can handle them.
 *
 * Two-track decoding strategy (iOS Safari needs both):
 *   1. Try `createImageBitmap` with EXIF auto-rotation. Fastest path; works
 *      on Chrome, Firefox, Safari ≥ 14.5 for plain JPEG/PNG.
 *   2. If that throws (Safari sometimes refuses iPhone JPEGs that have a
 *      HEIF container disguised as .jpeg, or when memory is tight), fall back
 *      to HTMLImageElement → drawImage. Slightly slower but works everywhere
 *      and never throws on a valid image.
 *
 * Encoding is forced through HTMLCanvasElement on Safari because OffscreenCanvas
 * `.convertToBlob()` is flaky in some iOS versions.
 *
 * Limitations:
 *   - HEIC: even the fallback can't decode HEIC. Falls through to server.
 *   - GIF / SVG: passed through (would lose animation / become raster).
 *   - Videos: never touched here.
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

  // Strategy 1: createImageBitmap (fast, native)
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const result = await encodeFromSource(bitmap, file.name, bitmap.width, bitmap.height);
    bitmap.close?.();
    if (result && result.size < file.size) return result;
  } catch (err) {
    console.warn('[client-resize] createImageBitmap failed, falling back to <img>:', err instanceof Error ? err.message : err);
  }

  // Strategy 2: HTMLImageElement fallback (works on Safari for HEIF-container JPEGs
  // and any case where createImageBitmap chokes on memory or codec).
  try {
    const result = await decodeViaImageElement(file);
    if (result && result.size < file.size) return result;
  } catch (err) {
    console.warn('[client-resize] <img> fallback failed, uploading original:', err instanceof Error ? err.message : err);
  }

  // Both strategies failed or made the file bigger — return original.
  return file;
}

// ─── Encoding pipeline ─────────────────────────────────────

type DecodedSource = ImageBitmap | HTMLImageElement;

async function encodeFromSource(
  source: DecodedSource,
  originalName: string,
  width: number,
  height: number,
): Promise<File | null> {
  const longSide = Math.max(width, height);
  const scale = Math.min(1, MAX_LONG_SIDE / longSide);
  const targetW = Math.round(width * scale);
  const targetH = Math.round(height * scale);

  // Always use HTMLCanvasElement — OffscreenCanvas.convertToBlob is unreliable
  // on iOS Safari, especially with large images. Slight perf hit, big stability gain.
  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, 0, 0, targetW, targetH);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((b) => resolve(b), 'image/jpeg', JPEG_QUALITY);
  });
  if (!blob) return null;

  const baseName = stripExtension(originalName);
  return new File([blob], `${baseName}.jpg`, {
    type: 'image/jpeg',
    lastModified: Date.now(),
  });
}

/**
 * Decode an image File via HTMLImageElement. This path handles Safari quirks
 * (HEIF-in-JPEG containers, missing OrientationParser, OOM in createImageBitmap).
 *
 * Note: HTMLImageElement applies EXIF auto-rotation natively in Safari ≥ 14
 * and Chrome ≥ 81, so the resulting canvas is upright without extra work.
 */
async function decodeViaImageElement(file: File): Promise<File | null> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImageElement(url);
    return await encodeFromSource(img, file.name, img.naturalWidth || img.width, img.naturalHeight || img.height);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      // decode() returns a promise that resolves once the bitmap is fully ready,
      // avoiding race conditions when drawn to canvas immediately.
      if (typeof img.decode === 'function') {
        img.decode().then(() => resolve(img)).catch(() => resolve(img));
      } else {
        resolve(img);
      }
    };
    img.onerror = (e) => reject(e instanceof Error ? e : new Error('Image load failed'));
    img.src = src;
  });
}

function stripExtension(fileName: string): string {
  const dot = fileName.lastIndexOf('.');
  return dot < 0 ? fileName : fileName.slice(0, dot);
}
