-- Prompty pro Extra nájem projekt
-- Project ID: 41d7b870-c931-4fb8-a77d-392375f67c01

-- 1. Facebook - Vzdělávací post
INSERT INTO project_prompts (project_id, slug, category, content, description, sort_order)
VALUES (
  '41d7b870-c931-4fb8-a77d-392375f67c01',
  'facebook-educational',
  'facebook',
  'Vytvoř vzdělávací Facebook post o pronájmu nemovitostí. Zaměř se na praktické tipy pro pronajímatele a nájemníky. Použij hook, který zaujme (otázka, překvapivý fakt, nebo bold statement). Struktura: Hook → Value (3-5 bodů) → CTA. Délka: 150-300 znaků. Ton: přátelský, ale profesionální. Přidej emoji pro vizuální atraktivitu.',
  'Vzdělávací post s praktickými tipy pro pronájem',
  1
);

-- 2. Facebook - Příběh klienta
INSERT INTO project_prompts (project_id, slug, category, content, description, sort_order)
VALUES (
  '41d7b870-c931-4fb8-a77d-392375f67c01',
  'facebook-story',
  'facebook',
  'Vytvoř Facebook post s příběhem klienta Extra nájem. Zaměř se na konkrétní výzvu (např. hledání spolehlivého nájemníka, správa nemovitosti na dálku) a jak jsme ji vyřešili. Struktura: Situace → Problém → Řešení → Výsledek. Použij citaci klienta, pokud je k dispozici. Délka: 200-400 znaků. Ton: autentický, empatický.',
  'Příběh úspěšného klienta s konkrétním řešením',
  2
);

-- 3. Facebook - Social proof
INSERT INTO project_prompts (project_id, slug, category, content, description, sort_order)
VALUES (
  '41d7b870-c931-4fb8-a77d-392375f67c01',
  'facebook-social-proof',
  'facebook',
  'Vytvoř Facebook post zdůrazňující důvěryhodnost Extra nájem. Použij čísla (počet spokojených klientů, let na trhu, úspěšných pronájmů), recenze, nebo ocenění. Struktura: Statistika/Achievement → Co to znamená pro klienta → CTA. Délka: 100-250 znaků. Ton: sebevědomý, ale ne arogantní.',
  'Post s důkazy důvěryhodnosti a úspěchů',
  3
);

-- 4. Instagram - Caption s hookem
INSERT INTO project_prompts (project_id, slug, category, content, description, sort_order)
VALUES (
  '41d7b870-c931-4fb8-a77d-392375f67c01',
  'instagram-caption',
  'instagram',
  'Vytvoř Instagram caption pro post o pronájmu nemovitostí. Začni silným hookem (otázka, překvapivý fakt, nebo relatable statement). Struktura: Hook (1 řádek) → Value/Story (3-5 řádků) → CTA (1 řádek) → Hashtags (8-15). Použij line breaks pro čitelnost. Ton: casual, ale profesionální. Hashtags: mix niche (#pronajemnemovitosti), střední (#realitycz), lokální (#prahanajem), branded (#extranajem).',
  'Instagram caption s hookem a hashtag strategií',
  4
);

-- 5. Instagram - Carousel template
INSERT INTO project_prompts (project_id, slug, category, content, description, sort_order)
VALUES (
  '41d7b870-c931-4fb8-a77d-392375f67c01',
  'instagram-carousel',
  'instagram',
  'Vytvoř text pro Instagram carousel (5-7 slides) o pronájmu nemovitostí. Slide 1: Hook/Titulek (max 6 slov). Slides 2-6: Jeden tip/fakt/krok per slide (max 15 slov). Slide 7: CTA + logo. Každý slide musí být standalone čitelný. Formát: "Slide 1: [text]\nSlide 2: [text]..." Ton: stručný, akční.',
  'Carousel post s postupnými kroky nebo tipy',
  5
);

-- 6. LinkedIn - Insight post
INSERT INTO project_prompts (project_id, slug, category, content, description, sort_order)
VALUES (
  '41d7b870-c931-4fb8-a77d-392375f67c01',
  'linkedin-insight',
  'linkedin',
  'Vytvoř LinkedIn post s profesionálním insightem o trhu s pronájmem nemovitostí. Použij konkrétní data, trendy, nebo pozorování z praxe. Struktura: Hook (bold statement nebo otázka) → Context → Insight → Takeaway. Délka: 800-1500 znaků. Ton: profesionální, ale osobní (1. osoba). NIKDY nedávej odkaz do těla postu. Používej konkrétní čísla a příklady.',
  'Profesionální insight s daty a trendy',
  6
);

-- 7. LinkedIn - Case study
INSERT INTO project_prompts (project_id, slug, category, content, description, sort_order)
VALUES (
  '41d7b870-c931-4fb8-a77d-392375f67c01',
  'linkedin-case-study',
  'linkedin',
  'Vytvoř LinkedIn case study o úspěšném pronájmu nemovitosti. Struktura: Výzva → Přístup → Řešení → Výsledky (s čísly). Použij storytelling, ale zůstaň profesionální. Délka: 1000-1500 znaků. Ton: analytický, ale čitelný. Zdůrazni konkrétní metriky (např. "Pronajato za 14 dní místo průměrných 45"). NIKDY nedávej odkaz do těla postu.',
  'Detailní case study s měřitelnými výsledky',
  7
);

-- 8. LinkedIn - Framework/Seznam
INSERT INTO project_prompts (project_id, slug, category, content, description, sort_order)
VALUES (
  '41d7b870-c931-4fb8-a77d-392375f67c01',
  'linkedin-framework',
  'linkedin',
  'Vytvoř LinkedIn post s frameworkem nebo seznamem pro pronajímatele. Formát: "X kroků k [cíl]" nebo "X chyb, kterým se vyhnout". Struktura: Úvod (proč je to důležité) → Číslovaný seznam (3-7 bodů, každý s vysvětlením) → Závěr/CTA. Délka: 800-1200 znaků. Ton: autoritativní, ale přístupný. Každý bod musí být actionable.',
  'Praktický framework nebo checklist',
  8
);

-- 9. X (Twitter) - Standalone tweet
INSERT INTO project_prompts (project_id, slug, category, content, description, sort_order)
VALUES (
  '41d7b870-c931-4fb8-a77d-392375f67c01',
  'x-standalone',
  'x',
  'Vytvoř standalone tweet o pronájmu nemovitostí. Musí být kompletní myšlenka bez nutnosti threadu. Použij hook (otázka, překvapivý fakt, bold statement). Délka: 150-280 znaků. Max 2 hashtags. NIKDY nedávej odkaz do prvního tweetu. Ton: condensed wisdom, punch. Formát: Hook → Value → (optional) CTA.',
  'Samostatný tweet s kompletní myšlenkou',
  9
);

-- 10. X (Twitter) - Thread starter
INSERT INTO project_prompts (project_id, slug, category, content, description, sort_order)
VALUES (
  '41d7b870-c931-4fb8-a77d-392375f67c01',
  'x-thread',
  'x',
  'Vytvoř thread starter pro X o pronájmu nemovitostí. První tweet: Hook + promise (co se čtenář naučí). Struktura threadu: Tweet 1: Hook + "Thread 🧵" → Tweets 2-5: Jeden tip/insight per tweet → Tweet 6: Recap + CTA. Každý tweet max 280 znaků. NIKDY nedávej odkaz do prvního tweetu. Ton: direct, valuable.',
  'Úvodní tweet pro delší thread',
  10
);

-- 11. Blog - Vzdělávací článek
INSERT INTO project_prompts (project_id, slug, category, content, description, sort_order)
VALUES (
  '41d7b870-c931-4fb8-a77d-392375f67c01',
  'blog-educational',
  'blog',
  'Vytvoř vzdělávací blog článek o pronájmu nemovitostí. Délka: 800-1500 slov. Struktura: Úvod (proč je téma důležité) → H2 sekce (3-5 hlavních bodů) → H3 podsekce → Závěr s CTA. Používej konkrétní příklady, čísla, citace zákonů kde relevantní. Ton: profesionální, ale přístupný (vykání nebo neosobně). NIKDY nepoužívej emoji. NIKDY nepoužívej generické fráze ("v dnešní době"). Formátování: HTML s Tailwind třídami.',
  'Dlouhý vzdělávací článek s praktickými tipy',
  11
);

-- 12. Email - Newsletter
INSERT INTO project_prompts (project_id, slug, category, content, description, sort_order)
VALUES (
  '41d7b870-c931-4fb8-a77d-392375f67c01',
  'email-newsletter',
  'email',
  'Vytvoř newsletter email pro pronajímatele a nájemníky. Struktura: Subject line (max 50 znaků, curiosity-driven) → Preheader (doplňuje subject) → Úvod (1-2 věty) → Hlavní obsah (tip, novinka, nebo příběh) → CTA (jasný next step) → P.S. (bonus tip nebo reminder). Délka: 200-400 slov. Ton: osobní, jako od přítele. Používej "ty" formu.',
  'Newsletter email s tipy a novinkami',
  12
);
