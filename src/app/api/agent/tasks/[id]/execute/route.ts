import { executeTask } from '@/lib/ai/agent-orchestrator';
import { NextResponse } from 'next/server';

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const result = await executeTask(id);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json(result);
}
