import { supabase } from '@/lib/supabase/client';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/require-auth';
import { safeParseJson, validateBody, projectCreateSchema } from '@/lib/api/validate';
import { checkRateLimit } from '@/lib/api/rate-limit';

export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const { data, error } = await supabase
    .from('projects')
    .select('*, content_queue(count)')
    .eq('is_active', true)
    .order('name');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const rl = checkRateLimit(auth.userId, 'default');
  if (!rl.ok) return rl.response;

  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const json = await safeParseJson(request);
  if (!json.ok) return json.response;

  const v = validateBody(json.data, projectCreateSchema);
  if (!v.ok) return v.response;

  const body = v.data;

  // ---- Optional: load source project for cloning ----
  // We clone visual identity, prompts, mood, and orchestrator config — but NOT
  // KB content (project-specific) or platform credentials (security boundary).
  let cloneSource: Record<string, unknown> | null = null;
  if (body.clone_from_project_id) {
    const { data: src } = await supabase
      .from('projects')
      .select('mood_settings, content_mix, constraints, style_rules, orchestrator_config, visual_identity, semantic_anchors')
      .eq('id', body.clone_from_project_id)
      .single();
    if (src) cloneSource = src as Record<string, unknown>;
  }

  // Default orchestrator config — Hugo OFF until user explicitly enables it.
  const defaultOrchestrator = {
    enabled: false,
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

  // Merge precedence (lowest → highest): hard defaults → cloned source → request body.
  // The request body wins so explicit user picks during the wizard always stick.
  const finalConstraints = {
    forbidden_topics: body.onboarding?.forbidden_topics ?? [],
    mandatory_terms: body.onboarding?.mandatory_terms ?? [],
    max_hashtags: 5,
    ...((cloneSource?.constraints as Record<string, unknown>) || {}),
    ...(body.constraints || {}),
    // Re-apply onboarding values last so the wizard's lists are not lost when cloning.
    ...(body.onboarding?.forbidden_topics ? { forbidden_topics: body.onboarding.forbidden_topics } : {}),
    ...(body.onboarding?.mandatory_terms ? { mandatory_terms: body.onboarding.mandatory_terms } : {}),
  };

  const { data, error } = await supabase
    .from('projects')
    .insert({
      name: body.name,
      slug: body.slug,
      description: body.description || body.onboarding?.about || null,
      late_social_set_id: body.late_social_set_id || null,
      platforms: body.platforms || ['linkedin'],
      mood_settings:
        body.mood_settings ||
        (cloneSource?.mood_settings as Record<string, unknown>) ||
        { tone: 'professional', energy: 'medium', style: 'informative' },
      content_mix:
        body.content_mix ||
        (cloneSource?.content_mix as Record<string, unknown>) ||
        { educational: 0.66, soft_sell: 0.17, hard_sell: 0.17 },
      constraints: finalConstraints,
      semantic_anchors:
        body.semantic_anchors ||
        (cloneSource?.semantic_anchors as string[]) ||
        [],
      style_rules:
        body.style_rules ||
        (cloneSource?.style_rules as Record<string, unknown>) ||
        { start_with_question: false, max_bullets: 3, no_hashtags_in_text: true, max_length: 2200 },
      visual_identity:
        body.visual_identity ||
        (cloneSource?.visual_identity as Record<string, unknown>) ||
        null,
      orchestrator_config: {
        ...defaultOrchestrator,
        ...((cloneSource?.orchestrator_config as Record<string, unknown>) || {}),
        // Always start a freshly-created project paused so the user can review settings.
        enabled: false,
        auto_publish: false,
      },
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // ---- Starter Kit: prompts + KB ----
  if (data?.id) {
    const projectId = data.id;
    const projectName = body.name || 'Projekt';

    try {
      // If cloning, copy prompt templates from the source project (and rewrite
      // the slugs so they're unique per project). Otherwise seed with the
      // generic starter pack.
      if (body.clone_from_project_id) {
        const { data: srcPrompts } = await supabase
          .from('project_prompt_templates')
          .select('category, content, description, sort_order')
          .eq('project_id', body.clone_from_project_id)
          .eq('is_active', true);

        if (srcPrompts && srcPrompts.length > 0) {
          await supabase.from('project_prompt_templates').insert(
            srcPrompts.map((p, i) => ({
              project_id: projectId,
              slug: `${p.category}_${projectId.slice(0, 8)}_${i}`,
              category: p.category,
              content: p.content,
              description: p.description,
              sort_order: p.sort_order,
            })),
          );
        } else {
          await supabase.from('project_prompt_templates').insert(
            getStarterPrompts(projectId, projectName, body.onboarding),
          );
        }
      } else {
        await supabase.from('project_prompt_templates').insert(
          getStarterPrompts(projectId, projectName, body.onboarding),
        );
      }
    } catch {
      // Starter kit failure should not block project creation
    }

    try {
      // KB is always seeded fresh per project. If the wizard provided onboarding
      // answers, those become real KB entries instead of "VYPLŇTE:" placeholders
      // — saving the user 30+ minutes of manual editing later.
      await supabase.from('knowledge_base').insert(
        getStarterKB(projectId, projectName, body.onboarding),
      );
    } catch {
      // KB starter failure should not block project creation
    }
  }

  return NextResponse.json(data, { status: 201 });
}

// Type alias used by both starter generators below.
type Onboarding = {
  about?: string;
  audience?: string;
  usp?: string;
  forbidden_topics?: string[];
  mandatory_terms?: string[];
};

// ---- Starter Kit: Default prompt templates ----
function getStarterPrompts(projectId: string, projectName: string, onboarding?: Onboarding) {
  // Personalised identity prompt when the wizard collected an "about" answer.
  // Otherwise fall back to a generic UPRAVTE block the user can edit later.
  const identityContent = onboarding?.about
    ? `KDO JSEM:
- Jsem Hugo – AI asistent projektu ${projectName}.
- ${onboarding.about}
- Komunikuji profesionálně, ale přátelsky.
- Vždy mluvím česky s háčky a čárkami.

OSOBNOST:
- Profesionální, ale lidský.
- Mluvím fakty a daty.
- Jsem nápomocný a vstřícný.`
    : `KDO JSEM:
- Jsem Hugo – AI asistent projektu ${projectName}.
- Komunikuji profesionálně, ale přátelsky.
- Vždy mluvím česky s háčky a čárkami.

OSOBNOST:
- Profesionální, ale lidský.
- Mluvím fakty a daty.
- Jsem nápomocný a vstřícný.

UPRAVTE TENTO PROMPT podle identity vašeho projektu.`;

  return [
    {
      project_id: projectId,
      slug: `identity_${projectId.slice(0, 8)}`,
      category: 'identity',
      content: identityContent,
      description: `Identita – kdo je Hugo pro ${projectName}`,
      sort_order: 10,
    },
    {
      project_id: projectId,
      slug: `communication_${projectId.slice(0, 8)}`,
      category: 'communication',
      content: `PRAVIDLA KOMUNIKACE:
- Piš VÝHRADNĚ česky s háčky a čárkami.
- Krátké věty. Max 2-3 věty na odstavec.
- Začínej zajímavým faktem nebo otázkou.

ZAKÁZANÉ FRÁZE:
- "V dnešní době..."
- "Není žádným tajemstvím..."
- Generické fráze bez hodnoty

STRUKTURA POSTU:
1. HOOK: Zajímavý fakt nebo otázka
2. KONTEXT: 2-3 věty vysvětlení
3. HODNOTA: Co si čtenář odnese
4. CTA: Otázka nebo výzva

UPRAVTE TENTO PROMPT podle komunikačního stylu vašeho projektu.`,
      description: `Komunikační pravidla pro ${projectName}`,
      sort_order: 20,
    },
    {
      project_id: projectId,
      slug: `guardrail_${projectId.slice(0, 8)}`,
      category: 'guardrail',
      content: `BEZPEČNOSTNÍ PRAVIDLA:
- NIKDY neslibuj konkrétní výsledky ani garance.
- NIKDY nekritizuj jmenovitě konkurenci.
- NIKDY nepoužívej manipulativní jazyk.
- Vždy buď faktický a ověřitelný.
- Pokud si nejsi jistý informací, NEPOUŽIJ ji.

UPRAVTE TENTO PROMPT podle specifických omezení vašeho projektu.`,
      description: `Guardrails – bezpečnostní pravidla`,
      sort_order: 30,
    },
    {
      project_id: projectId,
      slug: `content_strategy_${projectId.slice(0, 8)}`,
      category: 'content_strategy',
      content: `STRATEGIE OBSAHU:
Content mix: 66 % edukace, 17 % soft-sell, 17 % hard-sell.

PRAVIDLA:
- Střídej typy obsahu – nikdy 2x stejný typ za sebou.
- Každý post musí přinést konkrétní hodnotu čtenáři.
- Edukační obsah buduje důvěru.
- Soft-sell ukazuje řešení.
- Hard-sell vyzývá k akci.

UPRAVTE TENTO PROMPT podle strategie vašeho projektu.`,
      description: `Strategie obsahu pro ${projectName}`,
      sort_order: 40,
    },
    {
      project_id: projectId,
      slug: `platform_linkedin_${projectId.slice(0, 8)}`,
      category: 'platform_rules',
      content: `PRAVIDLA PRO LINKEDIN:
- Profesionální tón.
- Začni zajímavým faktem – první 2 řádky jsou vidět před "zobrazit více".
- Krátké odstavce (1-2 věty). Prázdné řádky mezi nimi.
- Délka: 1 200–2 200 znaků.
- Hashtagy: 3-5 na konci.
- CTA: Otázka na konci.

UPRAVTE TENTO PROMPT podle vašich LinkedIn pravidel.`,
      description: `LinkedIn pravidla`,
      sort_order: 50,
    },
    {
      project_id: projectId,
      slug: `quality_${projectId.slice(0, 8)}`,
      category: 'quality_criteria',
      content: `KRITÉRIA KVALITY:
Každý post MUSÍ splnit tato kritéria. Minimum overall: 7/10.

1. HODNOTA (10/10 váha): Post musí přinést konkrétní hodnotu čtenáři.
2. AUTENTICITA (9/10 váha): Nesmí znít genericky nebo jako AI.
3. FAKTICKÁ PŘESNOST (9/10 váha): Všechna tvrzení musí být podložitelná.
4. STRUKTURA (7/10 váha): Krátké odstavce, jasná struktura.
5. CTA (6/10 váha): Přirozená výzva k akci.

POKUD POST NESPLŇUJE SKÓRE 7+ → PŘEGENEROVAT.

UPRAVTE TENTO PROMPT podle vašich kvalitativních standardů.`,
      description: `Kritéria kvality`,
      sort_order: 70,
    },
    {
      project_id: projectId,
      slug: `cta_${projectId.slice(0, 8)}`,
      category: 'cta_rules',
      content: `PRAVIDLA PRO CTA:
- Max 1 CTA per post.
- CTA musí vyplynout z obsahu, ne být nalepené na konec.
- Edukační post → otázka k zamyšlení.
- Soft-sell → odkaz na web.
- Hard-sell → výzva k akci.

UPRAVTE TENTO PROMPT podle vašich CTA pravidel.`,
      description: `CTA pravidla`,
      sort_order: 60,
    },
    {
      project_id: projectId,
      slug: `legal_${projectId.slice(0, 8)}`,
      category: 'legal',
      content: `PRÁVNÍ OMEZENÍ:
- NIKDY neslibuj konkrétní výsledky.
- NIKDY nepoužívej formulace, které by mohly být považovány za odborné poradenství.
- Informace slouží pouze k edukačním účelům.

UPRAVTE TENTO PROMPT podle právních omezení vašeho oboru.`,
      description: `Právní omezení`,
      sort_order: 98,
    },
  ];
}

// ---- Starter Kit: Default KB entries ----
//
// When the wizard collected onboarding answers, we write them straight into the
// KB instead of generic VYPLŇTE: placeholders. The user can still edit them
// later, but Hugo can already generate sensible posts on day one.
function getStarterKB(projectId: string, projectName: string, onboarding?: Onboarding) {
  const aboutContent = onboarding?.about
    || `VYPLŇTE: Stručný popis projektu ${projectName}. Co děláte, pro koho, jaký problém řešíte.`;
  const audienceContent = onboarding?.audience
    || 'VYPLŇTE: Kdo je váš ideální zákazník? Věk, zájmy, problémy, motivace.';
  const uspContent = onboarding?.usp
    || 'VYPLŇTE: Čím se lišíte od konkurence? Proč by si zákazník měl vybrat právě vás?';

  return [
    {
      project_id: projectId,
      category: 'product',
      title: `Co je ${projectName}`,
      content: aboutContent,
      is_active: true,
    },
    {
      project_id: projectId,
      category: 'product',
      title: 'Hlavní služba / produkt',
      content: 'VYPLŇTE: Popište hlavní službu nebo produkt. Co zákazník dostane, jaká je hodnota.',
      is_active: true,
    },
    {
      project_id: projectId,
      category: 'audience',
      title: 'Cílová skupina',
      content: audienceContent,
      is_active: true,
    },
    {
      project_id: projectId,
      category: 'audience',
      title: 'Co cílová skupina potřebuje',
      content: 'VYPLŇTE: Jaké problémy řeší? Co hledají? Jaké mají obavy?',
      is_active: true,
    },
    {
      project_id: projectId,
      category: 'usp',
      title: 'Hlavní konkurenční výhoda',
      content: uspContent,
      is_active: true,
    },
    {
      project_id: projectId,
      category: 'faq',
      title: 'Nejčastější otázka č. 1',
      content: 'VYPLŇTE: Jakou otázku dostáváte nejčastěji? A jaká je odpověď?',
      is_active: true,
    },
  ];
}
