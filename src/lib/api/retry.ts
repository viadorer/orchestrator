/**
 * Retry helpers for external API calls.
 *
 * Two main concerns when retrying:
 *   1. Don't retry permanent errors (4xx auth/validation) — they will keep failing
 *      forever and just waste quota.
 *   2. Don't retry idempotency-unsafe operations without a key.
 *
 * Used by /api/publish to give getLate.dev a fair chance through transient
 * network blips before marking a post as failed.
 */

export interface RetryOptions {
  /** How many attempts in total (incl. the first call). Default 3. */
  maxAttempts?: number;
  /** Base delay in ms — actual delay is base * 2^(attempt-1). Default 5000. */
  baseDelayMs?: number;
  /** Cap on delay between attempts. Default 30000. */
  maxDelayMs?: number;
  /** Optional callback per failed attempt — useful for logging. */
  onAttemptFailed?: (attempt: number, error: unknown, retryable: boolean) => void;
  /**
   * Decide whether the error is retryable. Default: classifyRetryable below.
   * Return true → retry; false → bail out immediately.
   */
  isRetryable?: (error: unknown) => boolean;
}

/**
 * Run an async operation with exponential backoff retry.
 *
 * Returns the operation's result on success, or throws the last error on
 * exhaustion. The operation must be idempotent OR safe to call multiple times
 * (e.g. wrap getLate.publish, which dedupes via idempotency keys server-side).
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  opts: RetryOptions = {},
): Promise<T> {
  const maxAttempts = opts.maxAttempts ?? 3;
  const baseDelayMs = opts.baseDelayMs ?? 5_000;
  const maxDelayMs = opts.maxDelayMs ?? 30_000;
  const isRetryable = opts.isRetryable ?? classifyRetryable;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (err) {
      lastError = err;
      const retryable = isRetryable(err);
      opts.onAttemptFailed?.(attempt, err, retryable);

      // Bail immediately on permanent errors (auth, validation, 4xx) — retrying won't help.
      if (!retryable) throw err;

      // No more retries left → throw.
      if (attempt >= maxAttempts) throw err;

      // Exponential backoff with jitter: base * 2^(attempt-1) ± 20%.
      const expDelay = baseDelayMs * Math.pow(2, attempt - 1);
      const cappedDelay = Math.min(expDelay, maxDelayMs);
      const jitter = cappedDelay * 0.2 * (Math.random() * 2 - 1);
      const delay = Math.max(0, Math.round(cappedDelay + jitter));

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // Unreachable — loop above always throws or returns.
  throw lastError;
}

/**
 * Default retryable-error classifier.
 *
 * Treats as RETRYABLE (transient):
 *   - 408 Request Timeout
 *   - 425 Too Early
 *   - 429 Too Many Requests
 *   - 500 / 502 / 503 / 504
 *   - Any error whose message contains "timeout", "ECONNRESET", "ENOTFOUND",
 *     "fetch failed", "network", "AbortError"
 *
 * Treats as PERMANENT (don't retry):
 *   - 400 / 401 / 403 / 404 / 422 / 410
 *   - Any error tagged with `.permanent = true`
 */
export function classifyRetryable(error: unknown): boolean {
  if (!error) return false;

  // Explicit permanent flag from caller.
  if (typeof error === 'object' && error !== null && 'permanent' in error) {
    return !(error as { permanent: boolean }).permanent;
  }

  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();

  // Network / DNS / abort signals — always retry.
  if (lower.includes('timeout')) return true;
  if (lower.includes('econnreset')) return true;
  if (lower.includes('enotfound')) return true;
  if (lower.includes('econnrefused')) return true;
  if (lower.includes('fetch failed')) return true;
  if (lower.includes('network')) return true;
  if (lower.includes('aborterror')) return true;

  // Look for HTTP status codes embedded in the message.
  const statusMatch = message.match(/\b([4-5]\d{2})\b/);
  if (statusMatch) {
    const status = parseInt(statusMatch[1], 10);
    // 5xx → retry; 408/425/429 → retry; everything else 4xx → permanent.
    if (status >= 500) return true;
    if (status === 408 || status === 425 || status === 429) return true;
    return false;
  }

  // Default: assume transient. Better to retry once or twice than to lose work
  // on an ambiguous error message.
  return true;
}

/**
 * Mark an Error as permanent so withRetry stops trying immediately.
 * Useful when you've validated input client-side and know retries won't help.
 */
export function permanentError(message: string): Error & { permanent: true } {
  const err = new Error(message) as Error & { permanent: true };
  err.permanent = true;
  return err;
}
