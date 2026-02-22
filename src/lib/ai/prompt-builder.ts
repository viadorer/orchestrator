/**
 * Modular Prompt Builder (Lego systém)
 * 
 * Sestavuje prompt z komponent:
 * 1. Globální šablony (prompt_templates) – platí pro všechny projekty
 * 2. Per-project šablony (project_prompt_templates) – detailní instrukce per projekt
 * 3. Dynamický kontext (KB, pattern, news, dedup)
 * 
 * Variable substitution: {{PROJECT_NAME}}, {{TONE}}, {{PLATFORM}}, atd.
 */

import { supabase } from '@/lib/supabase/client';
import { buildPlatformPromptBlock, PLATFORM_LIMITS, getDefaultImageSpec } from '@/lib/platforms';

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
  contentMix?: Record<string, number>;
  semanticAnchors: string[];
  websiteUrl?: string;
  // Knowledge base entries
  kbEntries: Array<{ category: string; title: string; content: string }>;
  // Recent posts for dedup context
  recentPosts?: string[];
  // News context (Contextual Pulse)
  newsContext?: string;
  // Used KB entries to avoid repetition
  usedKbIds?: string[];
}

// ============================================
// Load global prompt template by slug
// ============================================

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

// ============================================
// Load per-project prompt templates
// ============================================

export async function getProjectPrompts(projectId: string, category?: string): Promise<Array<{ slug: string; category: string; content: string }>> {
  if (!supabase) return [];
  let query = supabase
    .from('project_prompt_templates')
    .select('slug, category, content')
    .eq('project_id', projectId)
    .eq('is_active', true)
    .order('sort_order');

  if (category) query = query.eq('category', category);

  const { data } = await query;
  return data || [];
}

// ============================================
// Variable substitution in prompt templates
// ============================================

function substituteVariables(template: string, ctx: PromptContext): string {
  const mix = ctx.contentMix || { educational: 0.66, soft_sell: 0.17, hard_sell: 0.17 };
  const styleRules = ctx.styleRules as Record<string, unknown>;

  const vars: Record<string, string> = {
    '{{PROJECT_NAME}}': ctx.projectName,
    '{{PLATFORM}}': ctx.platform,
    '{{CONTENT_TYPE}}': ctx.contentType,
    '{{TONE}}': ctx.moodSettings.tone,
    '{{ENERGY}}': ctx.moodSettings.energy,
    '{{STYLE}}': ctx.moodSettings.style,
    '{{SEMANTIC_ANCHORS}}': ctx.semanticAnchors.join(', ') || 'Nejsou definovány',
    '{{WEBSITE_URL}}': ctx.websiteUrl || '',
    '{{FORBIDDEN_TOPICS}}': ctx.constraints.forbidden_topics.length > 0
      ? ctx.constraints.forbidden_topics.map(t => `- ${t}`).join('\n')
      : '- Žádná specifická omezení',
    '{{MANDATORY_TERMS}}': ctx.constraints.mandatory_terms.length > 0
      ? ctx.constraints.mandatory_terms.map(t => `- ${t}`).join('\n')
      : '- Žádné povinné termíny',
    '{{MAX_HASHTAGS}}': String(ctx.constraints.max_hashtags || 5),
    '{{MAX_LENGTH}}': String(styleRules?.max_length || 2200),
    '{{MAX_BULLETS}}': String(styleRules?.max_bullets || 3),
    '{{CONTENT_MIX_EDUCATIONAL}}': String(Math.round((mix.educational || 0) * 100)),
    '{{CONTENT_MIX_SOFT}}': String(Math.round((mix.soft_sell || 0) * 100)),
    '{{CONTENT_MIX_HARD}}': String(Math.round((mix.hard_sell || 0) * 100)),
  };

  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(key, value);
  }

  // Conditional blocks: {{#FLAG}}content{{/FLAG}}
  const startQ = styleRules?.start_with_question;
  const noHash = styleRules?.no_hashtags_in_text;

  result = result.replace(/\{\{#START_WITH_QUESTION\}\}([\s\S]*?)\{\{\/START_WITH_QUESTION\}\}/g,
    startQ ? '$1' : '');
  result = result.replace(/\{\{#NO_HASHTAGS_IN_TEXT\}\}([\s\S]*?)\{\{\/NO_HASHTAGS_IN_TEXT\}\}/g,
    noHash ? '$1' : '');

  return result;
}

// ============================================
// Build complete content prompt
// ============================================

export async function buildContentPrompt(ctx: PromptContext): Promise<string> {
  const parts: string[] = [];

  // 1. Load per-project prompts (the detailed instructions)
  const projectPrompts = await getProjectPrompts(ctx.projectId);

  if (projectPrompts.length > 0) {
    // ---- PROJECT HAS CUSTOM PROMPTS ----
    // Use per-project prompts as the primary instruction set

    // Group by category for ordered assembly
    const byCategory = new Map<string, string[]>();
    for (const pp of projectPrompts) {
      const content = substituteVariables(pp.content, ctx);
      if (!byCategory.has(pp.category)) byCategory.set(pp.category, []);
      byCategory.get(pp.category)!.push(content);
    }

    // Assembly order (most important first)
    const categoryOrder = [
      'identity', 'communication', 'guardrail', 'business_rules',
      'content_strategy', 'topic_boundaries', 'cta_rules',
      'quality_criteria', 'personalization', 'examples',
      'seasonal', 'competitor', 'legal',
    ];

    // Add project prompts in order
    for (const cat of categoryOrder) {
      const entries = byCategory.get(cat);
      if (entries) {
        for (const entry of entries) {
          parts.push(entry);
        }
      }
    }

    // Platform-specific rules (only for current platform)
    const platformPrompts = byCategory.get('platform_rules') || [];
    for (const pp of projectPrompts.filter(p => p.category === 'platform_rules')) {
      if (pp.slug.includes(ctx.platform) || pp.slug === 'platform_rules') {
        parts.push(substituteVariables(pp.content, ctx));
      }
    }
    // If no platform-specific prompt matched, include all platform_rules
    if (platformPrompts.length === 0) {
      // no-op, already handled
    }

  } else {
    // ---- NO CUSTOM PROMPTS – FALLBACK TO GLOBAL ----
    const systemRole = await getPromptTemplate('system_role');
    parts.push(systemRole || 'Jsi Hugo – AI content orchestrátor. Tvým úkolem je vytvářet autentický obsah pro sociální sítě.');

    parts.push(`\n---\nPROJEKT: ${ctx.projectName}`);
    parts.push(`PLATFORMA: ${ctx.platform}`);
    parts.push(`TYP OBSAHU: ${ctx.contentType}`);

    parts.push(`\nTÓN KOMUNIKACE:`);
    parts.push(`- Tón: ${ctx.moodSettings.tone}`);
    parts.push(`- Energie: ${ctx.moodSettings.energy}`);
    parts.push(`- Styl: ${ctx.moodSettings.style}`);

    parts.push(`\nPRAVIDLA FORMÁTU:`);
    for (const [key, value] of Object.entries(ctx.styleRules)) {
      parts.push(`- ${key}: ${value}`);
    }

    if (ctx.constraints.forbidden_topics.length > 0) {
      parts.push(`\nZAKÁZANÁ TÉMATA: ${ctx.constraints.forbidden_topics.join(', ')}`);
    }
    if (ctx.constraints.mandatory_terms.length > 0) {
      parts.push(`POVINNÉ TERMÍNY: ${ctx.constraints.mandatory_terms.join(', ')}`);
    }
    if (ctx.semanticAnchors.length > 0) {
      parts.push(`\nKLÍČOVÁ SLOVA: ${ctx.semanticAnchors.join(', ')}`);
    }
  }

  // ---- ALWAYS APPENDED (regardless of custom prompts) ----

  // Knowledge Base
  if (ctx.kbEntries.length > 0) {
    parts.push('\n---\nKNOWLEDGE BASE (používej POUZE tato fakta, NEVYMÝŠLEJ SI):');
    for (const entry of ctx.kbEntries) {
      parts.push(`[${entry.category}] ${entry.title}: ${entry.content}`);
    }
  }

  // Content Pattern
  if (ctx.patternTemplate) {
    parts.push(`\n---\nVZOR PŘÍSPĚVKU (dodržuj tuto strukturu):\n${ctx.patternTemplate}`);
  }

  // Task context
  parts.push(`\n---\nÚKOL: Vytvoř příspěvek pro ${ctx.platform}.`);
  parts.push(`Typ: ${ctx.contentType}`);

  // Platform-specific content generation specs
  parts.push(buildPlatformPromptBlock(ctx.platform));

  // News Context
  if (ctx.newsContext) {
    parts.push(`\n---\nAKTUÁLNÍ KONTEXT:\n${ctx.newsContext}`);
  }

  // Dedup – ALL existing posts
  if (ctx.recentPosts && ctx.recentPosts.length > 0) {
    parts.push(`\n---\nEXISTUJÍCÍ POSTY (tyto texty už EXISTUJÍ – NESMÍŠ je opakovat ani parafrázovat):`);
    ctx.recentPosts.forEach((post, i) => {
      parts.push(`${i + 1}. "${post.substring(0, 200)}${post.length > 200 ? '...' : ''}"`);
    });
    parts.push('\nKAŽDÝ nový post MUSÍ být o JINÉM tématu, s JINÝM hookem, JINOU strukturou.');
    parts.push('Pokud všechny KB fakta už byly použity, najdi NOVÝ ÚHEL na stejné téma.');
  }

  // Creativity rules
  parts.push(`\n---\nKREATIVITA – POVINNÁ PRAVIDLA:
1. HOOK: Každý post MUSÍ začínat jinak. Střídej typy hooků:
   - Číslo/statistika ("1,37." / "20 736 Kč.")
   - Provokativní otázka ("Co když váš důchod nebude stačit?")
   - Kontrastní tvrzení ("Všichni mluví o úsporách. Nikdo o příjmech.")
   - Příběh/scénář ("Představte si, že je vám 65...")
   - Citát/výrok ("Průměrný Čech spoří 2 400 Kč měsíčně.")
   - Metafora ("Důchod je maraton, ne sprint.")
2. STRUKTURA: Střídej formáty – ne vždy číslo→kontext→řešení→CTA.
3. ÚHEL: Použij KB fakta, která NEBYLA v posledních postech.
4. ORIGINALITA: Neopakuj fráze z předchozích postů.
5. HODNOTA: Každý post musí přinést NOVOU informaci nebo NOVÝ pohled.`);

  // Quality Self-Rating
  const qualityCheck = await getPromptTemplate('quality_check');
  if (qualityCheck) {
    parts.push(`\n---\n${qualityCheck}`);
  }

  // Output format – include image_spec from platform
  const defaultImg = getDefaultImageSpec(ctx.platform);
  const imgSpecExample = defaultImg
    ? `{ "width": ${defaultImg.width}, "height": ${defaultImg.height}, "aspectRatio": "${defaultImg.aspectRatio}" }`
    : '{ "width": 1200, "height": 630, "aspectRatio": "1.91:1" }';

  const platformLimits = PLATFORM_LIMITS[ctx.platform];
  const emojiRule = '- ABSOLUTNĚ ŽÁDNÉ emotikony/emoji v textu. Emoji jsou ZAKÁZANÉ. Nikdy nepoužívej Unicode emoji symboly.';

  const hashtagRule = platformLimits?.contentSpec.hashtagPlacement === 'none'
    ? '- ŽÁDNÉ hashtagy (#) v textu'
    : platformLimits?.contentSpec.hashtagPlacement === 'inline'
      ? `- Hashtagy: max ${platformLimits.maxHashtags} INLINE v textu (ne na konci)`
      : `- Hashtagy: max ${platformLimits?.maxHashtags || 5} na KONCI textu (ne v textu)`;

  // Load per-project visual style templates (if any)
  const visualStylePrompts = await getProjectPrompts(ctx.projectId, 'visual_style');
  if (visualStylePrompts.length > 0) {
    parts.push('\n---\nVIZUÁLNÍ STYL ZNAČKY (dodržuj při tvorbě image_prompt):');
    for (const vsp of visualStylePrompts) {
      parts.push(substituteVariables(vsp.content, ctx));
    }
  }

  const supportsFirstComment = ['facebook', 'instagram', 'linkedin'].includes(ctx.platform);
  const firstCommentInstruction = supportsFirstComment && ctx.websiteUrl
    ? `  "first_comment": "Krátké CTA + odkaz (POUZE pokud post má CTA). Max 1 věta. Např: 'Kompletní průvodce: ${ctx.websiteUrl}/prirucka' nebo null pokud post nemá CTA.",`
    : '';

  parts.push(`\n---\nVÝSTUP: Vrať POUZE JSON objekt (žádný další text, žádný markdown, žádný \`\`\`json wrapper):
{
  "text": "Čistý text příspěvku optimalizovaný pro ${ctx.platform}. Délka: ${platformLimits?.optimalChars || 500} znaků.",
${firstCommentInstruction}
  "image_prompt": "DETAILED English scene description – see rules below",
  "image_spec": ${imgSpecExample},
  "alt_text": "Alt text pro obrázek v češtině (volitelné)",
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
${emojiRule}
- ŽÁDNÉ URL odkazy v textu (odkazy POUZE v first_comment pokud je podporován)
- Text musí fungovat sám o sobě jako čistý příspěvek
- Text MUSÍ mít délku kolem ${platformLimits?.optimalChars || 500} znaků (max ${platformLimits?.maxChars || 2200})${supportsFirstComment ? `

FIRST COMMENT (${ctx.platform}):
- Generuj POUZE pokud post obsahuje CTA (lead magnet, checklist, konzultace, průvodce)
- Pokud post je čistě edukační BEZ CTA → first_comment vynech (null)
- Formát: "Krátké CTA: ${ctx.websiteUrl}/konkretni-stranka"
- Max 1 věta + 1 URL
- Příklady:
  ✅ "Kompletní průvodce ke stažení: ${ctx.websiteUrl}/prirucka"
  ✅ "Checklist zdarma: ${ctx.websiteUrl}/checklist"
  ✅ "Rezervace konzultace: ${ctx.websiteUrl}/kontakt"
  ❌ "Klikněte na odkaz v bio" (to je pro Stories, ne feed)` : ''}

PRAVIDLA PRO image_prompt (KRITICKÉ – čti pozorně):
- MUSÍ být v angličtině
- Piš jako FILMOVÝ REŽISÉR popisující záběr pro kameramana:
  ✅ "Close-up of a young Czech couple reviewing mortgage papers at a kitchen table, morning sunlight streaming through window, coffee cups, shallow depth of field, warm tones"
  ✅ "Aerial view of Prague residential neighborhood at golden hour, mix of old and new buildings, warm autumn light, slight haze"
  ✅ "Weathered hands of elderly man holding a savings book, soft window light, bokeh background of family photos on shelf"
  ❌ "Professional photo of happy family" (příliš generické)
  ❌ "Business meeting in office" (stock photo klišé)
  ❌ "Financial planning concept" (abstraktní, ne vizuální)
- Popisuj KONKRÉTNÍ scénu: KDO (věk, vzhled, co dělá), KDE (místo, prostředí, detaily), JAK (osvětlení, nálada, úhel záběru)
- Zaměř se na EMOCI a AUTENTICITU – reální lidé v reálných situacích
- Přidej technické detaily: typ záběru (close-up, wide, aerial), hloubka ostrosti, osvětlení
- Aspect ratio: ${defaultImg?.aspectRatio || '1.91:1'}`);

  // Strip markdown code blocks from response (Gemini sometimes wraps in ```json)

  return parts.join('\n');
}
