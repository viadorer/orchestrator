import { timingSafeEqual } from 'node:crypto';

/**
 * Constant-time comparison of the incoming `Authorization: Bearer ...` header
 * against the configured CRON_SECRET. Prevents timing attacks against the
 * token. Returns `false` if the secret is not configured.
 */
export function verifyCronSecret(authHeader: string | null): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  if (!authHeader) return false;

  const expected = `Bearer ${cronSecret}`;
  const actualBuf = Buffer.from(authHeader);
  const expectedBuf = Buffer.from(expected);

  // timingSafeEqual requires equal-length buffers. Compare lengths first, but
  // still run the comparison on a same-size buffer to avoid leaking length.
  if (actualBuf.length !== expectedBuf.length) {
    // Run a dummy compare to keep timing roughly constant.
    timingSafeEqual(expectedBuf, expectedBuf);
    return false;
  }
  return timingSafeEqual(actualBuf, expectedBuf);
}
