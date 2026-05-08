import { supabase } from '@/lib/supabase/client';
import { requireAuth } from '@/lib/api/require-auth';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/daily-brief
 *
 * Aggregates everything you need to see in the morning, in one call:
 * - Posts awaiting review
 * - Posts scheduled for today
 * - Posts that failed in the last 24h (with error details)
 * - Errors in the last 24h, grouped by source
 * - Last cron run + its outcome
 * - Per-project quick stats (review/approved/scheduled counts)
 */
export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });

  const now = new Date();
  const startOfTodayPrague = startOfPragueDay(now);
  const endOfTodayPrague = new Date(startOfTodayPrague.getTime() + 24 * 60 * 60 * 1000);
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [
    reviewRes,
    scheduledTodayRes,
    failedRecentRes,
    errorsRes,
    lastCronRes,
    projectsRes,
  ] = await Promise.all([
    supabase
      .from('content_queue')
      .select('id, project_id, target_platform, text_content, created_at, projects(name, slug)')
      .eq('status', 'review')
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('content_queue')
      .select('id, project_id, target_platform, scheduled_for, text_content, projects(name, slug)')
      .eq('status', 'scheduled')
      .gte('scheduled_for', startOfTodayPrague.toISOString())
      .lt('scheduled_for', endOfTodayPrague.toISOString())
      .order('scheduled_for', { ascending: true })
      .limit(20),
    supabase
      .from('content_queue')
      .select('id, project_id, target_platform, text_content, updated_at, projects(name, slug)')
      .eq('status', 'failed')
      .gte('updated_at', last24h.toISOString())
      .order('updated_at', { ascending: false })
      .limit(20),
    supabase
      .from('agent_log')
      .select('id, project_id, details, created_at')
      .eq('action', 'error')
      .gte('created_at', last24h.toISOString())
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('agent_log')
      .select('id, action, details, created_at')
      .in('action', ['cron_agent', 'cron_rss', 'cron_maintenance', 'cron_weekly'])
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('projects')
      .select('id, name, slug, is_active, orchestrator_config')
      .eq('is_active', true)
      .order('name'),
  ]);

  // Aggregate errors by source
  const errorsBySource: Record<string, number> = {};
  for (const e of errorsRes.data || []) {
    const d = e.details as Record<string, unknown> | null;
    const src = (d?.source as string) || 'unknown';
    errorsBySource[src] = (errorsBySource[src] || 0) + 1;
  }

  // Cron health: did the agent cron run in the last 90 minutes?
  const lastAgentRun = (lastCronRes.data || []).find(r => r.action === 'cron_agent');
  const cronHealthy = lastAgentRun
    ? new Date(lastAgentRun.created_at as string).getTime() > now.getTime() - 90 * 60 * 1000
    : false;

  return NextResponse.json({
    timestamp: now.toISOString(),
    counts: {
      review: (reviewRes.data || []).length,
      scheduled_today: (scheduledTodayRes.data || []).length,
      failed_24h: (failedRecentRes.data || []).length,
      errors_24h: (errorsRes.data || []).length,
    },
    review_queue: reviewRes.data || [],
    scheduled_today: scheduledTodayRes.data || [],
    failed_recent: failedRecentRes.data || [],
    errors_by_source: errorsBySource,
    errors_recent: (errorsRes.data || []).slice(0, 10),
    cron: {
      healthy: cronHealthy,
      last_run: lastAgentRun?.created_at || null,
      recent: lastCronRes.data || [],
    },
    projects: (projectsRes.data || []).map(p => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      orchestrator_enabled: ((p.orchestrator_config as Record<string, unknown>) || {}).enabled === true,
    })),
  });
}

/** Get the start of "today" in Europe/Prague timezone, returned as UTC Date. */
function startOfPragueDay(now: Date): Date {
  // Format the date in Prague tz to get Y-M-D
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Prague',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = fmt.formatToParts(now);
  const y = parts.find(p => p.type === 'year')?.value;
  const m = parts.find(p => p.type === 'month')?.value;
  const d = parts.find(p => p.type === 'day')?.value;
  // Construct UTC midnight then offset by Prague's UTC offset
  // Prague is UTC+1 (CET) or UTC+2 (CEST). Use Intl to compute offset.
  const pragueMidnightLocal = new Date(`${y}-${m}-${d}T00:00:00`);
  const pragueOffsetMinutes = getOffsetMinutes(pragueMidnightLocal, 'Europe/Prague');
  return new Date(pragueMidnightLocal.getTime() - pragueOffsetMinutes * 60 * 1000);
}

function getOffsetMinutes(date: Date, tz: string): number {
  // Compute timezone offset (minutes) between UTC and the given timezone for the given date.
  const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
  const tzDate = new Date(date.toLocaleString('en-US', { timeZone: tz }));
  return (tzDate.getTime() - utcDate.getTime()) / 60000;
}
