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
import { buildContentPrompt, getPromptTemplate, getProjectPrompts, type PromptContext } from './prompt-builder';
import { generateVisualAssets } from '@/lib/visual/visual-agent';
import { findMatchingMedia, markMediaUsed } from '@/lib/ai/vision-engine';
import { getRelevantNews } from '@/lib/rss/fetcher';
import { getNextContentType } from './content-engine';
import { hugoEditorReview } from './hugo-editor';

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
      // Smart content type selection: use getNextContentType if not explicitly set
      const contentMix = (project.content_mix as Record<string, number>) || { educational: 0.66, soft_sell: 0.17, hard_sell: 0.17 };
      const contentType = (params.contentType as string) || await getNextContentType(project.id as string, contentMix);

      // ---- Style rules ----
      const styleRules = project.style_rules as Record<string, unknown>;
      if (styleRules && Object.keys(styleRules).length > 0) {
        parts.push('\n---\nPRAVIDLA FORMÁTU:');
        for (const [key, value] of Object.entries(styleRules)) {
          parts.push(`- ${key}: ${value}`);
        }
      }

      // ---- Content mix context for this generation ----
      parts.push(`\nAKTUÁLNÍ GENEROVÁNÍ: typ="${contentType}", platforma="${platform}"`);
      parts.push(`CÍLOVÝ MIX: ${JSON.stringify(contentMix)}`);
      parts.push('Generuj obsah odpovídající zadanému typu. Dodržuj cílový content mix.');

      // ---- Load per-project prompts (examples, identity, guardrails, etc.) ----
      const projectPrompts = await getProjectPrompts(project.id as string);
      if (projectPrompts.length > 0) {
        const byCategory = new Map<string, string[]>();
        for (const pp of projectPrompts) {
          if (!byCategory.has(pp.category)) byCategory.set(pp.category, []);
          byCategory.get(pp.category)!.push(pp.content);
        }

        // Inject per-project prompts in order
        const promptOrder = [
          'identity', 'communication', 'guardrail', 'business_rules',
          'content_strategy', 'topic_boundaries', 'cta_rules',
          'quality_criteria', 'personalization',
        ];
        for (const cat of promptOrder) {
          const entries = byCategory.get(cat);
          if (entries) {
            parts.push(`\n---\n[${cat.toUpperCase()}]:`);
            for (const entry of entries) parts.push(entry);
          }
        }

        // Platform-specific rules (only for current platform)
        for (const pp of projectPrompts.filter(p => p.category === 'platform_rules')) {
          if (pp.slug.includes(platform) || pp.slug === 'platform_rules') {
            parts.push(`\n---\n[PLATFORM RULES – ${platform.toUpperCase()}]:`);
            parts.push(pp.content);
          }
        }

        // Examples: CRITICAL for quality – these are the reference standard
        const examples = byCategory.get('examples');
        if (examples) {
          parts.push('\n---\nPŘÍKLADY DOBRÝCH A ŠPATNÝCH POSTŮ (toto je tvůj standard kvality):');
          parts.push('Studuj tyto příklady. Dobré posty = tvůj cíl. Špatné posty = čeho se vyvarovat.');
          parts.push('NEOPISUJ tyto příklady doslova. Jsou to VZORY stylu a kvality, ne šablony k opakování.');
          for (const ex of examples) parts.push(ex);
        }
      }

      // ---- Load ALL posts for dedup (including review!) ----
      if (supabase) {
        const { data: publishedPosts } = await supabase
          .from('content_queue')
          .select('text_content, content_type')
          .eq('project_id', project.id)
          .in('status', ['approved', 'sent', 'scheduled', 'published', 'review'])
          .order('created_at', { ascending: false })
          .limit(50);

        if (publishedPosts && publishedPosts.length > 0) {
          // Analyze used hooks to force diversity
          const usedHooks = publishedPosts.map(p => {
            const text = (p.text_content as string) || '';
            return text.split('\n')[0].substring(0, 80);
          });
          const usedTypes = publishedPosts.map(p => (p.content_type as string) || 'educational');
          const typeCounts: Record<string, number> = {};
          usedTypes.forEach(t => { typeCounts[t] = (typeCounts[t] || 0) + 1; });

          parts.push('\n---\nEXISTUJÍCÍ POSTY (tyto texty už EXISTUJÍ – NESMÍŠ je opakovat ani parafrázovat):');
          for (let i = 0; i < publishedPosts.length; i++) {
            const text = (publishedPosts[i].text_content as string) || '';
            const type = (publishedPosts[i].content_type as string) || '';
            parts.push(`${i + 1}. [${type}] "${text.substring(0, 200)}${text.length > 200 ? '...' : ''}"`);
          }
          parts.push(`\nSTATISTIKA TYPŮ: ${JSON.stringify(typeCounts)}`);
          parts.push(`\nPOUŽITÉ HOOKY (NESMÍŠ začínat stejně):`);
          for (const hook of usedHooks.slice(0, 20)) {
            parts.push(`- "${hook}"`);
          }
          parts.push('\nKAŽDÝ nový post MUSÍ být o JINÉM tématu, s JINÝM hookem, JINOU strukturou.');
          parts.push('Pokud všechny KB fakta už byly použity, najdi NOVÝ ÚHEL na stejné téma.');
        }
      }

      // ---- Contextual Pulse: inject relevant news ----
      try {
        const recentNews = await getRelevantNews(project.id as string, {
          limit: 5,
          hoursBack: 72,
          minRelevance: 0.3,
          onlyUnused: true,
        });
        if (recentNews.length > 0) {
          parts.push('\n---\nAKTUÁLNÍ NOVINKY (Contextual Pulse – můžeš na ně reagovat):');
          parts.push('Pokud je novinka relevantní k tématu postu, ZAKOMPONUJ ji přirozeně.');
          parts.push('Cituj zdroj (např. "Jak uvádí ČSÚ..." nebo "Podle dat Eurostatu...").');
          parts.push('Nereaguj na každou novinku – jen na ty, které přirozeně zapadají.');
          for (const news of recentNews) {
            parts.push(`\n[${news.source_name}] ${news.title} (${new Date(news.published_at).toLocaleDateString('cs-CZ')})`);
            if (news.summary) parts.push(`  Shrnutí: ${news.summary}`);
            if (news.link) parts.push(`  Zdroj: ${news.link}`);
          }
        }
      } catch {
        // News fetch failed, continue without
      }

      // ---- Load content pattern for structural variety ----
      if (supabase) {
        try {
          const { data: patterns } = await supabase
            .from('content_patterns')
            .select('id, name, structure_template, content_type')
            .eq('project_id', project.id)
            .eq('is_active', true);
          if (patterns && patterns.length > 0) {
            // Pick a pattern matching the content type, or random
            const matching = patterns.filter(p => !p.content_type || p.content_type === contentType);
            const pattern = matching.length > 0
              ? matching[Math.floor(Math.random() * matching.length)]
              : patterns[Math.floor(Math.random() * patterns.length)];
            parts.push(`\n---\nVZOR PŘÍSPĚVKU (dodržuj tuto strukturu):\n${pattern.structure_template}`);
          }
        } catch {
          // content_patterns table may not exist
        }
      }

      // ---- Creative instructions ----
      parts.push(`\n---\nGENERUJ příspěvek pro platformu: ${platform}`);
      parts.push(`Typ obsahu: ${contentType}`);

      parts.push(`\nKREATIVITA – POVINNÁ PRAVIDLA:
1. HOOK: Každý post MUSÍ začínat jinak. Střídej typy hooků:
   - Číslo/statistika ("1,37." / "20 736 Kč.")
   - Provokativní otázka ("Co když váš důchod nebude stačit?")
   - Kontrastní tvrzení ("Všichni mluví o úsporách. Nikdo o příjmech.")
   - Příběh/scénář ("Představte si, že je vám 65...")
   - Citát/výrok ("Průměrný Čech spoří 2 400 Kč měsíčně.")
   - Metafora ("Důchod je maraton, ne sprint.")
2. STRUKTURA: Střídej formáty – ne vždy číslo→kontext→řešení→CTA.
3. ÚHEL: Použij KB fakta, která NEBYLA v posledních postech.
4. ORIGINALITA: Neopakuj fráze z předchozích postů. Žádné "Matematika nečeká", "Žádná magie" pokud už byly použity.
5. HODNOTA: Každý post musí přinést NOVOU informaci nebo NOVÝ pohled.`);

      parts.push(`\nKVALITA: Post MUSÍ mít overall skóre >= ${MIN_QUALITY_SCORE}/10.
- creativity < 7 = AUTOMATICKY ZAMÍTNUTO a přegenerováno
- Buď k sobě přísný. Pokud post připomíná něco, co už bylo publikováno, sniž creativity.`);

      parts.push(`\nVrať POUZE JSON:
{
  "text": "Text příspěvku",
  "image_prompt": "Popis obrázku pro generování",
  "alt_text": "Alt text",
  "scores": {
    "creativity": 1-10,
    "tone_match": 1-10,
    "hallucination_risk": 1-10,
    "value_score": 1-10,
    "overall": 1-10
  }
}`);
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

// Hugo-Editor imported from shared module (hugo-editor.ts)
// to avoid circular dependency with content-engine

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
  const { data: runningData, error: runningError } = await supabase
    .from('agent_tasks')
    .update({ status: 'running', started_at: new Date().toISOString() })
    .eq('id', taskId)
    .select('id, status');

  await supabase.from('agent_log').insert({
    project_id: task.project_id,
    task_id: taskId,
    action: 'task_status_debug',
    details: {
      target_status: 'running',
      rows_affected: runningData?.length ?? 0,
      new_status: runningData?.[0]?.status ?? null,
      error: runningError?.message ?? null,
      error_code: runningError?.code ?? null,
    },
  });

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
      // Keep _resolved_content_type for saving, will be cleaned up after
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
      const platform = (task.params?.platform as string) || (ctx.project.platforms as string[])?.[0] || 'linkedin';
      // Read media_strategy: task params > project orchestrator_config > default 'auto'
      const orchConfig = (ctx.project.orchestrator_config as Record<string, unknown>) || {};
      const mediaStrategy = (task.params?.media_strategy as string)
        || (orchConfig.media_strategy as string)
        || 'auto';

      // Generate visual assets (chart/card/photo)
      let visualData: { visual_type: string; chart_url: string | null; card_url: string | null; image_prompt: string | null } = {
        visual_type: 'none', chart_url: null, card_url: null, image_prompt: (result.image_prompt as string) || null,
      };
      try {
        const visualIdentity = (ctx.project.visual_identity as Record<string, string>) || {};
        visualData = await generateVisualAssets({
          text: result.text as string,
          projectName: ctx.project.name as string,
          platform,
          visualIdentity,
          kbEntries: ctx.kbEntries,
        });
      } catch {
        // Visual generation failed, continue without
      }

      // ---- Media Library matching (pgvector) ----
      let matchedImageUrl: string | null = null;
      let matchedMediaId: string | null = null;
      if (mediaStrategy === 'auto') {
        try {
          const matches = await findMatchingMedia(task.project_id, result.text as string, {
            limit: 5,
            fileType: 'image',
            excludeRecentlyUsed: true,
          });
          if (matches.length > 0) {
            // Best match = highest similarity + least used
            const best = matches[0];
            matchedImageUrl = best.public_url;
            matchedMediaId = best.id;
            await markMediaUsed(best.id);
          }
        } catch {
          // Media matching failed, continue without
        }
      }

      // Determine final image: matched photo > chart > card
      const finalImageUrl = matchedImageUrl || null;

      // Determine post status: auto-publish or review
      const autoPublish = task.params?.auto_publish === true;
      const autoThreshold = (task.params?.auto_publish_threshold as number) || 8.5;
      const overallScore = scores?.overall || 0;
      let postStatus: string;
      if (overallScore < MIN_QUALITY_SCORE) {
        postStatus = 'rejected';
      } else if (autoPublish && overallScore >= autoThreshold) {
        postStatus = 'approved'; // Will be picked up by publish cron
      } else {
        postStatus = 'review';
      }

      // Resolve content type (same logic as prompt building)
      const resolvedContentType = (task.params?.contentType as string)
        || (result._resolved_content_type as string)
        || 'educational';

      // Save to content_queue – use only core columns first, add optional ones if available
      const coreInsert: Record<string, unknown> = {
        project_id: task.project_id,
        text_content: result.text as string,
        image_prompt: (result.image_prompt as string) || null,
        content_type: resolvedContentType,
        platforms: [platform],
        ai_scores: scores || {},
        status: postStatus,
        source: task.params?.human_topic ? 'human_priority' : 'ai_generated',
      };

      // Try full insert with all optional columns
      const fullInsert: Record<string, unknown> = {
        ...coreInsert,
        alt_text: (result.alt_text as string) || null,
        editor_review: result.editor_review || null,
        visual_type: matchedImageUrl ? 'matched_photo' : visualData.visual_type,
        chart_url: visualData.chart_url || null,
        card_url: visualData.card_url || null,
      };
      if (matchedImageUrl) fullInsert.image_url = matchedImageUrl;
      if (matchedMediaId) fullInsert.matched_media_id = matchedMediaId;

      const { error: queueError } = await supabase.from('content_queue').insert(fullInsert);

      // If full insert fails, retry with core columns only
      if (queueError) {
        console.error('content_queue full insert failed:', queueError.message);
        const { error: coreError } = await supabase.from('content_queue').insert(coreInsert);
        if (coreError) {
          console.error('content_queue core insert also failed:', coreError.message);
          // Log the failure
          await supabase.from('agent_log').insert({
            project_id: task.project_id,
            task_id: taskId,
            action: 'content_queue_insert_error',
            details: { full_error: queueError.message, core_error: coreError.message },
          });
        }
      }

      // Log media match result
      if (matchedImageUrl) {
        await supabase.from('agent_log').insert({
          project_id: task.project_id,
          task_id: taskId,
          action: 'media_matched',
          details: {
            media_id: matchedMediaId,
            image_url: matchedImageUrl,
            post_text_preview: (result.text as string).substring(0, 100),
          },
        });
      }
    }

    // Clean up internal fields before storing
    delete result._resolved_content_type;

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
    const { data: completedData, error: updateError } = await supabase.from('agent_tasks').update({
      status: 'completed',
      result,
      completed_at: new Date().toISOString(),
    }).eq('id', taskId).select('id, status');

    await supabase.from('agent_log').insert({
      project_id: task.project_id,
      task_id: taskId,
      action: 'task_completed_debug',
      details: {
        rows_affected: completedData?.length ?? 0,
        new_status: completedData?.[0]?.status ?? null,
        error: updateError?.message ?? null,
        error_code: updateError?.code ?? null,
        result_keys: Object.keys(result),
      },
    });

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
  // Resolve content type once (same logic as buildAgentPrompt)
  const contentMix = (ctx.project.content_mix as Record<string, number>) || { educational: 0.66, soft_sell: 0.17, hard_sell: 0.17 };
  const resolvedContentType = (params.contentType as string) || await getNextContentType(task.project_id as string, contentMix);
  let totalTokens = 0;
  let bestResult: Record<string, unknown> = {};
  let bestScore = 0;

  for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
    // Build prompt (uses per-project prompts if available)
    const prompt = await buildAgentPrompt('generate_content', ctx, {
      ...params,
      contentType: resolvedContentType,
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
    _resolved_content_type: resolvedContentType,
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
// Orchestrator Config Types
// ============================================

interface OrchestratorConfig {
  enabled: boolean;
  posting_frequency: 'daily' | '3x_week' | 'weekly' | '2x_daily' | 'custom';
  posting_times: string[];       // ["09:00", "15:00"]
  max_posts_per_day: number;
  content_strategy: string;      // "4-1-1"
  auto_publish: boolean;
  auto_publish_threshold: number; // min score for auto-publish
  timezone: string;              // "Europe/Prague"
  media_strategy: 'auto' | 'manual' | 'none';
  platforms_priority: string[];  // ordered platforms
  pause_weekends: boolean;
}

const DEFAULT_CONFIG: OrchestratorConfig = {
  enabled: true,
  posting_frequency: 'daily',
  posting_times: ['09:00', '15:00'],
  max_posts_per_day: 2,
  content_strategy: '4-1-1',
  auto_publish: false,
  auto_publish_threshold: 8.5,
  timezone: 'Europe/Prague',
  media_strategy: 'auto',
  platforms_priority: [],
  pause_weekends: false,
};

function getConfig(project: Record<string, unknown>): OrchestratorConfig {
  const raw = project.orchestrator_config as Partial<OrchestratorConfig> | null;
  return { ...DEFAULT_CONFIG, ...raw };
}

/**
 * Get current hour in project's timezone.
 */
function getProjectLocalHour(timezone: string): number {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', { hour: 'numeric', hour12: false, timeZone: timezone });
    return parseInt(formatter.format(now), 10);
  } catch {
    return new Date().getUTCHours() + 1; // fallback CET
  }
}

function getProjectLocalDay(timezone: string): number {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: timezone });
    const day = formatter.format(now);
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(day);
  } catch {
    return new Date().getDay();
  }
}

/**
 * Check if current time is within a posting window.
 * posting_times: ["09:00", "15:00"] → returns true if current hour matches any.
 */
function isInPostingWindow(config: OrchestratorConfig): boolean {
  const localHour = getProjectLocalHour(config.timezone);
  return config.posting_times.some(time => {
    const hour = parseInt(time.split(':')[0], 10);
    return localHour === hour;
  });
}

/**
 * Calculate required hours between posts based on frequency.
 */
function getPostingIntervalHours(frequency: string): number {
  switch (frequency) {
    case '2x_daily': return 8;
    case 'daily': return 20;
    case '3x_week': return 48;
    case 'weekly': return 144;
    default: return 20;
  }
}

// ============================================
// Auto-Scheduling: Per-project orchestrator
// ============================================

export async function autoScheduleProjects(): Promise<{ scheduled: number; projects_checked: number; skipped_reasons: Record<string, number> }> {
  if (!supabase) return { scheduled: 0, projects_checked: 0, skipped_reasons: {} };

  // Get all active projects with their config
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, platforms, is_active, orchestrator_config')
    .eq('is_active', true);

  if (!projects) return { scheduled: 0, projects_checked: 0, skipped_reasons: {} };

  let scheduled = 0;
  const skipped: Record<string, number> = {};
  const skip = (reason: string) => { skipped[reason] = (skipped[reason] || 0) + 1; };

  for (const project of projects) {
    const config = getConfig(project);

    // 1. Orchestrator disabled?
    if (!config.enabled) { skip('disabled'); continue; }

    // 2. Weekend pause?
    const localDay = getProjectLocalDay(config.timezone);
    if (config.pause_weekends && (localDay === 0 || localDay === 6)) {
      skip('weekend_pause'); continue;
    }

    // 3. In posting window? (only generate during configured hours)
    if (!isInPostingWindow(config)) { skip('outside_posting_window'); continue; }

    // 4. Already has pending/running tasks?
    const { count: pendingCount } = await supabase
      .from('agent_tasks')
      .select('id', { count: 'exact' })
      .eq('project_id', project.id)
      .in('status', ['pending', 'running']);

    if ((pendingCount || 0) > 0) { skip('has_pending_tasks'); continue; }

    // 5. Has KB entries?
    const { count: kbCount } = await supabase
      .from('knowledge_base')
      .select('id', { count: 'exact' })
      .eq('project_id', project.id)
      .eq('is_active', true);

    if ((kbCount || 0) === 0) { skip('no_kb'); continue; }

    // 6. Check posting interval (respect frequency)
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

    const requiredInterval = getPostingIntervalHours(config.posting_frequency);
    if (hoursSinceLastPost < requiredInterval) { skip('too_recent'); continue; }

    // 7. Check daily post limit
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const { count: todayCount } = await supabase
      .from('content_queue')
      .select('id', { count: 'exact' })
      .eq('project_id', project.id)
      .gte('created_at', todayStart.toISOString());

    if ((todayCount || 0) >= config.max_posts_per_day) { skip('daily_limit_reached'); continue; }

    // 8. Schedule content generation!
    const platforms = config.platforms_priority.length > 0
      ? config.platforms_priority
      : (project.platforms as string[]) || ['facebook'];

    const postsToGenerate = Math.min(
      config.max_posts_per_day - (todayCount || 0),
      platforms.length,
      2, // max 2 per cron cycle
    );

    for (let i = 0; i < postsToGenerate; i++) {
      const platform = platforms[i % platforms.length];
      await createTask(project.id, 'generate_content', {
        platform,
        auto_scheduled: true,
        media_strategy: config.media_strategy,
        auto_publish: config.auto_publish,
        auto_publish_threshold: config.auto_publish_threshold,
      }, { priority: 3 });
      scheduled++;
    }

    // Weekly: content mix analysis (Monday)
    if (localDay === 1 && hoursSinceLastPost < 168) {
      await createTask(project.id, 'analyze_content_mix', {}, { priority: 2 });
      scheduled++;
    }
  }

  // Log
  await supabase.from('agent_log').insert({
    action: 'auto_schedule',
    details: {
      projects_checked: projects.length,
      tasks_scheduled: scheduled,
      skipped_reasons: skipped,
      timestamp: new Date().toISOString(),
    },
  });

  return { scheduled, projects_checked: projects.length, skipped_reasons: skipped };
}

// ============================================
// Agent: Run all pending tasks (Cron entry point)
// ============================================

export async function runPendingTasks(projectId?: string): Promise<{
  executed: number;
  failed: number;
  skipped: number;
  auto_scheduled: number;
}> {
  if (!supabase) return { executed: 0, failed: 0, skipped: 0, auto_scheduled: 0 };

  // Step 0: Recover stuck 'running' tasks (older than 5 min → reset to failed)
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  await supabase
    .from('agent_tasks')
    .update({ status: 'failed', error_message: 'Timeout – task stuck in running state', completed_at: new Date().toISOString() })
    .eq('status', 'running')
    .lt('started_at', fiveMinAgo);

  // Step 1: Auto-schedule if no projectId specified (full cron run)
  let autoScheduled = 0;
  if (!projectId) {
    const scheduleResult = await autoScheduleProjects();
    autoScheduled = scheduleResult.scheduled;
  }

  // Step 2: Run pending tasks (priority DESC = human topics first)
  let query = supabase
    .from('agent_tasks')
    .select('id, priority, project_id, task_type')
    .eq('status', 'pending')
    .lte('scheduled_for', new Date().toISOString())
    .order('priority', { ascending: false }) // HIGH priority first (10 = human)
    .order('scheduled_for', { ascending: true })
    .limit(CRON_BATCH_LIMIT);

  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  const { data: tasks } = await query;
  if (!tasks || tasks.length === 0) return { executed: 0, failed: 0, skipped: 0, auto_scheduled: autoScheduled };

  let executed = 0;
  let failed = 0;
  let skipped = 0;

  // Track daily generate_content count per project to enforce limits
  const dailyGenerateCounts: Record<string, number> = {};
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  for (const task of tasks) {
    // Enforce daily limit for generate_content tasks
    if (task.task_type === 'generate_content') {
      const pid = task.project_id;

      // Lazy-load today's count for this project
      if (dailyGenerateCounts[pid] === undefined) {
        const { count } = await supabase
          .from('content_queue')
          .select('id', { count: 'exact' })
          .eq('project_id', pid)
          .gte('created_at', todayStart.toISOString());
        dailyGenerateCounts[pid] = count || 0;
      }

      // Get project's max_posts_per_day (default 3)
      const { data: proj } = await supabase
        .from('projects')
        .select('orchestrator_config')
        .eq('id', pid)
        .single();
      const maxPerDay = (proj?.orchestrator_config as Record<string, unknown>)?.max_posts_per_day as number || 3;

      if (dailyGenerateCounts[pid] >= maxPerDay) {
        // Skip this task – daily limit reached
        skipped++;
        continue;
      }

      // Increment counter
      dailyGenerateCounts[pid]++;
    }

    const result = await executeTask(task.id);
    if (result.success) executed++;
    else failed++;
  }

  return { executed, failed, skipped, auto_scheduled: autoScheduled };
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
