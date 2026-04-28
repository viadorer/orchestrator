/**
 * Cron Lock Helper
 *
 * Prevents race conditions when multiple cron invocations overlap.
 * Vercel can sometimes spawn parallel cron instances during cold starts
 * or when previous invocation runs longer than the schedule interval.
 *
 * Usage:
 *   const lock = await acquireCronLock('agent_orchestrator');
 *   if (!lock.acquired) return NextResponse.json({ skipped: true, reason: lock.reason });
 *   try { ... do work ... } finally { await lock.release(); }
 *
 * If Supabase is unavailable, the lock falls open (returns acquired=true) so
 * cron continues to run — safer than silently failing in single-instance scenarios.
 */

import { supabase } from '@/lib/supabase/client';

export interface CronLockHandle {
  acquired: boolean;
  reason: string;
  release: () => Promise<void>;
}

export async function acquireCronLock(lockName: string): Promise<CronLockHandle> {
  if (!supabase) {
    console.warn(`[cron-lock] Supabase unavailable, allowing ${lockName} to proceed without lock`);
    return { acquired: true, reason: 'no_supabase', release: async () => {} };
  }

  try {
    const { data, error } = await supabase.rpc('try_acquire_cron_lock', { lock_name: lockName });

    if (error) {
      // RPC not deployed yet (migration not applied) — fall open
      console.warn(`[cron-lock] try_acquire_cron_lock RPC error (migration not applied?): ${error.message}`);
      return { acquired: true, reason: 'rpc_error', release: async () => {} };
    }

    if (data === true) {
      return {
        acquired: true,
        reason: 'acquired',
        release: async () => {
          try {
            await supabase!.rpc('release_cron_lock', { lock_name: lockName });
          } catch (err) {
            console.warn(`[cron-lock] Failed to release ${lockName}:`, err instanceof Error ? err.message : err);
          }
        },
      };
    }

    console.log(`[cron-lock] ${lockName} already held by another instance — skipping`);
    return { acquired: false, reason: 'already_running', release: async () => {} };
  } catch (err) {
    console.error(`[cron-lock] Unexpected error for ${lockName}:`, err);
    // Fall open on unexpected error — better to risk duplicate run than silent failure
    return { acquired: true, reason: 'exception', release: async () => {} };
  }
}
