import { listAccounts } from '@/lib/getlate';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/require-auth';

/**
 * GET /api/getlate/accounts
 * Lists all connected social media accounts from getLate.dev
 * Use this to find accountIds for each platform.
 */
export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  try {
    const accounts = await listAccounts();
    return NextResponse.json({ accounts });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
