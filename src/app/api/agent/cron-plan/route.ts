import { supabase } from '@/lib/supabase/client';
import { NextResponse } from 'next/server';

/**
 * GET /api/agent/cron-plan
 * Returns orchestrator config for all projects + cron schedule info
 * Used by Agent Hugo > Cron Plán tab
 */
export async function GET() {
  if (!supabase) {
    return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  }

  // All projects with orchestrator config
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, slug, platforms, orchestrator_config, visual_identity')
    .order('name');

  if (!projects) {
    return NextResponse.json({ projects: [], cron_schedule: {}, last_runs: [], cron_secret_configured: !!process.env.CRON_SECRET });
  }

  // Today's generated content count per project
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { data: todayCounts } = await supabase
    .from('content_queue')
    .select('project_id')
    .gte('created_at', todayStart.toISOString());

  const countByProject: Record<string, number> = {};
  if (todayCounts) {
    for (const row of todayCounts) {
      countByProject[row.project_id] = (countByProject[row.project_id] || 0) + 1;
    }
  }

  // Pending tasks per project
  const { data: pendingTasks } = await supabase
    .from('agent_tasks')
    .select('project_id, task_type, scheduled_for')
    .eq('status', 'pending')
    .order('scheduled_for', { ascending: true });

  const pendingByProject: Record<string, Array<{ task_type: string; scheduled_for: string }>> = {};
  if (pendingTasks) {
    for (const t of pendingTasks) {
      if (!pendingByProject[t.project_id]) pendingByProject[t.project_id] = [];
      pendingByProject[t.project_id].push({ task_type: t.task_type, scheduled_for: t.scheduled_for });
    }
  }

  // Last cron runs
  const { data: lastCronRuns } = await supabase
    .from('agent_log')
    .select('action, details, created_at')
    .in('action', ['cron_agent', 'cron_rss'])
    .order('created_at', { ascending: false })
    .limit(5);

  const enriched = projects.map(p => {
    const config = (p.orchestrator_config as Record<string, unknown>) || {};
    const vi = (p.visual_identity as Record<string, unknown>) || {};
    const enabled = config.enabled === true;
    const frequency = (config.posting_frequency as string) || 'daily';
    const postingTimes = (config.posting_times as string[]) || ['09:00'];
    const maxPerDay = (config.max_posts_per_day as number) || 3;
    const autoPublish = config.auto_publish === true;
    const autoPublishThreshold = (config.auto_publish_threshold as number) || 8;
    const contentStrategy = (config.content_strategy as string) || 'balanced';
    const mediaStrategy = (config.media_strategy as string) || 'auto';
    const pauseWeekends = config.pause_weekends === true;

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      platforms: p.platforms || [],
      logo_url: (vi.logo_url as string) || null,
      primary_color: (vi.primary_color as string) || null,
      enabled,
      frequency,
      posting_times: postingTimes,
      max_per_day: maxPerDay,
      auto_publish: autoPublish,
      auto_publish_threshold: autoPublishThreshold,
      content_strategy: contentStrategy,
      media_strategy: mediaStrategy,
      pause_weekends: pauseWeekends,
      today_generated: countByProject[p.id] || 0,
      pending_tasks: pendingByProject[p.id] || [],
    };
  });

  return NextResponse.json({
    projects: enriched,
    cron_schedule: {
      agent: '0 8,12,17 * * * (9:00, 13:00, 18:00 CET)',
      rss: '0 */6 * * * (every 6 hours)',
    },
    last_runs: lastCronRuns || [],
    cron_secret_configured: !!process.env.CRON_SECRET,
  });
}
