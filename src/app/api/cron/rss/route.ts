import { fetchAllRssFeeds } from '@/lib/rss/fetcher';
import { supabase } from '@/lib/supabase/client';
import { NextResponse } from 'next/server';

/**
 * Cron: RSS Fetch
 * Runs every 6 hours via Vercel Cron
 * Fetches all active RSS sources, scrapes articles, AI summarizes, stores with embeddings
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  const result = await fetchAllRssFeeds();
  const duration = Date.now() - startTime;

  const logData = {
    ok: true,
    ...result,
    duration_ms: duration,
    timestamp: new Date().toISOString(),
  };

  // Log cron run
  if (supabase) {
    try {
      await supabase.from('agent_log').insert({
        action: 'cron_rss',
        details: logData,
        tokens_used: 0,
        model_used: 'system',
      });
    } catch {
      // Don't fail cron on log error
    }
  }

  return NextResponse.json(logData);
}
