import { supabase } from '@/lib/supabase/client';
import { NextResponse } from 'next/server';

/**
 * Update ai_people for a media asset
 * PATCH /api/media/[id]/people
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const { id } = await params;
  const { people } = await request.json();

  if (!Array.isArray(people)) {
    return NextResponse.json({ error: 'people must be an array' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('media_assets')
    .update({ ai_people: people })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ asset: data });
}
