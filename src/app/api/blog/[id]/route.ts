import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  const { data, error } = await supabase
    .from('content_queue')
    .select('*, projects!inner(name, slug)')
    .eq('id', id)
    .eq('content_type', 'blog')
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
  }

  return NextResponse.json({ post: data });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  const updates: Record<string, unknown> = {};

  if (body.markdown_body !== undefined) {
    updates.markdown_body = body.markdown_body;
  }

  if (body.blog_meta !== undefined) {
    updates.blog_meta = body.blog_meta;
    // Update text_content with excerpt
    if (body.blog_meta.excerpt) {
      updates.text_content = body.blog_meta.excerpt;
    }
  }

  if (body.status !== undefined) {
    updates.status = body.status;
  }

  const { data, error } = await supabase
    .from('content_queue')
    .update(updates)
    .eq('id', id)
    .eq('content_type', 'blog')
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message || 'Failed to update blog post' },
      { status: 400 }
    );
  }

  return NextResponse.json({ post: data });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  const { error } = await supabase
    .from('content_queue')
    .delete()
    .eq('id', id)
    .eq('content_type', 'blog');

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: true });
}
