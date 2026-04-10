/**
 * Pre-render a dynamic template URL into a static PNG and upload to storage.
 *
 * getLate expects a stable, publicly-accessible image URL — not a dynamic endpoint
 * that needs server-side rendering on fetch.
 *
 * Shared between:
 * - /api/queue/bulk-approve (pre-render at approval time, 25s timeout)
 * - /api/publish (fallback if static_image_url is missing, 14s timeout)
 */

import { storage } from '@/lib/storage';

export async function resolveTemplateToStaticUrl(
  templateUrl: string,
  postId: string,
  projectId: string,
  platform: string,
  timeoutMs = 14000,
): Promise<string> {
  try {
    console.log(`[resolve-template] Pre-rendering template for post ${postId}...`);
    const startTime = Date.now();

    const response = await fetch(templateUrl, {
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!response.ok) {
      console.error(`[resolve-template] Render failed (${response.status}): ${await response.text().catch(() => 'no body')}`);
      return templateUrl;
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('image/')) {
      console.error(`[resolve-template] Non-image content-type: ${contentType}`);
      return templateUrl;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const renderMs = Date.now() - startTime;
    console.log(`[resolve-template] Rendered: ${(buffer.length / 1024).toFixed(1)} KB in ${renderMs}ms`);

    const timestamp = Date.now();
    const fileName = `template_${platform}_${timestamp}.png`;

    const uploadResult = await storage.upload(buffer, fileName, {
      projectId,
      folder: 'published-templates',
      contentType: 'image/png',
    });

    if (uploadResult.success && uploadResult.public_url) {
      console.log(`[resolve-template] Uploaded to ${uploadResult.provider}: ${uploadResult.public_url}`);
      return uploadResult.public_url;
    }

    console.error(`[resolve-template] Upload failed: ${uploadResult.error}`);
    return templateUrl;
  } catch (err) {
    console.error(`[resolve-template] Error:`, err instanceof Error ? err.message : err);
    return templateUrl;
  }
}
