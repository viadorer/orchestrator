'use client';

import Image, { type ImageProps } from 'next/image';
import { useState } from 'react';

interface SafeImageProps extends Omit<ImageProps, 'onError' | 'src'> {
  src: string | null | undefined;
  /** Element rendered if src is missing or fails to load. */
  fallback?: React.ReactNode;
}

/**
 * next/image wrapper that:
 *   - hides itself if src is missing or 404s (instead of showing broken icon)
 *   - falls through to a caller-provided fallback node
 *   - tolerates remote hosts not yet in next.config.ts images.remotePatterns
 *     by setting `unoptimized` for non-allowlisted hosts (avoids 500 errors
 *     on first deploy while keeping optimisation for allowlisted hosts)
 *
 * Use for icon-sized logos and avatars where dimensions are known. For
 * full-bleed photo previews continue using <img> until the surrounding
 * layout is responsive enough for next/image.
 */
const ALLOWLIST_HOSTS = [
  'supabase.co',
  'r2.cloudflarestorage.com',
  'r2.dev',
  'quickchart.io',
  'raw.githubusercontent.com',
];

function isAllowlisted(src: string): boolean {
  try {
    const url = new URL(src);
    return ALLOWLIST_HOSTS.some((h) => url.hostname.endsWith(h));
  } catch {
    // Relative path — Next.js will serve from /public.
    return src.startsWith('/');
  }
}

export function SafeImage({ src, fallback = null, alt, ...rest }: SafeImageProps) {
  const [errored, setErrored] = useState(false);

  if (!src || errored) return <>{fallback}</>;

  const isLocal = src.startsWith('/');
  const allowed = isAllowlisted(src);

  return (
    <Image
      {...rest}
      src={src}
      alt={alt}
      onError={() => setErrored(true)}
      unoptimized={!isLocal && !allowed}
    />
  );
}
