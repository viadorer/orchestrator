import { supabase } from '@/lib/supabase/client';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || 'review';
  const projectId = searchParams.get('projectId');

  let query = supabase
    .from('content_queue')
    .select('*, projects(name, slug)')
    .eq('status', status)
    .order('created_at', { ascending: false })
    .limit(100);

  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PATCH(request: Request) {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const { id, text_content } = await request.json();

  if (!id || !text_content) {
    return NextResponse.json({ error: 'id and text_content are required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('content_queue')
    .update({ text_content })
    .eq('id', id)
    .in('status', ['approved', 'scheduled'])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(request: Request) {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const { ids } = await request.json();

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'ids array is required' }, { status: 400 });
  }

  const { error } = await supabase
    .from('content_queue')
    .delete()
    .in('id', ids)
    .in('status', ['approved', 'scheduled']);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ deleted: ids.length });
}
