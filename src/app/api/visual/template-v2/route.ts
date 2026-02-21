import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

/**
 * Template v2 → Redirect to /api/visual/template
 * 
 * Sharp requires system fonts (librsvg) which aren't available on Vercel.
 * Redirecting to @vercel/og implementation which has fonts built-in.
 * 
 * GET /api/visual/template-v2?t=quote_card&hook=...&body=...
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  url.pathname = '/api/visual/template';
  
  return NextResponse.redirect(url, 308);
}
