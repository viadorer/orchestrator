import { NextRequest, NextResponse } from 'next/server';

/**
 * Legacy /api/visual/card → redirect to /api/visual/template
 * 
 * Old card_url entries in content_queue point here.
 * Maps old params (hook, body, bg, accent, text) to new template endpoint.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  
  // Forward all params, add t=bold_card if not present
  const newParams = new URLSearchParams(searchParams.toString());
  if (!newParams.has('t')) {
    newParams.set('t', 'bold_card');
  }

  const url = new URL(request.url);
  url.pathname = '/api/visual/template-v2';
  url.search = newParams.toString();
  return NextResponse.redirect(url, 308);
}
