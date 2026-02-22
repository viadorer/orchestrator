import { supabase } from '@/lib/supabase/client';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  const limit = parseInt(searchParams.get('limit') || '20', 10);

  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 });

  const { data } = await supabase
    .from('aio_audits')
    .select('id, prompt, platform, brand_mentioned, brand_position, sentiment, competitors_mentioned, created_at')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(limit);

  return NextResponse.json(data || []);
}
