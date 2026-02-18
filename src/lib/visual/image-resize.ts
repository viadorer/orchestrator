/**
 * Image Resize/Crop Utility for Platform Compliance
 * 
 * Ensures images meet platform aspect ratio requirements before publishing.
 * Instagram is the strictest: 0.75:1 (3:4) to 1.91:1
 * 
 * Flow:
 * 1. Fetch image from URL
 * 2. Check aspect ratio against platform constraints
 * 3. If out of range → center-crop to target ratio
 * 4. Upload cropped version to Supabase Storage
 * 5. Return new public URL
 */

import { supabase } from '@/lib/supabase/client';

// Platform aspect ratio constraints (width / height)
const ASPECT_CONSTRAINTS: Record<string, { min: number; max: number; target: number }> = {
  instagram: { min: 0.75, max: 1.91, target: 0.80 },  // min 3:4 (0.75), target 4:5 (0.80)
  facebook:  { min: 0.50, max: 2.00, target: 1.91 },
  linkedin:  { min: 0.50, max: 2.00, target: 1.91 },
  x:         { min: 0.50, max: 3.00, target: 1.78 },
  tiktok:    { min: 0.50, max: 1.00, target: 0.5625 },
  pinterest: { min: 0.50, max: 1.00, target: 0.667 },
};

/**
 * Check if any of the target platforms require aspect ratio enforcement.
 */
export function needsAspectRatioFix(platforms: string[]): boolean {
  return platforms.some(p => p in ASPECT_CONSTRAINTS);
}

/**
 * Get the strictest aspect ratio constraints for a set of platforms.
 * Returns null if no platform needs enforcement.
 */
function getStrictestConstraints(platforms: string[]): { min: number; max: number; target: number } | null {
  let strictest: { min: number; max: number; target: number } | null = null;

  for (const p of platforms) {
    const c = ASPECT_CONSTRAINTS[p];
    if (!c) continue;
    if (!strictest) {
      strictest = { ...c };
    } else {
      // Tighten: raise min, lower max
      strictest.min = Math.max(strictest.min, c.min);
      strictest.max = Math.min(strictest.max, c.max);
      strictest.target = c.target; // use last platform's target
    }
  }

  return strictest;
}

/**
 * Ensure an image URL meets aspect ratio requirements for the given platforms.
 * If the image is already compliant, returns the original URL unchanged.
 * If cropping is needed, uploads a cropped version and returns the new URL.
 * 
 * @returns The (possibly new) image URL that is platform-compliant
 */
export async function ensureImageAspectRatio(
  imageUrl: string,
  platforms: string[],
  projectId?: string,
): Promise<string> {
  const constraints = getStrictestConstraints(platforms);
  if (!constraints) return imageUrl;

  try {
    const sharp = (await import('sharp')).default;

    // Fetch the image
    const response = await fetch(imageUrl);
    if (!response.ok) return imageUrl;

    const arrayBuffer = await response.arrayBuffer();
    let buffer: Buffer = Buffer.from(arrayBuffer) as Buffer;

    // Check current dimensions
    const metadata = await sharp(buffer).metadata();
    const w = metadata.width;
    const h = metadata.height;
    if (!w || !h) return imageUrl;

    const currentRatio = w / h;

    // Already within allowed range — no crop needed
    if (currentRatio >= constraints.min && currentRatio <= constraints.max) {
      return imageUrl;
    }

    // Crop to target ratio (center crop)
    let cropW = w;
    let cropH = h;

    if (currentRatio < constraints.min) {
      // Too tall → crop height
      cropH = Math.round(w / constraints.target);
      cropW = w;
    } else {
      // Too wide → crop width
      cropW = Math.round(h * constraints.target);
      cropH = h;
    }

    cropW = Math.min(cropW, w);
    cropH = Math.min(cropH, h);

    const left = Math.round((w - cropW) / 2);
    const top = Math.round((h - cropH) / 2);

    console.log(`[image-resize] Aspect ratio fix: ${w}×${h} (${currentRatio.toFixed(2)}) → ${cropW}×${cropH} (${(cropW / cropH).toFixed(2)}) for platforms: ${platforms.join(',')}`);

    buffer = await sharp(buffer)
      .extract({ left, top, width: cropW, height: cropH })
      .png()
      .toBuffer() as Buffer;

    // Upload cropped image to Supabase Storage
    if (supabase && projectId) {
      const timestamp = Date.now();
      const storagePath = `${projectId}/resized/cropped_${timestamp}.png`;

      const { error: uploadError } = await supabase.storage
        .from('media-assets')
        .upload(storagePath, buffer, {
          contentType: 'image/png',
          upsert: false,
        });

      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from('media-assets')
          .getPublicUrl(storagePath);

        if (urlData?.publicUrl) {
          console.log(`[image-resize] Cropped image uploaded: ${urlData.publicUrl}`);
          return urlData.publicUrl;
        }
      } else {
        console.error('[image-resize] Upload failed:', uploadError.message);
      }
    }

    // If we can't upload, return original (will likely fail at getLate)
    return imageUrl;
  } catch (err) {
    console.error('[image-resize] Error:', err);
    return imageUrl;
  }
}
