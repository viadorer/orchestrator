/**
 * Modular Prompt Builder (Lego systém)
 * 
 * Sestavuje prompt z komponent:
 * {{System_Role}} + {{Project_KB}} + {{Tone_of_Voice}} + {{Pattern}} + {{Context}}
 */

import { supabase } from '@/lib/supabase/client';

export interface PromptContext {
  projectId: string;
  projectName: string;
  contentType: 'educational' | 'soft_sell' | 'hard_sell' | 'news' | 'engagement';
  patternTemplate?: string;
  platform: string;
  // Project settings
  moodSettings: { tone: string; energy: string; style: string };
  styleRules: Record<string, unknown>;
  constraints: { forbidden_topics: string[]; mandatory_terms: string[]; max_hashtags: number };
  semanticAnchors: string[];
  // Knowledge base entries
  kbEntries: Array<{ category: string; title: string; content: string }>;
  // Recent posts for dedup context
  recentPosts?: string[];
  // News context (Contextual Pulse)
  newsContext?: string;
  // Used KB entries to avoid repetition
  usedKbIds?: string[];
}

export async function getPromptTemplate(slug: string): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase
    .from('prompt_templates')
    .select('content')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();
  return data?.content ?? null;
}

export async function buildContentPrompt(ctx: PromptContext): Promise<string> {
  const parts: string[] = [];

  // 1. System Role
  const systemRole = await getPromptTemplate('system_role');
  parts.push(systemRole || 'Jsi Hugo – AI content orchestrátor. Tvým úkolem je vytvářet autentický obsah pro sociální sítě.');

  // 2. Project Context
  parts.push(`\n---\nPROJEKT: ${ctx.projectName}`);
  parts.push(`PLATFORMA: ${ctx.platform}`);
  parts.push(`TYP OBSAHU: ${ctx.contentType}`);

  // 3. Tone of Voice (Mood Settings)
  parts.push(`\nTÓN KOMUNIKACE:`);
  parts.push(`- Tón: ${ctx.moodSettings.tone}`);
  parts.push(`- Energie: ${ctx.moodSettings.energy}`);
  parts.push(`- Styl: ${ctx.moodSettings.style}`);

  // 4. Style Sheet
  parts.push(`\nPRAVIDLA FORMÁTU:`);
  for (const [key, value] of Object.entries(ctx.styleRules)) {
    parts.push(`- ${key}: ${value}`);
  }

  // 5. Constraints (Safe/Ban List)
  if (ctx.constraints.forbidden_topics.length > 0) {
    parts.push(`\nZAKÁZANÁ TÉMATA (NIKDY o nich nepiš): ${ctx.constraints.forbidden_topics.join(', ')}`);
  }
  if (ctx.constraints.mandatory_terms.length > 0) {
    parts.push(`POVINNÉ TERMÍNY (použij alespoň jeden): ${ctx.constraints.mandatory_terms.join(', ')}`);
  }

  // 6. Semantic Anchors
  if (ctx.semanticAnchors.length > 0) {
    parts.push(`\nKLÍČOVÁ SLOVA PROJEKTU: ${ctx.semanticAnchors.join(', ')}`);
  }

  // 7. Knowledge Base
  if (ctx.kbEntries.length > 0) {
    parts.push('\n---\nZNALOSTNÍ BÁZE (používej POUZE tato fakta, nevymýšlej si):');
    for (const entry of ctx.kbEntries) {
      parts.push(`[${entry.category}] ${entry.title}: ${entry.content}`);
    }
  }

  // 8. Content Pattern
  if (ctx.patternTemplate) {
    parts.push(`\n---\nVZOR PŘÍSPĚVKU (dodržuj tuto strukturu):\n${ctx.patternTemplate}`);
  }

  // 9. News Context (Contextual Pulse)
  if (ctx.newsContext) {
    parts.push(`\n---\nAKTUÁLNÍ KONTEXT (použij pokud je relevantní):\n${ctx.newsContext}`);
  }

  // 10. Dedup - recent posts
  if (ctx.recentPosts && ctx.recentPosts.length > 0) {
    parts.push(`\n---\nNEDÁVNÉ POSTY (NEOPAKUJ podobný obsah):`);
    ctx.recentPosts.forEach((post, i) => {
      parts.push(`${i + 1}. ${post.substring(0, 150)}...`);
    });
  }

  // 11. Quality Self-Rating instruction
  const qualityCheck = await getPromptTemplate('quality_check');
  if (qualityCheck) {
    parts.push(`\n---\n${qualityCheck}`);
  }

  // 12. Output format
  parts.push(`\n---\nVÝSTUP: Vrať JSON objekt s těmito poli:
{
  "text": "Text příspěvku",
  "image_prompt": "Popis obrázku pro generování (volitelné)",
  "alt_text": "Alt text pro obrázek (volitelné)",
  "scores": {
    "creativity": 1-10,
    "tone_match": 1-10,
    "hallucination_risk": 1-10,
    "value_score": 1-10,
    "overall": 1-10
  }
}`);

  return parts.join('\n');
}
