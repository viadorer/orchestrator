import { supabase } from '@/lib/supabase/client';
import { NextResponse } from 'next/server';

/**
 * GET /api/cron/status
 * Returns last cron runs from agent_log for admin dashboard
 */
export async function GET() {
  if (!supabase) {
    return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  }

  // Last 20 cron runs (agent + rss)
  const { data: logs } = await supabase
    .from('agent_log')
    .select('id, action, details, created_at')
    .in('action', ['cron_agent', 'cron_rss'])
    .order('created_at', { ascending: false })
    .limit(20);

  // Find last run for each type
  const lastAgent = logs?.find(l => l.action === 'cron_agent');
  const lastRss = logs?.find(l => l.action === 'cron_rss');

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
    history: logs || [],
    cron_secret_configured: !!process.env.CRON_SECRET,
  });
}
