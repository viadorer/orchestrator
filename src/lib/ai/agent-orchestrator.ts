/**
 * Agent Orchestrator
 * 
 * Hugo jako autonomní agent – dohlíží nad každým projektem samostatně.
 * Spouští úkoly, analyzuje stav, generuje obsah, plánuje týden.
 * 
 * Služby agenta:
 * 1. Content Services - generování postů, plánování týdne
 * 2. Quality Services - self-rating, dedup, sentiment check
 * 3. Strategy Services - content mix analýza, topic suggestions, KB gap analysis
 * 4. Publishing Services - scheduling, optimální časy
 */

import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { supabase } from '@/lib/supabase/client';
import { buildContentPrompt, getPromptTemplate, type PromptContext } from './prompt-builder';

// ============================================
// Types
// ============================================

export type TaskType =
  | 'generate_content'
  | 'generate_week_plan'
  | 'analyze_content_mix'
  | 'suggest_topics'
  | 'react_to_news'
  | 'quality_review'
  | 'sentiment_check'
  | 'dedup_check'
  | 'optimize_schedule'
  | 'kb_gap_analysis'
  | 'competitor_brief'
  | 'performance_report';

export interface AgentTask {
  id: string;
  project_id: string;
  task_type: TaskType;
  params: Record<string, unknown>;
  status: string;
  priority: number;
  result: Record<string, unknown> | null;
  error_message: string | null;
  scheduled_for: string;
}

export interface ProjectContext {
  project: Record<string, unknown>;
  kbEntries: Array<{ id: string; category: string; title: string; content: string }>;
  recentPosts: Array<{ text_content: string; content_type: string; created_at: string }>;
  postHistory: Array<{ content_type: string; posted_at: string }>;
  pendingTasks: number;
}

// ============================================
// Core: Load project context for agent
// ============================================

async function loadProjectContext(projectId: string): Promise<ProjectContext | null> {
  if (!supabase) return null;

  const [projectRes, kbRes, recentRes, historyRes, tasksRes] = await Promise.all([
    supabase.from('projects').select('*').eq('id', projectId).single(),
    supabase.from('knowledge_base').select('id, category, title, content').eq('project_id', projectId).eq('is_active', true),
    supabase.from('content_queue').select('text_content, content_type, created_at').eq('project_id', projectId).in('status', ['approved', 'sent', 'scheduled']).order('created_at', { ascending: false }).limit(10),
    supabase.from('post_history').select('content_type, posted_at').eq('project_id', projectId).order('posted_at', { ascending: false }).limit(20),
    supabase.from('agent_tasks').select('id', { count: 'exact' }).eq('project_id', projectId).in('status', ['pending', 'running']),
  ]);

  if (!projectRes.data) return null;

  return {
    project: projectRes.data,
    kbEntries: kbRes.data || [],
    recentPosts: recentRes.data || [],
    postHistory: historyRes.data || [],
    pendingTasks: tasksRes.count || 0,
  };
}

// ============================================
// Agent: Build context prompt for agent tasks
// ============================================

async function buildAgentPrompt(
  taskType: TaskType,
  ctx: ProjectContext,
  params: Record<string, unknown> = {}
): Promise<string> {
  const parts: string[] = [];
  const project = ctx.project;

  // 1. Agent system role
  const agentRole = await getPromptTemplate('agent_orchestrator');
  parts.push(agentRole || 'Jsi Hugo – autonomní AI agent pro správu marketingového obsahu.');

  // 2. Project context
  parts.push(`\n---\nPROJEKT: ${project.name}`);
  parts.push(`Slug: ${project.slug}`);
  parts.push(`Popis: ${project.description || 'Bez popisu'}`);
  parts.push(`Platformy: ${(project.platforms as string[])?.join(', ')}`);

  // 3. Mood & Style
  const mood = project.mood_settings as Record<string, string>;
  parts.push(`\nTÓN: ${mood?.tone || 'professional'} | ENERGIE: ${mood?.energy || 'medium'} | STYL: ${mood?.style || 'informative'}`);

  // 4. Constraints
  const constraints = project.constraints as { forbidden_topics: string[]; mandatory_terms: string[] };
  if (constraints?.forbidden_topics?.length > 0) {
    parts.push(`ZAKÁZANÁ TÉMATA: ${constraints.forbidden_topics.join(', ')}`);
  }
  if (constraints?.mandatory_terms?.length > 0) {
    parts.push(`POVINNÉ TERMÍNY: ${constraints.mandatory_terms.join(', ')}`);
  }

  // 5. Semantic anchors
  const anchors = project.semantic_anchors as string[];
  if (anchors?.length > 0) {
    parts.push(`KLÍČOVÁ SLOVA: ${anchors.join(', ')}`);
  }

  // 6. Content mix target
  const mix = project.content_mix as Record<string, number>;
  parts.push(`\nCÍLOVÝ CONTENT MIX: ${JSON.stringify(mix)}`);

  // 7. Knowledge Base
  if (ctx.kbEntries.length > 0) {
    parts.push('\n---\nKNOWLEDGE BASE:');
    for (const entry of ctx.kbEntries) {
      parts.push(`[${entry.category}] ${entry.title} (id: ${entry.id}): ${entry.content}`);
    }
  } else {
    parts.push('\n---\nKNOWLEDGE BASE: PRÁZDNÁ – doporuč přidání záznamů.');
  }

  // 8. Recent posts (for dedup & context)
  if (ctx.recentPosts.length > 0) {
    parts.push('\n---\nNEDÁVNÉ POSTY (neopakuj):');
    ctx.recentPosts.forEach((p, i) => {
      parts.push(`${i + 1}. [${p.content_type}] ${p.text_content.substring(0, 150)}...`);
    });
  }

  // 9. Post history stats
  if (ctx.postHistory.length > 0) {
    const typeCounts: Record<string, number> = {};
    ctx.postHistory.forEach(h => {
      typeCounts[h.content_type] = (typeCounts[h.content_type] || 0) + 1;
    });
    parts.push(`\nHISTORIE (posledních ${ctx.postHistory.length} postů): ${JSON.stringify(typeCounts)}`);
  }

  // 10. Task-specific prompt
  const taskPromptMap: Record<string, string> = {
    generate_content: 'system_role',
    generate_week_plan: 'agent_week_planner',
    suggest_topics: 'agent_topic_suggester',
    kb_gap_analysis: 'agent_kb_analyzer',
    performance_report: 'agent_performance',
  };

  const taskPromptSlug = taskPromptMap[taskType];
  if (taskPromptSlug) {
    const taskPrompt = await getPromptTemplate(taskPromptSlug);
    if (taskPrompt) {
      parts.push(`\n---\nÚKOL:\n${taskPrompt}`);
    }
  }

  // 11. Task-specific instructions based on type
  switch (taskType) {
    case 'generate_content': {
      const platform = (params.platform as string) || (project.platforms as string[])?.[0] || 'linkedin';
      const contentType = params.contentType as string;
      parts.push(`\nGENERUJ příspěvek pro platformu: ${platform}`);
      if (contentType) parts.push(`Typ obsahu: ${contentType}`);
      parts.push('Vrať JSON: {"text": "...", "image_prompt": "...", "alt_text": "...", "scores": {"creativity": N, "tone_match": N, "hallucination_risk": N, "value_score": N, "overall": N}}');
      break;
    }
    case 'analyze_content_mix': {
      parts.push('\nANALYZUJ aktuální content mix vs cílový. Vrať JSON: {"actual_mix": {...}, "target_mix": {...}, "gaps": [...], "recommendations": [...]}');
      break;
    }
    case 'quality_review': {
      const postText = params.post_text as string;
      if (postText) parts.push(`\nZKONTROLUJ kvalitu tohoto postu:\n"${postText}"\n\nVrať JSON: {"scores": {...}, "issues": [...], "suggestions": [...], "safe_to_publish": true/false}`);
      break;
    }
    case 'sentiment_check': {
      const text = params.text as string;
      if (text) parts.push(`\nZKONTROLUJ sentiment a bezpečnost:\n"${text}"\n\nVrať JSON: {"sentiment": "positive/neutral/negative", "safe": true/false, "flags": [...], "risk_level": "low/medium/high"}`);
      break;
    }
    case 'react_to_news': {
      const newsTitle = params.news_title as string;
      const newsSummary = params.news_summary as string;
      parts.push(`\nREAGUJ na tuto novinku:\nTitulek: ${newsTitle}\nShrnutí: ${newsSummary}\n\nVytvoř post, který propojí tuto novinku s KB fakty projektu.`);
      parts.push('Vrať JSON: {"text": "...", "image_prompt": "...", "scores": {...}}');
      break;
    }
    case 'optimize_schedule': {
      parts.push('\nNAVRHNI optimální časy publikace pro každou platformu. Zohledni typ obsahu a cílovou skupinu.');
      parts.push('Vrať JSON: {"schedule": [{"platform": "...", "best_times": ["HH:MM"], "best_days": ["monday",...], "reasoning": "..."}]}');
      break;
    }
  }

  return parts.join('\n');
}

// ============================================
// Agent: Execute task
// ============================================

export async function executeTask(taskId: string): Promise<{ success: boolean; result?: Record<string, unknown>; error?: string }> {
  if (!supabase) return { success: false, error: 'Supabase not configured' };

  // Load task
  const { data: task } = await supabase
    .from('agent_tasks')
    .select('*')
    .eq('id', taskId)
    .single();

  if (!task) return { success: false, error: 'Task not found' };

  // Mark as running
  await supabase.from('agent_tasks').update({ status: 'running', started_at: new Date().toISOString() }).eq('id', taskId);

  try {
    // Load project context
    const ctx = await loadProjectContext(task.project_id);
    if (!ctx) throw new Error('Project not found');

    // Build prompt
    const prompt = await buildAgentPrompt(task.task_type, ctx, task.params || {});

    // Call Gemini
    const { text: rawResponse, usage } = await generateText({
      model: google('gemini-2.0-flash'),
      prompt,
      temperature: task.task_type === 'generate_content' ? 0.8 : 0.4,
    });

    // Parse JSON response
    let result: Record<string, unknown>;
    try {
      const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        // Try array
        const arrayMatch = rawResponse.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
          result = { items: JSON.parse(arrayMatch[0]) };
        } else {
          result = { raw_response: rawResponse };
        }
      }
    } catch {
      result = { raw_response: rawResponse };
    }

    // Post-processing based on task type
    if (task.task_type === 'generate_content' && result.text) {
      // Auto-save to content_queue
      await supabase.from('content_queue').insert({
        project_id: task.project_id,
        text_content: result.text as string,
        image_prompt: (result.image_prompt as string) || null,
        alt_text: (result.alt_text as string) || null,
        content_type: (task.params?.contentType as string) || 'educational',
        platforms: [(task.params?.platform as string) || (ctx.project.platforms as string[])?.[0] || 'linkedin'],
        ai_scores: result.scores || {},
        status: 'review',
        source: 'ai_generated',
      });
    }

    // Log the action
    await supabase.from('agent_log').insert({
      project_id: task.project_id,
      task_id: taskId,
      action: `task_${task.task_type}`,
      details: { result_summary: typeof result.text === 'string' ? result.text.substring(0, 200) : null },
      tokens_used: usage?.totalTokens || null,
      model_used: 'gemini-2.0-flash',
    });

    // Mark as completed
    await supabase.from('agent_tasks').update({
      status: 'completed',
      result,
      completed_at: new Date().toISOString(),
    }).eq('id', taskId);

    // Handle recurring tasks
    if (task.is_recurring && task.recurrence_rule) {
      const nextRun = calculateNextRun(task.recurrence_rule);
      await supabase.from('agent_tasks').update({
        last_run_at: new Date().toISOString(),
        next_run_at: nextRun.toISOString(),
        status: 'pending',
        result: null,
        started_at: null,
        completed_at: null,
        scheduled_for: nextRun.toISOString(),
      }).eq('id', taskId);
    }

    return { success: true, result };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    await supabase.from('agent_tasks').update({
      status: 'failed',
      error_message: errorMsg,
      completed_at: new Date().toISOString(),
    }).eq('id', taskId);

    await supabase.from('agent_log').insert({
      project_id: task.project_id,
      task_id: taskId,
      action: `task_failed_${task.task_type}`,
      details: { error: errorMsg },
    });

    return { success: false, error: errorMsg };
  }
}

// ============================================
// Agent: Create task
// ============================================

export async function createTask(
  projectId: string,
  taskType: TaskType,
  params: Record<string, unknown> = {},
  options: { priority?: number; scheduledFor?: string; recurring?: string } = {}
): Promise<string | null> {
  if (!supabase) return null;

  const { data } = await supabase.from('agent_tasks').insert({
    project_id: projectId,
    task_type: taskType,
    params,
    priority: options.priority || 5,
    scheduled_for: options.scheduledFor || new Date().toISOString(),
    is_recurring: !!options.recurring,
    recurrence_rule: options.recurring || null,
    next_run_at: options.recurring ? new Date().toISOString() : null,
  }).select('id').single();

  return data?.id || null;
}

// ============================================
// Agent: Run all pending tasks for a project
// ============================================

export async function runPendingTasks(projectId?: string): Promise<{ executed: number; failed: number }> {
  if (!supabase) return { executed: 0, failed: 0 };

  let query = supabase
    .from('agent_tasks')
    .select('id')
    .eq('status', 'pending')
    .lte('scheduled_for', new Date().toISOString())
    .order('priority', { ascending: true })
    .order('scheduled_for', { ascending: true })
    .limit(10);

  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  const { data: tasks } = await query;
  if (!tasks || tasks.length === 0) return { executed: 0, failed: 0 };

  let executed = 0;
  let failed = 0;

  for (const task of tasks) {
    const result = await executeTask(task.id);
    if (result.success) executed++;
    else failed++;
  }

  return { executed, failed };
}

// ============================================
// Agent: Get project health summary
// ============================================

export async function getProjectHealth(projectId: string): Promise<Record<string, unknown> | null> {
  if (!supabase) return null;

  const ctx = await loadProjectContext(projectId);
  if (!ctx) return null;

  const project = ctx.project;
  const mix = project.content_mix as Record<string, number>;

  // Calculate actual content mix from history
  const actualMix: Record<string, number> = {};
  const total = ctx.postHistory.length || 1;
  ctx.postHistory.forEach(h => {
    actualMix[h.content_type] = ((actualMix[h.content_type] || 0) + 1) / total;
  });

  // KB completeness
  const categories = ['product', 'audience', 'usp', 'faq', 'case_study', 'general'];
  const presentCategories = [...new Set(ctx.kbEntries.map(e => e.category))];
  const missingCategories = categories.filter(c => !presentCategories.includes(c));

  // Recent quality scores
  const { data: recentScores } = await supabase
    .from('content_queue')
    .select('ai_scores')
    .eq('project_id', projectId)
    .not('ai_scores', 'is', null)
    .order('created_at', { ascending: false })
    .limit(10);

  const avgScore = recentScores && recentScores.length > 0
    ? recentScores.reduce((sum, p) => sum + ((p.ai_scores as { overall?: number })?.overall || 0), 0) / recentScores.length
    : null;

  // Determine health status
  let health: 'excellent' | 'good' | 'needs_attention' | 'critical' | 'idle' = 'idle';
  if (ctx.kbEntries.length === 0) health = 'critical';
  else if (missingCategories.length > 3) health = 'needs_attention';
  else if (avgScore && avgScore >= 8) health = 'excellent';
  else if (avgScore && avgScore >= 6) health = 'good';
  else if (ctx.postHistory.length > 0) health = 'good';

  return {
    health,
    kb_entries: ctx.kbEntries.length,
    kb_missing_categories: missingCategories,
    posts_total: ctx.postHistory.length,
    posts_recent: ctx.recentPosts.length,
    pending_tasks: ctx.pendingTasks,
    avg_quality_score: avgScore ? Math.round(avgScore * 10) / 10 : null,
    content_mix_actual: actualMix,
    content_mix_target: mix,
  };
}

// ============================================
// Helper: Calculate next run time
// ============================================

function calculateNextRun(rule: string): Date {
  const now = new Date();
  switch (rule) {
    case 'daily':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    case 'weekly_mon':
      return getNextDayOfWeek(1);
    case 'weekly_mon_wed_fri': {
      const today = now.getDay();
      if (today < 1) return getNextDayOfWeek(1);
      if (today < 3) return getNextDayOfWeek(3);
      if (today < 5) return getNextDayOfWeek(5);
      return getNextDayOfWeek(1);
    }
    case 'monthly':
      return new Date(now.getFullYear(), now.getMonth() + 1, 1, 9, 0);
    default:
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
  }
}

function getNextDayOfWeek(dayOfWeek: number): Date {
  const now = new Date();
  const result = new Date(now);
  result.setDate(now.getDate() + ((dayOfWeek + 7 - now.getDay()) % 7 || 7));
  result.setHours(9, 0, 0, 0);
  return result;
}
