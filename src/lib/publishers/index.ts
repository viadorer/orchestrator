/**
 * Publisher Registry
 * 
 * Centrální místo pro přístup k publisherům.
 * Aktuálně jen getLate.dev, ale snadno rozšiřitelné.
 * 
 * Usage:
 *   import { getPublisher } from '@/lib/publishers';
 *   const publisher = getPublisher();
 *   const result = await publisher.publish(payload);
 */

import { getLatePublisher } from './getlate';
import type { Publisher } from './types';

// Registry of available publishers
const publishers: Record<string, Publisher> = {
  getlate: getLatePublisher,
};

/**
 * Get the active publisher.
 * Currently always getLate, but can be extended to per-project publisher selection.
 */
export function getPublisher(name = 'getlate'): Publisher {
  const publisher = publishers[name];
  if (!publisher) {
    throw new Error(`Publisher "${name}" not found. Available: ${Object.keys(publishers).join(', ')}`);
  }
  return publisher;
}

// Re-export types and helpers
export type { Publisher, PublishPayload, PublishResult, PlatformEntry, MediaItem, AccountInfo } from './types';
export { buildPlatformsArray } from './getlate';
