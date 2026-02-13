import { supabase } from '@/lib/supabase/client';
import { createTask, type TaskType } from '@/lib/ai/agent-orchestrator';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  const status = searchParams.get('status');

  let query = supabase
    .from('agent_tasks')
    .select('*, projects(name, slug)')
    .order('created_at', { ascending: false })
    .limit(100);

  if (projectId) query = query.eq('project_id', projectId);
  if (status) query = query.eq('status', status);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { projectId, taskType, params, priority, scheduledFor, recurring } = body;

  if (!projectId || !taskType) {
    return NextResponse.json({ error: 'projectId and taskType are required' }, { status: 400 });
  }

  const taskId = await createTask(
    projectId,
    taskType as TaskType,
    params || {},
    { priority, scheduledFor, recurring }
  );

  if (!taskId) {
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }

  return NextResponse.json({ id: taskId }, { status: 201 });
}
