import { supabase } from '@/lib/supabase/client';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  const body = await request.json();
  const { data, error } = await supabase.from('aio_entity_profiles').insert(body).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function PUT(request: Request) {
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  const body = await request.json();
  const { id, ...fields } = body as Record<string, unknown>;
  const { data, error } = await supabase.from('aio_entity_profiles').update(fields).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
