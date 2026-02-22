/**
 * AIO API Endpoint
 *
 * GET  /api/agent/aio?projectId=... — stav AIO pro projekt (sites, entity, scores)
 * POST /api/agent/aio — manuální trigger AIO injection
 *
 * Body POST:
 * { "projectId": "uuid" }           — inject pro konkrétní projekt
 * { "action": "inject_all" }        — inject pro všechny aktivní projekty
 * { "action": "audit", "projectId": "uuid" } — spustí visibility audit task
 */

import { supabase } from '@/lib/supabase/client';
import { NextResponse } from 'next/server';

export const maxDuration = 60;

export async function GET(request: Request) {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');

  // Load AIO sites
  let sitesQuery = supabase.from('aio_sites').select('*, projects(name, slug)');
  if (projectId) sitesQuery = sitesQuery.eq('project_id', projectId);
  const { data: sites } = await sitesQuery.order('created_at', { ascending: false });

  // Load entity profiles
  let entityQuery = supabase.from('aio_entity_profiles').select('*');
  if (projectId) entityQuery = entityQuery.eq('project_id', projectId);
  const { data: entities } = await entityQuery;

  // Load latest scores
  let scoresQuery = supabase.from('aio_scores').select('*').order('score_date', { ascending: false }).limit(projectId ? 10 : 50);
  if (projectId) scoresQuery = scoresQuery.eq('project_id', projectId);
  const { data: scores } = await scoresQuery;

  // Load recent injection logs
  let logsQuery = supabase
    .from('agent_log')
    .select('project_id, action, details, created_at')
    .eq('action', 'aio_schema_inject')
    .order('created_at', { ascending: false })
    .limit(20);
  if (projectId) logsQuery = logsQuery.eq('project_id', projectId);
  const { data: logs } = await logsQuery;

  return NextResponse.json({
    sites: sites || [],
    entities: entities || [],
    scores: scores || [],
    recent_injections: logs || [],
    github_pat_configured: !!process.env.GITHUB_PAT,
  });
}

export async function POST(request: Request) {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const body = await request.json() as Record<string, unknown>;
  const action = (body.action as string) || 'inject';
  const projectId = body.projectId as string | undefined;

  // Check GITHUB_PAT
  if (!process.env.GITHUB_PAT) {
    return NextResponse.json(
      { error: 'GITHUB_PAT not configured. Set it in Vercel env vars.' },
      { status: 500 },
    );
  }

  if (action === 'audit' && projectId) {
    // Create visibility audit task
    const { createTask } = await import('@/lib/ai/agent-orchestrator');
    const taskId = await createTask(projectId, 'aio_visibility_audit', {}, { priority: 7 });
    return NextResponse.json({ task_id: taskId, action: 'aio_visibility_audit', project_id: projectId });
  }

  if (action === 'entity_audit' && projectId) {
    const { createTask } = await import('@/lib/ai/agent-orchestrator');
    const taskId = await createTask(projectId, 'aio_entity_audit', {}, { priority: 5 });
    return NextResponse.json({ task_id: taskId, action: 'aio_entity_audit', project_id: projectId });
  }

  // Schema injection
  const { runAioInjectionBatch } = await import('@/lib/aio/aio-engine');
  const result = await runAioInjectionBatch(projectId);

  // Log
  await supabase.from('agent_log').insert({
    project_id: projectId || null,
    action: 'aio_manual_inject',
    details: {
      total_sites: result.totalSites,
      succeeded: result.succeeded,
      failed: result.failed,
      trigger: 'api',
    },
  });

  return NextResponse.json({
    action: 'aio_schema_inject',
    ...result,
  });
}
