/**
 * Simple in-memory rate limiter for API routes.
 *
 * Uses a sliding window approach. Suitable for single-instance deployments.
 * For multi-instance (Vercel serverless), consider Upstash Redis rate limiter.
 */

import { NextResponse } from 'next/server';

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const cutoff = Date.now() - 120_000;
  for (const [key, entry] of store) {
    entry.timestamps = entry.timestamps.filter(t => t > cutoff);
    if (entry.timestamps.length === 0) store.delete(key);
  }
}, 300_000);

interface RateLimitConfig {
  /** Max requests in the window */
  maxRequests: number;
  /** Window size in seconds */
  windowSeconds: number;
}

const DEFAULTS: Record<string, RateLimitConfig> = {
  default: { maxRequests: 60, windowSeconds: 60 },
  generate: { maxRequests: 10, windowSeconds: 60 },
  upload: { maxRequests: 20, windowSeconds: 60 },
  publish: { maxRequests: 10, windowSeconds: 60 },
  auth: { maxRequests: 10, windowSeconds: 300 },
};

export type RateLimitResult =
  | { ok: true }
  | { ok: false; response: NextResponse };

/**
 * Check rate limit for a given key (e.g. user ID or IP).
 */
export function checkRateLimit(
  key: string,
  tier: keyof typeof DEFAULTS = 'default',
): RateLimitResult {
  const config = DEFAULTS[tier] || DEFAULTS.default;
  const now = Date.now();
  const windowStart = now - config.windowSeconds * 1000;

  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Remove timestamps outside window
  entry.timestamps = entry.timestamps.filter(t => t > windowStart);

  if (entry.timestamps.length >= config.maxRequests) {
    const retryAfter = Math.ceil((entry.timestamps[0] + config.windowSeconds * 1000 - now) / 1000);
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Too many requests' },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfter),
            'X-RateLimit-Limit': String(config.maxRequests),
            'X-RateLimit-Remaining': '0',
          },
        },
      ),
    };
  }

  entry.timestamps.push(now);

  return { ok: true };
}
