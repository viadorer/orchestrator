import { getProjectHealth } from '@/lib/ai/agent-orchestrator';
import { NextResponse } from 'next/server';

export async function GET(_request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;

  const health = await getProjectHealth(projectId);

  if (!health) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  return NextResponse.json(health);
}
