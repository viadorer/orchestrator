import { runPendingTasks, publishApprovedPosts, scheduleFridayTopicSuggestions, fetchEngagementMetrics } from '@/lib/ai/agent-orchestrator';
import { fetchAllRssFeeds } from '@/lib/rss/fetcher';
import { supabase } from '@/lib/supabase/client';
import { acquireCronLock } from '@/lib/api/cron-lock';
import { verifyCronSecret } from '@/lib/api/verify-cron';
import { logError } from '@/lib/api/error-log';
import { NextResponse } from 'next/server';

/**
 * Hot-path cron — Vercel hourly (vercel.json).
 *
 * Critical, time-sensitive work only:
 *   1. Auto-schedule + run pending tasks
 *   2. Auto-publish approved posts
 *   3. RSS fetch (respects per-source fetch_interval_hours)
 *   4. Engagement metrics from getLate.dev
 *   5. Friday topic suggestions (window: Fri 8-10 CET)
 *
 * Slow / weekly work moved out:
 *   /api/cron/maintenance — media tagging + dedup embeddings (every 6h)
 *   /api/cron/weekly      — AIO inject (Mon), AIO audit + Sunday optimization
 */
export const maxDuration = 60; // Vercel Pro plan
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!verifyCronSecret(request.headers.get('authorization'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const lock = await acquireCronLock('agent_orchestrator');
  if (!lock.acquired) {
    console.log(`[cron-agent] Skipping run — another instance is active (${lock.reason})`);
    return NextResponse.json({
      skipped: true,
      reason: lock.reason,
      message: 'Another cron instance is already running',
      timestamp: new Date().toISOString(),
    });
  }

  const startTime = Date.now();

  try {
    // 1+2. Auto-schedule + run tasks
    const taskResult = await runPendingTasks();

    // 3. Auto-publish approved posts
    const publishResult = await publishApprovedPosts();

    // 4. RSS fetch
    let rssResult = { sources_checked: 0, total_added: 0, total_errors: 0 };
    try {
      rssResult = await fetchAllRssFeeds();
    } catch (err) {
      await logError(err, { source: 'cron-agent.rss_fetch' });
    }

    // 5. Friday topic suggestions (Fri 8-10 CET)
    const now = new Date();
    const pragueHour = parseInt(new Intl.DateTimeFormat('en-US', { hour: 'numeric', hour12: false, timeZone: 'Europe/Prague' }).format(now), 10);
    const pragueDay = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'Europe/Prague' }).format(now);

    let fridayTopics = 0;
    if (pragueDay === 'Fri' && pragueHour >= 8 && pragueHour <= 10) {
      fridayTopics = await scheduleFridayTopicSuggestions();
    }

    // 6. Engagement metrics from getLate
    let engagementResult = { posts_checked: 0, metrics_updated: 0 };
    try {
      engagementResult = await fetchEngagementMetrics();
    } catch (err) {
      await logError(err, { source: 'cron-agent.engagement' });
    }

    const duration = Date.now() - startTime;
    const result = {
      ...taskResult,
      published: publishResult.published,
      publish_failed: publishResult.failed,
      publish_skipped: publishResult.skipped,
      rss_sources_checked: rssResult.sources_checked,
      rss_added: rssResult.total_added,
      rss_errors: rssResult.total_errors,
      friday_topics_scheduled: fridayTopics,
      engagement_checked: engagementResult.posts_checked,
      engagement_updated: engagementResult.metrics_updated,
      duration_ms: duration,
      timestamp: new Date().toISOString(),
      message: `Hugo: ${taskResult.executed} tasks, ${publishResult.published} published, ${rssResult.total_added} news, ${engagementResult.metrics_updated} engagement.`,
    };

    if (supabase) {
      try {
        await supabase.from('agent_log').insert({
          action: 'cron_agent',
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
