/**
 * Hugo-Editor: Self-correction (2nd AI pass)
 * 
 * Extracted to its own module to avoid circular dependencies
 * between agent-orchestrator and content-engine.
 * 
 * Per-project: načítá guardrails, quality_criteria,
 * editor_rules a examples z project_prompt_templates
 */

import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { supabase } from '@/lib/supabase/client';
import { getProjectPrompts } from './prompt-builder';
import { PLATFORM_LIMITS } from '@/lib/platforms';

// Shared context interface for Hugo-Editor
export interface EditorContext {
  project: Record<string, unknown>;
  kbEntries: Array<{ category: string; title: string; content: string }>;
  feedbackHistory: Array<{ original_text: string; edited_text: string; feedback_note: string }>;
}

export async function hugoEditorReview(
  text: string,
  ctx: EditorContext,
  platform: string
): Promise<{ improved_text: string; editor_scores: Record<string, number>; changes: string[] }> {
  const project = ctx.project;
  const projectId = project.id as string;
  const mood = project.mood_settings as Record<string, string>;

  // Load per-project editor instructions from DB
  const [guardrails, qualityCriteria, editorRules, examples] = await Promise.all([
    getProjectPrompts(projectId, 'guardrail'),
    getProjectPrompts(projectId, 'quality_criteria'),
    getProjectPrompts(projectId, 'editor_rules'),
    getProjectPrompts(projectId, 'examples'),
  ]);

  // Build editor prompt dynamically from per-project templates
  const parts: string[] = [];

  parts.push(`Jsi Hugo-Editor – kontrolor kvality obsahu pro projekt "${project.name}".
Tvůj úkol: zkontrolovat post, ohodnotit ho a pokud nesplňuje standardy, PŘEPSAT ho.
Jsi PŘÍSNÝ. Jsi NESMLOUVAVÝ. Kvalita je vše.`);

  parts.push(`\nPLATFORMA: ${platform}`);
  parts.push(`TÓN: ${mood?.tone || 'professional'} | ENERGIE: ${mood?.energy || 'medium'} | STYL: ${mood?.style || 'informative'}`);

  // Platform-specific limits for the editor to validate against
  const platformLimits = PLATFORM_LIMITS[platform];
  if (platformLimits) {
    parts.push(`\nLIMITY PLATFORMY ${platformLimits.name.toUpperCase()}:`);
    parts.push(`- Max délka: ${platformLimits.maxChars} znaků, optimální: ${platformLimits.optimalChars} znaků`);
    parts.push(`- Viditelných před oříznutím: ${platformLimits.visibleChars} znaků`);
    parts.push(`- Hashtagy: max ${platformLimits.maxHashtags}, umístění: ${platformLimits.contentSpec.hashtagPlacement}`);
    parts.push(`- Emoji: ${platformLimits.contentSpec.emojiPolicy}`);
    parts.push(`- Tón: ${platformLimits.contentSpec.tone}`);
    parts.push(`- Hook: ${platformLimits.contentSpec.hookStrategy}`);
    parts.push(`KONTROLUJ: Je text v rámci limitu ${platformLimits.optimalChars} znaků? Je hook v prvních ${platformLimits.visibleChars} znacích?`);
  }

  parts.push(`\n---\nPŮVODNÍ POST K REVIEW:\n"""\n${text}\n"""`);

  // Inject per-project guardrails
  if (guardrails.length > 0) {
    parts.push('\n---\nGUARDRAILS PROJEKTU (MUSÍŠ dodržet):');
    for (const g of guardrails) {
      parts.push(g.content);
    }
  }

  // Inject per-project quality criteria
  if (qualityCriteria.length > 0) {
    parts.push('\n---\nKRITÉRIA KVALITY (hodnoť podle nich):');
    for (const q of qualityCriteria) {
      parts.push(q.content);
    }
  }

  // Inject per-project editor-specific rules
  if (editorRules.length > 0) {
    parts.push('\n---\nSPECIFICKÁ PRAVIDLA PRO EDITORA:');
    for (const e of editorRules) {
      parts.push(e.content);
    }
  }

  // Inject examples (good/bad posts)
  if (examples.length > 0) {
    parts.push('\n---\nPŘÍKLADY (referenční vzory):');
    for (const ex of examples) {
      parts.push(ex.content);
    }
  }

  // Inject KB facts for fact-checking
  if (ctx.kbEntries.length > 0) {
    parts.push('\n---\nKNOWLEDGE BASE (ověř fakta proti těmto záznamům):');
    for (const entry of ctx.kbEntries.slice(0, 10)) {
      parts.push(`[${entry.category}] ${entry.title}: ${entry.content.substring(0, 200)}`);
    }
  }

  // Feedback loop
  if (ctx.feedbackHistory.length > 0) {
    parts.push('\n---\nFEEDBACK OD ADMINA (respektuj tyto preference):');
    for (const fb of ctx.feedbackHistory) {
      parts.push(`- Původní: "${fb.original_text.substring(0, 80)}..." → Upraveno: "${fb.edited_text.substring(0, 80)}..."`);
      if (fb.feedback_note) parts.push(`  Poznámka: ${fb.feedback_note}`);
    }
  }

  // Fallback: generic checklist if no per-project templates
  if (guardrails.length === 0 && qualityCriteria.length === 0) {
    parts.push(`\n---\nGENERICKÝ KONTROLNÍ SEZNAM:
1. HOOK: Je první věta dostatečně silná? Zastaví scrollování?
2. HODNOTA: Přináší post konkrétní hodnotu čtenáři?
3. AUTENTICITA: Zní to jako člověk, ne jako AI? Žádné generické fráze?
4. STRUKTURA: Je vizuálně přehledné? Krátké odstavce?
5. CTA: Je výzva k akci přirozená?
6. FAKTA: Jsou všechna tvrzení podložená KB?`);
  }

  parts.push(`\n---\nINSTRUKCE:
- Pokud post splňuje VŠECHNA kritéria (skóre 8+), vrať ho beze změny.
- Pokud má slabiny, PŘEPIŠ ho a vylepši. Buď konkrétní v popisu změn.
- Pokud porušuje guardrails → skóre MAX 4/10 a PŘEPIŠ.
- NIKDY nezhoršuj kvalitu. NIKDY nepřidávej generické fráze.

Vrať POUZE JSON:
{
  "improved_text": "Vylepšený text postu (nebo původní pokud je dobrý)",
  "editor_scores": {"hook": N, "value": N, "authenticity": N, "structure": N, "guardrails": N, "facts": N, "cta": N, "overall": N},
  "changes": ["Popis změny 1", "Popis změny 2"],
  "guardrail_violations": ["Porušení 1"] 
}`);

  const editorPrompt = parts.join('\n');

  const { text: rawResponse, usage } = await generateText({
    model: google('gemini-2.0-flash'),
    prompt: editorPrompt,
    temperature: 0.3,
  });

  // Log editor tokens
  if (supabase && projectId) {
    await supabase.from('agent_log').insert({
      project_id: projectId,
      action: 'hugo_editor_review',
      details: {
        platform,
        guardrails_loaded: guardrails.length,
        quality_criteria_loaded: qualityCriteria.length,
        editor_rules_loaded: editorRules.length,
        feedback_entries: ctx.feedbackHistory.length,
      },
      tokens_used: usage?.totalTokens || 0,
      model_used: 'gemini-2.0-flash',
    });
  }

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
