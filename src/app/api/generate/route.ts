import { supabase } from '@/lib/supabase/client';
import { createTask, executeTask } from '@/lib/ai/agent-orchestrator';
import { NextResponse } from 'next/server';

/**
 * Generate Content API
 * 
 * Uses the SAME pipeline as Agent Hugo (executeTask):
 * - Per-project prompts (identity, examples, guardrails)
 * - Published posts dedup (won't repeat existing posts)
 * - Creativity rules (hook variety, structure variety)
 * - Contextual Pulse (recent news integration)
 * - Hugo-Editor self-correction
 * - Media matching (if media_strategy = 'auto')
 */
export async function POST(request: Request) {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const body = await request.json();
  const { projectId, platform, contentType, patternId } = body;

  if (!projectId || !platform) {
    return NextResponse.json({ error: 'projectId and platform are required' }, { status: 400 });
  }

  try {
    // Create a task (same as Agent Hugo would)
    const taskId = await createTask(projectId, 'generate_content', {
      platform,
      contentType: contentType || undefined,
      patternId: patternId || undefined,
      source: 'manual_generate',
    }, { priority: 8 }); // High priority for manual generation

    if (!taskId) {
      return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
    }

    // Execute immediately (same pipeline as cron)
    const result = await executeTask(taskId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Get the saved content from content_queue
    const { data: saved } = await supabase
      .from('content_queue')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return NextResponse.json({
      content: {
        text: result.result?.text || '',
        image_prompt: result.result?.image_prompt || null,
        alt_text: result.result?.alt_text || null,
        scores: result.result?.scores || {},
      },
      saved,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
