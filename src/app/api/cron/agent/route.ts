import { runPendingTasks, publishApprovedPosts, scheduleFridayTopicSuggestions, fetchEngagementMetrics, optimizeFromEngagement, embedPostsForDedup } from '@/lib/ai/agent-orchestrator';
import { processUntaggedMedia } from '@/lib/ai/vision-engine';
import { fetchAllRssFeeds } from '@/lib/rss/fetcher';
import { supabase } from '@/lib/supabase/client';
import { NextResponse } from 'next/server';

/**
 * Cron endpoint – Vercel spouští každou hodinu
 * 
 * Hugo "dýchá" – kompletní autonomní pipeline:
 * 1. Auto-schedule: Per-project orchestrator (respektuje config)
 * 2. Run pending: Spustí pending tasks (human priority first)
 * 3. Auto-publish: Odešle approved posty přes getLate.dev (pokud auto_publish=true)
 * 4. RSS fetch: Stáhne novinky z RSS feedů (respektuje fetch_interval_hours)
 * 5. Media processing: AI-tag nové fotky (Gemini Vision)
 * 6. Friday topics: V pátek navrhne témata na příští týden
 * 7. Engagement metrics: Stáhne metriky z getLate.dev (likes, comments, shares)
 * 8. Performance optimization: Analyzuje engagement data a učí se (neděle)
 * 9. Embed posts: Generuje embeddingy pro cross-project dedup (pgvector)
 * 
 * Secured by CRON_SECRET header (Vercel automatically sends this)
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();

  // 1+2. Auto-schedule + run tasks
  const taskResult = await runPendingTasks();

  // 3. Auto-publish approved posts (only for projects with auto_publish=true)
  const publishResult = await publishApprovedPosts();

  // 4. RSS fetch (respects per-source fetch_interval_hours)
  let rssResult = { sources_checked: 0, total_added: 0, total_errors: 0 };
  try {
    rssResult = await fetchAllRssFeeds();
  } catch {
    // RSS fetch failed, continue
  }

  // 5. Process untagged media (max 10 per cron cycle to stay within limits)
  const mediaResult = await processUntaggedMedia(10);

  // 6. Friday topic suggestions (only on Fridays, 8-10 AM CET)
  let fridayTopics = 0;
  const now = new Date();
  const pragueHour = parseInt(new Intl.DateTimeFormat('en-US', { hour: 'numeric', hour12: false, timeZone: 'Europe/Prague' }).format(now), 10);
  const pragueDay = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'Europe/Prague' }).format(now);
  if (pragueDay === 'Fri' && pragueHour >= 8 && pragueHour <= 10) {
    fridayTopics = await scheduleFridayTopicSuggestions();
  }

  // 7. Engagement metrics: fetch from getLate.dev for posts older than 24h
  let engagementResult = { posts_checked: 0, metrics_updated: 0 };
  try {
    engagementResult = await fetchEngagementMetrics();
  } catch {
    // Engagement fetch failed, continue
  }

  // 9. Embed posts for cross-project dedup (max 20 per cycle)
  let embedResult = { embedded: 0, failed: 0 };
  try {
    embedResult = await embedPostsForDedup(20);
  } catch {
    // Embedding failed, continue
  }

  // 8. Performance optimization: Sunday morning – analyze engagement and learn
  if (pragueDay === 'Sun' && pragueHour >= 8 && pragueHour <= 10) {
    try {
      const { data: activeProjects } = supabase
        ? await supabase.from('projects').select('id').eq('is_active', true)
        : { data: null };
      if (activeProjects) {
        for (const p of activeProjects) {
          await optimizeFromEngagement(p.id);
        }
      }
    } catch {
      // Performance optimization failed, continue
    }
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
    media_processed: mediaResult.processed,
    media_failed: mediaResult.failed,
    friday_topics_scheduled: fridayTopics,
    engagement_checked: engagementResult.posts_checked,
    engagement_updated: engagementResult.metrics_updated,
    posts_embedded: embedResult.embedded,
    embed_failed: embedResult.failed,
    duration_ms: duration,
    timestamp: new Date().toISOString(),
    message: `Hugo: ${taskResult.executed} tasks, ${publishResult.published} published, ${rssResult.total_added} news, ${mediaResult.processed} media, ${engagementResult.metrics_updated} engagement, ${embedResult.embedded} embedded.`,
  };

  // Log cron run to agent_log for admin visibility
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
}
