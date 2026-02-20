/**
 * getLate.dev Publisher Implementation
 * 
 * Obaluje stávající getLate API klient do Publisher interface.
 * Stávající src/lib/getlate.ts zůstává jako low-level klient.
 */

import { publishPost, listAccounts, buildPlatformsArray } from '@/lib/getlate';
import { ok, fail } from '@/lib/types/result';
import type { Publisher, PublishPayload, PublishResult, AccountInfo } from './types';

const GETLATE_API_KEY = process.env.GETLATE_API_KEY;

export const getLatePublisher: Publisher = {
  name: 'getLate.dev',

  isConfigured(): boolean {
    return !!GETLATE_API_KEY;
  },

  async publish(payload: PublishPayload) {
    if (!GETLATE_API_KEY) {
      return fail<PublishResult>('GETLATE_API_KEY not configured', 'NOT_CONFIGURED');
    }

    try {
      const result = await publishPost({
        content: payload.content,
        platforms: payload.platforms,
        mediaItems: payload.mediaItems,
        scheduledFor: payload.scheduledFor,
        timezone: payload.timezone || 'Europe/Prague',
      });

      return ok<PublishResult>({
        externalId: result._id,
        status: payload.scheduledFor ? 'scheduled' : 'sent',
        platforms: result.platforms || [],
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown getLate error';
      console.error(`[publisher:getlate] Publish failed:`, msg);
      return fail<PublishResult>(msg, 'PUBLISH_FAILED');
    }
  },

  async getAccounts() {
    if (!GETLATE_API_KEY) {
      return fail<AccountInfo[]>('GETLATE_API_KEY not configured', 'NOT_CONFIGURED');
    }

    try {
      const accounts = await listAccounts();
      return ok<AccountInfo[]>(
        accounts.map(a => ({
          id: a._id,
          platform: a.platform,
          username: a.username,
        }))
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      return fail<AccountInfo[]>(msg, 'ACCOUNTS_FAILED');
    }
  },
};

// Re-export helper for building platform entries from project config
export { buildPlatformsArray };
