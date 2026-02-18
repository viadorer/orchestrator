import { supabase } from '@/lib/supabase/client';
import { NextResponse } from 'next/server';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const { id } = await params;

  const { data, error } = await supabase
    .from('project_prompt_templates')
    .select('*')
    .eq('project_id', id)
    .order('is_active', { ascending: false })
    .order('sort_order');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const { id } = await params;
  const body = await request.json();

  // If action is "copy_defaults", copy default prompts to this project
  if (body.action === 'copy_defaults') {
    const { data, error } = await supabase.rpc('copy_default_prompts_to_project', {
      p_project_id: id,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ copied: data });
  }

  // Otherwise create a new prompt template
  const { slug, category, content, description, sort_order } = body;

  if (!slug || !category || !content) {
    return NextResponse.json({ error: 'slug, category, and content are required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('project_prompt_templates')
    .insert({
      project_id: id,
      slug,
      category,
      content,
      description: description || null,
      sort_order: sort_order || 100,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
