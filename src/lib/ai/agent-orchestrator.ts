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
import { randomUUID } from 'crypto';
import { supabase } from '@/lib/supabase/client';
import { buildContentPrompt, getPromptTemplate, getProjectPrompts, type PromptContext } from './prompt-builder';
import { generateVisualAssets } from '@/lib/visual/visual-agent';
import { getRelevantNews } from '@/lib/rss/fetcher';
import { getNextPlatformContentType, buildMixStatusBlock } from './content-engine';
import { hugoEditorReview } from './hugo-editor';
import { getDefaultImageSpec, buildPlatformPromptBlock, PLATFORM_LIMITS, type ContentType } from '@/lib/platforms';

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
  | 'performance_report'
  | 'auto_enrich_kb'
  | 'cross_project_dedup'
  | 'generate_ab_variants'
  | 'image_prompt_review'
  | 'prompt_quality_audit'
  | 'engagement_learning'
  | 'visual_consistency_audit'
  | 'aio_schema_inject'
  | 'aio_visibility_audit'
  | 'aio_entity_audit';

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

  // 11. Agent Memory – context from previous analyses
  if (supabase) {
    try {
      const { data: memories } = await supabase
        .from('agent_memory')
        .select('memory_type, content, updated_at')
        .eq('project_id', project.id)
        .order('updated_at', { ascending: false });

      if (memories && memories.length > 0) {
        parts.push('\n---\nAGENT MEMORY (tvé předchozí analýzy a poznatky):');
        for (const mem of memories) {
          const age = Math.round((Date.now() - new Date(mem.updated_at).getTime()) / (1000 * 60 * 60));
          parts.push(`\n[${mem.memory_type}] (před ${age}h):`);
          const content = mem.content as Record<string, unknown>;
          // Compact summary per type
          switch (mem.memory_type) {
            case 'kb_gaps':
              if (content.suggestions) parts.push(`  Doporučení: ${JSON.stringify(content.suggestions)}`);
              if (content.completeness_score) parts.push(`  Kompletnost KB: ${content.completeness_score}/10`);
              break;
            case 'mix_correction':
              if (content.next_type) parts.push(`  Doporučený další typ: ${content.next_type}`);
              if (content.recommendation) parts.push(`  Doporučení: ${JSON.stringify(content.recommendation)}`);
              break;
            case 'performance_insights':
              if (content.summary) parts.push(`  Shrnutí: ${content.summary}`);
              if (content.recommendations) parts.push(`  Doporučení: ${JSON.stringify(content.recommendations)}`);
              break;
            case 'schedule_optimization':
              if (content.best_times) parts.push(`  Nejlepší časy: ${JSON.stringify(content.best_times)}`);
              break;
            case 'week_plan':
              parts.push(`  Aktuální plán: ${JSON.stringify(content.plan)}`);
              break;
            case 'suggested_topics':
              parts.push(`  Navržená témata: ${JSON.stringify(content.topics)}`);
              break;
            case 'sentiment_report':
              if (content.issues) parts.push(`  Problémy: ${JSON.stringify(content.issues)}`);
              break;
            case 'feedback_digest': {
              const suggestions = content.suggestions as Array<Record<string, unknown>>;
              if (suggestions && suggestions.length > 0) {
                parts.push(`  Feedback vzory (z admin editů):`);
                for (const s of suggestions) {
                  parts.push(`  - [${s.type}] ${s.title}: ${s.content}`);
                }
                parts.push(`  POVINNĚ dodržuj tato pravidla z feedback digestu!`);
              }
              break;
            }
            case 'kb_enrichment':
              if (content.inserted) parts.push(`  Naposledy přidáno ${content.inserted} KB záznamů`);
              break;
            case 'image_prompt_tips': {
              const tips = content.tips as string[];
              if (tips && tips.length > 0) {
                parts.push(`  Tipy pro image prompty (z review):`);
                for (const tip of tips) parts.push(`  - ${tip}`);
                parts.push(`  Průměrné zlepšení: ${content.avg_original_score} → ${content.avg_improved_score}`);
              }
              break;
            }
            case 'prompt_audit':
              parts.push(`  Kvalita prompt systému: ${content.overall_score}/10`);
              if (content.recommendations) parts.push(`  Doporučení: ${JSON.stringify(content.recommendations)}`);
              break;
            case 'engagement_insights': {
              const ins = content.insights as Record<string, unknown>;
              if (ins) {
                parts.push(`  Nejlepší typ obsahu: ${ins.best_content_type}`);
                parts.push(`  Nejlepší hook: ${ins.best_hook_type}`);
                parts.push(`  Nejlepší vizuál: ${ins.best_visual}`);
                parts.push(`  Optimální délka: ${ins.optimal_length}`);
              }
              if (content.visual_strategy) parts.push(`  Vizuální strategie: ${content.visual_strategy}`);
              break;
            }
            case 'visual_audit':
              parts.push(`  Konzistence: ${content.consistency_score}/10, Brand fit: ${content.brand_fit_score}/10`);
              if (content.rules) parts.push(`  Pravidla: ${JSON.stringify(content.rules)}`);
              break;
            case 'optimal_posting_times':
              if (content.times) parts.push(`  Optimální časy: ${JSON.stringify(content.times)}`);
              break;
            case 'competitor_insights':
              if (content.differentiators) parts.push(`  Diferenciátory: ${JSON.stringify(content.differentiators)}`);
              if (content.content_opportunities) parts.push(`  Příležitosti: ${JSON.stringify(content.content_opportunities)}`);
              break;
            case 'dedup_report':
              parts.push(`  Unikátnost: ${content.is_unique ? 'OK' : 'DUPLICITA'}, max similarity: ${content.max_similarity}`);
              break;
            default:
              parts.push(`  ${JSON.stringify(content).substring(0, 200)}`);
          }
        }
        parts.push('\nVyužij tyto poznatky při generování. Reaguj na doporučení z předchozích analýz.');
      }
    } catch {
      // agent_memory table may not exist yet
    }
  }

  // 12. Task-specific prompt from global templates
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

      // ---- Platform-aware content type selection ----
      // Priority: explicit param > platform mix tracking > legacy fallback
      const legacyMix = (project.content_mix as Record<string, number>) || null;
      const orchConfig = (project.orchestrator_config as Record<string, unknown>) || {};
      const platformContentMix = (orchConfig.platform_content_mix as Record<string, Record<string, number>>) || {};
      const platformOverride = (platformContentMix[platform] as Partial<Record<ContentType, number>>) || null;

      let contentType: string;
      let mixStatusBlock = '';

      if (params.contentType) {
        // Explicit type from human/task param — respect it, but still show mix status
        contentType = params.contentType as string;
        const mixStatus = await getNextPlatformContentType(
          project.id as string, platform, legacyMix, platformOverride,
        );
        mixStatusBlock = buildMixStatusBlock(mixStatus);
      } else {
        // Auto-select based on platform mix tracking
        const mixStatus = await getNextPlatformContentType(
          project.id as string, platform, legacyMix, platformOverride,
        );
        contentType = mixStatus.chosenType;
        mixStatusBlock = buildMixStatusBlock(mixStatus);
      }

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
      parts.push(mixStatusBlock);
      parts.push('Generuj obsah odpovídající doporučenému typu. Dodržuj týdenní content mix.');

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

      // ---- Platform-specific content generation specs ----
      parts.push(buildPlatformPromptBlock(platform));

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

      // ---- Platform-aware output format ----
      const platformLimits = PLATFORM_LIMITS[platform];
      const defaultImg = getDefaultImageSpec(platform);
      const imgSpecExample = defaultImg
        ? `{ "width": ${defaultImg.width}, "height": ${defaultImg.height}, "aspectRatio": "${defaultImg.aspectRatio}" }`
        : '{ "width": 1200, "height": 630, "aspectRatio": "1.91:1" }';

      const hashtagRule = platformLimits?.contentSpec.hashtagPlacement === 'none'
        ? '- ŽÁDNÉ hashtagy (#) v textu'
        : platformLimits?.contentSpec.hashtagPlacement === 'inline'
          ? `- Hashtagy: max ${platformLimits.maxHashtags} INLINE v textu (ne na konci)`
          : `- Hashtagy: max ${platformLimits?.maxHashtags || 5} na KONCI textu (ne v textu)`;

      parts.push(`\nVrať POUZE JSON:
{
  "text": "Text příspěvku optimalizovaný pro ${platform}. Délka: ${platformLimits?.optimalChars || 500} znaků.",
  "image_prompt": "DETAILED English scene description for photo generation",
  "image_spec": ${imgSpecExample},
  "alt_text": "Alt text pro obrázek v češtině",
  "scores": {
    "creativity": 1-10,
    "tone_match": 1-10,
    "hallucination_risk": 1-10,
    "value_score": 1-10,
    "overall": 1-10
  }
}

DŮLEŽITÉ PRAVIDLO PRO TEXT:
${hashtagRule}
- ABSOLUTNĚ ŽÁDNÉ emotikony/emoji v textu
- ŽÁDNÉ URL odkazy
- Text MUSÍ mít délku kolem ${platformLimits?.optimalChars || 500} znaků (max ${platformLimits?.maxChars || 2200})
- Hook MUSÍ být v prvních ${platformLimits?.visibleChars || 200} znacích (to je vše co uživatel vidí)${platform === 'x' ? `

⚠️ TVRDÝ LIMIT PRO X (TWITTER):
- Text MUSÍ mít MAXIMÁLNĚ 280 znaků včetně mezer.
- NEOŘEZÁVEJ delší text — piš ROVNOU krátce a úderně.
- Jedna silná myšlenka, žádné omáčky. Každé slovo musí mít váhu.
- Pokud se myšlenka nevejde do 280 znaků, zjednoduš ji — NIKDY nepřekračuj limit.
- Před odesláním si SPOČÍTEJ znaky. Pokud text > 280 znaků, PŘEPIŠ ho kratší.` : ''}

PRAVIDLA PRO image_prompt (KRITICKÉ):
- MUSÍ být v angličtině
- Piš jako FILMOVÝ REŽISÉR: konkrétní scéna, kdo, kde, co dělá, osvětlení, nálada
- Aspect ratio: ${defaultImg?.aspectRatio || '1.91:1'}`);
      break;
    }
    case 'suggest_topics': {
      const platform = (params.platform as string) || (project.platforms as string[])?.[0] || 'facebook';
      parts.push(`\n---\nÚKOL: NAVRH TÉMATA PRO OBSAH`);
      parts.push(`Platforma: ${platform}`);
      parts.push(`\nAnalyzuj Knowledge Base, nedávné posty a agent memory.`);
      parts.push(`Navrhni 5 UNIKÁTNÍCH témat, která:`);
      parts.push(`1. Vycházejí z KB faktů, které JEŠTĚ NEBYLY použity v nedávných postech`);
      parts.push(`2. Pokrývají různé content typy (educational, soft_sell, hard_sell, engagement, news_reaction)`);
      parts.push(`3. Reagují na doporučení z předchozích analýz (KB gaps, mix correction)`);
      parts.push(`4. Jsou relevantní pro cílovou skupinu projektu`);
      parts.push(`5. Mají potenciál pro vysoký engagement na platformě ${platform}`);
      parts.push(`\nPro každé téma uveď konkrétní KB fakta, která má post využít.`);
      parts.push(`\nVrať JSON:\n{"topics": [{"title": "...", "description": "Úhel a klíčové body", "content_type": "educational|soft_sell|hard_sell|engagement|news_reaction", "kb_facts": ["fakt 1", "fakt 2"], "hook_idea": "Návrh úvodního háčku"}]}`);
      break;
    }
    case 'generate_week_plan': {
      const platforms = (project.platforms as string[]) || ['facebook'];
      const mix = project.content_mix as Record<string, number>;
      parts.push(`\n---\nÚKOL: PLÁN OBSAHU NA TÝDEN`);
      parts.push(`Platformy: ${platforms.join(', ')}`);
      parts.push(`Cílový mix: ${JSON.stringify(mix)}`);
      parts.push(`\nVytvoř plán na 5 pracovních dní (pondělí–pátek).`);
      parts.push(`Pro každý den:`);
      parts.push(`1. Zvol téma z KB, které ještě nebylo v nedávných postech`);
      parts.push(`2. Zvol content type tak, aby celkový týden odpovídal cílovému mixu`);
      parts.push(`3. Zvol platformu (střídej pokud je jich víc)`);
      parts.push(`4. Navrhni konkrétní hook/úhel`);
      parts.push(`5. Reaguj na agent memory – pokud mix analýza říká, že chybí soft_sell, přidej víc`);
      parts.push(`\nVrať JSON:\n{"week_plan": [{"day": "pondělí", "topic": "...", "content_type": "...", "platform": "...", "hook_idea": "...", "kb_sources": ["..."]}]}`);
      break;
    }
    case 'kb_gap_analysis': {
      parts.push(`\n---\nÚKOL: ANALÝZA MEZER V KNOWLEDGE BASE`);
      parts.push(`\nProzkoumej KB záznamy a identifikuj:`);
      parts.push(`1. CHYBĚJÍCÍ KATEGORIE – jaké typy informací chybí pro kvalitní obsah?`);
      parts.push(`2. SLABÉ ZÁZNAMY – které záznamy potřebují rozšíření nebo aktualizaci?`);
      parts.push(`3. KONKRÉTNÍ DOPORUČENÍ – co přesně přidat (s příklady)`);
      parts.push(`4. KOMPLETNOST – celkové skóre 1-10`);
      parts.push(`\nZaměř se na: case studies, FAQ, data/statistiky, právní aspekty, finanční gramotnost, cílová skupina.`);
      parts.push(`\nVrať JSON:\n{"completeness_score": 7, "gaps": [{"category": "...", "description": "...", "importance": "high|medium|low"}], "suggestions": ["..."], "weak_entries": ["Název záznamu (id): důvod"]}`);
      break;
    }
    case 'analyze_content_mix': {
      parts.push(`\n---\nÚKOL: ANALÝZA CONTENT MIXU`);
      parts.push(`Cílový mix: ${JSON.stringify(project.content_mix)}`);
      parts.push(`\nAnalyzuj nedávné posty a porovnej aktuální mix s cílovým.`);
      parts.push(`1. Spočítej kolik postů je v každé kategorii`);
      parts.push(`2. Porovnej s cílovým mixem`);
      parts.push(`3. Identifikuj které typy jsou podreprezentované`);
      parts.push(`4. Doporuč jaký typ by měl být DALŠÍ post`);
      parts.push(`\nVrať JSON:\n{"current_mix": {"educational": 5, "soft_sell": 1}, "target_mix": {...}, "next_recommended_type": "soft_sell", "recommendations": ["..."]}`);
      break;
    }
    case 'performance_report': {
      parts.push(`\n---\nÚKOL: REPORT VÝKONU OBSAHU`);
      parts.push(`\nAnalyzuj všechny dostupné posty a vytvoř report:`);
      parts.push(`1. PŘEHLED – počet postů, průměrné skóre, nejlepší/nejhorší post`);
      parts.push(`2. TRENDY – zlepšuje se kvalita? Které typy fungují nejlépe?`);
      parts.push(`3. DOPORUČENÍ – co zlepšit, na co se zaměřit`);
      parts.push(`4. KB VYUŽITÍ – které KB záznamy se používají nejvíc/nejméně?`);
      parts.push(`\nVrať JSON:\n{"summary": "...", "metrics": {"total_posts": N, "avg_score": N, "best_type": "..."}, "trends": ["..."], "recommendations": ["..."]}`);
      break;
    }
    case 'optimize_schedule': {
      parts.push(`\n---\nÚKOL: OPTIMALIZACE ČASŮ PUBLIKACE`);
      parts.push(`Platformy: ${(project.platforms as string[])?.join(', ')}`);
      parts.push(`\nNa základě best practices pro dané platformy navrhni optimální časy:`);
      parts.push(`1. Pro každou platformu navrhni 2-3 nejlepší časy (hodina + den v týdnu)`);
      parts.push(`2. Zohledni českou cílovou skupinu (CET/CEST timezone)`);
      parts.push(`3. Zohledni typ obsahu – edukace ráno, engagement odpoledne`);
      parts.push(`4. Navrhni frekvenci (kolikrát týdně na každé platformě)`);
      parts.push(`\nVrať JSON:\n{"best_times": {"facebook": [{"day": "pondělí", "hour": 9, "reason": "..."}], "linkedin": [...]}, "frequency": {"facebook": 3, "linkedin": 2}, "timezone": "Europe/Prague"}`);
      break;
    }
    case 'sentiment_check': {
      parts.push(`\n---\nÚKOL: SENTIMENT A BEZPEČNOST OBSAHU`);
      parts.push(`\nZkontroluj VŠECHNY nedávné posty na:`);
      parts.push(`1. SENTIMENT – je tón konzistentní s nastavením projektu?`);
      parts.push(`2. BEZPEČNOST – nejsou tam kontroverzní tvrzení, přehnané sliby?`);
      parts.push(`3. BRAND SAFETY – odpovídá obsah hodnotám projektu?`);
      parts.push(`4. PRÁVNÍ RIZIKA – nejsou tam neoprávněná tvrzení o výnosech?`);
      parts.push(`\nVrať JSON:\n{"overall_sentiment": "positive|neutral|negative", "score": 1-10, "issues": [{"post_preview": "...", "issue": "...", "severity": "high|medium|low"}], "recommendations": ["..."]}`);
      break;
    }
    case 'quality_review': {
      const postText = params.post_text as string;
      if (postText) {
        parts.push(`\n---\nÚKOL: KONTROLA KVALITY POSTU`);
        parts.push(`\nZkontroluj tento post:\n"${postText}"`);
        parts.push(`\nHodnoť: kreativitu, shodu s tónem, hallucination risk, hodnotu pro čtenáře.`);
        parts.push(`Vrať JSON: {"scores": {"creativity": N, "tone_match": N, "hallucination_risk": N, "value_score": N, "overall": N}, "issues": ["..."], "suggestions": ["..."], "safe_to_publish": true/false}`);
      }
      break;
    }
    case 'react_to_news': {
      const newsTitle = params.news_title as string;
      const newsSummary = params.news_summary as string;
      const platform = (params.platform as string) || (ctx.project.platforms as string[])?.[0] || 'facebook';
      parts.push(`\n---\nÚKOL: REAKCE NA NOVINKU`);
      parts.push(`Titulek: ${newsTitle}`);
      parts.push(`Shrnutí: ${newsSummary}`);
      parts.push(`Platforma: ${platform}`);
      parts.push(`\nVytvoř post, který propojí tuto novinku s KB fakty projektu. Cituj zdroj.`);
      parts.push(`Post musí být relevantní pro cílovou skupinu projektu.`);
      parts.push('Vrať JSON: {"text": "...", "image_prompt": "...", "scores": {"creativity": N, "relevance": N, "tone_match": N, "overall": N}}');
      break;
    }
    case 'dedup_check': {
      const postText = params.post_text as string;
      parts.push(`\n---\nÚKOL: KONTROLA DUPLICIT V RÁMCI PROJEKTU`);
      parts.push(`\nPOST K OVĚŘENÍ:\n"${postText?.substring(0, 500)}"`);
      parts.push(`\nPorovnej s nedávnými posty projektu (viz výše).`);
      parts.push(`Zkontroluj:`);
      parts.push(`1. Není text příliš podobný existujícímu postu? (>70% overlap)`);
      parts.push(`2. Nepoužívá stejný hook/úvod?`);
      parts.push(`3. Nepřináší stejná fakta ve stejném pořadí?`);
      parts.push(`\nVrať JSON:\n{"is_unique": true/false, "similarity_score": 0.XX, "most_similar_post": "preview...", "issues": ["..."], "suggestions": ["Jak post odlišit"]}`);
      break;
    }
    case 'competitor_brief': {
      const competitorUrl = params.competitor_url as string;
      const competitorName = params.competitor_name as string;
      parts.push(`\n---\nÚKOL: ANALÝZA KONKURENCE`);
      if (competitorName) parts.push(`Konkurent: ${competitorName}`);
      if (competitorUrl) parts.push(`URL: ${competitorUrl}`);
      parts.push(`\nNa základě KB a znalostí o projektu "${ctx.project.name}":`);
      parts.push(`1. Jaké jsou hlavní DIFERENCIÁTORY oproti konkurenci?`);
      parts.push(`2. Jaké TÉMATA by měl projekt pokrývat, aby se odlišil?`);
      parts.push(`3. Jaké SLABINY konkurence může projekt využít v obsahu?`);
      parts.push(`4. Navrhni 3-5 KONKRÉTNÍCH postů, které zdůrazní výhody projektu`);
      parts.push(`\nVrať JSON:\n{"differentiators": ["..."], "content_opportunities": [{"topic": "...", "angle": "...", "content_type": "educational|soft_sell"}], "competitor_weaknesses": ["..."], "post_ideas": [{"title": "...", "hook": "...", "key_message": "..."}]}`);
      break;
    }
    case 'auto_enrich_kb': {
      parts.push(`\n---\nÚKOL: AUTOMATICKÉ OBOHACENÍ KNOWLEDGE BASE`);
      parts.push(`\nAnalyzuj existující KB záznamy výše a identifikuj MEZERY.`);
      parts.push(`Pokud máš v AGENT MEMORY výsledky kb_gap analýzy, využij je.`);
      parts.push(`Pokud ne, proveď vlastní analýzu: jaké informace chybí pro kvalitní obsah?`);
      parts.push(`\nPro každý navržený záznam:`);
      parts.push(`1. Zvol kategorii (product, audience, usp, faq, case_study, data, market, legal, process, general)`);
      parts.push(`2. Navrhni title a content (reálná, faktická data – NE generické fráze)`);
      parts.push(`3. Uveď důvod proč tento záznam chybí`);
      parts.push(`4. Prioritu (high/medium/low)`);
      parts.push(`\nPRAVIDLA:`);
      parts.push(`- Navrhuj MAX 5 záznamů najednou`);
      parts.push(`- Každý záznam musí být KONKRÉTNÍ a UŽITEČNÝ pro generování obsahu`);
      parts.push(`- Nenavrhuj záznamy, které už v KB existují (zkontroluj výše)`);
      parts.push(`- Preferuj kategorie: faq, case_study, data, process (ty nejčastěji chybí)`);
      parts.push(`- Content musí být FAKTICKÝ – konkrétní čísla, procesy, příklady`);
      parts.push(`- VŽDY navrhni alespoň 3 záznamy, i když KB vypadá kompletní`);
      parts.push(`\nVrať POUZE JSON:\n{"suggestions": [{"category": "faq", "title": "...", "content": "...", "reason": "...", "priority": "high"}], "kb_completeness_before": N, "kb_completeness_after": N}`);
      break;
    }
    case 'cross_project_dedup': {
      const postText = params.post_text as string;
      const postProjectId = params.post_project_id as string;
      parts.push(`\n---\nÚKOL: CROSS-PROJECT DEDUP CHECK`);
      parts.push(`\nZkontroluj, zda tento post není příliš podobný postům z JINÝCH projektů.`);
      parts.push(`\nPOST K OVĚŘENÍ:\n"${postText?.substring(0, 500)}"`);
      parts.push(`Projekt: ${postProjectId}`);
      if (params.similar_posts) {
        parts.push(`\nPODOBNÉ POSTY Z JINÝCH PROJEKTŮ:`);
        const similar = params.similar_posts as Array<{ text: string; project: string; similarity: number }>;
        for (const s of similar) {
          parts.push(`- [${s.project}] (similarity: ${s.similarity.toFixed(2)}): "${s.text.substring(0, 200)}..."`);
        }
      }
      parts.push(`\nHodnoť:`);
      parts.push(`1. Je post dostatečně unikátní? (similarity < 0.85 = OK)`);
      parts.push(`2. Pokud je příliš podobný, navrhni úpravy pro diferenciaci`);
      parts.push(`\nVrať JSON:\n{"is_unique": true/false, "max_similarity": 0.XX, "most_similar_project": "...", "suggestions": ["..."]}`);
      break;
    }
    case 'generate_ab_variants': {
      const originalText = params.original_text as string;
      const platform = (params.platform as string) || 'facebook';
      parts.push(`\n---\nÚKOL: GENERUJ A/B VARIANTY POSTU`);
      parts.push(`\nPŮVODNÍ POST (varianta A):\n"${originalText}"`);
      parts.push(`Platforma: ${platform}`);
      parts.push(`\nVytvoř 2 alternativní varianty (B a C), které:`);
      parts.push(`1. Zachovají STEJNÉ téma a KB fakta`);
      parts.push(`2. Použijí JINÝ hook (jiný typ úvodu)`);
      parts.push(`3. Mají JINOU strukturu (jiné formátování, jiný flow)`);
      parts.push(`4. Zachovají stejný tón a guardrails`);
      parts.push(`\nPro každou variantu uveď skóre a popis rozdílu.`);
      parts.push(`\nVrať JSON:\n{"variants": [{"label": "B", "text": "...", "hook_type": "question|statistic|story|contrast", "difference": "Popis rozdílu", "scores": {"creativity": N, "overall": N}}, {"label": "C", ...}]}`);
      break;
    }
    case 'image_prompt_review': {
      const imagePrompt = params.image_prompt as string;
      const platform = (params.platform as string) || 'instagram';
      const postText = (params.post_text as string) || '';
      const vi = ctx.project.visual_identity as Record<string, string> || {};
      parts.push(`\n---\nÚKOL: REVIEW A VYLEPŠENÍ IMAGE PROMPTU`);
      parts.push(`\nPŮVODNÍ IMAGE PROMPT:\n"${imagePrompt}"`);
      parts.push(`\nPOST TEXT (kontext):\n"${postText?.substring(0, 300)}"`);
      parts.push(`Platforma: ${platform}`);
      if (Object.keys(vi).length > 0) {
        parts.push(`\nVIZUÁLNÍ IDENTITA ZNAČKY:`);
        if (vi.photography_style) parts.push(`- Styl: ${vi.photography_style}`);
        if (vi.photography_mood) parts.push(`- Nálada: ${vi.photography_mood}`);
        if (vi.photography_subjects) parts.push(`- Typické subjekty: ${vi.photography_subjects}`);
        if (vi.photography_lighting) parts.push(`- Osvětlení: ${vi.photography_lighting}`);
        if (vi.photography_color_grade) parts.push(`- Barevný grading: ${vi.photography_color_grade}`);
        if (vi.photography_avoid) parts.push(`- VYHNOUT SE: ${vi.photography_avoid}`);
      }
      parts.push(`\nANALYZUJ prompt podle těchto kritérií:`);
      parts.push(`1. SPECIFIČNOST (1-10): Je prompt dostatečně konkrétní? Popisuje scénu, ne koncept?`);
      parts.push(`2. EMOCE (1-10): Vyvolává prompt emoci? Je filmový/cinematic?`);
      parts.push(`3. TECHNICKÉ DETAILY (1-10): Má osvětlení, úhel, hloubku ostrosti?`);
      parts.push(`4. BRAND FIT (1-10): Odpovídá vizuální identitě značky?`);
      parts.push(`5. PLATFORM FIT (1-10): Je vhodný pro ${platform}? (IG=lifestyle, LI=professional, FB=storytelling)`);
      parts.push(`\nPRAVIDLA PRO VYLEPŠENÍ:`);
      parts.push(`- Piš v ANGLIČTINĚ jako pokyn pro fotografa`);
      parts.push(`- Popisuj KONKRÉTNÍ scénu: kdo, kde, co dělá, jaké prostředí`);
      parts.push(`- Přidej TECHNICKÉ detaily: "shallow depth of field", "golden hour", "overhead shot"`);
      parts.push(`- Přidej EMOCI: "contemplative expression", "warm smile", "determined gaze"`);
      parts.push(`- Přidej MATERIÁLY a TEXTURY: "weathered oak desk", "crisp white shirt", "steaming coffee"`);
      parts.push(`- NIKDY generické: "Professional photo of business" → ŠPATNĚ`);
      parts.push(`- VŽDY specifické: "Close-up of young couple reviewing mortgage documents at kitchen table, morning light through window, shallow DOF, warm tones" → SPRÁVNĚ`);
      parts.push(`\nVrať POUZE JSON:\n{"original_scores": {"specificity": N, "emotion": N, "technical": N, "brand_fit": N, "platform_fit": N, "overall": N}, "improved_prompt": "...", "improved_scores": {"specificity": N, "emotion": N, "technical": N, "brand_fit": N, "platform_fit": N, "overall": N}, "changes": ["Co bylo změněno a proč"], "tips": ["Obecné tipy pro zlepšení foto promptů tohoto projektu"]}`);
      break;
    }
    case 'prompt_quality_audit': {
      parts.push(`\n---\nÚKOL: AUDIT KVALITY PROMPT ŠABLON PROJEKTU`);
      // Load project prompts
      if (supabase) {
        const { data: prompts } = await supabase
          .from('project_prompt_templates')
          .select('slug, category, content, is_active')
          .eq('project_id', ctx.project.id)
          .order('category');
        if (prompts && prompts.length > 0) {
          parts.push(`\nAKTIVNÍ PROMPT ŠABLONY (${prompts.length}):`);
          for (const p of prompts) {
            parts.push(`\n[${p.category}] ${p.slug} (${p.is_active ? 'aktivní' : 'neaktivní'}):`);
            parts.push(`${(p.content as string).substring(0, 300)}`);
          }
        } else {
          parts.push(`\nProjekt NEMÁ žádné custom prompt šablony.`);
        }
      }
      parts.push(`\nAnalyzuj nedávné posty výše a porovnej s prompt šablonami.`);
      parts.push(`\nHODNOŤ KAŽDOU ŠABLONU:`);
      parts.push(`1. EFEKTIVITA: Dodržuje Hugo toto pravidlo v reálných postech? (1-10)`);
      parts.push(`2. JASNOST: Je instrukce jasná a jednoznačná? (1-10)`);
      parts.push(`3. RELEVANCE: Je pravidlo stále potřebné? (1-10)`);
      parts.push(`4. KONFLIKT: Není v konfliktu s jiným pravidlem?`);
      parts.push(`\nNAVRHNI:`);
      parts.push(`- Které šablony SMAZAT (neefektivní, zastaralé)`);
      parts.push(`- Které šablony UPRAVIT (nejasné, příliš obecné)`);
      parts.push(`- Které NOVÉ šablony přidat (chybějící pravidla)`);
      parts.push(`- Celkové skóre kvality prompt systému (1-10)`);
      parts.push(`\nVrať POUZE JSON:\n{"overall_score": N, "templates_audit": [{"slug": "...", "effectiveness": N, "clarity": N, "relevance": N, "action": "keep|modify|delete", "suggestion": "..."}], "missing_templates": [{"category": "...", "content": "...", "reason": "..."}], "conflicts": ["..."], "recommendations": ["..."]}`);
      break;
    }
    case 'engagement_learning': {
      parts.push(`\n---\nÚKOL: ANALÝZA ENGAGEMENT DAT A UČENÍ`);
      // Load engagement data
      if (supabase) {
        const { data: posts } = await supabase
          .from('content_queue')
          .select('text_content, content_type, target_platform, ai_scores, engagement_score, engagement_metrics, visual_type, created_at')
          .eq('project_id', ctx.project.id)
          .in('status', ['sent', 'published'])
          .not('engagement_score', 'is', null)
          .order('created_at', { ascending: false })
          .limit(30);
        if (posts && posts.length > 0) {
          parts.push(`\nPOSTY S ENGAGEMENT DATY (${posts.length}):`);
          for (const p of posts) {
            const metrics = p.engagement_metrics as Record<string, number> || {};
            const scores = p.ai_scores as Record<string, number> || {};
            parts.push(`\n[${p.content_type}] ${p.target_platform} | Engagement: ${p.engagement_score} | AI score: ${scores.overall || '?'}`);
            parts.push(`  Likes: ${metrics.likes || 0}, Comments: ${metrics.comments || 0}, Shares: ${metrics.shares || 0}`);
            parts.push(`  Vizuál: ${p.visual_type || 'none'}`);
            parts.push(`  Text: "${(p.text_content as string).substring(0, 150)}..."`);
          }
        } else {
          parts.push(`\nŽádné posty s engagement daty. Doporuč jak začít sbírat data.`);
        }
      }
      parts.push(`\nANALYZUJ:`);
      parts.push(`1. CONTENT TYPE → ENGAGEMENT: Které typy obsahu mají nejvyšší engagement?`);
      parts.push(`2. HOOK TYPE → ENGAGEMENT: Jaké úvody fungují nejlépe? (číslo, otázka, příběh, kontrast)`);
      parts.push(`3. VIZUÁL → ENGAGEMENT: Foto vs karta vs žádný vizuál – co funguje?`);
      parts.push(`4. PLATFORMA → ENGAGEMENT: Která platforma má nejlepší výsledky?`);
      parts.push(`5. DÉLKA → ENGAGEMENT: Krátké vs dlouhé posty?`);
      parts.push(`6. ČAS → ENGAGEMENT: V jakou dobu mají posty nejlepší výsledky?`);
      parts.push(`7. AI SCORE vs ENGAGEMENT: Koreluje AI skóre s reálným engagementem?`);
      parts.push(`\nNA ZÁKLADĚ ANALÝZY NAVRHNI KONKRÉTNÍ ZMĚNY:`);
      parts.push(`- Úprava content_mix (více/méně jakého typu)`);
      parts.push(`- Úprava posting_hours (lepší časy)`);
      parts.push(`- Nové guardrails/communication rules`);
      parts.push(`- Úprava vizuální strategie`);
      parts.push(`\nVrať POUZE JSON:\n{"insights": {"best_content_type": "...", "best_hook_type": "...", "best_visual": "...", "best_platform": "...", "optimal_length": "short|medium|long", "best_posting_hour": N, "ai_score_correlation": N}, "content_mix_suggestion": {"educational": 0.X, "soft_sell": 0.X, "hard_sell": 0.X}, "posting_hours_suggestion": [9, 12, 17], "new_rules": [{"type": "guardrail|communication", "content": "..."}], "visual_strategy": "...", "recommendations": ["..."]}`);
      break;
    }
    case 'visual_consistency_audit': {
      parts.push(`\n---\nÚKOL: AUDIT VIZUÁLNÍ KONZISTENCE PROJEKTU`);
      const vi = ctx.project.visual_identity as Record<string, string> || {};
      if (Object.keys(vi).length > 0) {
        parts.push(`\nNASTAVENÁ VIZUÁLNÍ IDENTITA:`);
        for (const [key, value] of Object.entries(vi)) {
          parts.push(`- ${key}: ${value}`);
        }
      } else {
        parts.push(`\nProjekt NEMÁ nastavenou vizuální identitu. Navrhni ji.`);
      }
      // Load recent image prompts and visual types
      if (supabase) {
        const { data: posts } = await supabase
          .from('content_queue')
          .select('image_prompt, visual_type, image_url, card_url, target_platform, ai_scores')
          .eq('project_id', ctx.project.id)
          .in('status', ['review', 'approved', 'sent', 'published'])
          .order('created_at', { ascending: false })
          .limit(20);
        if (posts && posts.length > 0) {
          const withImages = posts.filter(p => p.image_prompt || p.image_url);
          parts.push(`\nPOSLEDNÍCH ${posts.length} POSTŮ (${withImages.length} s vizuálem):`);
          for (const p of posts) {
            parts.push(`  [${p.target_platform}] vizuál: ${p.visual_type || 'none'}`);
            if (p.image_prompt) parts.push(`    prompt: "${(p.image_prompt as string).substring(0, 200)}"`);
          }
        }
      }
      parts.push(`\nANALYZUJ:`);
      parts.push(`1. KONZISTENCE: Jsou image prompty konzistentní? Opakují se motivy, barvy, styl?`);
      parts.push(`2. BRAND FIT: Odpovídají vizuály nastavené vizuální identitě?`);
      parts.push(`3. ROZMANITOST: Nejsou vizuály příliš monotónní? Střídají se typy?`);
      parts.push(`4. KVALITA PROMPTŮ: Jsou prompty dostatečně specifické a filmové?`);
      parts.push(`5. PLATFORM FIT: Jsou vizuály vhodné pro cílové platformy?`);
      parts.push(`\nNAVRHNI:`);
      parts.push(`- Úpravy visual_identity (photography_style, mood, subjects, lighting, color_grade, avoid)`);
      parts.push(`- Vzorové image prompty pro tento projekt (3-5 příkladů)`);
      parts.push(`- Pravidla pro konzistenci (co vždy zahrnout, čemu se vyhnout)`);
      parts.push(`\nVrať POUZE JSON:\n{"consistency_score": N, "brand_fit_score": N, "diversity_score": N, "prompt_quality_score": N, "visual_identity_suggestions": {"photography_style": "...", "photography_mood": "...", "photography_subjects": "...", "photography_lighting": "...", "photography_color_grade": "...", "photography_avoid": "..."}, "example_prompts": ["...", "...", "..."], "rules": ["..."], "recommendations": ["..."]}`);
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
// Agent: Post-processing – Hugo acts on task results
// ============================================

async function processTaskResult(
  task: Record<string, unknown>,
  result: Record<string, unknown>,
  ctx: ProjectContext,
): Promise<void> {
  if (!supabase) return;
  const projectId = task.project_id as string;
  const taskType = task.task_type as string;
  const params = (task.params as Record<string, unknown>) || {};

  try {
    switch (taskType) {
      // ---- REACT TO NEWS → save post to content_queue ----
      case 'react_to_news': {
        if (result.text) {
          const platform = (params.platform as string) || (ctx.project.platforms as string[])?.[0] || 'facebook';
          const scores = result.scores as Record<string, number> || {};
          await supabase.from('content_queue').insert({
            project_id: projectId,
            text_content: result.text as string,
            image_prompt: (result.image_prompt as string) || null,
            content_type: 'news_reaction',
            platforms: [platform],
            target_platform: platform,
            ai_scores: scores,
            status: 'review',
            source: 'news_reaction',
          });
        }
        break;
      }

      // ---- QUALITY REVIEW → log result, flag if unsafe ----
      case 'quality_review': {
        const safeToPublish = result.safe_to_publish as boolean;
        const contentId = params.content_id as string;
        if (contentId && safeToPublish === false && supabase) {
          // Flag the post as needing review
          await supabase.from('content_queue').update({
            status: 'review',
          }).eq('id', contentId).eq('status', 'approved');
        }
        await supabase.from('agent_log').insert({
          project_id: projectId,
          action: 'quality_reviewed',
          details: {
            content_id: contentId,
            safe_to_publish: safeToPublish,
            scores: result.scores,
            issues: result.issues,
          },
        });
        break;
      }

      // ---- DEDUP CHECK → log result ----
      case 'dedup_check': {
        await supabase.from('agent_log').insert({
          project_id: projectId,
          action: 'dedup_checked',
          details: {
            is_unique: result.is_unique,
            similarity_score: result.similarity_score,
            issues: result.issues,
          },
        });
        break;
      }

      // ---- COMPETITOR BRIEF → save insights to memory + create content tasks ----
      case 'competitor_brief': {
        await upsertAgentMemory(projectId, 'competitor_insights', {
          differentiators: result.differentiators || [],
          content_opportunities: result.content_opportunities || [],
          competitor_weaknesses: result.competitor_weaknesses || [],
          analyzed_at: new Date().toISOString(),
        });

        // Auto-create content tasks from post ideas
        const postIdeas = result.post_ideas as Array<Record<string, unknown>> || [];
        if (postIdeas.length > 0) {
          const platforms = (ctx.project.platforms as string[]) || ['facebook'];
          for (const idea of postIdeas.slice(0, 3)) {
            await createTask(projectId, 'generate_content', {
              platform: platforms[0],
              human_topic: (idea.title as string) || '',
              human_notes: `Hook: ${idea.hook || ''}. ${idea.key_message || ''}`,
              contentType: 'educational',
              source: 'competitor_brief',
            }, { priority: 4 });
          }
        }
        break;
      }

      // ---- SUGGEST TOPICS → create generate_content tasks ----
      case 'suggest_topics': {
        const topics = result.topics as Array<Record<string, unknown>> | undefined;
        if (topics && topics.length > 0) {
          const platforms = (ctx.project.platforms as string[]) || ['facebook'];
          const platform = (params.platform as string) || platforms[0];
          // Create a generate_content task for each topic (max 5)
          for (const topic of topics.slice(0, 5)) {
            const topicTitle = (topic.title || topic.topic || '') as string;
            if (!topicTitle) continue;
            await createTask(projectId, 'generate_content', {
              platform,
              human_topic: topicTitle,
              human_notes: (topic.description || topic.angle || '') as string,
              contentType: (topic.content_type || 'educational') as string,
              source: 'agent_suggest_topics',
            }, { priority: 4 });
          }
          // Save to agent_memory for context
          await upsertAgentMemory(projectId, 'suggested_topics', {
            topics: topics.slice(0, 5).map(t => ({
              title: t.title || t.topic,
              type: t.content_type || 'educational',
            })),
            generated_at: new Date().toISOString(),
          });
        }
        break;
      }

      // ---- WEEK PLAN → schedule tasks across the week ----
      case 'generate_week_plan': {
        const weekPlan = result.week_plan as Array<Record<string, unknown>> | undefined;
        const plan = weekPlan || result.plan as Array<Record<string, unknown>> | undefined;
        if (plan && plan.length > 0) {
          const platforms = (ctx.project.platforms as string[]) || ['facebook'];
          const orchConfig = (ctx.project.orchestrator_config as Record<string, unknown>) || {};
          const postingHours = (orchConfig.posting_hours as number[]) || [9, 12, 17];

          for (const day of plan) {
            const dayName = (day.day || day.date || '') as string;
            const topic = (day.topic || day.title || '') as string;
            const contentType = (day.content_type || day.type || 'educational') as string;
            const platform = (day.platform as string) || platforms[0];
            if (!topic) continue;

            // Calculate scheduled_for based on day name
            const scheduledDate = resolveDayToDate(dayName, postingHours[0] || 9);
            if (!scheduledDate) continue;

            await createTask(projectId, 'generate_content', {
              platform,
              human_topic: topic,
              contentType,
              source: 'agent_week_plan',
            }, {
              priority: 3,
              scheduledFor: scheduledDate.toISOString(),
            });
          }
          // Save plan to memory
          await upsertAgentMemory(projectId, 'week_plan', {
            plan: plan.slice(0, 7),
            generated_at: new Date().toISOString(),
          });
        }
        break;
      }

      // ---- KB GAP ANALYSIS → save insights to memory ----
      case 'kb_gap_analysis': {
        const gaps = result.gaps as Array<Record<string, unknown>> | undefined;
        const suggestions = result.suggestions as string[] | undefined;
        await upsertAgentMemory(projectId, 'kb_gaps', {
          gaps: gaps?.slice(0, 10) || [],
          suggestions: suggestions?.slice(0, 10) || [],
          weak_entries: result.weak_entries || [],
          completeness_score: result.completeness_score || null,
          analyzed_at: new Date().toISOString(),
        });
        break;
      }

      // ---- CONTENT MIX ANALYSIS → save correction to memory ----
      case 'analyze_content_mix': {
        await upsertAgentMemory(projectId, 'mix_correction', {
          current_mix: result.current_mix || result.actual_mix || {},
          target_mix: result.target_mix || {},
          recommendation: result.recommendation || result.recommendations || null,
          next_type: result.next_recommended_type || result.suggested_next || null,
          analyzed_at: new Date().toISOString(),
        });
        break;
      }

      // ---- OPTIMIZE SCHEDULE → update orchestrator_config posting hours ----
      case 'optimize_schedule': {
        const bestTimes = result.best_times || result.optimal_times || result.recommended_times;
        if (bestTimes) {
          // Save to memory (don't auto-update config without admin approval)
          await upsertAgentMemory(projectId, 'schedule_optimization', {
            best_times: bestTimes,
            timezone: result.timezone || 'Europe/Prague',
            analyzed_at: new Date().toISOString(),
          });
        }
        break;
      }

      // ---- PERFORMANCE REPORT → save metrics to memory ----
      case 'performance_report': {
        await upsertAgentMemory(projectId, 'performance_insights', {
          summary: result.summary || null,
          metrics: result.metrics || {},
          trends: result.trends || [],
          recommendations: result.recommendations || [],
          analyzed_at: new Date().toISOString(),
        });
        break;
      }

      // ---- SENTIMENT CHECK → flag posts if negative ----
      case 'sentiment_check': {
        const sentiment = result.sentiment || result.overall_sentiment;
        const score = result.score || result.sentiment_score;
        await upsertAgentMemory(projectId, 'sentiment_report', {
          sentiment,
          score,
          issues: result.issues || result.flags || [],
          analyzed_at: new Date().toISOString(),
        });
        break;
      }

      // ---- AUTO ENRICH KB → insert suggested entries (status: pending_review) ----
      case 'auto_enrich_kb': {
        const suggestions = result.suggestions as Array<Record<string, unknown>> | undefined;
        if (suggestions && suggestions.length > 0 && supabase) {
          let inserted = 0;
          for (const s of suggestions.slice(0, 5)) {
            const title = (s.title as string) || '';
            const content = (s.content as string) || '';
            const category = (s.category as string) || 'general';
            if (!title || !content) continue;

            // Insert as inactive (pending admin review)
            await supabase.from('knowledge_base').insert({
              project_id: projectId,
              category,
              title: `[AI NÁVRH] ${title}`,
              content,
              is_active: false, // Admin must activate
            });
            inserted++;
          }

          await upsertAgentMemory(projectId, 'kb_enrichment', {
            suggested: suggestions.length,
            inserted,
            completeness_before: result.kb_completeness_before || null,
            completeness_after: result.kb_completeness_after || null,
            enriched_at: new Date().toISOString(),
          });

          await supabase.from('agent_log').insert({
            project_id: projectId,
            action: 'auto_enrich_kb',
            details: { suggested: suggestions.length, inserted, categories: suggestions.map(s => s.category) },
          });
        }
        break;
      }

      // ---- CROSS PROJECT DEDUP → log result ----
      case 'cross_project_dedup': {
        await upsertAgentMemory(projectId, 'dedup_report', {
          is_unique: result.is_unique ?? true,
          max_similarity: result.max_similarity || 0,
          most_similar_project: result.most_similar_project || null,
          suggestions: result.suggestions || [],
          checked_at: new Date().toISOString(),
        });
        break;
      }

      // ---- A/B VARIANTS → save variants to content_queue ----
      case 'generate_ab_variants': {
        const variants = result.variants as Array<Record<string, unknown>> | undefined;
        if (variants && variants.length > 0 && supabase) {
          const sourcePostId = params.source_post_id as string;
          const platform = (params.platform as string) || 'facebook';

          for (const variant of variants.slice(0, 2)) {
            const variantText = (variant.text as string) || '';
            if (!variantText) continue;

            const scores = variant.scores as Record<string, number> | undefined;
            await supabase.from('content_queue').insert({
              project_id: projectId,
              text_content: variantText,
              content_type: (params.content_type as string) || 'educational',
              platforms: [platform],
              target_platform: platform,
              ai_scores: scores || {},
              status: 'review',
              source: 'ab_variant',
              generation_context: {
                variant_label: variant.label,
                hook_type: variant.hook_type,
                difference: variant.difference,
                source_post_id: sourcePostId,
              },
            });
          }

          await supabase.from('agent_log').insert({
            project_id: projectId,
            action: 'ab_variants_generated',
            details: {
              source_post_id: sourcePostId,
              variants_count: variants.length,
              labels: variants.map(v => v.label),
            },
          });
        }
        break;
      }

      // ---- IMAGE PROMPT REVIEW → update image_prompt on content_queue + save tips ----
      case 'image_prompt_review': {
        const improvedPrompt = result.improved_prompt as string;
        const contentId = params.content_id as string;
        const originalScores = result.original_scores as Record<string, number> || {};
        const improvedScores = result.improved_scores as Record<string, number> || {};

        // Auto-update the content_queue record with improved prompt
        if (improvedPrompt && contentId && supabase) {
          await supabase.from('content_queue').update({
            image_prompt: improvedPrompt,
          }).eq('id', contentId);
        }

        // Save tips to agent_memory for future image prompt generation
        const tips = result.tips as string[] || [];
        if (tips.length > 0) {
          await upsertAgentMemory(projectId, 'image_prompt_tips', {
            tips,
            avg_original_score: originalScores.overall || 0,
            avg_improved_score: improvedScores.overall || 0,
            improvement: (improvedScores.overall || 0) - (originalScores.overall || 0),
            reviewed_at: new Date().toISOString(),
          });
        }

        await supabase?.from('agent_log').insert({
          project_id: projectId,
          action: 'image_prompt_reviewed',
          details: {
            content_id: contentId,
            original_score: originalScores.overall,
            improved_score: improvedScores.overall,
            changes: result.changes,
          },
        });
        break;
      }

      // ---- PROMPT QUALITY AUDIT → save audit + auto-apply recommendations ----
      case 'prompt_quality_audit': {
        const overallScore = result.overall_score as number || 0;
        const templatesAudit = result.templates_audit as Array<Record<string, unknown>> || [];
        const missingTemplates = result.missing_templates as Array<Record<string, unknown>> || [];

        // Save audit results to memory
        await upsertAgentMemory(projectId, 'prompt_audit', {
          overall_score: overallScore,
          templates_audited: templatesAudit.length,
          to_delete: templatesAudit.filter(t => t.action === 'delete').length,
          to_modify: templatesAudit.filter(t => t.action === 'modify').length,
          missing: missingTemplates.length,
          conflicts: result.conflicts || [],
          recommendations: result.recommendations || [],
          audited_at: new Date().toISOString(),
        });

        // Auto-add missing templates with high confidence (admin can deactivate)
        if (missingTemplates.length > 0 && supabase) {
          for (const mt of missingTemplates.slice(0, 3)) {
            const content = (mt.content as string) || '';
            const category = (mt.category as string) || 'guardrail';
            if (!content) continue;
            await supabase.from('project_prompt_templates').insert({
              project_id: projectId,
              slug: `auto_${category}_${Date.now()}`,
              category,
              content,
              is_active: false, // Admin must activate
              sort_order: 100,
            });
          }
        }

        await supabase?.from('agent_log').insert({
          project_id: projectId,
          action: 'prompt_quality_audited',
          details: {
            overall_score: overallScore,
            templates_audited: templatesAudit.length,
            missing_added: Math.min(missingTemplates.length, 3),
            recommendations: result.recommendations,
          },
        });
        break;
      }

      // ---- ENGAGEMENT LEARNING → save insights + auto-update config ----
      case 'engagement_learning': {
        const insights = result.insights as Record<string, unknown> || {};
        const contentMixSuggestion = result.content_mix_suggestion as Record<string, number> || {};
        const postingHoursSuggestion = result.posting_hours_suggestion as number[] || [];
        const newRules = result.new_rules as Array<Record<string, unknown>> || [];

        // Save insights to memory
        await upsertAgentMemory(projectId, 'engagement_insights', {
          insights,
          content_mix_suggestion: contentMixSuggestion,
          posting_hours_suggestion: postingHoursSuggestion,
          visual_strategy: result.visual_strategy || null,
          recommendations: result.recommendations || [],
          learned_at: new Date().toISOString(),
        });

        // Auto-update content_mix if suggestion differs significantly
        if (Object.keys(contentMixSuggestion).length > 0 && supabase) {
          const { data: proj } = await supabase.from('projects').select('content_mix').eq('id', projectId).single();
          const currentMix = (proj?.content_mix as Record<string, number>) || {};
          const hasDiff = Object.entries(contentMixSuggestion).some(([k, v]) => Math.abs((currentMix[k] || 0) - v) > 0.1);
          if (hasDiff) {
            await supabase.from('projects').update({ content_mix: contentMixSuggestion }).eq('id', projectId);
            await supabase.from('agent_log').insert({
              project_id: projectId,
              action: 'content_mix_auto_updated',
              details: { previous: currentMix, new: contentMixSuggestion, reason: 'engagement_learning' },
            });
          }
        }

        // Save optimal posting hours to agent_memory (admin can apply manually)
        if (postingHoursSuggestion.length > 0) {
          const postingTimes = postingHoursSuggestion.map(h => `${String(h).padStart(2, '0')}:00`);
          await upsertAgentMemory(projectId, 'optimal_posting_times', {
            hours: postingHoursSuggestion,
            times: postingTimes,
            updated_at: new Date().toISOString(),
          });
        }

        // Auto-add new guardrails/communication rules (inactive, admin must activate)
        if (newRules.length > 0 && supabase) {
          for (const rule of newRules.slice(0, 3)) {
            const content = (rule.content as string) || '';
            const category = (rule.type as string) || 'guardrail';
            if (!content) continue;
            await supabase.from('project_prompt_templates').insert({
              project_id: projectId,
              slug: `engagement_${category}_${Date.now()}`,
              category,
              content,
              is_active: false,
              sort_order: 100,
            });
          }
        }

        await supabase?.from('agent_log').insert({
          project_id: projectId,
          action: 'engagement_learned',
          details: {
            insights,
            mix_updated: Object.keys(contentMixSuggestion).length > 0,
            rules_suggested: newRules.length,
          },
        });
        break;
      }

      // ---- VISUAL CONSISTENCY AUDIT → save + auto-update visual_identity ----
      case 'visual_consistency_audit': {
        const viSuggestions = result.visual_identity_suggestions as Record<string, string> || {};
        const examplePrompts = result.example_prompts as string[] || [];
        const rules = result.rules as string[] || [];

        // Save audit to memory
        await upsertAgentMemory(projectId, 'visual_audit', {
          consistency_score: result.consistency_score || 0,
          brand_fit_score: result.brand_fit_score || 0,
          diversity_score: result.diversity_score || 0,
          prompt_quality_score: result.prompt_quality_score || 0,
          example_prompts: examplePrompts,
          rules,
          recommendations: result.recommendations || [],
          audited_at: new Date().toISOString(),
        });

        // Auto-update visual_identity if project has none or scores are low
        if (Object.keys(viSuggestions).length > 0 && supabase) {
          const { data: proj } = await supabase.from('projects').select('visual_identity').eq('id', projectId).single();
          const currentVi = (proj?.visual_identity as Record<string, string>) || {};
          const hasVi = Object.keys(currentVi).length > 0;
          const lowScore = ((result.brand_fit_score as number) || 0) < 6;

          if (!hasVi || lowScore) {
            // Merge: keep existing values, add missing ones from suggestions
            const merged = { ...viSuggestions, ...currentVi };
            await supabase.from('projects').update({ visual_identity: merged }).eq('id', projectId);
            await supabase.from('agent_log').insert({
              project_id: projectId,
              action: 'visual_identity_auto_updated',
              details: { previous: currentVi, merged, reason: hasVi ? 'low_brand_fit_score' : 'no_visual_identity' },
            });
          }
        }

        // Save example prompts as visual_style prompt templates (inactive)
        if (examplePrompts.length > 0 && supabase) {
          await supabase.from('project_prompt_templates').insert({
            project_id: projectId,
            slug: `visual_examples_${Date.now()}`,
            category: 'visual_style',
            content: `VZOROVÉ IMAGE PROMPTY PRO TENTO PROJEKT:\n${examplePrompts.map((p, i) => `${i + 1}. ${p}`).join('\n')}\n\nPRAVIDLA:\n${rules.join('\n')}`,
            is_active: false,
            sort_order: 100,
          });
        }

        await supabase?.from('agent_log').insert({
          project_id: projectId,
          action: 'visual_consistency_audited',
          details: {
            consistency_score: result.consistency_score,
            brand_fit_score: result.brand_fit_score,
            vi_updated: Object.keys(viSuggestions).length > 0,
            example_prompts_count: examplePrompts.length,
          },
        });
        break;
      }
    }
  } catch (err) {
    // Post-processing failure should not fail the task
    await supabase.from('agent_log').insert({
      project_id: projectId,
      task_id: task.id as string,
      action: 'post_processing_error',
      details: { task_type: taskType, error: err instanceof Error ? err.message : 'Unknown' },
    });
  }
}

// ---- Agent Memory: upsert (one entry per project+type) ----
async function upsertAgentMemory(
  projectId: string,
  memoryType: string,
  content: Record<string, unknown>,
): Promise<void> {
  if (!supabase) return;

  // Check if memory exists
  const { data: existing } = await supabase
    .from('agent_memory')
    .select('id')
    .eq('project_id', projectId)
    .eq('memory_type', memoryType)
    .single();

  if (existing) {
    await supabase.from('agent_memory')
      .update({ content, updated_at: new Date().toISOString() })
      .eq('id', existing.id);
  } else {
    await supabase.from('agent_memory').insert({
      project_id: projectId,
      memory_type: memoryType,
      content,
    });
  }
}

// ---- Resolve day name to actual Date ----
function resolveDayToDate(dayName: string, hour: number): Date | null {
  const dayMap: Record<string, number> = {
    'pondělí': 1, 'monday': 1, 'po': 1,
    'úterý': 2, 'tuesday': 2, 'út': 2,
    'středa': 3, 'wednesday': 3, 'st': 3,
    'čtvrtek': 4, 'thursday': 4, 'čt': 4,
    'pátek': 5, 'friday': 5, 'pá': 5,
    'sobota': 6, 'saturday': 6, 'so': 6,
    'neděle': 0, 'sunday': 0, 'ne': 0,
  };

  const normalized = dayName.toLowerCase().trim();
  const targetDay = dayMap[normalized];
  if (targetDay === undefined) return null;

  const now = new Date();
  const currentDay = now.getDay();
  let daysAhead = targetDay - currentDay;
  if (daysAhead <= 0) daysAhead += 7; // Next week

  const date = new Date(now);
  date.setDate(date.getDate() + daysAhead);
  date.setHours(hour, 0, 0, 0);
  return date;
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
      // Keep _resolved_content_type for saving, will be cleaned up after
    } else if (task.task_type === 'aio_schema_inject') {
      // ---- AIO: Schema Injection via GitHub API ----
      const { runAioInjectionBatch } = await import('@/lib/aio/aio-engine');
      const aioResult = await runAioInjectionBatch(task.project_id);
      result = {
        total_sites: aioResult.totalSites,
        succeeded: aioResult.succeeded,
        failed: aioResult.failed,
        details: aioResult.results.map((r) => ({
          repo: r.repo,
          injected: r.injected,
          skipped: r.skipped,
          failed: r.failed,
          commit_sha: r.lastCommitSha,
          error: r.error,
        })),
      };
    } else if (task.task_type === 'aio_visibility_audit') {
      // ---- AIO: Visibility Audit (prompt testing across AI platforms) ----
      const { runVisibilityAudit } = await import('@/lib/aio/visibility-auditor');
      const auditResult = await runVisibilityAudit(task.project_id);
      result = auditResult
        ? {
            total_prompts: auditResult.totalPrompts,
            total_tests: auditResult.totalTests,
            visibility_score: auditResult.score.visibilityScore,
            share_of_voice: auditResult.score.shareOfVoice,
            prompts_with_brand: auditResult.score.promptsWithBrand,
            top_competitors: auditResult.score.topCompetitors,
            platforms: auditResult.score.platformsBreakdown,
          }
        : { error: 'No entity profile or prompts configured for this project' };
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

      // ---- Image Prompt Review: 2nd AI pass to improve photo prompts ----
      if (result.image_prompt && typeof result.image_prompt === 'string') {
        try {
          const reviewPrompt = await buildAgentPrompt('image_prompt_review', ctx, {
            image_prompt: result.image_prompt,
            platform,
            post_text: (result.text as string)?.substring(0, 300),
          });
          const { text: reviewRaw } = await generateText({
            model: google('gemini-2.0-flash'),
            prompt: reviewPrompt,
            temperature: 0.3,
          });
          const reviewResult = parseAIResponse(reviewRaw);
          if (reviewResult.improved_prompt && typeof reviewResult.improved_prompt === 'string') {
            const origScore = (reviewResult.original_scores as Record<string, number>)?.overall || 0;
            const newScore = (reviewResult.improved_scores as Record<string, number>)?.overall || 0;
            if (newScore >= origScore) {
              result.image_prompt = reviewResult.improved_prompt;
              result._image_prompt_improved = true;
              result._image_prompt_scores = { original: origScore, improved: newScore };
            }
          }
          totalTokens += 300;
        } catch {
          // Image prompt review failed, continue with original
        }
      }

      // Generate visual assets (chart/card/photo)
      let visualData: { visual_type: string; chart_url: string | null; card_url: string | null; image_prompt: string | null; generated_image_url?: string | null; media_asset_id?: string | null; template_url?: string | null } = {
        visual_type: 'none', chart_url: null, card_url: null, image_prompt: (result.image_prompt as string) || null,
      };
      try {
        const visualIdentity = (ctx.project.visual_identity as Record<string, unknown>) || {};
        visualData = await generateVisualAssets({
          text: result.text as string,
          projectName: ctx.project.name as string,
          platform,
          visualIdentity: visualIdentity as Record<string, string>,
          kbEntries: ctx.kbEntries,
          projectId: task.project_id,
          logoUrl: (visualIdentity as Record<string, string>).logo_url || null,
          photographyPreset: (visualIdentity.photography_preset as Record<string, unknown>) || null,
        });
      } catch {
        // Visual generation failed, continue without
      }

      // ---- Media from visual-agent (already handles: Library match → Imagen → fallback) ----
      const matchedImageUrl: string | null = visualData.generated_image_url || null;
      const matchedMediaId: string | null = visualData.media_asset_id || null;
      const templateUrl = (visualData as Record<string, unknown>).template_url as string | null || null;

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

      // ---- Build generation_context (debug trace) ----
      // Count loaded agent memories
      let memoryTypesLoaded: string[] = [];
      try {
        if (supabase) {
          const { data: mems } = await supabase
            .from('agent_memory')
            .select('memory_type')
            .eq('project_id', task.project_id);
          memoryTypesLoaded = (mems || []).map((m: { memory_type: string }) => m.memory_type);
        }
      } catch { /* ignore */ }

      // Count news injected
      let newsInjected = 0;
      let newsTitles: string[] = [];
      try {
        const recentNews = await getRelevantNews(task.project_id as string, {
          limit: 5, hoursBack: 72, minRelevance: 0.3, onlyUnused: true,
        });
        newsInjected = recentNews.length;
        newsTitles = recentNews.map(n => n.title);
      } catch { /* ignore */ }

      const generationContext: Record<string, unknown> = {
        task_id: taskId,
        content_type: resolvedContentType,
        content_type_reason: task.params?.contentType
          ? 'explicit (human/task param)'
          : `platform_mix: ${resolvedContentType} selected by getNextPlatformContentType`,
        platform,
        kb_entries_used: ctx.kbEntries.length,
        kb_categories: [...new Set(ctx.kbEntries.map(e => e.category))],
        news_injected: newsInjected,
        news_titles: newsTitles,
        memory_types_loaded: memoryTypesLoaded,
        dedup_posts_checked: ctx.recentPosts.length,
        feedback_entries: ctx.feedbackHistory.length,
        attempts,
        editor_used: !!result.editor_review,
        editor_changes: (result.editor_review as Record<string, unknown>)?.changes || [],
        media_matched: !!matchedMediaId,
        media_id: matchedMediaId,
        media_strategy: mediaStrategy,
        tokens_used: totalTokens,
        model: 'gemini-2.0-flash',
        temperature: 0.7 + (attempts > 1 ? attempts * 0.05 : 0),
        auto_scheduled: !!task.params?.auto_scheduled,
        human_topic: (task.params?.human_topic as string) || null,
        source: (task.params?.source as string) || 'agent',
        timestamp: new Date().toISOString(),
      };

      // Resolve image spec for this platform
      const platformImageSpec = getDefaultImageSpec(platform);
      const imageSpec = (result.image_spec as Record<string, unknown>) || (platformImageSpec ? {
        width: platformImageSpec.width,
        height: platformImageSpec.height,
        aspectRatio: platformImageSpec.aspectRatio,
      } : null);

      // Save to content_queue – use only core columns first, add optional ones if available
      const coreInsert: Record<string, unknown> = {
        project_id: task.project_id,
        text_content: result.text as string,
        first_comment: (result.first_comment as string) || null,
        image_prompt: (result.image_prompt as string) || null,
        content_type: resolvedContentType,
        platforms: [platform],
        target_platform: platform,
        content_group_id: (task.params?.content_group_id as string) || null,
        image_spec: imageSpec,
        ai_scores: scores || {},
        status: postStatus,
        source: task.params?.human_topic ? 'human_priority' : 'ai_generated',
      };

      // Try full insert with all optional columns (including generation_context)
      const fullInsert: Record<string, unknown> = {
        ...coreInsert,
        generation_context: generationContext,
        alt_text: (result.alt_text as string) || null,
        editor_review: result.editor_review || null,
        visual_type: visualData.visual_type,
        chart_url: visualData.chart_url || null,
        card_url: visualData.card_url || templateUrl || null,
        template_url: templateUrl || null,
      };
      if (matchedImageUrl) fullInsert.image_url = matchedImageUrl;
      if (matchedMediaId) fullInsert.matched_media_id = matchedMediaId;

      const { error: queueError } = await supabase.from('content_queue').insert(fullInsert);

      // If full insert fails, retry with core columns only (no generation_context)
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

    // ---- Post-processing: Hugo acts on results ----
    await processTaskResult(task, result, ctx);

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
  // Resolve content type once (same logic as buildAgentPrompt — platform-aware)
  let resolvedContentType: string;
  if (params.contentType) {
    resolvedContentType = params.contentType as string;
  } else {
    const legacyMix = (ctx.project.content_mix as Record<string, number>) || null;
    const orchConfig = (ctx.project.orchestrator_config as Record<string, unknown>) || {};
    const platformContentMix = (orchConfig.platform_content_mix as Record<string, Record<string, number>>) || {};
    const platformOverride = (platformContentMix[platform] as Partial<Record<ContentType, number>>) || null;
    const mixStatus = await getNextPlatformContentType(
      task.project_id as string, platform, legacyMix, platformOverride,
    );
    resolvedContentType = mixStatus.chosenType;
  }
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
  // If a specific platform is given, create a single task
  if (platform) {
    return createTask(
      projectId,
      'generate_content',
      {
        human_topic: topic,
        human_notes: notes || null,
        platform,
        contentType: contentType || 'educational',
      },
      { priority: HUMAN_PRIORITY }
    );
  }

  // No specific platform → create tasks for ALL project platforms (multi-platform)
  if (!supabase) return null;
  const { data: project } = await supabase
    .from('projects')
    .select('platforms')
    .eq('id', projectId)
    .single();

  const platforms = (project?.platforms as string[]) || ['linkedin'];
  const contentGroupId = randomUUID();
  let firstTaskId: string | null = null;

  for (let i = 0; i < platforms.length; i++) {
    const scheduledFor = new Date(Date.now() + i * 2 * 60 * 1000); // stagger 2 min apart
    const taskId = await createTask(
      projectId,
      'generate_content',
      {
        human_topic: topic,
        human_notes: notes || null,
        platform: platforms[i],
        content_group_id: contentGroupId,
        contentType: contentType || 'educational',
      },
      { priority: HUMAN_PRIORITY, scheduledFor: scheduledFor.toISOString() }
    );
    if (i === 0) firstTaskId = taskId;
  }

  return firstTaskId;
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
  posting_times: ['09:00', '13:00', '15:00', '18:00'],
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
  const config = { ...DEFAULT_CONFIG, ...raw };

  // If project has no custom posting_times, assign deterministic hours based on project ID
  // This spreads 59 projects across hours 8-19 (CET) so they don't all fire at once
  if (!raw?.posting_times && project.id) {
    config.posting_times = getDefaultPostingTimes(project.id as string, config.posting_frequency);
  }

  return config;
}

/**
 * Assign deterministic posting hours based on project ID hash.
 * Spreads projects across hours 8-19 CET so cron load is distributed.
 * - daily: 1 hour assigned (e.g. ['11:00'])
 * - 2x_daily: 2 hours assigned (e.g. ['09:00', '16:00'])
 * - 3x_week: 1 hour assigned
 * - weekly: 1 hour assigned
 */
function getDefaultPostingTimes(projectId: string, frequency: string): string[] {
  // Simple hash from project UUID → number
  let hash = 0;
  for (let i = 0; i < projectId.length; i++) {
    hash = ((hash << 5) - hash + projectId.charCodeAt(i)) | 0;
  }
  hash = Math.abs(hash);

  // Available posting hours: 8-19 CET (12 slots)
  const SLOTS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
  const primarySlot = SLOTS[hash % SLOTS.length];

  if (frequency === '2x_daily') {
    // Second slot ~7 hours later, wrap around
    const secondSlot = SLOTS[(hash + 7) % SLOTS.length];
    const hours = [primarySlot, secondSlot].sort((a, b) => a - b);
    return hours.map(h => `${String(h).padStart(2, '0')}:00`);
  }

  return [`${String(primarySlot).padStart(2, '0')}:00`];
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
    .select('id, name, platforms, is_active, orchestrator_config, late_accounts')
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

    // 6. Resolve platforms with getLate accounts
    const allPlatforms = config.platforms_priority.length > 0
      ? config.platforms_priority
      : (project.platforms as string[]) || ['facebook'];

    const lateAccounts = (project.late_accounts as Record<string, string>) || {};
    const platforms = allPlatforms.filter(p => {
      if (lateAccounts[p]) return true;
      console.log(`[auto-schedule] Skipping platform "${p}" for project "${project.name}" — no late_account configured`);
      return false;
    });

    if (platforms.length === 0) { skip('no_late_accounts'); continue; }

    // 7. Per-platform scheduling: interval + daily limit checked independently per platform
    const requiredInterval = getPostingIntervalHours(config.posting_frequency);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const contentGroupId = randomUUID();
    let platformsScheduled = 0;

    for (const platform of platforms) {
      // 7a. Check posting interval per platform
      const { data: lastPlatformPost } = await supabase
        .from('content_queue')
        .select('created_at')
        .eq('project_id', project.id)
        .eq('target_platform', platform)
        .order('created_at', { ascending: false })
        .limit(1);

      const lastPostDate = lastPlatformPost?.[0]?.created_at;
      const hoursSinceLastPost = lastPostDate
        ? (Date.now() - new Date(lastPostDate).getTime()) / (1000 * 60 * 60)
        : 999;

      if (hoursSinceLastPost < requiredInterval) {
        skip(`too_recent:${platform}`);
        continue;
      }

      // 7b. Check daily post limit per platform
      const { count: todayPlatformCount } = await supabase
        .from('content_queue')
        .select('id', { count: 'exact' })
        .eq('project_id', project.id)
        .eq('target_platform', platform)
        .gte('created_at', todayStart.toISOString());

      if ((todayPlatformCount || 0) >= config.max_posts_per_day) {
        skip(`daily_limit:${platform}`);
        continue;
      }

      // 7c. Schedule content generation for this platform
      await createTask(project.id, 'generate_content', {
        platform,
        content_group_id: contentGroupId,
        auto_scheduled: true,
        media_strategy: config.media_strategy,
        auto_publish: config.auto_publish,
        auto_publish_threshold: config.auto_publish_threshold,
      }, { priority: 3 });
      platformsScheduled++;
      scheduled++;
    }

    if (platformsScheduled === 0) { skip('all_platforms_throttled'); }

  }

  // ---- Weekly analytics tasks (run independently of content scheduling) ----
  // These run for ALL active projects with KB, regardless of pending content tasks
  for (const project of projects) {
    const config = getConfig(project);
    if (!config.enabled) continue;

    const localDay = getProjectLocalDay(config.timezone);
    const localHour = getProjectLocalHour(config.timezone);

    // Only schedule analytics during morning hours (8-10) to avoid duplicates from hourly cron
    if (localHour < 8 || localHour > 10) continue;

    // Check KB exists (analytics need data to analyze)
    const { count: kbCount } = await supabase
      .from('knowledge_base')
      .select('id', { count: 'exact' })
      .eq('project_id', project.id)
      .eq('is_active', true);
    if ((kbCount || 0) === 0) continue;

    // Monday: Content Mix Analysis
    if (localDay === 1) {
      const hasPending = await hasRecentAnalyticsTask(project.id, 'analyze_content_mix', 48);
      if (!hasPending) {
        await createTask(project.id, 'analyze_content_mix', {
          auto_scheduled: true,
          reason: 'weekly_monday_audit',
        }, { priority: 2 });
        scheduled++;
      }
    }

    // Wednesday: KB Gap Analysis
    if (localDay === 3) {
      const hasPending = await hasRecentAnalyticsTask(project.id, 'kb_gap_analysis', 48);
      if (!hasPending) {
        await createTask(project.id, 'kb_gap_analysis', {
          auto_scheduled: true,
          reason: 'weekly_wednesday_audit',
        }, { priority: 2 });
        scheduled++;
      }
    }

    // Thursday: Auto-enrich KB (based on Wednesday's gap analysis)
    if (localDay === 4) {
      const hasPending = await hasRecentAnalyticsTask(project.id, 'auto_enrich_kb', 48);
      if (!hasPending) {
        await createTask(project.id, 'auto_enrich_kb', {
          auto_scheduled: true,
          reason: 'weekly_thursday_enrichment',
        }, { priority: 2 });
        scheduled++;
      }
    }

    // Tuesday: Prompt Quality Audit (bi-weekly, 1st and 15th)
    if (localDay === 2) {
      const dayOfMonth = new Date().getDate();
      if (dayOfMonth <= 2 || (dayOfMonth >= 15 && dayOfMonth <= 16)) {
        const hasAudit = await hasRecentAnalyticsTask(project.id, 'prompt_quality_audit', 168); // 7 days
        if (!hasAudit) {
          await createTask(project.id, 'prompt_quality_audit', {
            auto_scheduled: true,
            reason: 'biweekly_prompt_audit',
          }, { priority: 2 });
          scheduled++;
        }
      }
    }

    // Friday: Feedback Digest + Performance Report + Engagement Learning
    if (localDay === 5) {
      // Feedback Digest: analyze admin edits and generate prompt suggestions
      // Check agent_log (not agent_tasks) since digest is a direct API call
      const digestSince = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
      const { count: digestCount } = await supabase
        .from('agent_log')
        .select('id', { count: 'exact' })
        .eq('project_id', project.id)
        .eq('action', 'feedback_digest_generated')
        .gte('created_at', digestSince);
      const hasDigest = (digestCount || 0) > 0;
      if (!hasDigest) {
        // Trigger feedback digest via API (not a task, but a direct call)
        try {
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL
            || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
            || 'http://localhost:3000';
          await fetch(`${baseUrl}/api/agent/feedback-digest?projectId=${project.id}&days=7`);
        } catch {
          // Feedback digest fetch failed, continue
        }
      }

      // Performance Report
      const hasReport = await hasRecentAnalyticsTask(project.id, 'performance_report', 48);
      if (!hasReport) {
        await createTask(project.id, 'performance_report', {
          auto_scheduled: true,
          reason: 'weekly_friday_report',
        }, { priority: 2 });
        scheduled++;
      }

      // Engagement Learning (weekly)
      const hasEngagement = await hasRecentAnalyticsTask(project.id, 'engagement_learning', 48);
      if (!hasEngagement) {
        await createTask(project.id, 'engagement_learning', {
          auto_scheduled: true,
          reason: 'weekly_friday_engagement_learning',
        }, { priority: 2 });
        scheduled++;
      }
    }

    // 1st of month: Visual Consistency Audit
    const dayOfMonth = new Date().getDate();
    if (dayOfMonth === 1 && localHour >= 8 && localHour <= 10) {
      const hasVisualAudit = await hasRecentAnalyticsTask(project.id, 'visual_consistency_audit', 168 * 3); // 21 days
      if (!hasVisualAudit) {
        await createTask(project.id, 'visual_consistency_audit', {
          auto_scheduled: true,
          reason: 'monthly_visual_audit',
        }, { priority: 2 });
        scheduled++;
      }
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

/**
 * Check if an analytics task of given type was already created/completed recently.
 * Prevents duplicate scheduling from hourly cron.
 */
async function hasRecentAnalyticsTask(
  projectId: string,
  taskType: string,
  withinHours: number,
): Promise<boolean> {
  if (!supabase) return true; // fail-safe: don't create if can't check

  const since = new Date(Date.now() - withinHours * 60 * 60 * 1000).toISOString();

  const { count } = await supabase
    .from('agent_tasks')
    .select('id', { count: 'exact' })
    .eq('project_id', projectId)
    .eq('task_type', taskType)
    .gte('created_at', since);

  return (count || 0) > 0;
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

    // Stagger execution: wait 3-8 seconds between tasks to avoid API burst
    if (tasks.indexOf(task) < tasks.length - 1) {
      const delayMs = 3000 + Math.floor(Math.random() * 5000);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
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
  const categories = ['product', 'audience', 'usp', 'faq', 'case_study', 'data', 'market', 'legal', 'process', 'general'];
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

// ============================================
// Auto-Publish: Send approved posts via getLate.dev
// ============================================

export async function publishApprovedPosts(): Promise<{
  published: number;
  failed: number;
  skipped: number;
}> {
  if (!supabase) return { published: 0, failed: 0, skipped: 0 };

  // Only auto-publish posts from projects with auto_publish enabled
  const { data: posts } = await supabase
    .from('content_queue')
    .select('*, projects(id, name, late_accounts, orchestrator_config)')
    .eq('status', 'approved')
    .order('created_at', { ascending: true })
    .limit(20);

  if (!posts || posts.length === 0) return { published: 0, failed: 0, skipped: 0 };

  // Lazy import to avoid circular deps
  const { getPublisher, buildPlatformsArray } = await import('@/lib/publishers');
  const { validatePostMultiPlatform } = await import('@/lib/platforms');
  const publisher = getPublisher();

  let published = 0;
  let failed = 0;
  let skipped = 0;

  for (const post of posts) {
    const project = post.projects as {
      id: string;
      name: string;
      late_accounts: Record<string, string> | null;
      orchestrator_config: Record<string, unknown> | null;
    };

    if (!project) { skipped++; continue; }

    const config = project.orchestrator_config || {};
    // Only auto-publish if project has auto_publish enabled
    if (!config.auto_publish) { skipped++; continue; }

    const lateAccounts = project.late_accounts || {};
    const targetPlatforms: string[] = post.target_platform
      ? [post.target_platform]
      : (post.platforms || []);

    const platformEntries = buildPlatformsArray(lateAccounts, targetPlatforms);
    if (platformEntries.length === 0) { skipped++; continue; }

    // Validate content
    const validations = validatePostMultiPlatform(post.text_content || '', targetPlatforms);
    const hasErrors = Object.values(validations).some(v => !v.valid);
    if (hasErrors) { skipped++; continue; }

    try {
      // Fallback: read template_url from generation_context if column is empty
      if (!post.template_url && !post.card_url && (post as Record<string, unknown>).generation_context) {
        const gc = (post as Record<string, unknown>).generation_context as Record<string, unknown> | null;
        if (gc?.template_url_value) {
          (post as Record<string, unknown>).template_url = gc.template_url_value;
        }
      }

      // Build media items (same priority logic as /api/publish/route.ts)
      const mediaItems: Array<{ type: 'image' | 'video' | 'document'; url: string }> = [];

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL
        || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
        || 'http://localhost:3000';
      const resolveUrl = (url: string): string => {
        if (url.startsWith('http')) return url;
        if (url.startsWith('/')) return `${baseUrl}${url}`;
        return url;
      };

      // Helper: pre-render a template URL to static PNG and upload to storage
      const preRenderTemplate = async (dynamicUrl: string): Promise<string> => {
        try {
          const { storage } = await import('@/lib/storage');
          const resp = await fetch(dynamicUrl, { signal: AbortSignal.timeout(14000) });
          if (resp.ok && (resp.headers.get('content-type') || '').includes('image/')) {
            const buf = Buffer.from(await resp.arrayBuffer());
            const uploadResult = await storage.upload(buf, `template_${targetPlatforms[0]}_${Date.now()}.png`, {
              projectId: post.project_id,
              folder: 'published-templates',
              contentType: 'image/png',
            });
            if (uploadResult.success && uploadResult.public_url) {
              return uploadResult.public_url;
            }
          }
        } catch (e) {
          console.error(`[auto-publish] Template pre-render failed:`, e instanceof Error ? e.message : e);
        }
        return dynamicUrl;
      };

      // Priority 1: Brand template (photo + brand frame + logo + text)
      // If template_url + multiple media_urls → carousel with brand templates
      let usedTemplate = false;
      if (post.template_url || post.card_url) {
        const templateBase = post.template_url || post.card_url;
        const isTemplateEndpoint = templateBase.includes('/api/visual/template');

        // Collect photos for carousel
        const carouselPhotos: string[] = [];
        if (post.media_urls && Array.isArray(post.media_urls) && post.media_urls.length > 1 && isTemplateEndpoint) {
          for (const url of post.media_urls) {
            if (typeof url === 'string' && (url.startsWith('http') || url.startsWith('/'))) {
              carouselPhotos.push(url);
            }
          }
        }

        if (carouselPhotos.length > 1) {
          // Carousel mode: generate a branded template for each photo
          console.log(`[auto-publish] Carousel mode: ${carouselPhotos.length} photos with brand template`);
          for (let ci = 0; ci < carouselPhotos.length; ci++) {
            let templateSrc = templateBase;
            try {
              const tUrl = new URL(templateSrc, baseUrl);
              tUrl.searchParams.set('photo', carouselPhotos[ci]);
              if (targetPlatforms[0]) tUrl.searchParams.set('platform', targetPlatforms[0]);
              tUrl.searchParams.delete('w');
              tUrl.searchParams.delete('h');
              templateSrc = tUrl.pathname + '?' + tUrl.searchParams.toString();
            } catch { /* keep original */ }
            const staticUrl = await preRenderTemplate(resolveUrl(templateSrc));
            console.log(`[auto-publish] Carousel [${ci + 1}/${carouselPhotos.length}]: ${staticUrl.substring(0, 150)}`);
            mediaItems.push({ type: 'image', url: staticUrl });
          }
        } else {
          // Single template
          let templateSrc = templateBase;
          if (isTemplateEndpoint && targetPlatforms[0]) {
            try {
              const tUrl = new URL(templateSrc, baseUrl);
              tUrl.searchParams.set('platform', targetPlatforms[0]);
              tUrl.searchParams.delete('w');
              tUrl.searchParams.delete('h');
              templateSrc = tUrl.pathname + '?' + tUrl.searchParams.toString();
            } catch { /* keep original */ }
          }
          console.log(`[auto-publish] Pre-rendering template for post ${post.id}...`);
          const staticUrl = await preRenderTemplate(resolveUrl(templateSrc));
          console.log(`[auto-publish] Template uploaded: ${staticUrl.substring(0, 150)}`);
          mediaItems.push({ type: 'image', url: staticUrl });
        }
        usedTemplate = true;
      } else if (post.media_urls && Array.isArray(post.media_urls) && post.media_urls.length > 0) {
        // Priority 2: media_urls array (multiple images from manual post)
        for (const url of post.media_urls) {
          if (typeof url === 'string' && (url.startsWith('http') || url.startsWith('/'))) {
            mediaItems.push({ type: 'image', url: resolveUrl(url) });
          }
        }
      } else if (post.image_url) {
        // Priority 3: single image fallback
        mediaItems.push({ type: 'image', url: post.image_url });
      }
      // Chart (absolute URL from QuickChart.io)
      if (post.chart_url) {
        mediaItems.push({ type: 'image', url: post.chart_url });
      }

      // Enforce aspect ratio for platform compliance — skip for template URLs
      if (!usedTemplate) {
        const { ensureImageAspectRatio } = await import('@/lib/visual/image-resize');
        for (let i = 0; i < mediaItems.length; i++) {
          if (mediaItems[i].type === 'image') {
            try {
              mediaItems[i].url = await ensureImageAspectRatio(
                mediaItems[i].url,
                targetPlatforms,
                post.project_id,
              );
            } catch {
              // Continue with original URL if resize fails
            }
          }
        }
      }

      console.log(`[auto-publish] Post ${post.id} → platforms: ${targetPlatforms.join(',')}, media: ${mediaItems.length}, template: ${usedTemplate}`);

      const publishResult = await publisher.publish({
        content: post.text_content,
        platforms: platformEntries,
        mediaItems: mediaItems.length > 0 ? mediaItems : undefined,
        timezone: 'Europe/Prague',
      });

      if (!publishResult.ok) {
        throw new Error(publishResult.error);
      }

      // Update status
      await supabase.from('content_queue').update({
        status: publishResult.data.status,
        sent_at: publishResult.data.status === 'sent' ? new Date().toISOString() : null,
        late_post_id: publishResult.data.externalId,
      }).eq('id', post.id);

      // Record in post_history
      await supabase.from('post_history').insert({
        project_id: post.project_id,
        content_type: post.content_type,
        pattern_id: post.pattern_id || null,
        platform: post.target_platform || targetPlatforms[0] || null,
      });

      published++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown';
      await supabase.from('content_queue').update({ status: 'failed' }).eq('id', post.id);
      await supabase.from('agent_log').insert({
        project_id: post.project_id,
        action: 'auto_publish_failed',
        details: { post_id: post.id, error: msg },
      });
      failed++;
    }
  }

  if (published > 0 || failed > 0) {
    await supabase.from('agent_log').insert({
      action: 'auto_publish',
      details: { published, failed, skipped, timestamp: new Date().toISOString() },
    });
  }

  return { published, failed, skipped };
}

// ============================================
// Friday Topic Suggestions: Auto-schedule for next week
// ============================================

export async function scheduleFridayTopicSuggestions(): Promise<number> {
  if (!supabase) return 0;

  const { data: projects } = await supabase
    .from('projects')
    .select('id, orchestrator_config')
    .eq('is_active', true);

  if (!projects) return 0;

  let scheduled = 0;

  for (const project of projects) {
    const config = getConfig(project);
    if (!config.enabled) continue;

    // Check KB exists
    const { count: kbCount } = await supabase
      .from('knowledge_base')
      .select('id', { count: 'exact' })
      .eq('project_id', project.id)
      .eq('is_active', true);
    if ((kbCount || 0) === 0) continue;

    // Check not already scheduled recently
    const hasPending = await hasRecentAnalyticsTask(project.id, 'suggest_topics', 48);
    if (hasPending) continue;

    await createTask(project.id, 'suggest_topics', {
      auto_scheduled: true,
      reason: 'friday_weekly_topics',
    }, { priority: 2 });
    scheduled++;
  }

  if (scheduled > 0) {
    await supabase.from('agent_log').insert({
      action: 'friday_topic_suggestions',
      details: { scheduled, timestamp: new Date().toISOString() },
    });
  }

  return scheduled;
}

// ============================================
// Cross-Project Dedup: pgvector similarity check
// ============================================

export async function crossProjectDedupCheck(
  projectId: string,
  postText: string,
  options: { threshold?: number; limit?: number } = {},
): Promise<{
  is_unique: boolean;
  max_similarity: number;
  similar_posts: Array<{ project_id: string; project_name: string; text_preview: string; similarity: number }>;
}> {
  if (!supabase) return { is_unique: true, max_similarity: 0, similar_posts: [] };

  const threshold = options.threshold || 0.85;
  const limit = options.limit || 5;

  try {
    // Generate embedding for the post text
    const { embed } = await import('ai');
    const { google } = await import('@ai-sdk/google');
    const { embedding } = await embed({
      model: google.textEmbeddingModel('text-embedding-004'),
      value: postText.substring(0, 2000),
    });

    // Search across ALL projects (excluding current)
    const { data: similar } = await supabase.rpc('match_posts_cross_project', {
      query_embedding: JSON.stringify(embedding),
      exclude_project_id: projectId,
      match_threshold: threshold - 0.15, // Lower threshold to catch near-duplicates
      match_count: limit,
    });

    if (!similar || similar.length === 0) {
      return { is_unique: true, max_similarity: 0, similar_posts: [] };
    }

    const maxSim = Math.max(...similar.map((s: { similarity: number }) => s.similarity));

    return {
      is_unique: maxSim < threshold,
      max_similarity: maxSim,
      similar_posts: similar.map((s: { project_id: string; project_name: string; text_content: string; similarity: number }) => ({
        project_id: s.project_id,
        project_name: s.project_name || 'Unknown',
        text_preview: (s.text_content || '').substring(0, 200),
        similarity: s.similarity,
      })),
    };
  } catch {
    // pgvector RPC may not exist yet – fail open
    return { is_unique: true, max_similarity: 0, similar_posts: [] };
  }
}

// ============================================
// A/B Variants: Trigger variant generation for a post
// ============================================

export async function triggerABVariants(
  postId: string,
): Promise<string | null> {
  if (!supabase) return null;

  const { data: post } = await supabase
    .from('content_queue')
    .select('id, project_id, text_content, content_type, target_platform')
    .eq('id', postId)
    .single();

  if (!post) return null;

  return createTask(post.project_id, 'generate_ab_variants', {
    original_text: post.text_content,
    platform: post.target_platform || 'facebook',
    content_type: post.content_type,
    source_post_id: postId,
  }, { priority: 4 });
}

// ============================================
// Engagement Metrics: Fetch & store from getLate.dev
// ============================================

export async function fetchEngagementMetrics(): Promise<{
  posts_checked: number;
  metrics_updated: number;
}> {
  if (!supabase) return { posts_checked: 0, metrics_updated: 0 };

  // Get recently sent posts that don't have engagement data yet
  const { data: posts } = await supabase
    .from('content_queue')
    .select('id, project_id, late_post_id, sent_at')
    .eq('status', 'sent')
    .not('late_post_id', 'is', null)
    .is('engagement_metrics', null)
    .order('sent_at', { ascending: false })
    .limit(50);

  if (!posts || posts.length === 0) return { posts_checked: 0, metrics_updated: 0 };

  let metricsUpdated = 0;

  try {
    const { lateRequest } = await import('@/lib/getlate');

    for (const post of posts) {
      // Only check posts older than 24h (give time for engagement)
      const sentAt = new Date(post.sent_at);
      if (Date.now() - sentAt.getTime() < 24 * 60 * 60 * 1000) continue;

      try {
        const latePost = await lateRequest<{
          post: {
            _id: string;
            platforms: Array<{
              platform: string;
              metrics?: {
                likes?: number;
                comments?: number;
                shares?: number;
                impressions?: number;
                clicks?: number;
                reach?: number;
              };
            }>;
          };
        }>(`/posts/${post.late_post_id}`);

        if (latePost?.post?.platforms) {
          const metrics: Record<string, unknown> = {};
          let totalEngagement = 0;

          for (const p of latePost.post.platforms) {
            if (p.metrics) {
              metrics[p.platform] = p.metrics;
              totalEngagement += (p.metrics.likes || 0) + (p.metrics.comments || 0) * 3 + (p.metrics.shares || 0) * 5;
            }
          }

          if (Object.keys(metrics).length > 0) {
            await supabase.from('content_queue').update({
              engagement_metrics: metrics,
              engagement_score: totalEngagement,
            }).eq('id', post.id);
            metricsUpdated++;
          }
        }
      } catch {
        // Individual post fetch failed, continue
      }
    }
  } catch {
    // getLate import or API failed
  }

  if (metricsUpdated > 0) {
    await supabase.from('agent_log').insert({
      action: 'fetch_engagement_metrics',
      details: { posts_checked: posts.length, metrics_updated: metricsUpdated, timestamp: new Date().toISOString() },
    });
  }

  return { posts_checked: posts.length, metrics_updated: metricsUpdated };
}

// ============================================
// Performance Optimization: Learn from engagement data
// ============================================

export async function optimizeFromEngagement(projectId: string): Promise<void> {
  if (!supabase) return;

  // Get posts with engagement data
  const { data: posts } = await supabase
    .from('content_queue')
    .select('content_type, target_platform, ai_scores, engagement_metrics, engagement_score, generation_context')
    .eq('project_id', projectId)
    .not('engagement_score', 'is', null)
    .order('sent_at', { ascending: false })
    .limit(30);

  if (!posts || posts.length < 5) return; // Need enough data

  // Analyze: which content types / platforms / hooks perform best?
  const analysis: Record<string, { total_engagement: number; count: number; avg_score: number }> = {};

  for (const post of posts) {
    const key = `${post.content_type}_${post.target_platform}`;
    if (!analysis[key]) analysis[key] = { total_engagement: 0, count: 0, avg_score: 0 };
    analysis[key].total_engagement += (post.engagement_score as number) || 0;
    analysis[key].count++;
    analysis[key].avg_score += ((post.ai_scores as Record<string, number>)?.overall || 0);
  }

  // Calculate averages
  for (const key of Object.keys(analysis)) {
    analysis[key].avg_score = analysis[key].avg_score / analysis[key].count;
  }

  // Find best and worst performers
  const sorted = Object.entries(analysis).sort((a, b) =>
    (b[1].total_engagement / b[1].count) - (a[1].total_engagement / a[1].count)
  );

  const bestPerformers = sorted.slice(0, 3).map(([key, data]) => ({
    type_platform: key,
    avg_engagement: Math.round(data.total_engagement / data.count),
    count: data.count,
    avg_ai_score: Math.round(data.avg_score * 10) / 10,
  }));

  const worstPerformers = sorted.slice(-3).map(([key, data]) => ({
    type_platform: key,
    avg_engagement: Math.round(data.total_engagement / data.count),
    count: data.count,
    avg_ai_score: Math.round(data.avg_score * 10) / 10,
  }));

  // AI score vs engagement correlation
  const scores = posts.map(p => ({
    ai: (p.ai_scores as Record<string, number>)?.overall || 0,
    eng: (p.engagement_score as number) || 0,
  }));
  const avgAI = scores.reduce((s, p) => s + p.ai, 0) / scores.length;
  const avgEng = scores.reduce((s, p) => s + p.eng, 0) / scores.length;
  let correlation = 0;
  let varAI = 0;
  let varEng = 0;
  for (const s of scores) {
    correlation += (s.ai - avgAI) * (s.eng - avgEng);
    varAI += (s.ai - avgAI) ** 2;
    varEng += (s.eng - avgEng) ** 2;
  }
  const r = varAI > 0 && varEng > 0 ? correlation / Math.sqrt(varAI * varEng) : 0;

  await upsertAgentMemory(projectId, 'performance_insights', {
    best_performers: bestPerformers,
    worst_performers: worstPerformers,
    ai_engagement_correlation: Math.round(r * 100) / 100,
    total_posts_analyzed: posts.length,
    recommendations: [
      bestPerformers[0] ? `Nejlepší: ${bestPerformers[0].type_platform} (avg engagement: ${bestPerformers[0].avg_engagement})` : null,
      worstPerformers[0] ? `Nejhorší: ${worstPerformers[0].type_platform} (avg engagement: ${worstPerformers[0].avg_engagement})` : null,
      r > 0.5 ? 'AI skóre dobře koreluje s engagementem – scoring funguje.' : 'AI skóre špatně koreluje s engagementem – potřeba rekalibrovat scoring.',
    ].filter(Boolean),
    analyzed_at: new Date().toISOString(),
  });
}

// ============================================
// Embed Posts: Generate embeddings for cross-project dedup
// ============================================

export async function embedPostsForDedup(limit: number = 20): Promise<{
  embedded: number;
  failed: number;
}> {
  if (!supabase) return { embedded: 0, failed: 0 };

  // Get posts that need embedding
  const { data: posts } = await supabase
    .from('content_queue')
    .select('id, text_content')
    .eq('needs_embedding', true)
    .is('embedding', null)
    .not('text_content', 'is', null)
    .limit(limit);

  if (!posts || posts.length === 0) return { embedded: 0, failed: 0 };

  let embedded = 0;
  let failed = 0;

  try {
    const { embed } = await import('ai');
    const { google } = await import('@ai-sdk/google');

    for (const post of posts) {
      try {
        const { embedding } = await embed({
          model: google.textEmbeddingModel('text-embedding-004'),
          value: (post.text_content as string).substring(0, 2000),
        });

        await supabase.from('content_queue').update({
          embedding: JSON.stringify(embedding),
          needs_embedding: false,
        }).eq('id', post.id);

        embedded++;
      } catch {
        await supabase.from('content_queue').update({
          needs_embedding: false, // Don't retry failed ones
        }).eq('id', post.id);
        failed++;
      }
    }
  } catch {
    // Import failed
  }

  return { embedded, failed };
}
