import { createHumanPriorityTask } from '@/lib/ai/agent-orchestrator';
import { NextResponse } from 'next/server';

/**
 * Priority Route – Admin vloží téma, Hugo ho okamžitě zpracuje (priority 10)
 * 
 * POST /api/agent/priority
 * Body: { projectId, topic, notes?, platform?, contentType? }
 */
export async function POST(request: Request) {
  const body = await request.json();
  const { projectId, topic, notes, platform, contentType } = body;

  if (!projectId || !topic) {
    return NextResponse.json(
      { error: 'projectId and topic are required' },
      { status: 400 }
    );
  }

  const taskId = await createHumanPriorityTask(
    projectId,
    topic,
    notes,
    platform,
    contentType,
  );

  if (!taskId) {
    return NextResponse.json({ error: 'Failed to create priority task' }, { status: 500 });
  }

  return NextResponse.json({
    taskId,
    priority: 10,
    message: `Priority task created. Hugo will process "${topic}" immediately.`,
  }, { status: 201 });
}
