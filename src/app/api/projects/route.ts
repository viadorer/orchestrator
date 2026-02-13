import { supabase } from '@/lib/supabase/client';
import { NextResponse } from 'next/server';

export async function GET() {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const { data, error } = await supabase
    .from('projects')
    .select('*, content_queue(count)')
    .eq('is_active', true)
    .order('name');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const body = await request.json();

  const { data, error } = await supabase
    .from('projects')
    .insert({
      name: body.name,
      slug: body.slug,
      description: body.description,
      late_social_set_id: body.late_social_set_id,
      platforms: body.platforms || ['linkedin'],
      mood_settings: body.mood_settings,
      content_mix: body.content_mix,
      constraints: body.constraints,
      semantic_anchors: body.semantic_anchors || [],
      style_rules: body.style_rules,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
