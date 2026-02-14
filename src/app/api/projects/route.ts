import { supabase } from '@/lib/supabase/client';
import { NextResponse } from 'next/server';

export async function GET() {
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
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const body = await request.json();

  const { data, error } = await supabase
    .from('projects')
    .insert({
      name: body.name,
      slug: body.slug,
      description: body.description || null,
      late_social_set_id: body.late_social_set_id || null,
      platforms: body.platforms || ['linkedin'],
      mood_settings: body.mood_settings || { tone: 'professional', energy: 'medium', style: 'informative' },
      content_mix: body.content_mix || { educational: 0.66, soft_sell: 0.17, hard_sell: 0.17 },
      constraints: body.constraints || { forbidden_topics: [], mandatory_terms: [], max_hashtags: 5 },
      semantic_anchors: body.semantic_anchors || [],
      style_rules: body.style_rules || { start_with_question: false, max_bullets: 3, no_hashtags_in_text: true, max_length: 2200 },
      orchestrator_config: {
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
      },
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // ---- Starter Kit: Create default prompt templates ----
  if (data?.id) {
    const projectId = data.id;
    const projectName = body.name || 'Projekt';

    try {
      await supabase.from('project_prompt_templates').insert(
        getStarterPrompts(projectId, projectName)
      );
    } catch {
      // Starter kit failure should not block project creation
    }

    try {
      await supabase.from('knowledge_base').insert(
        getStarterKB(projectId, projectName)
      );
    } catch {
      // KB starter failure should not block project creation
    }
  }

  return NextResponse.json(data, { status: 201 });
}

// ---- Starter Kit: Default prompt templates ----
function getStarterPrompts(projectId: string, projectName: string) {
  return [
    {
      project_id: projectId,
      slug: `identity_${projectId.slice(0, 8)}`,
      category: 'identity',
      content: `KDO JSEM:
- Jsem Hugo – AI asistent projektu ${projectName}.
- Komunikuji profesionálně, ale přátelsky.
- Vždy mluvím česky s háčky a čárkami.

OSOBNOST:
- Profesionální, ale lidský.
- Mluvím fakty a daty.
- Jsem nápomocný a vstřícný.

UPRAVTE TENTO PROMPT podle identity vašeho projektu.`,
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
function getStarterKB(projectId: string, projectName: string) {
  return [
    {
      project_id: projectId,
      category: 'product',
      title: `Co je ${projectName}`,
      content: `VYPLŇTE: Stručný popis projektu ${projectName}. Co děláte, pro koho, jaký problém řešíte.`,
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
      content: 'VYPLŇTE: Kdo je váš ideální zákazník? Věk, zájmy, problémy, motivace.',
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
      content: 'VYPLŇTE: Čím se lišíte od konkurence? Proč by si zákazník měl vybrat právě vás?',
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

