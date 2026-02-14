import { runPendingTasks } from '@/lib/ai/agent-orchestrator';
import { NextResponse } from 'next/server';

// Allow up to 60s for running multiple tasks
export const maxDuration = 60;

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const projectId = body.projectId as string | undefined;

  try {
    const result = await runPendingTasks(projectId);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
