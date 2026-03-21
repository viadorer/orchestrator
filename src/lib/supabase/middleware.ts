/**
 * Supabase Middleware Client
 *
 * Pro Next.js middleware - refreshuje auth session.
 * Pro API routes (kromě veřejných) vyžaduje platnou session.
 */

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// API routes které mají vlastní auth nebo jsou záměrně veřejné
const PUBLIC_API_PREFIXES = [
  '/api/auth/',       // login/logout
  '/api/chat/',       // Hugo chatbot widget (origin-based auth)
  '/api/cron/',       // chráněno CRON_SECRET
  '/api/webhooks/',   // chráněno HMAC signature
];

function isPublicApiRoute(pathname: string): boolean {
  return PUBLIC_API_PREFIXES.some(prefix => pathname.startsWith(prefix));
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Refresh session (important for token refresh)
  const { data: { user } } = await supabase.auth.getUser();

  // Block unauthenticated API requests (except public routes)
  const pathname = request.nextUrl.pathname;
  if (pathname.startsWith('/api/') && !isPublicApiRoute(pathname) && !user) {
    console.warn(`[auth-middleware] Blocked unauthenticated request: ${request.method} ${pathname}`);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return supabaseResponse;
}
