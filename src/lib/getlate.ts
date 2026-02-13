/**
 * getLate.dev API Client
 * 
 * Base URL: https://getlate.dev/api/v1
 * Auth: Bearer token
 * 
 * Klíčový koncept:
 * - Profile = kontejner pro účty (brand/projekt)
 * - Account = připojený účet na konkrétní síti (každý má vlastní _id)
 * - Post = obsah publikovaný na 1+ účtů
 * 
 * Formát platforms v POST /posts:
 * platforms: [{ platform: "facebook", accountId: "698f7c19..." }]
 */

const GETLATE_API_URL = 'https://getlate.dev/api/v1';
const GETLATE_API_KEY = process.env.GETLATE_API_KEY;

// ============================================
// Types
// ============================================

export interface LatePlatformEntry {
  platform: string;
  accountId: string;
}

export interface LatePostPayload {
  content: string;
  platforms: LatePlatformEntry[];
  scheduledFor?: string; // ISO 8601
  timezone?: string;
}

export interface LatePostResponse {
  _id: string;
  content: string;
  status: string;
  scheduledFor?: string;
  platforms: Array<{
    platform: string;
    accountId: string;
    status: string;
  }>;
}

export interface LateAccount {
  _id: string;
  platform: string;
  username: string;
  profileId: string;
}

// ============================================
// API Client
// ============================================

async function lateRequest<T>(path: string, options?: RequestInit): Promise<T> {
  if (!GETLATE_API_KEY) {
    throw new Error('GETLATE_API_KEY is not configured. Set it in .env');
  }

  const res = await fetch(`${GETLATE_API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GETLATE_API_KEY}`,
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`getLate.dev API error (${res.status}): ${errorText}`);
  }

  return res.json();
}

// ============================================
// Posts
// ============================================

/**
 * Publish or schedule a post to one or more platforms.
 * Each platform needs its own accountId from getLate.
 */
export async function publishPost(payload: LatePostPayload): Promise<LatePostResponse> {
  const body: Record<string, unknown> = {
    content: payload.content,
    platforms: payload.platforms,
  };

  if (payload.scheduledFor) {
    body.scheduledFor = payload.scheduledFor;
    body.timezone = payload.timezone || 'Europe/Prague';
  }

  const result = await lateRequest<{ post: LatePostResponse }>('/posts', {
    method: 'POST',
    body: JSON.stringify(body),
  });

  return result.post;
}

/**
 * Publish immediately (no scheduledFor).
 */
export async function publishNow(
  content: string,
  platforms: LatePlatformEntry[],
): Promise<LatePostResponse> {
  return publishPost({ content, platforms });
}

/**
 * Schedule a post for a specific time.
 */
export async function schedulePost(
  content: string,
  platforms: LatePlatformEntry[],
  scheduledFor: string,
): Promise<LatePostResponse> {
  return publishPost({ content, platforms, scheduledFor });
}

// ============================================
// Accounts
// ============================================

/**
 * List all connected social media accounts.
 * Use this to get accountIds for each platform.
 */
export async function listAccounts(): Promise<LateAccount[]> {
  const result = await lateRequest<{ accounts: LateAccount[] }>('/accounts');
  return result.accounts;
}

// ============================================
// Helpers
// ============================================

/**
 * Build platforms array from project's late_accounts JSONB.
 * late_accounts format: {"facebook": "698f7c19...", "linkedin": "abc123..."}
 * targetPlatforms: which platforms to publish to (subset of late_accounts keys)
 */
export function buildPlatformsArray(
  lateAccounts: Record<string, string>,
  targetPlatforms: string[],
): LatePlatformEntry[] {
  const entries: LatePlatformEntry[] = [];

  for (const platform of targetPlatforms) {
    const accountId = lateAccounts[platform];
    if (accountId) {
      entries.push({ platform, accountId });
    }
  }

  return entries;
}
