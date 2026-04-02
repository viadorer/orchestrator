import { supabase } from '@/lib/supabase/client';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/require-auth';
import { safeParseJson, validateBody, queuePatchSchema, queueDeleteSchema } from '@/lib/api/validate';

export async function GET(request: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || 'review';
  const projectId = searchParams.get('projectId');

  let query = supabase
    .from('content_queue')
    .select('*, projects(name, slug, platforms)')
    .eq('status', status)
    .order('created_at', { ascending: false })
    .limit(100);

  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PATCH(request: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const json = await safeParseJson(request);
  if (!json.ok) return json.response;

  const v = validateBody(json.data, queuePatchSchema);
  if (!v.ok) return v.response;

  const { id, text_content } = v.data;

  const { data, error } = await supabase
    .from('content_queue')
    .update({ text_content })
    .eq('id', id)
    .in('status', ['approved', 'scheduled'])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(request: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const json = await safeParseJson(request);
  if (!json.ok) return json.response;

  const v = validateBody(json.data, queueDeleteSchema);
  if (!v.ok) return v.response;

  const { ids } = v.data;

  const { error } = await supabase
    .from('content_queue')
    .delete()
    .in('id', ids)
    .in('status', ['approved', 'scheduled']);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ deleted: ids.length });
}
