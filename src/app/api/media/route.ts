import { supabase } from '@/lib/supabase/client';
import { processMediaAsset } from '@/lib/ai/vision-engine';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/require-auth';

/**
 * Media Library API
 * GET  /api/media?project_id=xxx          – list project assets
 * GET  /api/media?shared=true             – list shared library
 * GET  /api/media?project_id=xxx&include_shared=true – project + shared
 * POST /api/media                         – register uploaded asset
 */

export async function GET(request: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('project_id');
  const fileType = searchParams.get('file_type');
  const processed = searchParams.get('processed');
  const shared = searchParams.get('shared');
  const includeShared = searchParams.get('include_shared');
  const limit = parseInt(searchParams.get('limit') || '50', 10);

  let query = supabase
    .from('media_assets')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (shared === 'true') {
    // Only shared library
    query = query.eq('is_shared', true);
  } else if (projectId && includeShared === 'true') {
    // Project + shared (OR filter)
    query = query.or(`project_id.eq.${projectId},is_shared.eq.true`);
  } else if (projectId) {
    // Only this project
    query = query.eq('project_id', projectId);
  }

  if (fileType) query = query.eq('file_type', fileType);
  if (processed === 'true') query = query.eq('is_processed', true);
  if (processed === 'false') query = query.eq('is_processed', false);

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ assets: data, count: data?.length || 0 });
}

export async function POST(request: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });

  const body = await request.json();
  const { project_id, storage_path, public_url, file_name, file_type, mime_type, file_size, width, height, is_shared } = body;

  if (!storage_path || !public_url) {
    return NextResponse.json({ error: 'storage_path and public_url are required' }, { status: 400 });
  }
  // Either project_id or is_shared must be set
  if (!project_id && !is_shared) {
    return NextResponse.json({ error: 'Either project_id or is_shared=true is required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('media_assets')
    .insert({
      project_id: project_id || null,
      storage_path,
      public_url,
      file_name: file_name || storage_path.split('/').pop(),
      file_type: file_type || 'image',
      mime_type: mime_type || null,
      file_size: file_size || null,
      width: width || null,
      height: height || null,
      is_shared: is_shared || false,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Auto-process: AI tagging + embedding (async, don't block response)
  if (data?.id) {
    processMediaAsset(data.id).catch(() => {
      // Processing failed silently – will be retried by cron
    });
  }

  return NextResponse.json({ asset: data, processing: true });
}
