import { supabase } from '@/lib/supabase/client';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/require-auth';

/**
 * Template A/B Performance API
 * GET /api/analytics/templates — returns template_key performance data
 */
export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });

  // Try the view first, fallback to direct query
  try {
    const { data: viewData, error: viewError } = await supabase
      .from('template_performance')
      .select('*');

    if (!viewError && viewData) {
      return NextResponse.json({ templates: viewData });
    }
  } catch { /* view might not exist yet */ }

  // Fallback: direct query
  const { data, error } = await supabase
    .from('content_queue')
    .select('template_key, ai_scores, engagement_score, status, visual_type')
    .not('template_key', 'is', null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Aggregate manually
  const grouped: Record<string, { total: number; published: number; scores: number[]; engagement: number[] }> = {};
  for (const row of data || []) {
    const key = row.template_key || 'unknown';
    if (!grouped[key]) grouped[key] = { total: 0, published: 0, scores: [], engagement: [] };
    grouped[key].total++;
    if (row.status === 'sent') grouped[key].published++;
    const overall = (row.ai_scores as Record<string, number>)?.overall;
    if (overall) grouped[key].scores.push(overall);
    if (row.engagement_score) grouped[key].engagement.push(row.engagement_score);
  }

  const templates = Object.entries(grouped).map(([key, g]) => ({
    template_key: key,
    total_posts: g.total,
    published_posts: g.published,
    avg_ai_score: g.scores.length > 0 ? +(g.scores.reduce((a, b) => a + b, 0) / g.scores.length).toFixed(1) : null,
    avg_engagement: g.engagement.length > 0 ? +(g.engagement.reduce((a, b) => a + b, 0) / g.engagement.length).toFixed(1) : null,
  })).sort((a, b) => (b.avg_engagement || 0) - (a.avg_engagement || 0));

  return NextResponse.json({ templates });
}
