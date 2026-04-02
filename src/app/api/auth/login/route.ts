import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { safeParseJson, validateBody, loginSchema } from '@/lib/api/validate';
import { checkRateLimit } from '@/lib/api/rate-limit';

export async function POST(request: Request) {
  // Rate limit login attempts by IP
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const rl = checkRateLimit(`auth:${ip}`, 'auth');
  if (!rl.ok) return rl.response;

  const json = await safeParseJson(request);
  if (!json.ok) return json.response;

  const v = validateBody(json.data, loginSchema);
  if (!v.ok) return v.response;

  const { email, password } = v.data;
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
