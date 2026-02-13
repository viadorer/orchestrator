import { supabase } from '@/lib/supabase/client';
import { processMediaAsset } from '@/lib/ai/vision-engine';
import { NextResponse } from 'next/server';

/**
 * Single Media Asset API
 * GET    /api/media/[id]          – get asset details
 * PATCH  /api/media/[id]          – update asset
 * DELETE /api/media/[id]          – soft-delete asset
 * POST   /api/media/[id]?action=process – trigger AI tagging
 */

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });

  const { id } = await params;
  const { data, error } = await supabase
    .from('media_assets')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return NextResponse.json({ error: 'Asset not found' }, { status: 404 });

  return NextResponse.json({ asset: data });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  if (action === 'process') {
    const success = await processMediaAsset(id);
    if (!success) return NextResponse.json({ error: 'Processing failed' }, { status: 500 });

    const { data } = await supabase.from('media_assets').select('*').eq('id', id).single();
    return NextResponse.json({ asset: data, processed: true });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });

  const { id } = await params;
  const body = await request.json();

  const allowedFields = ['ai_description', 'ai_tags', 'ai_mood', 'ai_scene', 'is_active', 'file_type'];
  const updates: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (key in body) updates[key] = body[key];
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('media_assets')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ asset: data });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });

  const { id } = await params;

  const { error } = await supabase
    .from('media_assets')
    .update({ is_active: false })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ deleted: true });
}
