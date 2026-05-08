/**
 * Webhook orphan detector.
 *
 * Why this exists: when /api/publish hands a post to getLate.dev, it stores
 * the returned `late_post_id` and marks status='sent'. The post's true terminal
 * state ('published' on Facebook/IG/etc., or 'failed') is supposed to arrive
 * later via /api/webhooks/getlate.
 *
 * If the webhook never arrives — getLate had an outage, our endpoint was
 * down, signature mismatch, etc. — the post is stuck in 'sent' forever, even
 * though the social network may or may not have actually published it. The
 * user's Daily Brief looks fine but in reality posts may be silently lost.
 *
 * This helper finds posts that have been in 'sent' for too long and flags
 * them with `webhook_orphaned=true`. Daily Brief surfaces them so the user
 * can manually verify in the getLate dashboard.
 *
 * Called from /api/cron/maintenance once an hour.
 */

import { supabase } from '@/lib/supabase/client';
import { logError } from '@/lib/api/error-log';

/** How long we wait for a webhook before flagging the post as orphaned. */
const WEBHOOK_GRACE_PERIOD_MS = 2 * 60 * 60 * 1000; // 2 hours

export interface OrphanResult {
  flagged: number;
  /** Total posts in 'sent' that we examined this run. */
  scanned: number;
}

/**
 * Scan recent 'sent' posts and mark any whose webhook hasn't arrived in time.
 *
 * Bounded scan window (last 7 days) so we don't churn over old data forever —
 * if a webhook hasn't arrived in 7 days, it's never coming and the flag is
 * already set.
 */
export async function detectOrphanedPosts(): Promise<OrphanResult> {
  if (!supabase) return { flagged: 0, scanned: 0 };

  const cutoff = new Date(Date.now() - WEBHOOK_GRACE_PERIOD_MS).toISOString();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  try {
    // Find candidates: status='sent', sent_at older than grace period, not yet flagged.
    const { data: candidates, error } = await supabase
      .from('content_queue')
      .select('id, late_post_id, sent_at, project_id, target_platform')
      .eq('status', 'sent')
      .eq('webhook_orphaned', false)
      .not('sent_at', 'is', null)
      .lt('sent_at', cutoff)
      .gte('sent_at', sevenDaysAgo)
      .limit(100);

    if (error) {
      await logError(error, { source: 'orphan-detector.scan' });
      return { flagged: 0, scanned: 0 };
    }

    if (!candidates || candidates.length === 0) {
      return { flagged: 0, scanned: 0 };
    }

    // Flag all of them in one update.
    const ids = candidates.map((c) => c.id as string);
    const { error: updateError } = await supabase
      .from('content_queue')
      .update({ webhook_orphaned: true })
      .in('id', ids);

    if (updateError) {
      await logError(updateError, { source: 'orphan-detector.flag' });
      return { flagged: 0, scanned: candidates.length };
    }

    // One concise log entry per orphan so admins can investigate.
    for (const c of candidates) {
      console.warn(
        `[orphan-detector] Post ${c.id} flagged orphaned ` +
          `(late_post_id=${c.late_post_id}, sent_at=${c.sent_at}, platform=${c.target_platform})`,
      );
    }

    return { flagged: candidates.length, scanned: candidates.length };
  } catch (err) {
    await logError(err, { source: 'orphan-detector' });
    return { flagged: 0, scanned: 0 };
  }
}
