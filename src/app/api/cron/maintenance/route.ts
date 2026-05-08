import { embedPostsForDedup } from '@/lib/ai/agent-orchestrator';
import { processUntaggedMedia } from '@/lib/ai/vision-engine';
import { detectOrphanedPosts } from '@/lib/api/orphan-detector';
import { supabase } from '@/lib/supabase/client';
import { acquireCronLock } from '@/lib/api/cron-lock';
import { verifyCronSecret } from '@/lib/api/verify-cron';
import { NextResponse } from 'next/server';

/**
 * Maintenance cron — Vercel every 6h (vercel.json).
 *
 * Moves long-running work out of the hot-path /api/cron/agent so that the
 * hourly orchestrator stays well under the 60s function budget.
 *
 * 1. AI-tag untagged media (Gemini Vision) — caps at 10 / cycle.
 * 2. Generate embeddings for cross-project dedup (pgvector) — caps at 30.
 * 3. Detect "orphaned" posts: status='sent' but no webhook arrived in 2h.
 */
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!verifyCronSecret(request.headers.get('authorization'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const lock = await acquireCronLock('cron_maintenance');
  if (!lock.acquired) {
    return NextResponse.json({
      skipped: true,
      reason: lock.reason,
      timestamp: new Date().toISOString(),
    });
  }

  const startTime = Date.now();

  try {
    // 1. AI-tag untagged media (limit 10)
    const mediaResult = await processUntaggedMedia(10);

    // 2. Embed posts for cross-project dedup (limit 30 — higher than the
    // previous 20 since this cron is now dedicated and slower-cadence).
    let embedResult = { embedded: 0, failed: 0 };
    try {
      embedResult = await embedPostsForDedup(30);
    } catch {
      // Embedding failed, continue
    }

    // 3. Detect orphaned posts (status='sent' for >2h with no webhook).
    // Cheap query — just two indexed lookups + bulk update.
    const orphanResult = await detectOrphanedPosts();

    const duration = Date.now() - startTime;
    const result = {
      media_processed: mediaResult.processed,
      media_failed: mediaResult.failed,
      posts_embedded: embedResult.embedded,
      embed_failed: embedResult.failed,
      orphans_flagged: orphanResult.flagged,
      orphans_scanned: orphanResult.scanned,
      duration_ms: duration,
      timestamp: new Date().toISOString(),
      message: `Maintenance: ${mediaResult.processed} media tagged, ${embedResult.embedded} embedded, ${orphanResult.flagged} orphans flagged.`,
    };

    if (supabase) {
      try {
        await supabase.from('agent_log').insert({
          action: 'cron_maintenance',
          details: result,
          tokens_used: 0,
          model_used: 'system',
        });
      } catch {
        // Don't fail cron on log error
      }
    }

    return NextResponse.json(result);
  } finally {
    await lock.release();
  }
}
