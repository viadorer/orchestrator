import { supabase } from '@/lib/supabase/client';
import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const inactive = searchParams.get('inactive') === 'true';

  const query = supabase
    .from('knowledge_base')
    .select('*')
    .eq('project_id', id)
    .order('created_at', { ascending: false });

  if (inactive) {
    query.eq('is_active', false);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const { id } = await params;
  const body = await request.json();

  const { data, error } = await supabase
    .from('knowledge_base')
    .insert({
      project_id: id,
      category: body.category,
      title: body.title,
      content: body.content,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  await params; // project id not needed for KB update
  const body = await request.json();
  const { kbId, ...fields } = body;

  if (!kbId) {
    return NextResponse.json({ error: 'kbId is required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('knowledge_base')
    .update(fields)
    .eq('id', kbId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  await params;
  const { searchParams } = new URL(request.url);
  const kbId = searchParams.get('kbId');

  if (!kbId) {
    return NextResponse.json({ error: 'kbId query param is required' }, { status: 400 });
  }

  const { error } = await supabase
    .from('knowledge_base')
    .delete()
    .eq('id', kbId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
