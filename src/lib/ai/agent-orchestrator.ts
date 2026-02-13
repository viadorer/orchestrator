/**
 * Agent Orchestrator v2.0 – Autonomní Hugo
 * 
 * Hugo jako plně autonomní agent:
 * 1. Auto-scheduling – sám plánuje tasks pro projekty s prázdným kalendářem
 * 2. Auto-retry – skóre < 7 → přegenerovat (max 3 pokusy)
 * 3. Hugo-Editor – self-correction agent (druhý AI průchod)
 * 4. Feedback Loop – úpravy v Review se ukládají jako learning
 * 5. Priority Route – tvé témata mají priority 10, okamžitě přeruší evergreen
 * 
 * Služby agenta:
 * 1. Content Services - generování postů, plánování týdne
 * 2. Quality Services - self-rating, dedup, sentiment check, self-correction
 * 3. Strategy Services - content mix analýza, topic suggestions, KB gap analysis
 * 4. Publishing Services - scheduling, optimální časy
 */

import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { supabase } from '@/lib/supabase/client';
import { buildContentPrompt, getPromptTemplate, type PromptContext } from './prompt-builder';

// ============================================
// Constants
// ============================================

const MIN_QUALITY_SCORE = 7;
const MAX_RETRY_ATTEMPTS = 3;
const CRON_BATCH_LIMIT = 20;
const HUMAN_PRIORITY = 10;

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
  is_recurring?: boolean;
  recurrence_rule?: string;
}

export interface ProjectContext {
  project: Record<string, unknown>;
  kbEntries: Array<{ id: string; category: string; title: string; content: string }>;
  recentPosts: Array<{ text_content: string; content_type: string; created_at: string }>;
  postHistory: Array<{ content_type: string; posted_at: string }>;
  pendingTasks: number;
  feedbackHistory: Array<{ original_text: string; edited_text: string; feedback_note: string }>;
}

// ============================================
// Core: Load project context for agent
// ============================================

async function loadProjectContext(projectId: string): Promise<ProjectContext | null> {
  if (!supabase) return null;

  const [projectRes, kbRes, recentRes, historyRes, tasksRes, feedbackRes] = await Promise.all([
    supabase.from('projects').select('*').eq('id', projectId).single(),
    supabase.from('knowledge_base').select('id, category, title, content').eq('project_id', projectId).eq('is_active', true),
    supabase.from('content_queue').select('text_content, content_type, created_at').eq('project_id', projectId).in('status', ['approved', 'sent', 'scheduled']).order('created_at', { ascending: false }).limit(10),
    supabase.from('post_history').select('content_type, posted_at').eq('project_id', projectId).order('posted_at', { ascending: false }).limit(20),
    supabase.from('agent_tasks').select('id', { count: 'exact' }).eq('project_id', projectId).in('status', ['pending', 'running']),
    // Feedback loop: load recent human edits for learning
    supabase.from('content_queue')
      .select('text_content, edited_text, feedback_note')
      .eq('project_id', projectId)
      .not('edited_text', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(5),
  ]);

  if (!projectRes.data) return null;

  return {
    project: projectRes.data,
    kbEntries: kbRes.data || [],
    recentPosts: recentRes.data || [],
    postHistory: historyRes.data || [],
    pendingTasks: tasksRes.count || 0,
    feedbackHistory: (feedbackRes.data || []).map((f: Record<string, unknown>) => ({
      original_text: (f.text_content as string) || '',
      edited_text: (f.edited_text as string) || '',
      feedback_note: (f.feedback_note as string) || '',
    })),
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

  // 10. FEEDBACK LOOP – Human edits as learning context
  if (ctx.feedbackHistory.length > 0) {
    parts.push('\n---\nFEEDBACK OD ADMINA (uč se z těchto úprav):');
    for (const fb of ctx.feedbackHistory) {
      parts.push(`PŮVODNÍ: "${fb.original_text.substring(0, 100)}..."`);
      parts.push(`UPRAVENO NA: "${fb.edited_text.substring(0, 100)}..."`);
      if (fb.feedback_note) parts.push(`POZNÁMKA: ${fb.feedback_note}`);
      parts.push('---');
    }
    parts.push('Poučení: Přizpůsob styl a obsah podle těchto úprav. Opakuj vzory, které admin preferuje.');
  }

  // 11. Task-specific prompt from global templates
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

  // 12. Human topic injection (Priority Route)
  if (params.human_topic) {
    parts.push(`\n---\n🔴 PRIORITNÍ TÉMA OD ADMINA (priority ${HUMAN_PRIORITY}):`);
    parts.push(`Téma: ${params.human_topic}`);
    if (params.human_notes) parts.push(`Poznámky: ${params.human_notes}`);
    parts.push('TOTO TÉMA MÁ ABSOLUTNÍ PŘEDNOST. Vytvoř post přesně na toto téma.');
  }

  // 13. Task-specific instructions based on type
  switch (taskType) {
    case 'generate_content': {
      const platform = (params.platform as string) || (project.platforms as string[])?.[0] || 'linkedin';
      const contentType = params.contentType as string;
      parts.push(`\nGENERUJ příspěvek pro platformu: ${platform}`);
      if (contentType) parts.push(`Typ obsahu: ${contentType}`);
      parts.push(`\nKVALITA: Post MUSÍ mít overall skóre >= ${MIN_QUALITY_SCORE}/10. Pokud ne, bude automaticky přegenerován.`);
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
    case 'generate_week_plan': {
      parts.push('\nNAPLÁNUJ obsah na celý týden (Po-Pá). Pro každý den navrhni post pro každou platformu.');
      parts.push('Zohledni content mix (4-1-1), sezónnost, a KB fakta.');
      parts.push('Vrať JSON: {"week_plan": [{"day": "monday", "posts": [{"platform": "...", "content_type": "...", "topic": "...", "hook": "..."}]}]}');
      break;
    }
    case 'suggest_topics': {
      parts.push('\nNAVRHNI 5-10 témat pro příspěvky na základě KB, sezóny a content mixu.');
      parts.push('Vrať JSON: {"topics": [{"title": "...", "content_type": "...", "platform": "...", "reasoning": "...", "priority": 1-10}]}');
      break;
    }
    case 'kb_gap_analysis': {
      parts.push('\nANALYZUJ Knowledge Base a najdi mezery. Co chybí pro kvalitní obsah?');
      parts.push('Vrať JSON: {"gaps": [{"category": "...", "description": "...", "importance": "high/medium/low"}], "recommendations": [...]}');
      break;
    }
  }

  return parts.join('\n');
}

// ============================================
// Hugo-Editor: Self-correction (2nd AI pass)
// ============================================

async function hugoEditorReview(
  text: string,
  ctx: ProjectContext,
  platform: string
): Promise<{ improved_text: string; editor_scores: Record<string, number>; changes: string[] }> {
  const project = ctx.project;
  const mood = project.mood_settings as Record<string, string>;

  const editorPrompt = `Jsi Hugo-Editor – kontrolor kvality obsahu. Tvůj úkol je zkontrolovat a VYLEPŠIT tento post.

PROJEKT: ${project.name}
PLATFORMA: ${platform}
TÓN: ${mood?.tone || 'professional'} | ENERGIE: ${mood?.energy || 'medium'} | STYL: ${mood?.style || 'informative'}

PŮVODNÍ POST:
"""
${text}
"""

KONTROLNÍ SEZNAM:
1. HOOK: Je první věta dostatečně silná? Zastaví scrollování?
2. HODNOTA: Přináší post konkrétní hodnotu čtenáři?
3. AUTENTICITA: Zní to jako člověk, ne jako AI? Žádné generické fráze?
4. STRUKTURA: Je vizuálně přehledné? Krátké odstavce?
5. CTA: Je výzva k akci přirozená?
6. GUARDRAILS: Neporušuje žádná pravidla projektu?
7. FAKTA: Jsou všechna tvrzení podložená KB?

${ctx.feedbackHistory.length > 0 ? `
FEEDBACK OD ADMINA (respektuj tyto preference):
${ctx.feedbackHistory.map(fb => `- Původní: "${fb.original_text.substring(0, 80)}..." → Upraveno: "${fb.edited_text.substring(0, 80)}..."`).join('\n')}
` : ''}

INSTRUKCE:
- Pokud je post dobrý (skóre 8+), vrať ho beze změny.
- Pokud má slabiny, PŘEPIŠ ho a vylepši.
- NIKDY nezhoršuj kvalitu.

Vrať JSON:
{
  "improved_text": "Vylepšený text postu (nebo původní pokud je dobrý)",
  "editor_scores": {"hook": N, "value": N, "authenticity": N, "structure": N, "cta": N, "overall": N},
  "changes": ["Popis změny 1", "Popis změny 2"] 
}`;

  const { text: rawResponse } = await generateText({
    model: google('gemini-2.0-flash'),
    prompt: editorPrompt,
    temperature: 0.3,
  });

  try {
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch {
    // Editor failed, return original
  }

  return {
    improved_text: text,
    editor_scores: { overall: 7 },
    changes: ['Editor review failed, using original'],
  };
}

// ============================================
// Parse AI response to JSON
// ============================================

function parseAIResponse(rawResponse: string): Record<string, unknown> {
  try {
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    const arrayMatch = rawResponse.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      return { items: JSON.parse(arrayMatch[0]) };
    }
  } catch {
    // Parse failed
  }
  return { raw_response: rawResponse };
}

// ============================================
// Agent: Execute task (with auto-retry + editor)
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

    let result: Record<string, unknown>;
    let totalTokens = 0;
    let attempts = 0;

    // ---- GENERATE CONTENT with auto-retry + editor ----
    if (task.task_type === 'generate_content') {
      result = await generateContentWithRetry(task, ctx);
      attempts = (result._attempts as number) || 1;
      totalTokens = (result._total_tokens as number) || 0;
      delete result._attempts;
      delete result._total_tokens;
    } else {
      // ---- OTHER TASK TYPES ----
      const prompt = await buildAgentPrompt(task.task_type, ctx, task.params || {});

      const { text: rawResponse, usage } = await generateText({
        model: google('gemini-2.0-flash'),
        prompt,
        temperature: task.task_type.includes('generate') ? 0.8 : 0.4,
      });

      totalTokens = usage?.totalTokens || 0;
      result = parseAIResponse(rawResponse);
    }

    // ---- Post-processing: save to content_queue ----
    if (task.task_type === 'generate_content' && result.text) {
      const scores = result.scores as Record<string, number> | undefined;
      await supabase.from('content_queue').insert({
        project_id: task.project_id,
        text_content: result.text as string,
        image_prompt: (result.image_prompt as string) || null,
        alt_text: (result.alt_text as string) || null,
        content_type: (task.params?.contentType as string) || 'educational',
        platforms: [(task.params?.platform as string) || (ctx.project.platforms as string[])?.[0] || 'linkedin'],
        ai_scores: scores || {},
        status: (scores?.overall || 0) >= MIN_QUALITY_SCORE ? 'review' : 'rejected',
        source: task.params?.human_topic ? 'human_priority' : 'ai_generated',
        editor_review: result.editor_review || null,
      });
    }

    // ---- Log ----
    await supabase.from('agent_log').insert({
      project_id: task.project_id,
      task_id: taskId,
      action: `task_${task.task_type}`,
      details: {
        result_summary: typeof result.text === 'string' ? result.text.substring(0, 200) : null,
        attempts,
        editor_used: !!result.editor_review,
        human_priority: !!task.params?.human_topic,
      },
      tokens_used: totalTokens,
      model_used: 'gemini-2.0-flash',
    });

    // ---- Mark completed ----
    await supabase.from('agent_tasks').update({
      status: 'completed',
      result,
      completed_at: new Date().toISOString(),
    }).eq('id', taskId);

    // ---- Handle recurring ----
    if (task.is_recurring && task.recurrence_rule) {
      const nextRun = calculateNextRun(task.recurrence_rule);
      await supabase.from('agent_tasks').insert({
        project_id: task.project_id,
        task_type: task.task_type,
        params: task.params,
        priority: task.priority,
        scheduled_for: nextRun.toISOString(),
        is_recurring: true,
        recurrence_rule: task.recurrence_rule,
        next_run_at: nextRun.toISOString(),
      });
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
// Generate content with auto-retry + Hugo-Editor
// ============================================

async function generateContentWithRetry(
  task: Record<string, unknown>,
  ctx: ProjectContext,
): Promise<Record<string, unknown>> {
  const params = (task.params as Record<string, unknown>) || {};
  const platform = (params.platform as string) || (ctx.project.platforms as string[])?.[0] || 'linkedin';
  let totalTokens = 0;
  let bestResult: Record<string, unknown> = {};
  let bestScore = 0;

  for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
    // Build prompt (uses per-project prompts if available)
    const prompt = await buildAgentPrompt('generate_content', ctx, {
      ...params,
      _attempt: attempt,
      _previous_score: bestScore > 0 ? bestScore : undefined,
    });

    const { text: rawResponse, usage } = await generateText({
      model: google('gemini-2.0-flash'),
      prompt,
      temperature: 0.7 + (attempt * 0.05), // Slightly increase creativity on retries
    });

    totalTokens += usage?.totalTokens || 0;
    const result = parseAIResponse(rawResponse);
    const scores = result.scores as Record<string, number> | undefined;
    const overall = scores?.overall || 0;

    // Track best result
    if (overall > bestScore) {
      bestScore = overall;
      bestResult = result;
    }

    // If score >= threshold, pass to Hugo-Editor for final polish
    if (overall >= MIN_QUALITY_SCORE) {
      // Hugo-Editor: self-correction pass
      const editorResult = await hugoEditorReview(
        result.text as string,
        ctx,
        platform,
      );
      totalTokens += 500; // Approximate editor tokens

      // Use editor's improved version if it's better
      if (editorResult.editor_scores.overall >= overall) {
        bestResult = {
          ...result,
          text: editorResult.improved_text,
          scores: { ...scores, ...editorResult.editor_scores },
          editor_review: {
            changes: editorResult.changes,
            original_score: overall,
            editor_score: editorResult.editor_scores.overall,
          },
        };
      }

      break; // Quality threshold met
    }

    // Log retry
    if (supabase && attempt < MAX_RETRY_ATTEMPTS) {
      await supabase.from('agent_log').insert({
        project_id: task.project_id as string,
        task_id: task.id as string,
        action: 'auto_retry',
        details: {
          attempt,
          score: overall,
          threshold: MIN_QUALITY_SCORE,
          reason: `Score ${overall} < ${MIN_QUALITY_SCORE}, retrying (${attempt}/${MAX_RETRY_ATTEMPTS})`,
        },
      });
    }
  }

  return {
    ...bestResult,
    _attempts: Math.min(MAX_RETRY_ATTEMPTS, (bestScore >= MIN_QUALITY_SCORE ? 1 : MAX_RETRY_ATTEMPTS)),
    _total_tokens: totalTokens,
  };
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
// Priority Route: Human topic injection
// ============================================

export async function createHumanPriorityTask(
  projectId: string,
  topic: string,
  notes?: string,
  platform?: string,
  contentType?: string,
): Promise<string | null> {
  return createTask(
    projectId,
    'generate_content',
    {
      human_topic: topic,
      human_notes: notes || null,
      platform: platform || 'linkedin',
      contentType: contentType || 'educational',
    },
    { priority: HUMAN_PRIORITY }
  );
}

// ============================================
// Feedback Loop: Save human edit as learning
// ============================================

export async function saveFeedback(
  contentId: string,
  editedText: string,
  feedbackNote?: string,
): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase
    .from('content_queue')
    .update({
      edited_text: editedText,
      feedback_note: feedbackNote || null,
      status: 'approved',
    })
    .eq('id', contentId);

  return !error;
}

// ============================================
// Auto-Scheduling: Hugo plans tasks for idle projects
// ============================================

export async function autoScheduleProjects(): Promise<{ scheduled: number; projects_checked: number }> {
  if (!supabase) return { scheduled: 0, projects_checked: 0 };

  // Get all active projects
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, platforms, is_active')
    .eq('is_active', true);

  if (!projects) return { scheduled: 0, projects_checked: 0 };

  let scheduled = 0;

  for (const project of projects) {
    // Check if project has pending/running tasks already
    const { count: pendingCount } = await supabase
      .from('agent_tasks')
      .select('id', { count: 'exact' })
      .eq('project_id', project.id)
      .in('status', ['pending', 'running']);

    if ((pendingCount || 0) > 0) continue; // Already has work

    // Check if project has KB entries (no point generating without KB)
    const { count: kbCount } = await supabase
      .from('knowledge_base')
      .select('id', { count: 'exact' })
      .eq('project_id', project.id)
      .eq('is_active', true);

    if ((kbCount || 0) === 0) continue; // No KB, skip

    // Check last post date
    const { data: lastPost } = await supabase
      .from('content_queue')
      .select('created_at')
      .eq('project_id', project.id)
      .order('created_at', { ascending: false })
      .limit(1);

    const lastPostDate = lastPost?.[0]?.created_at;
    const hoursSinceLastPost = lastPostDate
      ? (Date.now() - new Date(lastPostDate).getTime()) / (1000 * 60 * 60)
      : 999;

    // If no post in last 24h, schedule content generation
    if (hoursSinceLastPost > 24) {
      const platforms = (project.platforms as string[]) || ['linkedin'];
      for (const platform of platforms.slice(0, 2)) { // Max 2 platforms per cycle
        await createTask(project.id, 'generate_content', {
          platform,
          auto_scheduled: true,
        }, { priority: 3 }); // Low priority (human topics = 10)
        scheduled++;
      }
    }

    // Weekly: schedule content mix analysis (every Monday)
    const today = new Date();
    if (today.getDay() === 1 && hoursSinceLastPost < 168) { // Monday + had posts this week
      await createTask(project.id, 'analyze_content_mix', {}, { priority: 2 });
      scheduled++;
    }
  }

  // Log auto-scheduling run
  await supabase.from('agent_log').insert({
    action: 'auto_schedule',
    details: {
      projects_checked: projects.length,
      tasks_scheduled: scheduled,
      timestamp: new Date().toISOString(),
    },
  });

  return { scheduled, projects_checked: projects.length };
}

// ============================================
// Agent: Run all pending tasks (Cron entry point)
// ============================================

export async function runPendingTasks(projectId?: string): Promise<{
  executed: number;
  failed: number;
  auto_scheduled: number;
}> {
  if (!supabase) return { executed: 0, failed: 0, auto_scheduled: 0 };

  // Step 1: Auto-schedule if no projectId specified (full cron run)
  let autoScheduled = 0;
  if (!projectId) {
    const scheduleResult = await autoScheduleProjects();
    autoScheduled = scheduleResult.scheduled;
  }

  // Step 2: Run pending tasks (priority DESC = human topics first)
  let query = supabase
    .from('agent_tasks')
    .select('id, priority')
    .eq('status', 'pending')
    .lte('scheduled_for', new Date().toISOString())
    .order('priority', { ascending: false }) // HIGH priority first (10 = human)
    .order('scheduled_for', { ascending: true })
    .limit(CRON_BATCH_LIMIT);

  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  const { data: tasks } = await query;
  if (!tasks || tasks.length === 0) return { executed: 0, failed: 0, auto_scheduled: autoScheduled };

  let executed = 0;
  let failed = 0;

  for (const task of tasks) {
    const result = await executeTask(task.id);
    if (result.success) executed++;
    else failed++;
  }

  return { executed, failed, auto_scheduled: autoScheduled };
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

  // Prompt templates count
  const { count: promptCount } = await supabase
    .from('project_prompt_templates')
    .select('id', { count: 'exact' })
    .eq('project_id', projectId)
    .eq('is_active', true);

  // Determine health status
  let health: 'excellent' | 'good' | 'needs_attention' | 'critical' | 'idle' = 'idle';
  if (ctx.kbEntries.length === 0) health = 'critical';
  else if ((promptCount || 0) === 0) health = 'needs_attention';
  else if (missingCategories.length > 3) health = 'needs_attention';
  else if (avgScore && avgScore >= 8) health = 'excellent';
  else if (avgScore && avgScore >= 6) health = 'good';
  else if (ctx.postHistory.length > 0) health = 'good';

  return {
    health,
    kb_entries: ctx.kbEntries.length,
    kb_missing_categories: missingCategories,
    prompt_templates: promptCount || 0,
    posts_total: ctx.postHistory.length,
    posts_recent: ctx.recentPosts.length,
    pending_tasks: ctx.pendingTasks,
    avg_quality_score: avgScore ? Math.round(avgScore * 10) / 10 : null,
    content_mix_actual: actualMix,
    content_mix_target: mix,
    feedback_entries: ctx.feedbackHistory.length,
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
