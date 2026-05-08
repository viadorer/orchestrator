import { supabase } from '@/lib/supabase/client';
import { requireAuth } from '@/lib/api/require-auth';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/errors — recent errors from agent_log (action='error')
 *
 * Query params:
 *   - limit (default 50, max 200)
 *   - project_id (optional filter)
 *   - source (optional filter, e.g. 'publish', 'cron-agent')
 *   - hours (default 168 = 7 days)
 */
export async function GET(request: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });

  const { searchParams } = new URL(request.url);
  const limit = Math.min(200, parseInt(searchParams.get('limit') || '50', 10));
  const projectId = searchParams.get('project_id');
  const source = searchParams.get('source');
  const hours = Math.min(720, parseInt(searchParams.get('hours') || '168', 10));

  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  let query = supabase
    .from('agent_log')
    .select('id, project_id, action, details, created_at')
    .eq('action', 'error')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (projectId) query = query.eq('project_id', projectId);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Optional client-side source filter (details->>source)
  let errors = data || [];
  if (source) {
    errors = errors.filter(e => {
      const d = e.details as Record<string, unknown> | null;
      return d?.source === source;
    });
  }

  // Aggregate stats
  const bySource: Record<string, number> = {};
  for (const e of errors) {
    const d = e.details as Record<string, unknown> | null;
    const src = (d?.source as string) || 'unknown';
    bySource[src] = (bySource[src] || 0) + 1;
  }

  return NextResponse.json({
    errors,
    total: errors.length,
    by_source: bySource,
    window_hours: hours,
  });
}
