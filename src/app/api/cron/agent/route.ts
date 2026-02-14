import { runPendingTasks } from '@/lib/ai/agent-orchestrator';
import { processUntaggedMedia } from '@/lib/ai/vision-engine';
import { NextResponse } from 'next/server';

/**
 * Cron endpoint – Vercel spouští každou hodinu
 * 
 * Hugo "dýchá":
 * 1. Auto-schedule: Per-project orchestrator (respektuje config)
 * 2. Run pending: Spustí pending tasks (human priority first)
 * 3. Media processing: AI-tag nové fotky (Gemini Vision)
 * 
 * Secured by CRON_SECRET header (Vercel automatically sends this)
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();

  // 1+2. Auto-schedule + run tasks
  const taskResult = await runPendingTasks();

  // 3. Process untagged media (max 10 per cron cycle to stay within limits)
  const mediaResult = await processUntaggedMedia(10);

  const duration = Date.now() - startTime;

  return NextResponse.json({
    ...taskResult,
    media_processed: mediaResult.processed,
    media_failed: mediaResult.failed,
    duration_ms: duration,
    timestamp: new Date().toISOString(),
    message: `Hugo: ${taskResult.executed} tasks, ${taskResult.skipped} skipped (daily limit), ${taskResult.auto_scheduled} scheduled, ${mediaResult.processed} media tagged.`,
  });
}
