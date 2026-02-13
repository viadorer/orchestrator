import { runPendingTasks } from '@/lib/ai/agent-orchestrator';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const projectId = body.projectId as string | undefined;

  const result = await runPendingTasks(projectId);

  return NextResponse.json(result);
}
