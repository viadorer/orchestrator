-- ===========================================
-- SEED: Odhad.online
-- Projekt č. 4 – Kompletní nastavení
-- AI odhadce nemovitostí - lead generation
-- ===========================================

-- CLEANUP: Smazat existující projekt a všechna jeho data
DELETE FROM project_prompt_templates WHERE project_id = '879f733f-8dcc-48ca-a42b-808234821365';
DELETE FROM knowledge_base WHERE project_id = '879f733f-8dcc-48ca-a42b-808234821365';
DELETE FROM content_queue WHERE project_id = '879f733f-8dcc-48ca-a42b-808234821365';
DELETE FROM agent_tasks WHERE project_id = '879f733f-8dcc-48ca-a42b-808234821365';
DELETE FROM agent_log WHERE project_id = '879f733f-8dcc-48ca-a42b-808234821365';
DELETE FROM post_history WHERE project_id = '879f733f-8dcc-48ca-a42b-808234821365';
DELETE FROM projects WHERE id = '879f733f-8dcc-48ca-a42b-808234821365';

-- 1. PROJEKT
-- ===========================================

INSERT INTO projects (
  id, name, slug, description,
  platforms, late_social_set_id,
  mood_settings, content_mix, constraints, semantic_anchors, style_rules,
  visual_identity, orchestrator_config,
  is_active
) VALUES (
  '879f733f-8dcc-48ca-a42b-808234821365',
  'Odhad.online',
  'odhad-online',
  'AI odhadce nemovitostí Hugo. Orientační odhad tržní ceny nebo nájmu nemovitosti zdarma a nezávazně. Založeno na datech z reálných prodejů a pronájmů v okolí. Lead generation pro realitní služby, hypotéky a znalecké posudky. Web: odhad.online',

  ARRAY['linkedin', 'instagram', 'facebook', 'x'],
  NULL, -- getLate social_set_id doplnit později

  -- Mood: Profesionální, přátelský, důvěryhodný, pomocný
  '{"tone": "professional", "energy": "medium", "style": "helpful"}'::jsonb,

  -- Content Mix: 70% edukace, 20% soft-sell, 10% hard-sell
  '{"educational": 0.70, "soft_sell": 0.20, "hard_sell": 0.10}'::jsonb,

  -- Constraints
  '{
    "forbidden_topics": [
      "zaručená přesnost", "100% přesnost", "lepší než znalec",
      "nahrazuje znalecký posudek", "právně závazný odhad",
      "konkrétní jména konkurentů", "kritika realitních kanceláří",
      "spekulace s nemovitostmi", "rychlé zbohatnutí",
      "kryptoměny", "forex", "trading",
      "politická kritika", "osobní útoky"
    ],
    "mandatory_terms": [
      "orientační odhad", "tržní cena", "reálné prodeje",
      "zdarma", "nezávazně", "lokalita", "srovnání"
    ],
    "max_hashtags": 5
  }'::jsonb,

  -- Semantic Anchors
  ARRAY[
    'odhad nemovitosti', 'tržní cena', 'orientační odhad',
    'reálné prodeje', 'data z okolí', 'zdarma nezávazně',
    'AI odhadce Hugo', 'znalecký posudek', 'hypotéka',
    'prodej nemovitosti', 'pronájem', 'odhad.online'
  ],

  -- Style Rules
  '{
    "start_with_question": true,
    "max_bullets": 4,
    "no_hashtags_in_text": true,
    "max_length": 2000,
    "start_with_number": false,
    "no_emojis": false,
    "no_exclamation_marks": false,
    "paragraph_max_sentences": 3,
    "use_real_examples": true,
    "conversational_tone": true
  }'::jsonb,

  -- Visual Identity
  '{
    "primary_color": "#0f172a",
    "secondary_color": "#1e293b",
    "accent_color": "#8b5cf6",
    "text_color": "#ffffff",
    "font": "Inter",
    "logo_url": null,
    "style": "modern",
    "photography": {
      "style": "professional_real_estate",
      "subjects": ["modern_apartments", "family_homes", "city_skylines", "interior_design", "happy_families", "real_estate_agents"],
      "mood": "trustworthy_and_approachable",
      "avoid": ["stock_photos_obvious", "overly_staged", "empty_rooms"]
    }
  }'::jsonb,

  -- Orchestrator Config
  '{
    "enabled": false,
    "posting_frequency": "daily",
    "posting_times": ["09:00", "15:00"],
    "max_posts_per_day": 2,
    "content_strategy": "7-2-1",
    "auto_publish": false,
    "auto_publish_threshold": 8.5,
    "timezone": "Europe/Prague",
    "media_strategy": "auto",
    "platforms_priority": ["facebook", "instagram", "linkedin", "x"],
    "pause_weekends": false
  }'::jsonb,

  true
);

-- ===========================================
-- 2. KNOWLEDGE BASE
-- ===========================================

-- ---- PRODUCT ----

INSERT INTO knowledge_base (project_id, category, title, content, is_active) VALUES
('879f733f-8dcc-48ca-a42b-808234821365', 'product', 'Co je Odhad.online',
'Odhad.online je AI odhadce nemovitostí jménem Hugo. Poskytuje orientační odhad tržní ceny nebo výše nájmu nemovitosti zdarma a nezávazně. Odhad je založen na datech z reálných prodejů a pronájmů v okolí zadané adresy. Algoritmus porovná parametry nemovitosti (typ, plocha, stav, lokalita) se srovnatelnými transakcemi a vypočítá orientační tržní hodnotu.', true),

('879f733f-8dcc-48ca-a42b-808234821365', 'product', 'Jak funguje odhad',
'Odhad.online používá data z katastru nemovitostí a reálných transakcí. Proces:
1. Klient zadá parametry nemovitosti (typ, adresa, plocha, stav, dispozice)
2. AI Hugo ověří adresu přes Mapy.cz
3. Algoritmus najde srovnatelné prodeje/pronájmy v okolí
4. Vypočítá orientační cenu na základě statistického srovnání
5. Klient dostane náhled ceny v chatu + detailní report na email
Odhad trvá cca 2-3 minuty.', true),

('879f733f-8dcc-48ca-a42b-808234821365', 'product', 'Rozdíl mezi odhadem a znaleckým posudkem',
'Orientační odhad (Odhad.online):
- Rychlý (2-3 minuty), zdarma, online
- Založený na statistickém srovnání s okolními transakcemi
- Vhodný pro první orientaci, rozhodování o prodeji/koupi, plánování
- Není právně závazný

Znalecký posudek:
- Zpracovává certifikovaný soudní znalec
- Právně závazný, potřebný pro banku (hypotéka), soud, dědictví, rozvod
- Cena: cca 3 000-8 000 Kč
- Trvá několik dní

Odhad.online je první krok. Pro závazné ocenění doporučujeme certifikovaného odhadce.', true),

('879f733f-8dcc-48ca-a42b-808234821365', 'product', 'Co ovlivňuje cenu nemovitosti',
'Hlavní faktory ovlivňující cenu:
1. Lokalita (město, čtvrť, občanská vybavenost, doprava, prestiž lokality)
2. Velikost (užitná plocha u bytů/domů, plocha pozemku)
3. Stav (novostavba, po rekonstrukci, dobrý původní stav, špatný stav)
4. Typ nemovitosti (byt, rodinný dům, pozemek)
5. Dispozice a patro (u bytů - výtah, orientace, výhled)
6. Konstrukce (cihla vs panel, dřevostavba, kámen)
7. Energetická náročnost (třída A-G)
8. Aktuální tržní podmínky (úrokové sazby, poptávka, ekonomická situace)

Rozdíl mezi lokalitami ve stejném městě může být 20-40 %.', true),

('879f733f-8dcc-48ca-a42b-808234821365', 'product', 'Odhad prodejní ceny vs nájmu',
'Odhad.online umí odhadnout:
1. Prodejní cenu (kind=sale) - kolik by nemovitost přinesla při prodeji na volném trhu
2. Výši měsíčního nájmu (kind=lease) - kolik lze realisticky inkasovat za pronájem

Poměr nájmu k ceně (rental yield) se v ČR typicky pohybuje kolem 3-5 % ročně.
Příklad: Byt za 5 mil. Kč → očekávaný nájem 12 500-20 000 Kč/měsíc (3-4,8 % p.a.)

Pro investory je klíčový výnosový odhad. Pro prodávající/kupující prodejní cena.', true),

('879f733f-8dcc-48ca-a42b-808234821365', 'product', 'Lead generation flow',
'Odhad.online má 3-fázový lead generation proces:

FÁZE 1 - SBĚR DAT (bez bariér):
- Klient zadá parametry nemovitosti
- Hugo ověří adresu, doptá se na chybějící údaje
- Žádný požadavek na kontakt v této fázi

FÁZE 2 - NÁHLED + EMAIL GATE:
- Hugo ukáže náhled ceny v chatu (rozmezí, cena za m2, doba prodeje)
- Ihned po náhledu: "Detailní report vám pošlu emailem. Na jakou adresu?"
- Po emailu: "A vaše jméno?" → Po jménu: telefon (volitelný)
- GDPR souhlas jednou po získání kontaktu

FÁZE 3 - KVALIFIKACE INTENTU:
- "Jaký máte s nemovitostí záměr?" (prodej/koupě/pronájem/dědictví/jen info)
- Podle intentu: nabídka specialisty (prodej), hypotéka (koupě), prescoring (pronájem)
- Lead scoring: HOT (prodej+telefon), WARM (koupě+email), COLD (jen info)', true);

-- ---- AUDIENCE ----

INSERT INTO knowledge_base (project_id, category, title, content, is_active) VALUES
('879f733f-8dcc-48ca-a42b-808234821365', 'audience', 'Cílová skupina',
'Primární cílové skupiny:

1. PRODÁVAJÍCÍ (30-40 % leadů):
- Vlastníci nemovitostí zvažující prodej
- Potřebují znát tržní cenu pro rozhodnutí
- Věk: 35-65 let, vlastní byt/dům
- Intent: Zjistit cenu → Kontakt na realitního specialistu

2. KUPUJÍCÍ (40-50 % leadů):
- Lidé hledající nemovitost ke koupi
- Chtějí vědět, jestli je cena férová
- Věk: 25-45 let, prvokupující nebo upgrade
- Intent: Ověřit cenu → Hypotéka → Kupní proces

3. INVESTOŘI (10-15 % leadů):
- Hledají investiční nemovitost
- Zajímá je výnosnost (nájem vs cena)
- Věk: 30-55 let, mají kapitál nebo přístup k financování
- Intent: Výnosový odhad → Investiční analýza → Hypotéka

4. OSTATNÍ (5-10 % leadů):
- Dědictví, majetkové vyrovnání, rozvod
- Potřebují orientační hodnotu pro jednání
- Intent: Odhad → Doporučení znalce', true),

('879f733f-8dcc-48ca-a42b-808234821365', 'audience', 'Bolesti a potřeby',
'PRODÁVAJÍCÍ:
- Neví, za kolik nemovitost nabídnout
- Obava z podhodnocení nebo předražení
- Nejistota ohledně doby prodeje
- Potřeba: Realistický odhad + strategie prodeje

KUPUJÍCÍ:
- Nejistota, jestli je nabídková cena férová
- Strach z přeplacení
- Otázka financování (hypotéka)
- Potřeba: Ověření ceny + kalkulace hypotéky

INVESTOŘI:
- Hledají výnosnou nemovitost
- Potřebují spočítat ROI a cash flow
- Zajímá je poměr cena/nájem
- Potřeba: Výnosový odhad + investiční analýza

OBECNÉ BOLESTI:
- Nedůvěra k realitním kancelářím
- Obava z manipulace s cenou
- Potřeba nezávislého pohledu
- Strach z chyby při největší finanční transakci života', true),

('879f733f-8dcc-48ca-a42b-808234821365', 'audience', 'Tone of voice pro různé persony',
'PRVOKUPUJÍCÍ:
- Edukativní, trpělivý, povzbuzující
- Vysvětluj jednoduše, žádná hantýrka
- "Spousta lidí začíná stejně jako vy. Pojďme si to projít krok po kroku."

INVESTOR:
- Expertní, datově orientovaný
- Mluv jazykem investic: cash flow, výnosnost, pákový efekt
- "Při nájmu 15 000 Kč a splátce 12 000 Kč vychází kladný cash flow."

ZKUŠENÝ KLIENT:
- Efektivní, méně vysvětlování
- Soustřeď se na optimalizaci a srovnání
- Můžeš použít odborné termíny bez vysvětlování

KOMPLIKOVANÝ PŘÍPAD:
- Extra empatický, řešení-orientovaný
- NIKDY neříkej "to nepůjde"
- "Rozumím, OSVČ příjmy mají svá specifika. Pojďme se podívat na vaši situaci."', true);

-- ---- MARKET ----

INSERT INTO knowledge_base (project_id, category, title, content, is_active) VALUES
('879f733f-8dcc-48ca-a42b-808234821365', 'market', 'Trh nemovitostí v ČR 2026',
'Aktuální situace na trhu nemovitostí v ČR:

CENY:
- Průměrná cena bytu v Praze: 120-140 tis. Kč/m2
- Průměrná cena bytu v Brně: 80-100 tis. Kč/m2
- Průměrná cena bytu v Plzni: 60-75 tis. Kč/m2
- Rodinné domy: velmi variabilní podle lokality a stavu

HYPOTÉKY:
- Průměrná sazba: 4,5-5,5 % (únor 2026)
- LTV limit: 80 % (90 % pro mladé do 36 let)
- DSTI limit: 45 % (splátka/příjem)

DOBA PRODEJE:
- Praha: 60-90 dní
- Krajská města: 90-120 dní
- Menší města: 120-180 dní

TRENDY:
- Stabilizace cen po poklesu v 2023-2024
- Rostoucí poptávka díky klesajícím sazbám
- Nedostatek nabídky v atraktivních lokalitách', true),

('879f733f-8dcc-48ca-a42b-808234821365', 'market', 'Konkurence',
'Hlavní konkurenti v oblasti odhadu nemovitostí:

1. REALITNÍ KANCELÁŘE:
- Nabízí odhad zdarma jako lead magnet
- Často subjektivní (chtějí získat zakázku)
- Osobní schůzka nutná
- Výhoda Odhad.online: Okamžitý, nezávislý, online

2. ZNALCI A ODHADCI:
- Placené služby (3-8 tis. Kč)
- Právně závazné posudky
- Trvá několik dní
- Výhoda Odhad.online: Zdarma, okamžitě, orientační

3. ONLINE KALKULAČKY:
- Sreality.cz, Bezrealitky.cz, Idnes.cz
- Velmi zjednodušené, často nepřesné
- Žádná personalizace
- Výhoda Odhad.online: AI konverzace, detailní report, lead nurturing

4. HYPOTEČNÍ PORADCI:
- Nabízí odhad v rámci hypotečního procesu
- Zaměřeno na financování, ne na prodej
- Výhoda Odhad.online: Univerzální (prodej i koupě)', true);

-- ---- LEGAL ----

INSERT INTO knowledge_base (project_id, category, title, content, is_active) VALUES
('879f733f-8dcc-48ca-a42b-808234821365', 'legal', 'Právní status orientačního odhadu',
'Orientační odhad ceny nemovitosti na Odhad.online je informativní služba založená na statistickém zpracování veřejně dostupných dat o transakcích s nemovitostmi.

NENÍ:
- Znaleckým posudkem ve smyslu zákona č. 36/1967 Sb. o znalcích a tlumočnících
- Právně závazným dokumentem
- Náhradou za osobní prohlídku nemovitosti odborníkem
- Garantovanou prodejní/kupní cenou

JE:
- Orientační odhad tržní hodnoty
- Založený na reálných datech z okolí
- Vhodný pro první rozhodování
- Nezávazný a zdarma

Pro právní účely (hypotéka, soud, dědictví, rozvod) je nutný posudek certifikovaného soudního znalce.', true),

('879f733f-8dcc-48ca-a42b-808234821365', 'legal', 'GDPR a ochrana osobních údajů',
'Odhad.online zpracovává osobní údaje v souladu s GDPR:

JAKÉ ÚDAJE SBÍRÁME:
- Jméno, email, telefon (volitelný)
- Parametry nemovitosti (adresa, plocha, stav)
- Historie konverzace s AI Hugo

ÚČEL ZPRACOVÁNÍ:
- Zaslání detailního reportu s odhadem
- Kontaktování specialistou (pokud klient souhlasí)
- Zlepšování služby

SOUHLAS:
- Vyžadován při zadání kontaktních údajů
- Klient může souhlas kdykoliv odvolat
- Formulace: "Vaše údaje použijeme pro zaslání reportu a případnou konzultaci. Souhlasíte?"

BEZPEČNOST:
- Data šifrována, uložena v EU
- Přístup pouze oprávněné osoby
- Žádné sdílení s třetími stranami bez souhlasu', true);

-- ---- CONTENT_PATTERNS (kategorie: general) ----

INSERT INTO knowledge_base (project_id, category, title, content, is_active) VALUES
('879f733f-8dcc-48ca-a42b-808234821365', 'general', 'Edukační posty - Jak odhadnout cenu',
'Formát: Praktický návod s kroky

Struktura:
1. Hook: Otázka nebo problém ("Nevíte, za kolik nabídnout byt?")
2. Kontext: Proč je to důležité
3. Kroky: 3-5 konkrétních kroků jak postupovat
4. Příklad: Reálný příklad s čísly
5. CTA: "Vyzkoušejte odhad zdarma na odhad.online"

Témata:
- Jak zjistit tržní cenu bytu
- 5 faktorů které ovlivňují cenu nemovitosti
- Jak poznat, jestli je cena férová
- Rozdíl mezi odhadem a znaleckým posudkem
- Jak připravit nemovitost k prodeji
- Co ovlivňuje dobu prodeje', true),

('879f733f-8dcc-48ca-a42b-808234821365', 'general', 'Case study - Reálný příběh klienta',
'Formát: Storytelling s čísly

Struktura:
1. Situace: "Paní Jana z Plzně chtěla prodat byt..."
2. Problém: Co řešila, jaké měla obavy
3. Řešení: Jak jí Odhad.online pomohl
4. Výsledek: Konkrétní čísla, timeline
5. Poučení: Co se z toho můžeme naučit
6. CTA: "Máte podobnou situaci? Zkuste odhad zdarma."

Témata:
- Prodej bytu v rekordním čase díky správné ceně
- Jak investor našel výnosnou nemovitost
- Prvokupující a jejich cesta k vlastnímu bydlení
- Jak se vyhnout přeplacení nemovitosti', true),

('879f733f-8dcc-48ca-a42b-808234821365', 'general', 'Statistiky a trendy trhu',
'Formát: Data-driven post s grafy/čísly

Struktura:
1. Hook: Překvapivé číslo nebo trend
2. Data: 3-5 konkrétních statistik
3. Analýza: Co to znamená pro čtenáře
4. Predikce: Kam se trh pravděpodobně vyvine
5. Akce: Co s tím může čtenář udělat
6. CTA: "Zjistěte aktuální cenu vaší nemovitosti"

Témata:
- Vývoj cen nemovitostí v ČR
- Průměrná doba prodeje podle lokalit
- Vliv úrokových sazeb na ceny
- Nejžádanější lokality v krajských městech
- Poměr cena/nájem v různých městech', true),

('879f733f-8dcc-48ca-a42b-808234821365', 'general', 'Mýty a fakta',
'Formát: Debunking + edukace

Struktura:
1. Mýtus: "Mnoho lidí si myslí, že..."
2. Realita: "Ve skutečnosti..."
3. Vysvětlení: Proč je to jinak
4. Důkaz: Data nebo příklad
5. Doporučení: Co dělat správně
6. CTA: "Ověřte si reálnou cenu na odhad.online"

Témata:
- "Realitka mi řekla cenu, tak to bude pravda" (ne vždy)
- "Cena na inzerátu = tržní cena" (často ne)
- "Investoval jsem do rekonstrukce, cena vzroste o stejnou částku" (ne nutně)
- "V mé lokalitě se nic neprodává" (možná špatná cena)
- "Znalecký posudek není potřeba" (záleží na účelu)', true),

('879f733f-8dcc-48ca-a42b-808234821365', 'general', 'Tipy a triky',
'Formát: Rychlé praktické rady

Struktura:
1. Hook: "3 věci které zvýší cenu vašeho bytu"
2. Tip 1: Konkrétní rada + vysvětlení
3. Tip 2: Konkrétní rada + vysvětlení
4. Tip 3: Konkrétní rada + vysvětlení
5. Bonus: Další rychlá rada
6. CTA: "Zjistěte aktuální cenu před investicí"

Témata:
- Jak zvýšit cenu nemovitosti před prodejem
- 5 chyb které prodlužují dobu prodeje
- Jak vyjednat lepší cenu při koupi
- Co zkontrolovat před koupí nemovitosti
- Jak připravit nemovitost na prohlídky', true);

-- ---- USP ----

INSERT INTO knowledge_base (project_id, category, title, content, is_active) VALUES
('879f733f-8dcc-48ca-a42b-808234821365', 'usp', 'Proč Odhad.online',
'Hlavní výhody oproti konkurenci:
1. ZDARMA: Orientační odhad bez poplatků a závazků
2. AI CHATBOT: Konverzační přístup - Hugo se zeptá na detaily a zpřesní odhad
3. RYCHLOST: Odhad do 2 minut, ne dní
4. NEZÁVISLOST: Nejsme realitní kancelář, nemáme zájem na ceně
5. DATA: Odhad z reálných transakcí, ne z inzerátů
6. DOSTUPNOST: 24/7, bez registrace, bez čekání na operátora
7. SOUKROMÍ: Minimální sběr dat, žádné volání od realitky', true),

('879f733f-8dcc-48ca-a42b-808234821365', 'usp', 'Rozdíl oproti konkurenci',
'Realitní kanceláře: Odhad zdarma jako lead magnet, ale subjektivní a vyžaduje schůzku. Mají zájem na co nejvyšší ceně (vyšší provize).
Znalci a odhadci: Placené (3-8 tis. Kč), právně závazné, trvá dny. Nutné pro banku/soud.
Online kalkulačky (Sreality, Bezrealitky): Zjednodušené, zadáte adresu a plochu, dostanete číslo. Bez kontextu, bez vysvětlení.
Odhad.online (Hugo): AI chatbot, který se ptá na detaily, vysvětluje faktory ceny, dává kontext. Jako konzultace s odhadcem, ale zdarma a okamžitě.', true);

-- ---- FAQ ----

INSERT INTO knowledge_base (project_id, category, title, content, is_active) VALUES
('879f733f-8dcc-48ca-a42b-808234821365', 'faq', 'Jak přesný je odhad?',
'Orientační odhad na odhad.online je založen na reálných transakcích v okolí. Přesnost závisí na dostupnosti dat v dané lokalitě. V Praze a krajských městech je přesnost vysoká (±5-10 %). V menších obcích může být rozmezí širší (±10-20 %). Hugo vždy uvede rozmezí min-max a vysvětlí faktory, které cenu ovlivňují. Pro právní účely (hypotéka, soud) je nutný znalecký posudek.', true),

('879f733f-8dcc-48ca-a42b-808234821365', 'faq', 'Je odhad zdarma?',
'Ano, orientační odhad na odhad.online je zcela zdarma. Žádné poplatky, žádné skryté náklady, žádná registrace. Stačí napsat Hugovi a popsat nemovitost. Pokud budete potřebovat znalecký posudek pro banku nebo soud, ten stojí 3 000-8 000 Kč a zpracovává ho certifikovaný soudní znalec.', true),

('879f733f-8dcc-48ca-a42b-808234821365', 'faq', 'Jaká data Hugo používá?',
'Hugo pracuje s daty z reálných prodejů a pronájmů nemovitostí v ČR. Zdroje zahrnují katastr nemovitostí, statistiky ČSÚ, data z realitních portálů a historické transakce. Algoritmus porovnává parametry vaší nemovitosti (typ, plocha, stav, lokalita, dispozice) se srovnatelnými transakcemi v okolí a vypočítá orientační tržní hodnotu.', true),

('879f733f-8dcc-48ca-a42b-808234821365', 'faq', 'Můžu odhad použít pro hypotéku?',
'Orientační odhad z odhad.online není znaleckým posudkem a nelze ho použít pro banku. Pro hypotéku potřebujete znalecký posudek od certifikovaného soudního znalce (cena 3 000-8 000 Kč). Náš odhad je ale ideální první krok - zjistíte orientační hodnotu a můžete se lépe rozhodnout, zda má smysl investovat do znaleckého posudku.', true),

('879f733f-8dcc-48ca-a42b-808234821365', 'faq', 'Jak dlouho trvá odhad?',
'Konverzace s Hugem trvá 1-3 minuty. Hugo se zeptá na základní parametry nemovitosti (typ, adresa, plocha, stav, dispozice) a během chvíle poskytne orientační odhad s vysvětlením. Žádné čekání, žádné telefonáty, žádné schůzky. Dostupný 24/7.', true),

('879f733f-8dcc-48ca-a42b-808234821365', 'faq', 'Budete mě kontaktovat po odhadu?',
'NE. Odhad.online je plně automatizovaná služba. Hugo je AI chatbot, ne obchodník. Po odhadu vás nikdo nekontaktuje, nevolá, neposílá nabídky. Pokud budete chtít další služby, můžete nás kontaktovat vy. Ale my vás nekontaktujeme.', true);

-- ---- CASE_STUDY ----

INSERT INTO knowledge_base (project_id, category, title, content, is_active) VALUES
('879f733f-8dcc-48ca-a42b-808234821365', 'case_study', 'Příběh: Prodej bytu v Praze za správnou cenu',
'Situace: Majitel 3+1 na Praze 6 chtěl prodat. Realitka navrhla 8,5 mil. Kč. Odhad.online ukázal rozmezí 7,2-7,8 mil. Kč na základě srovnatelných prodejů v okolí. Majitel se rozhodl pro kompromis 7,9 mil. Kč. Výsledek: Byt se prodal za 3 týdny za 7,7 mil. Kč. Kdyby šel za 8,5 mil., čekal by měsíce a nakonec by musel snižovat. Poučení: Správné nacenění = rychlý prodej.', true),

('879f733f-8dcc-48ca-a42b-808234821365', 'case_study', 'Příběh: Kupující ušetřil 400 tis. Kč',
'Situace: Kupující našel byt 2+kk v Brně za 4,2 mil. Kč. Před koupí si nechal udělat odhad na odhad.online. Hugo ukázal rozmezí 3,6-3,9 mil. Kč. Kupující vyjednal slevu na 3,8 mil. Kč s odkazem na srovnatelné prodeje v okolí. Výsledek: Ušetřil 400 tis. Kč. Poučení: Nezávislý odhad je nejlepší vyjednávací nástroj.', true),

('879f733f-8dcc-48ca-a42b-808234821365', 'case_study', 'Příběh: Dědictví a spravedlivé rozdělení',
'Situace: Tři sourozenci zdědili rodinný dům v Olomouci. Potřebovali orientační hodnotu pro spravedlivé rozdělení. Jeden chtěl dům, ostatní podíl v penězích. Hugo odhadl hodnotu na 4,8-5,2 mil. Kč. Sourozenci se dohodli na 5 mil. Kč. Ten, kdo si dům nechal, vyplatil ostatním po 1,67 mil. Kč. Poučení: Nezávislý odhad pomáhá při rodinných dohodách.', true),

('879f733f-8dcc-48ca-a42b-808234821365', 'case_study', 'Příběh: Investor a výnosnost nájmu',
'Situace: Investor zvažoval koupi 1+kk v Ostravě za 1,8 mil. Kč. Hugo odhadl tržní hodnotu na 1,6-1,9 mil. Kč a orientační nájem na 9-11 tis. Kč/měsíc. Hrubá výnosnost: 6-7 % ročně. Investor koupil za 1,75 mil. Kč, pronajímá za 10 500 Kč. Výnosnost 7,2 %. Poučení: Odhad nájmu pomáhá investorům spočítat návratnost.', true);

-- ---- DATA ----

INSERT INTO knowledge_base (project_id, category, title, content, is_active) VALUES
('879f733f-8dcc-48ca-a42b-808234821365', 'data', 'Průměrné ceny bytů v ČR 2026',
'Orientační průměrné ceny bytů (únor 2026):
- Praha: 120-140 tis. Kč/m²
- Brno: 80-100 tis. Kč/m²
- Plzeň: 60-75 tis. Kč/m²
- Ostrava: 35-50 tis. Kč/m²
- Olomouc: 55-70 tis. Kč/m²
- České Budějovice: 55-65 tis. Kč/m²
- Liberec: 45-60 tis. Kč/m²
Ceny se liší podle lokality, stavu a dispozice. Novostavby jsou o 15-30 % dražší než starší byty.', true),

('879f733f-8dcc-48ca-a42b-808234821365', 'data', 'Průměrné nájmy v ČR 2026',
'Orientační průměrné nájmy bytů 2+kk (únor 2026):
- Praha: 22-30 tis. Kč/měsíc
- Brno: 16-22 tis. Kč/měsíc
- Plzeň: 13-17 tis. Kč/měsíc
- Ostrava: 10-14 tis. Kč/měsíc
- Olomouc: 12-16 tis. Kč/měsíc
Nájmy rostou meziročně o 3-8 %. Největší poptávka: 1+kk a 2+kk v krajských městech.', true),

('879f733f-8dcc-48ca-a42b-808234821365', 'data', 'Faktory ovlivňující cenu nemovitosti',
'Hlavní faktory a jejich vliv na cenu:
1. Lokalita (město, čtvrť, ulice) - až 40 % vlivu
2. Velikost (užitná plocha) - až 25 % vlivu
3. Stav (novostavba, po rekonstrukci, původní) - až 15 % vlivu
4. Typ (byt, rodinný dům, pozemek) - 10 %
5. Dispozice, patro, výtah, orientace - 5 %
6. Konstrukce (cihla vs panel) - 3 %
7. Energetická náročnost - 2 %
Rozdíl mezi lokalitami ve stejném městě může být 20-40 %.', true),

('879f733f-8dcc-48ca-a42b-808234821365', 'data', 'Hypoteční sazby a jejich vliv',
'Aktuální hypoteční sazby (únor 2026): 4,5-5,5 % p.a.
Vliv na ceny nemovitostí: Pokles sazby o 1 p.b. = nárůst kupní síly o cca 10 %. Při sazení 5 % si na splátku 15 000 Kč/měsíc půjčíte 2,8 mil. Kč. Při 4 % to je 3,1 mil. Kč. Rozdíl 300 tis. Kč.
LTV limit: 80 % (90 % pro mladé do 36 let). DSTI limit: 45 %.
Trend: Postupné snižování sazeb ČNB → očekávaný růst poptávky a cen.', true);

-- ---- PROCESS ----

INSERT INTO knowledge_base (project_id, category, title, content, is_active) VALUES
('879f733f-8dcc-48ca-a42b-808234821365', 'process', 'Jak funguje odhad s Hugem',
'Proces odhadu na odhad.online:
1. Otevřete chat na odhad.online
2. Hugo se představí a zeptá se, co potřebujete (odhad prodejní ceny nebo nájmu)
3. Hugo se zeptá na parametry: typ nemovitosti, adresa, plocha, stav, dispozice
4. Na základě dat z reálných transakcí Hugo vypočítá orientační cenu
5. Hugo vysvětlí faktory, které cenu ovlivňují
6. Pokud chcete, Hugo zpřesní odhad na základě dalších detailů
Celý proces trvá 1-3 minuty. Bez registrace, bez závazků.', true),

('879f733f-8dcc-48ca-a42b-808234821365', 'process', 'Co dělat po obdržení odhadu',
'Máte odhad z odhad.online. Co dál?

PRODÁVAJÍCÍ:
1. Porovnejte odhad s aktuálními inzeráty v okolí
2. Rozhodněte o prodejní ceně (odhad + 5-10 % pro vyjednávání)
3. Připravte nemovitost k prodeji (úklid, drobné opravy, fotky)
4. Zvažte realitní kancelář nebo prodej sami

KUPUJÍCÍ:
1. Porovnejte odhad s nabídkovou cenou
2. Pokud je nabídka výrazně nad odhadem, vyjednávejte
3. Nechte si zpracovat znalecký posudek před podpisem smlouvy

INVESTOR:
1. Spočítejte výnosnost (roční nájem / kupní cena × 100)
2. Porovnejte s alternativami (spořicí účet, fondy)
3. Zohledněte náklady (údržba, pojištění, daně, správa)', true),

('879f733f-8dcc-48ca-a42b-808234821365', 'process', 'Kdy potřebujete znalecký posudek',
'Orientační odhad z odhad.online stačí pro:
- Rozhodování o prodeji/koupi
- Vyjednávání o ceně
- Orientační srovnání nemovitostí
- Rodinné dohody (dědictví, dar)

Znalecký posudek potřebujete pro:
- Hypotéku (banka vyžaduje)
- Soud (rozvod, dědické řízení, exekuce)
- Daňové účely (daň z nabytí, odpisy)
- Pojištění (stanovení pojistné hodnoty)
Cena znaleckého posudku: 3 000-8 000 Kč. Doba zpracování: 3-10 dní.', true);

-- ===========================================
-- 3. PROMPT TEMPLATES
-- ===========================================

INSERT INTO project_prompt_templates (project_id, slug, category, content, description, sort_order) VALUES

-- IDENTITY
('879f733f-8dcc-48ca-a42b-808234821365', 'identity_odhad', 'identity',
'Jsi Hugo, AI odhadce nemovitostí na odhad.online.

TVOJE ROLE:
- Poskytuj orientační odhad tržní ceny nebo nájmu nemovitosti
- Komunikuj česky, přátelsky, profesionálně, stručně
- Oslovuj uživatele křestním jménem v 5. pádu, pokud ho znáš
- Odpovídáš max 2-3 větami, pokud situace nevyžaduje víc
- Nikdy neříkej "jako AI nemomu..." - prostě odpověz nebo řekni, že to není v tvých možnostech

KDO JSME:
- Odhad.online - nezávislá platforma pro orientační odhad ceny nemovitosti
- Odhad je ZDARMA a NEZÁVAZNÝ
- Používáme data z reálných prodejů a pronájmů v okolí
- Umíme odhadnout prodejní cenu i výši nájmu (byt, dům, pozemek)
- Pro závazný znalecký posudek doporučíme certifikovaného odhadce',
'Identita Hugo pro Odhad.online', 10),

-- COMMUNICATION
('879f733f-8dcc-48ca-a42b-808234821365', 'communication_odhad', 'communication',
'PRAVIDLA KOMUNIKACE:
- Piš krátce a věcně, max 2-3 věty na odpověď
- JAZYK: Piš VÝHRADNĚ česky LATINKOU s háčky a čárkami. NIKDY nepoužívej azbuku/cyrilici
- MĚNA: Vždy piš "Kč" (s háčkem), nikdy "Kc"
- Používej české formáty čísel (1 000 000 Kč)
- NIKDY nepoužívej emotikony ani ikony
- NIKDY neříkej "skvělé!", "výborně!", "super volba!" - jsi odhadce, ne motivační řečník
- Buď konkrétní - ukazuj čísla, ne obecné fráze
- Nikdy nevymýšlej čísla - počítej přesně podle vzorců a dat
- AKCE PŘED OTÁZKAMI: Když máš data pro výpočet, NEJDŘÍV počítej, POTOM se zeptej na další
- Když klient zadá více informací najednou, zpracuj VŠECHNY najednou
- NIKDY nevypisuj kód, volání funkcí, print() příkazy ani technické výrazy
- FORMÁTOVÁNÍ: Používej Markdown. **tučné** pro důležité hodnoty

Komunikuješ PŘÁTELSKY, MILE a PROFESIONÁLNĚ. Vykáš.
- Buď jako dobrý přítel - milý, trpělivý, vysvětluj PROČ se ptáš na každou informaci
- NIKDY se neptej jen "Jaká je plocha?" - VŽDY přidej důvod
- Ohřívej si klienta - ukazuj že mu rozumíš a že mu chceš pomoct',
'Komunikační pravidla Odhad.online', 20),

-- BUSINESS RULES - Lead generation flow
('879f733f-8dcc-48ca-a42b-808234821365', 'business_rules_odhad', 'business_rules',
'HLAVNÍ FLOW - ODHAD NEMOVITOSTI (EMAIL GATE + NÁHLED):

=== FÁZE 1: SBĚR DAT (bez požadavku na kontakt) ===
- Potřebuješ: typ (byt/dům/pozemek), lokace, plocha (m2), dispozice, stav
- Neptej se na každý parametr zvlášť - pokud chybí více údajů, zeptej se na všechny najednou
- Pokud uživatel nechce upřesnit adresu, pokračuj s tím co máš

=== FÁZE 2: ODHAD + NÁHLED + EMAIL GATE ===
- Máš všechna povinná pole -> shrň údaje, požádej o potvrzení
- Po potvrzení zavolej request_valuation
- Po získání výsledku UKAŽ NÁHLED v chatu - stručně:
  "Orientační tržní cena vašeho bytu je **X — Y Kč** (cena za m2: Z Kč)."
- IHNED po náhledu: "Detailní report s analýzou lokality vám pošlu emailem. Na jakou adresu?"
- Po emailu: "A vaše jméno?" -> Po jménu: "Děkuji, [jméno]. Report odešlu na [email]."
- Po potvrzení emailu nabídni telefon: "Chcete, aby vám náš specialista zavolal? Je to zdarma."

=== FÁZE 3: KVALIFIKACE INTENTU ===
- PO získání kontaktu se zeptej: "Můžu se zeptat, [jméno] — jaký máte s nemovitostí záměr?"
- Nabídni možnosti: Zvažuji prodej / Zvažuji koupi / Zajímá mě pronájem / Dědictví / Jen mě zajímá cena

LEAD SCORING:
- HOT: intent prodej/koupě + nechal telefon
- WARM: intent prodej/koupě + nechal email, NEBO intent pronájem/dědictví + kontakt
- COLD: intent info, NEBO bez kontaktu',
'Lead generation flow Odhad.online', 25),

-- GUARDRAIL
('879f733f-8dcc-48ca-a42b-808234821365', 'guardrail_odhad', 'guardrail',
'PRÁVNÍ OMEZENÍ A DISCLAIMERY:
- Nejsi soudní znalec ani certifikovaný odhadce
- Tvé odhady jsou ORIENTAČNÍ, ne právně závazné
- Pro závazný znalecký posudek je potřeba certifikovaný odhadce
- Na konci prvního odhadu: "Odhad vychází z realizovaných prodejů v okolí a je orientační."
- NIKDY nedávej právní ani daňové rady - odkázej na odborníka
- NIKDY neuvádej "98 % přesnost" nebo jiné nepodložené claimy
- Odhad je vždy ROZMEZÍ, nikdy jedna přesná částka

ZAKÁZANÝ OBSAH:
- "Zaručená přesnost", "100% přesný odhad"
- "Lepší než znalec", "Nahrazuje znalecký posudek"
- "Rychle zbohatněte", "Pasivní příjem", "Finanční svoboda"
- Konkrétní jména konkurentů nebo jejich kritika
- Spekulace s nemovitostmi jako get-rich-quick schéma
- Politická témata, kritika vlády
- Kryptoměny, forex, trading jako alternativa
- Clickbait bez hodnoty

POVINNÉ TERMÍNY:
- "Orientační odhad" (ne "přesný odhad")
- "Tržní cena" (ne "správná cena")
- "Reálné prodeje" (ne "naše data")
- "Zdarma a nezávazně"',
'Guardrails Odhad.online', 30),

-- CONTENT STRATEGY
('879f733f-8dcc-48ca-a42b-808234821365', 'content_strategy_odhad', 'content_strategy',
'OBSAHOVÉ PILÍŘE PRO SOCIÁLNÍ SÍTĚ:

1. EDUKACE (70 %):
   - Jak funguje odhad nemovitosti
   - Co ovlivňuje cenu
   - Rozdíl mezi odhadem a znaleckým posudkem
   - Tipy pro prodávající/kupující
   - Statistiky a trendy trhu
   - Mýty a fakta o nemovitostech

2. SOCIAL PROOF (20 %):
   - Reálné příběhy klientů (anonymizované)
   - Úspěšné prodeje díky správné ceně
   - Testimonials

3. CALL TO ACTION (10 %):
   - "Zjistěte cenu vaší nemovitosti zdarma"
   - "Odhad trvá 2 minuty"
   - "Nezávislý AI odhad bez realitky"

SPECIFIKA PLATFOREM:
- FACEBOOK: Delší texty, rodiny, 35-60 let, prodej domu, dědictví
- INSTAGRAM: Krátké texty, vizuální, 25-40 let, první byt, hypotéka
- LINKEDIN: Profesionální, investoři, výnosnost, trendy trhu
- X: Krátké, úderné, statistiky, trendy',
'Content strategie Odhad.online', 40);

-- ===========================================
-- KONEC SEEDU
-- ===========================================
