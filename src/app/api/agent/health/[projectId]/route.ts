import { getProjectHealth } from '@/lib/ai/agent-orchestrator';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/require-auth';

export async function GET(_request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  const { projectId } = await params;

  const health = await getProjectHealth(projectId);

  if (!health) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  return NextResponse.json(health);
}
