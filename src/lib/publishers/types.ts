/**
 * Publisher Interface
 * 
 * Abstrakce nad publishing službami (getLate.dev, Buffer, Hootsuite, přímé API).
 * Orchestrátor a publish API volají jen tento interface.
 */

import { type ServiceResult } from '@/lib/types/result';

export interface PublishPayload {
  content: string;
  platforms: PlatformEntry[];
  mediaItems?: MediaItem[];
  scheduledFor?: string; // ISO 8601
  timezone?: string;
}

export interface PlatformEntry {
  platform: string;
  accountId: string;
}

export interface MediaItem {
  type: 'image' | 'video' | 'document';
  url: string;
}

export interface PublishResult {
  externalId: string; // getLate _id, Buffer id, etc.
  status: 'sent' | 'scheduled';
  platforms: Array<{
    platform: string;
    accountId: string;
    status: string;
  }>;
}

export interface AccountInfo {
  id: string;
  platform: string;
  username: string;
}

export interface Publisher {
  readonly name: string;

  /** Publish or schedule a post */
  publish(payload: PublishPayload): Promise<ServiceResult<PublishResult>>;

  /** List connected accounts */
  getAccounts(): Promise<ServiceResult<AccountInfo[]>>;

  /** Check if publisher is configured */
  isConfigured(): boolean;
}
