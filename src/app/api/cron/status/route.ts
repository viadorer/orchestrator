import { supabase } from '@/lib/supabase/client';
import { NextResponse } from 'next/server';

/**
 * GET /api/cron/status
 * Returns last cron runs from agent_log for admin dashboard
 * 
 * Hugo pipeline (9 kroků):
 * 1. Auto-schedule  2. Run tasks  3. Auto-publish  4. RSS fetch
 * 5. Media processing  6. Friday topics  7. Engagement metrics
 * 8. Performance optimization  9. Embed posts (dedup)
 */
export async function GET() {
  if (!supabase) {
    return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  }

  // Last 30 cron + pipeline action logs
  const { data: logs } = await supabase
    .from('agent_log')
    .select('id, action, details, created_at')
    .in('action', [
      'cron_agent', 'cron_rss', 'auto_schedule', 'auto_publish',
      'friday_topic_suggestions', 'fetch_engagement_metrics',
      'auto_enrich_kb', 'ab_variants_generated',
    ])
    .order('created_at', { ascending: false })
    .limit(30);

  // Find last run for each type
  const findLast = (action: string) => logs?.find(l => l.action === action);
  const lastAgent = findLast('cron_agent');
  const lastRss = findLast('cron_rss');

  // Extract pipeline step stats from last cron_agent run
  const lastDetails = (lastAgent?.details || {}) as Record<string, unknown>;

  return NextResponse.json({
    cron_agent: {
      last_run: lastAgent?.created_at || null,
      details: lastAgent?.details || null,
      schedule: '0 8,12,17 * * * (9:00, 13:00, 18:00 CET)',
    },
    cron_rss: {
      last_run: lastRss?.created_at || null,
      details: lastRss?.details || null,
      schedule: '0 */6 * * * (every 6 hours)',
    },
    pipeline_steps: {
      tasks_executed: lastDetails.executed || 0,
      posts_published: lastDetails.published || 0,
      rss_added: lastDetails.rss_added || 0,
      media_processed: lastDetails.media_processed || 0,
      friday_topics: lastDetails.friday_topics_scheduled || 0,
      engagement_updated: lastDetails.engagement_updated || 0,
      posts_embedded: lastDetails.posts_embedded || 0,
      duration_ms: lastDetails.duration_ms || 0,
    },
    recent_actions: {
      auto_enrich_kb: findLast('auto_enrich_kb')?.created_at || null,
      ab_variants: findLast('ab_variants_generated')?.created_at || null,
      engagement: findLast('fetch_engagement_metrics')?.created_at || null,
      friday_topics: findLast('friday_topic_suggestions')?.created_at || null,
    },
    history: logs || [],
    cron_secret_configured: !!process.env.CRON_SECRET,
  });
}
