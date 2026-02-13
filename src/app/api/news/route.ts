import { supabase } from '@/lib/supabase/client';
import { NextResponse } from 'next/server';

/**
 * News API
 * GET /api/news?project_id=xxx&limit=30 - List news for project
 */
export async function GET(request: Request) {
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('project_id');
  const limit = parseInt(searchParams.get('limit') || '30');

  if (!projectId) {
    return NextResponse.json({ error: 'project_id is required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('project_news')
    .select('id, title, summary, source_name, link, relevance_score, published_at, is_used_in_post')
    .eq('project_id', projectId)
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ news: data });
}
