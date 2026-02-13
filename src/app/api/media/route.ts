import { supabase } from '@/lib/supabase/client';
import { NextResponse } from 'next/server';

/**
 * Media Library API
 * GET  /api/media?project_id=xxx  – list assets
 * POST /api/media                 – register uploaded asset
 */

export async function GET(request: Request) {
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('project_id');
  const fileType = searchParams.get('file_type');
  const processed = searchParams.get('processed');
  const limit = parseInt(searchParams.get('limit') || '50', 10);

  let query = supabase
    .from('media_assets')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (projectId) query = query.eq('project_id', projectId);
  if (fileType) query = query.eq('file_type', fileType);
  if (processed === 'true') query = query.eq('is_processed', true);
  if (processed === 'false') query = query.eq('is_processed', false);

  const { data, error, count } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ assets: data, count: data?.length || 0 });
}

export async function POST(request: Request) {
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });

  const body = await request.json();
  const { project_id, storage_path, public_url, file_name, file_type, mime_type, file_size, width, height } = body;

  if (!project_id || !storage_path || !public_url) {
    return NextResponse.json({ error: 'project_id, storage_path, and public_url are required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('media_assets')
    .insert({
      project_id,
      storage_path,
      public_url,
      file_name: file_name || storage_path.split('/').pop(),
      file_type: file_type || 'image',
      mime_type: mime_type || null,
      file_size: file_size || null,
      width: width || null,
      height: height || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ asset: data });
}
