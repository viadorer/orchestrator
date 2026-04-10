/**
 * Validate that an image URL is accessible and returns image content.
 * Used before publishing to catch broken/expired URLs.
 */
export async function validateImageUrl(url: string): Promise<boolean> {
  if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) {
    return false;
  }

  try {
    const response = await fetch(url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) return false;

    const contentType = response.headers.get('content-type') || '';
    return contentType.includes('image/');
  } catch {
    return false;
  }
}
