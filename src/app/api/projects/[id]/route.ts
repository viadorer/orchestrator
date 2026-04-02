import { supabase } from '@/lib/supabase/client';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/require-auth';
import { safeParseJson, validateBody, projectUpdateSchema, uuidSchema } from '@/lib/api/validate';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const { id } = await params;
  const idCheck = uuidSchema.safeParse(id);
  if (!idCheck.success) {
    return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
  }

  const [projectRes, kbRes, queueRes] = await Promise.all([
    supabase.from('projects').select('*').eq('id', id).single(),
    supabase.from('knowledge_base').select('*').eq('project_id', id).eq('is_active', true).order('category'),
    supabase.from('content_queue').select('*').eq('project_id', id).order('created_at', { ascending: false }).limit(50),
  ]);

  if (projectRes.error) {
    return NextResponse.json({ error: projectRes.error.message }, { status: 404 });
  }

  return NextResponse.json({
    ...projectRes.data,
    knowledge_base: kbRes.data || [],
    content_queue: queueRes.data || [],
  });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const { id } = await params;
  const idCheck = uuidSchema.safeParse(id);
  if (!idCheck.success) {
    return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
  }

  const json = await safeParseJson(request);
  if (!json.ok) return json.response;

  const v = validateBody(json.data, projectUpdateSchema);
  if (!v.ok) return v.response;

  const { data, error } = await supabase
    .from('projects')
    .update(v.data)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const { id } = await params;
  const idCheck = uuidSchema.safeParse(id);
  if (!idCheck.success) {
    return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
  }

  const { error } = await supabase
    .from('projects')
    .update({ is_active: false })
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
