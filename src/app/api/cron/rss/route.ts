import { fetchAllRssFeeds } from '@/lib/rss/fetcher';
import { NextResponse } from 'next/server';

/**
 * Cron: RSS Fetch
 * Runs every 6 hours via Vercel Cron
 * Fetches all active RSS sources, scrapes articles, AI summarizes, stores with embeddings
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await fetchAllRssFeeds();

  return NextResponse.json({
    ok: true,
    ...result,
    timestamp: new Date().toISOString(),
  });
}
