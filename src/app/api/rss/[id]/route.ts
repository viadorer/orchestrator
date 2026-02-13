import { supabase } from '@/lib/supabase/client';
import { fetchRssFeed } from '@/lib/rss/fetcher';
import { NextResponse } from 'next/server';

/**
 * Single RSS Source API
 * PATCH /api/rss/[id] - Update source
 * DELETE /api/rss/[id] - Delete source
 * POST /api/rss/[id]?action=fetch - Manually trigger fetch
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  const { id } = await params;
  const body = await request.json();

  const { error } = await supabase
    .from('rss_sources')
    .update(body)
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  const { id } = await params;

  await supabase.from('rss_sources').delete().eq('id', id);
  return NextResponse.json({ ok: true });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  const { id } = await params;

  const { data: source } = await supabase
    .from('rss_sources')
    .select('*')
    .eq('id', id)
    .single();

  if (!source) return NextResponse.json({ error: 'Source not found' }, { status: 404 });

  const result = await fetchRssFeed(source.project_id, source.id, source.url, source.name);
  return NextResponse.json(result);
}
