import { runPendingTasks } from '@/lib/ai/agent-orchestrator';
import { NextResponse } from 'next/server';

/**
 * Cron endpoint – Vercel spouští každou hodinu
 * 
 * Hugo "dýchá":
 * 1. Auto-schedule: Zkontroluje všechny projekty, vytvoří tasks pro idle projekty
 * 2. Run pending: Spustí všechny pending tasks (human priority first)
 * 
 * Secured by CRON_SECRET header (Vercel automatically sends this)
 */
export async function GET(request: Request) {
  // Verify cron secret (Vercel sends this automatically)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();

  const result = await runPendingTasks(); // No projectId = full cron run

  const duration = Date.now() - startTime;

  return NextResponse.json({
    ...result,
    duration_ms: duration,
    timestamp: new Date().toISOString(),
    message: `Hugo processed ${result.executed} tasks, ${result.failed} failed, ${result.auto_scheduled} auto-scheduled.`,
  });
}
