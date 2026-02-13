import { supabase } from '@/lib/supabase/client';
import { NextResponse } from 'next/server';

/**
 * RSS Sources API
 * GET /api/rss?project_id=xxx - List RSS sources for project
 * POST /api/rss - Add new RSS source
 */
export async function GET(request: Request) {
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('project_id');

  let query = supabase
    .from('rss_sources')
    .select('*')
    .order('created_at', { ascending: false });

  if (projectId) query = query.eq('project_id', projectId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ sources: data });
}

export async function POST(request: Request) {
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });

  const body = await request.json();
  const { project_id, name, url, category, fetch_interval_hours } = body;

  if (!project_id || !name || !url) {
    return NextResponse.json({ error: 'project_id, name, and url are required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('rss_sources')
    .insert({
      project_id,
      name,
      url,
      category: category || 'general',
      fetch_interval_hours: fetch_interval_hours || 6,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}
