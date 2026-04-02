import { supabase } from '@/lib/supabase/client';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/require-auth';

export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const { data, error } = await supabase
    .from('prompt_templates')
    .select('*')
    .eq('is_active', true)
    .order('category');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
