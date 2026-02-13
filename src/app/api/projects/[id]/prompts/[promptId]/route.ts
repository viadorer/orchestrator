import { supabase } from '@/lib/supabase/client';
import { NextResponse } from 'next/server';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; promptId: string }> }) {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const { promptId } = await params;
  const body = await request.json();

  const updateFields: Record<string, unknown> = {};
  if (body.content !== undefined) updateFields.content = body.content;
  if (body.description !== undefined) updateFields.description = body.description;
  if (body.sort_order !== undefined) updateFields.sort_order = body.sort_order;
  if (body.is_active !== undefined) updateFields.is_active = body.is_active;
  if (body.category !== undefined) updateFields.category = body.category;

  const { data, error } = await supabase
    .from('project_prompt_templates')
    .update(updateFields)
    .eq('id', promptId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string; promptId: string }> }) {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const { promptId } = await params;

  const { error } = await supabase
    .from('project_prompt_templates')
    .delete()
    .eq('id', promptId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ deleted: true });
}
