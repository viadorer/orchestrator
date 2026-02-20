import { supabase } from '@/lib/supabase/client';
import { NextResponse } from 'next/server';

/**
 * Get all media assets for a project
 * GET /api/media/project/[projectId]
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const { projectId } = await params;

  const { data, error } = await supabase
    .from('media_assets')
    .select('id, file_name, file_type, file_size, public_url, ai_description, ai_tags, created_at')
    .eq('project_id', projectId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ assets: data || [] });
}
