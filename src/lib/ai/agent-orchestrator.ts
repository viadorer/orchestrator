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
import { findMatchingMedia, markMediaUsed } from '@/lib/ai/vision-engine';
import { getRelevantNews } from '@/lib/rss/fetcher';
import { getNextContentType } from './content-engine';
import { hugoEditorReview } from './hugo-editor';
import { getDefaultImageSpec } from '@/lib/platforms';

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
  | 'generate_ab_variants';

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
      parts.push(`\n---\nÚKOL: REAKCE NA NOVINKU`);
      parts.push(`Titulek: ${newsTitle}`);
      parts.push(`Shrnutí: ${newsSummary}`);
      parts.push(`\nVytvoř post, který propojí tuto novinku s KB fakty projektu. Cituj zdroj.`);
      parts.push('Vrať JSON: {"text": "...", "image_prompt": "...", "scores": {...}}');
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
      let visualData: { visual_type: string; chart_url: string | null; card_url: string | null; image_prompt: string | null; generated_image_url?: string | null; media_asset_id?: string | null } = {
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
          projectId: task.project_id,
          logoUrl: (visualIdentity as Record<string, string>).logo_url || null,
        });
      } catch {
        // Visual generation failed, continue without
      }

      // ---- Media: Imagen generated > Media Library match > none ----
      let matchedImageUrl: string | null = visualData.generated_image_url || null;
      let matchedMediaId: string | null = visualData.media_asset_id || null;

      // If Imagen didn't generate, try Media Library matching (pgvector)
      if (!matchedImageUrl && mediaStrategy === 'auto') {
        try {
          const matches = await findMatchingMedia(task.project_id, result.text as string, {
            limit: 5,
            fileType: 'image',
            excludeRecentlyUsed: true,
          });
          if (matches.length > 0) {
            const best = matches[0];
            matchedImageUrl = best.public_url;
            matchedMediaId = best.id;
            await markMediaUsed(best.id);
          }
        } catch {
          // Media matching failed, continue without
        }
      }

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
          : `4-1-1 rule: ${resolvedContentType} selected by getNextContentType`,
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
        visual_type: matchedImageUrl ? 'matched_photo' : visualData.visual_type,
        chart_url: visualData.chart_url || null,
        card_url: visualData.card_url || null,
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

    // 8. Schedule content generation – one task per platform, linked by content_group_id
    const platforms = config.platforms_priority.length > 0
      ? config.platforms_priority
      : (project.platforms as string[]) || ['facebook'];

    // Check if we can generate at least one content group today
    const remainingSlots = config.max_posts_per_day - (todayCount || 0);
    if (remainingSlots <= 0) { skip('daily_limit_reached'); continue; }

    // Generate one content group (= one topic, N platform variants)
    const contentGroupId = randomUUID();
    const staggerBase = Math.floor(Math.random() * 13) + 2 + (scheduled * 5);

    for (let i = 0; i < platforms.length; i++) {
      const platform = platforms[i];
      // Stagger tasks: spread across time so they don't all hit AI at once
      const staggerMinutes = staggerBase + (i * 2);
      const scheduledFor = new Date(Date.now() + staggerMinutes * 60 * 1000);
      await createTask(project.id, 'generate_content', {
        platform,
        content_group_id: contentGroupId,
        auto_scheduled: true,
        media_strategy: config.media_strategy,
        auto_publish: config.auto_publish,
        auto_publish_threshold: config.auto_publish_threshold,
      }, { priority: 3, scheduledFor: scheduledFor.toISOString() });
      scheduled++;
    }

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
  const { publishPost, buildPlatformsArray } = await import('@/lib/getlate');
  const { validatePostMultiPlatform } = await import('@/lib/platforms');

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
      // Build media items
      const mediaItems: Array<{ type: 'image' | 'video' | 'document'; url: string }> = [];
      if (post.chart_url) mediaItems.push({ type: 'image', url: post.chart_url });
      if (post.card_url && post.card_url.startsWith('http')) mediaItems.push({ type: 'image', url: post.card_url });
      if (post.image_url) mediaItems.push({ type: 'image', url: post.image_url });

      // Enforce aspect ratio for platform compliance (Instagram: 0.75-1.91)
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

      const lateResult = await publishPost({
        content: post.text_content,
        platforms: platformEntries,
        mediaItems: mediaItems.length > 0 ? mediaItems : undefined,
        timezone: 'Europe/Prague',
      });

      // Update status
      await supabase.from('content_queue').update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        late_post_id: lateResult._id,
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
