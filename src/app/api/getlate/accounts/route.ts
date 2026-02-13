import { listAccounts } from '@/lib/getlate';
import { NextResponse } from 'next/server';

/**
 * GET /api/getlate/accounts
 * Lists all connected social media accounts from getLate.dev
 * Use this to find accountIds for each platform.
 */
export async function GET() {
  try {
    const accounts = await listAccounts();
    return NextResponse.json({ accounts });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
