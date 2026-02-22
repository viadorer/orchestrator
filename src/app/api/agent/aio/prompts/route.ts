import { supabase } from '@/lib/supabase/client';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 });

  const { data } = await supabase
    .from('aio_prompts')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });

  return NextResponse.json(data || []);
}

export async function POST(request: Request) {
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  const body = await request.json();
  const { data, error } = await supabase.from('aio_prompts').insert(body).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function PATCH(request: Request) {
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  const body = await request.json();
  const { id, ...fields } = body as Record<string, unknown>;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const { data, error } = await supabase.from('aio_prompts').update(fields).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function DELETE(request: Request) {
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  await supabase.from('aio_prompts').delete().eq('id', id);
  return NextResponse.json({ ok: true });
}
