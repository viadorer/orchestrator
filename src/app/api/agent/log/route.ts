import { supabase } from '@/lib/supabase/client';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/require-auth';

export async function GET(request: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');

  let query = supabase
    .from('agent_log')
    .select('*, projects(name, slug)')
    .order('created_at', { ascending: false })
    .limit(50);

  if (projectId) query = query.eq('project_id', projectId);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
