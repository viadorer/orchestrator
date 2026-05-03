/**
 * Keyset pagination helpers.
 *
 * Offset pagination is wrong for time-ordered feeds (rows shift between
 * requests, deep offsets are O(n)). Keyset uses a stable cursor on
 * (created_at, id) and is O(log n) regardless of depth.
 *
 * Cursors are opaque base64 strings to discourage clients from
 * synthesising them.
 */

export interface KeysetCursor {
  ts: string; // ISO timestamp
  id: string; // tiebreaker
}

export interface PaginationParams {
  limit: number;
  cursor: KeysetCursor | null;
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/** Decode a base64 cursor; returns null if invalid. */
export function decodeCursor(raw: string | null | undefined): KeysetCursor | null {
  if (!raw) return null;
  try {
    const json = Buffer.from(raw, 'base64').toString('utf8');
    const obj = JSON.parse(json) as { ts?: unknown; id?: unknown };
    if (typeof obj.ts !== 'string' || typeof obj.id !== 'string') return null;
    if (Number.isNaN(Date.parse(obj.ts))) return null;
    return { ts: obj.ts, id: obj.id };
  } catch {
    return null;
  }
}

export function encodeCursor(ts: string, id: string): string {
  return Buffer.from(JSON.stringify({ ts, id })).toString('base64');
}

/**
 * Parse search params into a normalised pagination shape. Clamps `limit`
 * to MAX_LIMIT to avoid clients exhausting the server with `limit=10000`.
 */
export function parsePagination(searchParams: URLSearchParams): PaginationParams {
  const rawLimit = Number(searchParams.get('limit') ?? DEFAULT_LIMIT);
  const limit = Number.isFinite(rawLimit)
    ? Math.min(Math.max(1, Math.floor(rawLimit)), MAX_LIMIT)
    : DEFAULT_LIMIT;
  const cursor = decodeCursor(searchParams.get('cursor'));
  return { limit, cursor };
}

/**
 * Build the next-page cursor from the last row of a result set.
 * Returns null if no more pages.
 */
export function buildNextCursor<T extends { id: string; created_at: string }>(
  rows: T[],
  limit: number,
): string | null {
  if (rows.length < limit) return null;
  const last = rows[rows.length - 1];
  return encodeCursor(last.created_at, last.id);
}
