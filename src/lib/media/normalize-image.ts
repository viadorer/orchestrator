/**
 * Server-side image normalization for social-network delivery.
 *
 * What this does (in order):
 *   1. Auto-rotate based on EXIF Orientation tag (iPhones save sideways otherwise).
 *   2. Convert HEIC/HEIF to JPEG (browsers and most social networks do not render HEIC).
 *   3. Resize so the longest side ≤ MAX_LONG_SIDE (default 2160 px).
 *      This single "master" size crops cleanly to every social network format:
 *        - Instagram portrait 1080×1350
 *        - Instagram story 1080×1920
 *        - Facebook landscape 1200×630
 *        - LinkedIn 1200×627
 *        - TikTok 1080×1920
 *      Larger originals waste bandwidth without visible benefit at 1× retina.
 *   4. Re-encode as JPEG quality 85 (visually lossless, ~80% smaller).
 *   5. Strip EXIF metadata (privacy: removes GPS, camera serial, date taken).
 *
 * If a non-image is passed, returns the original buffer unchanged.
 * If Sharp throws (corrupt file, unsupported codec) we also return the original
 * buffer — better to ship something than fail the upload.
 */

import sharp from 'sharp';

export interface NormalizeOptions {
  /** Maximum length of the longest side in pixels. Default 2160. */
  maxLongSide?: number;
  /** JPEG quality 1–100. Default 85 (visually-lossless sweet spot). */
  jpegQuality?: number;
  /** Whether to keep PNG transparency (re-encodes as PNG, not JPEG). Default false. */
  preservePng?: boolean;
}

export interface NormalizedImage {
  buffer: Buffer;
  /** Final MIME type — usually image/jpeg, occasionally image/png. */
  contentType: string;
  /** Final filename with corrected extension (e.g. "IMG_0001.HEIC" → "IMG_0001.jpg"). */
  fileName: string;
  /** Final dimensions. */
  width: number;
  height: number;
  /** True if the image was actually resized/re-encoded. */
  modified: boolean;
}

const DEFAULT_MAX_LONG_SIDE = 2160;
const DEFAULT_JPEG_QUALITY = 85;

/**
 * Normalize an image buffer for social-network delivery.
 *
 * @param buffer Original image bytes (any Sharp-supported format incl. HEIC/HEIF)
 * @param fileName Original filename — used for extension fallback
 * @param contentType Original MIME type (may be application/octet-stream from iOS)
 */
export async function normalizeImage(
  buffer: Buffer,
  fileName: string,
  contentType: string,
  opts: NormalizeOptions = {},
): Promise<NormalizedImage> {
  const maxLongSide = opts.maxLongSide ?? DEFAULT_MAX_LONG_SIDE;
  const jpegQuality = opts.jpegQuality ?? DEFAULT_JPEG_QUALITY;
  const preservePng = opts.preservePng ?? false;

  // Bail out early for non-images; let videos/pdfs pass through untouched.
  if (!isImageType(contentType, fileName)) {
    return {
      buffer,
      contentType,
      fileName,
      width: 0,
      height: 0,
      modified: false,
    };
  }

  try {
    const pipeline = sharp(buffer, { failOn: 'none' }).rotate(); // EXIF auto-rotate
    const metadata = await pipeline.metadata();
    const origWidth = metadata.width ?? 0;
    const origHeight = metadata.height ?? 0;
    const longSide = Math.max(origWidth, origHeight);

    // Skip resize if already within target — but still re-encode to strip EXIF + standardize format.
    const needsResize = longSide > maxLongSide;

    let resized = pipeline;
    if (needsResize) {
      resized = pipeline.resize({
        width: origWidth >= origHeight ? maxLongSide : undefined,
        height: origHeight > origWidth ? maxLongSide : undefined,
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    // Decide output format:
    // - PNG with alpha + preservePng → keep PNG (compressed)
    // - Everything else → JPEG (smaller, universal)
    const isPngWithAlpha = metadata.format === 'png' && metadata.hasAlpha === true;
    const useJpeg = !preservePng || !isPngWithAlpha;

    let outBuffer: Buffer;
    let outContentType: string;
    let outExt: string;

    if (useJpeg) {
      outBuffer = await resized
        .jpeg({ quality: jpegQuality, mozjpeg: true })
        .toBuffer();
      outContentType = 'image/jpeg';
      outExt = 'jpg';
    } else {
      outBuffer = await resized
        .png({ compressionLevel: 9, palette: true })
        .toBuffer();
      outContentType = 'image/png';
      outExt = 'png';
    }

    const finalMeta = await sharp(outBuffer).metadata();

    return {
      buffer: outBuffer,
      contentType: outContentType,
      fileName: replaceExtension(fileName, outExt),
      width: finalMeta.width ?? 0,
      height: finalMeta.height ?? 0,
      modified: true,
    };
  } catch (err) {
    // Corrupt file or unsupported codec — pass through untouched, log so we can investigate.
    console.warn(
      `[normalize-image] Failed to normalize "${fileName}" (${contentType}); passing through original. Error:`,
      err instanceof Error ? err.message : err,
    );
    return {
      buffer,
      contentType,
      fileName,
      width: 0,
      height: 0,
      modified: false,
    };
  }
}

/**
 * Decide whether a file is an image we should process.
 * Catches HEIC/HEIF and the generic application/octet-stream fallback iOS sometimes sends.
 */
function isImageType(contentType: string, fileName: string): boolean {
  if (contentType.startsWith('image/')) return true;
  if (contentType === 'application/octet-stream' || !contentType) {
    const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
    return ['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'heif'].includes(ext);
  }
  return false;
}

/** Replace the file extension while preserving everything else (incl. dots in stem). */
function replaceExtension(fileName: string, newExt: string): string {
  const lastDot = fileName.lastIndexOf('.');
  if (lastDot < 0) return `${fileName}.${newExt}`;
  return `${fileName.slice(0, lastDot)}.${newExt}`;
}
