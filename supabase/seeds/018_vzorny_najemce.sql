-- ===========================================
-- SEED: Vzorný nájemce
-- Garantovaný nájem pro majitele nemovitostí
-- ===========================================

-- CLEANUP
DELETE FROM project_prompt_templates WHERE project_id = 'b69c9206-78eb-450f-9349-3d306a821e7f';
DELETE FROM knowledge_base WHERE project_id = 'b69c9206-78eb-450f-9349-3d306a821e7f';
DELETE FROM rss_sources WHERE project_id = 'b69c9206-78eb-450f-9349-3d306a821e7f';
DELETE FROM content_queue WHERE project_id = 'b69c9206-78eb-450f-9349-3d306a821e7f';
DELETE FROM agent_tasks WHERE project_id = 'b69c9206-78eb-450f-9349-3d306a821e7f';
DELETE FROM agent_log WHERE project_id = 'b69c9206-78eb-450f-9349-3d306a821e7f';
DELETE FROM post_history WHERE project_id = 'b69c9206-78eb-450f-9349-3d306a821e7f';
DELETE FROM projects WHERE id = 'b69c9206-78eb-450f-9349-3d306a821e7f';

-- 1. PROJEKT
INSERT INTO projects (
  id, name, slug, description,
  platforms, late_social_set_id,
  mood_settings, content_mix, constraints, semantic_anchors, style_rules,
  visual_identity, orchestrator_config, is_active
) VALUES (
  'b69c9206-78eb-450f-9349-3d306a821e7f',
  'Vzorný nájemce',
  'vzorny-najemce',
  'Služba garantovaného nájmu pro majitele bytů a domů. Pronajímáme vaši nemovitost, garantujeme pravidelný nájem bez výpadků, staráme se o nájemníky i údržbu. Web: vzornynajemce.cz',
  ARRAY['linkedin', 'instagram', 'facebook'],
  NULL,
  '{"tone": "professional", "energy": "calm", "style": "reassuring"}'::jsonb,
  '{"educational": 0.60, "soft_sell": 0.25, "hard_sell": 0.15}'::jsonb,
  '{"forbidden_topics": ["zaručený výnos","investiční poradenství","100% bezrizikové","kritika konkurentů","diskriminace nájemníků","politická témata","spekulace","kryptoměny"], "mandatory_terms": ["garantovaný nájem","bez starostí","pravidelný příjem","správa nemovitosti"], "max_hashtags": 5}'::jsonb,
  ARRAY['garantovaný nájem','pronájem bez starostí','správa nemovitosti','pasivní příjem','pravidelný nájem','ochrana majitele','profesionální správa','výnos z pronájmu','vzorný nájemce','bez výpadků'],
  '{"start_with_question": true, "max_bullets": 5, "no_hashtags_in_text": true, "max_length": 2000, "use_real_examples": true, "conversational_tone": true}'::jsonb,
  '{"primary_color": "#1e3a5f", "secondary_color": "#2d5a87", "accent_color": "#22c55e", "text_color": "#ffffff", "font": "Inter", "style": "modern_trustworthy", "photography": {"style": "real_estate_lifestyle", "subjects": ["modern_apartments","happy_owners","keys_handover","cozy_interiors"], "mood": "calm_and_secure"}}'::jsonb,
  '{"enabled": false, "posting_frequency": "daily", "posting_times": ["10:00","16:00"], "max_posts_per_day": 1, "content_strategy": "6-2.5-1.5", "auto_publish": false, "auto_publish_threshold": 8.5, "timezone": "Europe/Prague", "platforms_priority": ["facebook","linkedin","instagram"], "pause_weekends": true}'::jsonb,
  true
);

-- ===========================================
-- 2. KNOWLEDGE BASE
-- ===========================================

-- ---- PRODUCT ----
INSERT INTO knowledge_base (project_id, category, title, content, is_active) VALUES
('b69c9206-78eb-450f-9349-3d306a821e7f', 'product', 'Co je Vzorný nájemce',
'Vzorný nájemce je služba garantovaného nájmu pro majitele bytů a domů. Fungujeme jako prostředník mezi majitelem a nájemníkem. Majitel pronajme nemovitost nám a my garantujeme pravidelný měsíční nájem bez ohledu na to, zda je byt obsazený nebo ne. Staráme se o vše: hledání nájemníků, smlouvy, údržbu, řešení problémů.', true),

('b69c9206-78eb-450f-9349-3d306a821e7f', 'product', 'Garantovaný nájem - jak to funguje',
'Princip: 1) Majitel podepíše smlouvu na 2-5 let. 2) Garantujeme fixní měsíční nájem (85-90 % tržního). 3) Nájem přichází každý měsíc bez výjimky. 4) Najdeme a prověříme nájemníky. 5) Řešíme komunikaci, údržbu, opravy. 6) Na konci vrátíme nemovitost ve smluvním stavu.', true),

('b69c9206-78eb-450f-9349-3d306a821e7f', 'product', 'Správa nemovitosti v ceně',
'V rámci garantovaného nájmu zajišťujeme: hledání a prověřování nájemníků, přípravu smluv, předávací protokoly s fotodokumentací, pravidelné kontroly stavu (1× za 3 měsíce), běžnou údržbu a drobné opravy, komunikaci s nájemníky 24/7, řešení pojistných událostí, vyúčtování energií. Vše zahrnuto, žádné skryté poplatky.', true),

('b69c9206-78eb-450f-9349-3d306a821e7f', 'product', 'Pojištění a ochrana nemovitosti',
'Každá nemovitost ve správě je chráněna: pojištění odpovědnosti za škody, kauce 2 měsíční nájmy na escrow účtu, fotodokumentace při předání a vrácení, pravidelné kontroly, smluvní závazek vrácení v původním stavu, rychlé řešení havárií (SLA do 4 hodin).', true);

-- ---- AUDIENCE ----
INSERT INTO knowledge_base (project_id, category, title, content, is_active) VALUES
('b69c9206-78eb-450f-9349-3d306a821e7f', 'audience', 'Cílové skupiny',
'1. INVESTOŘI (35-55 let): Koupili byt jako investici, nechtějí se starat, vlastní 1-3 byty. 2. DĚDICI: Zdědili nemovitost, nechtějí prodávat ani se starat, často v jiném městě. 3. EXPATI: Vlastní nemovitost v ČR, žijí v zahraničí, potřebují správce na dálku. 4. SENIOŘI: Přestěhovali se, nechtějí stres z pronájmu, oceňují klid a jistotu.', true),

('b69c9206-78eb-450f-9349-3d306a821e7f', 'audience', 'Bolesti majitelů',
'Hlavní problémy: 1) Neplatící nájemníci. 2) Poškození nemovitosti. 3) Čas a starosti (5-15 h/měsíc). 4) Právní rizika. 5) Výpadky příjmu (1-3 měsíce mezi nájemníky). 6) Vzdálená správa. 7) Stres (volání o půlnoci, havárie). Vzorný nájemce řeší VŠECHNY tyto problémy najednou.', true);

-- ---- USP ----
INSERT INTO knowledge_base (project_id, category, title, content, is_active) VALUES
('b69c9206-78eb-450f-9349-3d306a821e7f', 'usp', 'Proč Vzorný nájemce',
'Výhody: 1) GARANCE NÁJMU - platíme i když je byt prázdný. 2) NULOVÉ STAROSTI - kompletní správa. 3) PROVĚŘENÍ NÁJEMNÍCI - důkladný screening. 4) PRÁVNÍ JISTOTA - profesionální smlouvy. 5) PRAVIDELNÉ KONTROLY - fotoreport 1× za 3 měsíce. 6) RYCHLÝ SERVIS - havárie do 4 hodin. 7) TRANSPARENTNOST - online přehled. 8) VRÁCENÍ V PŮVODNÍM STAVU.', true),

('b69c9206-78eb-450f-9349-3d306a821e7f', 'usp', 'Rozdíl oproti konkurenci',
'Vlastní pronájem: Vyšší nájem, ale riziko neplacení, výpadky, 5-15 h/měsíc práce. Realitní kancelář: Najdou nájemníka za provizi, pak jste sami. Správcovská firma: Spravují za 8-15 % nájmu, ale NEGARANTUJÍ nájem. Vzorný nájemce: GARANTUJEME nájem + kompletní správa. Jediný, kdo nese riziko neplacení za vás.', true);

-- ---- FAQ ----
INSERT INTO knowledge_base (project_id, category, title, content, is_active) VALUES
('b69c9206-78eb-450f-9349-3d306a821e7f', 'faq', 'Kolik budu dostávat?',
'Garantovaný nájem je 85-90 % tržního nájmu. Příklad: tržní nájem 18 000 Kč → garance 15 300-16 200 Kč/měsíc. Rozdíl pokrývá správu, riziko a výpadky. Dostáváte méně, ale KAŽDÝ měsíc bez výjimky.', true),

('b69c9206-78eb-450f-9349-3d306a821e7f', 'faq', 'Na jak dlouho je smlouva?',
'Standardně 3 roky, minimum 2 roky. Výpovědní lhůta 3 měsíce. Po skončení můžete prodloužit, převzít nájemníka, nebo nemovitost převzít zpět.', true),

('b69c9206-78eb-450f-9349-3d306a821e7f', 'faq', 'Co když nájemník neplatí?',
'To je náš problém, ne váš. Vy dostáváte garantovaný nájem bez ohledu na platby nájemníka. Máme screening, kauce 2 měsíce, pojištění a právní oddělení.', true),

('b69c9206-78eb-450f-9349-3d306a821e7f', 'faq', 'Kdo platí opravy?',
'Drobné opravy do 2 000 Kč jsou v ceně. Větší opravy hradí majitel, ale my koordinujeme - vybereme řemeslníka, dohlédneme na kvalitu. Havárie řešíme okamžitě. Vše s fotodokumentací.', true),

('b69c9206-78eb-450f-9349-3d306a821e7f', 'faq', 'Mohu nemovitost prodat?',
'Ano. Nový majitel může převzít smlouvu (výhoda - okamžitý příjem), nebo ji ukončíme s 3měsíční výpovědní lhůtou. Garantovaný nájem může zvýšit prodejní cenu.', true),

('b69c9206-78eb-450f-9349-3d306a821e7f', 'faq', 'Jaké nemovitosti přijímáte?',
'Byty a domy v dobrém stavu v Praze a krajských městech. Funkční rozvody, bez závažných vad, platný PENB. Před podpisem provedeme bezplatnou prohlídku a ocenění.', true),

('b69c9206-78eb-450f-9349-3d306a821e7f', 'faq', 'Jak prověřujete nájemníky?',
'5stupňový screening: 1) Ověření identity. 2) Kontrola příjmu (min. 3× nájem). 3) Registry dlužníků (SOLUS, CRIBIS). 4) Reference od předchozího pronajímatele. 5) Osobní pohovor. Odmítáme cca 30 % žadatelů.', true);

-- ---- CASE_STUDY ----
INSERT INTO knowledge_base (project_id, category, title, content, is_active) VALUES
('b69c9206-78eb-450f-9349-3d306a821e7f', 'case_study', 'Investor se 3 byty v Praze',
'Pan Novák (45) vlastnil 3 byty, sám pronajímal 5 let. 15 h/měsíc správa, 2× neplatič (ztráta 120 tis. Kč), vakance 2 měs/rok. Po předání Vzornému nájemci: garance 42 000 Kč/měsíc (vs. průměr 38 000 při vlastní správě), 0 hodin práce. Nižší nájem na papíře, vyšší reálný příjem.', true),

('b69c9206-78eb-450f-9349-3d306a821e7f', 'case_study', 'Dědička bytu v jiném městě',
'Paní Svobodová (52) zdědila byt 2+1 v Brně, žije v Praze. Po roce vlastní správy: problémový nájemník, 3 měsíce dluh, poškozená koupelna. Po předání: garance 13 500 Kč/měsíc, byt opravený, pravidelný fotoreport. Za 2 roky: 0 problémů.', true),

('b69c9206-78eb-450f-9349-3d306a821e7f', 'case_study', 'Senior s volným bytem',
'Pan Dvořák (72) se přestěhoval k dceři, byt 3+1 v Ostravě prázdný. Garance 11 000 Kč/měsíc, peníze na účtu 15. každého měsíce. "Konečně mám klid. Nemusím nikomu volat, nic řešit."', true),

('b69c9206-78eb-450f-9349-3d306a821e7f', 'case_study', 'Expat v Londýně',
'Tomáš (38) pracuje v Londýně, byt 2+kk na Praze 5. Správa na dálku byla noční můra. Po předání: online dashboard, garance 16 800 Kč/měsíc. "Podívám se na dashboard jednou za měsíc. Vše funguje."', true);

-- ---- DATA ----
INSERT INTO knowledge_base (project_id, category, title, content, is_active) VALUES
('b69c9206-78eb-450f-9349-3d306a821e7f', 'data', 'Statistiky nájemního trhu ČR 2026',
'1,2 mil. domácností v nájmu (28 %). Průměrný nájem 2+kk: Praha 24 tis., Brno 18 tis., Ostrava 12 tis. Meziroční růst 5-8 %. Průměrná vakance: 1,5 měs/rok. Podíl problémových nájemníků: 8-12 %.', true),

('b69c9206-78eb-450f-9349-3d306a821e7f', 'data', 'Ekonomika garantovaného nájmu',
'Srovnání za 3 roky (2+kk Praha, tržní 20 000 Kč): VLASTNÍ SPRÁVA: 720 tis. hrubý - 90 tis. vakance - 40 tis. neplatič - 108 tis. čas = 482 tis. čistý. GARANCE (17 000): 612 tis. - 0 - 0 - 0 = 612 tis. Rozdíl +130 tis. ve prospěch garance.', true),

('b69c9206-78eb-450f-9349-3d306a821e7f', 'data', 'Rizika samostatného pronájmu',
'8-12 % nájemníků přestane platit. Vystěhování neplatiče: 6-12 měsíců soudně. Průměrná škoda: 30-80 tis. Kč. 15 % majitelů zažilo poškození nad 50 tis. Vakance 1,5 měs/rok. Právní náklady: 20-60 tis. Kč.', true),

('b69c9206-78eb-450f-9349-3d306a821e7f', 'data', 'Výnosnost pronájmu v ČR 2026',
'Hrubá výnosnost: Praha 3,5-4,5 %, Brno 4,5-5,5 %, Ostrava 6-8 %, Plzeň 4-5,5 %. S garancí nižší o 10-15 %, ale STABILNÍ a BEZRIZIKOVÁ. Reálná výnosnost po rizicích často VYŠŠÍ.', true);

-- ---- MARKET ----
INSERT INTO knowledge_base (project_id, category, title, content, is_active) VALUES
('b69c9206-78eb-450f-9349-3d306a821e7f', 'market', 'Trendy nájemního trhu 2026',
'1) Růst nájmů 5-8 %. 2) Profesionalizace (build-to-rent). 3) Regulace posiluje ochranu nájemníků. 4) Digitalizace správy. 5) ESG a energetická náročnost. 6) Remote work - poptávka po větších bytech. Garantovaný nájem je odpověď na profesionalizaci trhu.', true),

('b69c9206-78eb-450f-9349-3d306a821e7f', 'market', 'Build-to-rent trend',
'BTR je globální trend: projekty stavěné k pronájmu. V ČR: Heimstaden, Mint Investments, Trigema Rent. Individuální majitelé soutěží s profesionály. Vzorný nájemce je cesta, jak konkurovat BTR bez vlastních zdrojů.', true);

-- ---- LEGAL ----
INSERT INTO knowledge_base (project_id, category, title, content, is_active) VALUES
('b69c9206-78eb-450f-9349-3d306a821e7f', 'legal', 'Právní rámec nájmu v ČR',
'Nájemní smlouva písemně pro dobu > 1 rok. Výpovědní lhůta 3 měsíce. Kauce max 3 nájmy (standardně 2). Vystěhování pouze soudně (6-12 měsíců). Majitel nesmí vstoupit bez souhlasu. Drobné opravy nájemník, větší majitel.', true),

('b69c9206-78eb-450f-9349-3d306a821e7f', 'legal', 'Daňové aspekty pronájmu',
'Daň 15 % (FO) nebo 21 % (PO). Paušální výdaje 30 %. Skutečné: odpisy, opravy, pojištění, správa, úroky. DPH osvobozeno. Sociální/zdravotní neplatí (pokud není hlavní činnost). Poplatek za garantovaný nájem je daňově uznatelný.', true);

-- ---- PROCESS ----
INSERT INTO knowledge_base (project_id, category, title, content, is_active) VALUES
('b69c9206-78eb-450f-9349-3d306a821e7f', 'process', 'Jak začít s Vzorným nájemcem',
'1) KONTAKT: Formulář nebo telefon. 2) PROHLÍDKA: Zhodnotíme stav a potenciál. 3) NABÍDKA: Do 48 hodin garantovaná výše nájmu. 4) SMLOUVA: 2-5 let, jasné podmínky. 5) PŘEDÁNÍ: Protokol s fotodokumentací. 6) SPRÁVA: Najdeme nájemníka, řešíme vše. Od kontaktu po první nájem: 2-4 týdny.', true),

('b69c9206-78eb-450f-9349-3d306a821e7f', 'process', 'Screening nájemníků',
'5 stupňů: 1) Ověření identity. 2) Potvrzení příjmu (min. 3× nájem). 3) Registry dlužníků (SOLUS, CRIBIS, exekuce). 4) Reference od předchozího pronajímatele. 5) Osobní pohovor. Odmítáme 30 % žadatelů.', true),

('b69c9206-78eb-450f-9349-3d306a821e7f', 'process', 'Po podpisu smlouvy',
'Měsíc 1: Předání, fotodokumentace, drobné úpravy. Měsíc 1-2: Inzerce, prohlídky, screening. Měsíc 2-3: Smlouva s nájemníkem, předání. Průběžně: Garance na účtu 15. každého měsíce. Čtvrtletně: Kontrola s fotoreportem. Ročně: Revize nájmu.', true);

-- ---- GENERAL ----
INSERT INTO knowledge_base (project_id, category, title, content, is_active) VALUES
('b69c9206-78eb-450f-9349-3d306a821e7f', 'general', 'O společnosti',
'Vzorný nájemce je česká společnost specializující se na garantovaný nájem a profesionální správu nemovitostí. Působíme v Praze a krajských městech. Mise: Přeměnit pronájem z noční můry na pasivní příjem. Web: vzornynajemce.cz', true),

('b69c9206-78eb-450f-9349-3d306a821e7f', 'general', 'Proč pronájem místo prodeje',
'5 důvodů: 1) Pasivní příjem. 2) Růst hodnoty 5-8 %/rok. 3) Inflační ochrana. 4) Daňové výhody (odpisy, paušál). 5) Dědictví. S garantovaným nájmem všechny výhody BEZ nevýhod.', true);

-- ===========================================
-- 3. PROMPT TEMPLATES
-- ===========================================

INSERT INTO project_prompt_templates (project_id, slug, category, content, description, sort_order) VALUES

-- IDENTITY
('b69c9206-78eb-450f-9349-3d306a821e7f', 'identity_vzorny_najemce', 'identity',
'KDO JSEM:
- Jsem Hugo – AI asistent projektu Vzorný nájemce.
- Jsem expert na pronájem nemovitostí, správu a investice do bydlení.
- Komunikuji klidně, důvěryhodně a s konkrétními čísly.
- Vždy mluvím česky s háčky a čárkami.

OSOBNOST:
- Klidný a jistý – vzbuzuji důvěru.
- Praktický – dávám konkrétní rady a čísla.
- Empatický – rozumím starostem majitelů.
- Profesionální – znám trh, zákony, čísla.

MISE:
Pomáhám majitelům přeměnit pronájem ze stresu na pasivní příjem.
Garantovaný nájem = jistota + klid + nulové starosti.',
'Identita Hugo pro Vzorný nájemce', 10),

-- COMMUNICATION
('b69c9206-78eb-450f-9349-3d306a821e7f', 'communication_vzorny_najemce', 'communication',
'PRAVIDLA KOMUNIKACE:
- Piš VÝHRADNĚ česky s háčky a čárkami.
- Klidný, důvěryhodný tón. Žádná agresivní prodejní rétorika.
- Používej konkrétní čísla: "85-90 % tržního nájmu", "0 výpadků za 2 roky".
- Ukazuj srovnání: vlastní správa vs. garantovaný nájem.

STRUKTURA POSTU:
1. HOOK: Otázka nebo problém majitele
2. PROBLÉM: Pojmenování bolesti (neplatič, vakance, stres)
3. ŘEŠENÍ: Jak to řeší garantovaný nájem
4. DŮKAZ: Čísla, příběh, srovnání
5. CTA: Výzva k akci

TÓNY PRO SEGMENTY:
- Investoři: Čísla, výnosnost, ROI
- Dědici/senioři: Klid, jistota, bez starostí
- Expati: Online správa, transparentnost

ZAKÁZANÉ FRÁZE:
- "Zaručený výnos"
- "Bezrizikové investování"
- "Nejlepší na trhu"',
'Komunikační pravidla Vzorný nájemce', 20),

-- GUARDRAILS
('b69c9206-78eb-450f-9349-3d306a821e7f', 'guardrail_vzorny_najemce', 'guardrail',
'BEZPEČNOSTNÍ PRAVIDLA:
- NIKDY neslibuj konkrétní výnosnost investice.
- NIKDY nepoužívej "zaručený výnos", "bezrizikové".
- NIKDY nekritizuj konkurenci jménem.
- NIKDY nediskriminuj nájemníky.
- NIKDY nestrašit hrůznými příběhy (fakta jsou OK).
- VŽDY uveď, že garance je 85-90 % tržního (ne 100 %).

POVINNÉ DISCLAIMERY:
- Výnosnost: "Orientační kalkulace, skutečnost se může lišit."
- Právní témata: "Doporučujeme konzultaci s právníkem."
- Daně: "Konzultujte s daňovým poradcem."

PŘESNOST:
- Používej POUZE data z Knowledge Base.
- Pokud si nejsi jistý faktem, NEPOUŽIJ ho.',
'Guardrails Vzorný nájemce', 30),

-- CONTENT STRATEGY
('b69c9206-78eb-450f-9349-3d306a821e7f', 'content_strategy_vzorny_najemce', 'content_strategy',
'STRATEGIE OBSAHU:
Content mix: 60 % edukace, 25 % soft-sell, 15 % hard-sell.

EDUKAČNÍ (60 %):
- Tipy pro majitele, statistiky trhu, právní rady
- Srovnání vlastní správa vs. profesionální
- Rizika pronájmu a prevence

SOFT-SELL (25 %):
- Příběhy klientů, srovnání ekonomiky
- Proces spolupráce, FAQ

HARD-SELL (15 %):
- Nabídka konzultace, kalkulátor výnosu
- Limitované akce

PRAVIDLA:
- Každý post = konkrétní hodnota (číslo, tip, příběh).
- Střídej segmenty (investoři, dědici, senioři, expati).',
'Strategie obsahu Vzorný nájemce', 40),

-- PLATFORM RULES - FACEBOOK
('b69c9206-78eb-450f-9349-3d306a821e7f', 'platform_facebook_vzorny_najemce', 'platform_rules',
'PRAVIDLA PRO FACEBOOK:
- Konverzační, přátelský tón.
- Začni otázkou nebo příběhem.
- Délka: 800-1 500 znaků.
- Hashtagy: 3-5 na konci.
- Emoji: s mírou.
- Témata: příběhy klientů, tipy, statistiky, FAQ, srovnání.',
'Facebook pravidla Vzorný nájemce', 50),

-- PLATFORM RULES - LINKEDIN
('b69c9206-78eb-450f-9349-3d306a821e7f', 'platform_linkedin_vzorny_najemce', 'platform_rules',
'PRAVIDLA PRO LINKEDIN:
- Profesionální, datový tón.
- Začni číslem nebo trendem.
- Délka: 1 200-2 200 znaků.
- Hashtagy: 3-5. Žádné emoji.
- Témata: investiční analýzy, trendy, právní změny, case studies.',
'LinkedIn pravidla Vzorný nájemce', 51),

-- PLATFORM RULES - INSTAGRAM
('b69c9206-78eb-450f-9349-3d306a821e7f', 'platform_instagram_vzorny_najemce', 'platform_rules',
'PRAVIDLA PRO INSTAGRAM:
- Vizuální – VŽDY navrhni image prompt.
- Caption: 500-1 000 znaků.
- Hashtagy: 15-20.
- Emoji: povoleny.
- Carousel pro tipy, srovnání, statistiky.
- Témata: before/after, infografiky, příběhy, proces.',
'Instagram pravidla Vzorný nájemce', 52),

-- QUALITY CRITERIA
('b69c9206-78eb-450f-9349-3d306a821e7f', 'quality_vzorny_najemce', 'quality_criteria',
'KRITÉRIA KVALITY (minimum 7/10):
1. RELEVANCE (10): Řeší reálný problém majitele.
2. HODNOTA (9): Konkrétní číslo, tip, nebo příběh.
3. DŮVĚRYHODNOST (9): Podloženo daty, statistikami.
4. SROZUMITELNOST (8): Jasný jazyk, žádný žargon.
5. CTA (7): Přirozená výzva k akci.
POKUD < 7 → PŘEGENEROVAT.',
'Kritéria kvality Vzorný nájemce', 70),

-- CTA RULES
('b69c9206-78eb-450f-9349-3d306a821e7f', 'cta_vzorny_najemce', 'cta_rules',
'PRAVIDLA PRO CTA (max 1 per post):
1. ENGAGEMENT: "Pronajímáte sami? Jaká je vaše zkušenost?"
2. EDUKACE: "Více na vzornynajemce.cz"
3. NABÍDKA: "Zjistěte, kolik vám garantujeme"
4. KALKULACE: "Spočítejte si výnos"

SEGMENTOVÉ:
- Investoři: "Kolik vám vydělává váš byt?"
- Dědici: "Zdědili jste nemovitost? Poradíme."
- Senioři: "Chcete klid a pravidelný příjem?"
- Expati: "Spravujeme váš byt na dálku."',
'CTA pravidla Vzorný nájemce', 60),

-- LEGAL
('b69c9206-78eb-450f-9349-3d306a821e7f', 'legal_vzorny_najemce', 'legal',
'PRÁVNÍ OMEZENÍ:
- NIKDY neslibuj konkrétní výnosnost.
- NIKDY nepoužívej "zaručený výnos", "bezrizikové".
- VŽDY uveď: "Orientační kalkulace."
- NIKDY nediskriminuj nájemníky.
- NIKDY nekritizuj konkurenci jménem.

POVOLENÉ:
- "Garantovaný nájem 85-90 % tržního"
- "Nulová vakance"
- "Kompletní správa bez starostí"

ZAKÁZANÉ:
- "Zaručená návratnost"
- "Bezrizikový příjem"
- "Nejlepší investice"',
'Právní omezení Vzorný nájemce', 98);

-- ===========================================
-- 4. RSS FEEDS
-- ===========================================

INSERT INTO rss_sources (project_id, name, url, category, is_active, fetch_interval_hours) VALUES

-- NEMOVITOSTI & REALITNÍ TRH
('b69c9206-78eb-450f-9349-3d306a821e7f', 'Hypoindex.cz', 'https://www.hypoindex.cz/feed/', 'nemovitosti', true, 12),
('b69c9206-78eb-450f-9349-3d306a821e7f', 'Realityčechy.cz Blog', 'https://www.realitycechy.cz/blog/feed/', 'nemovitosti', true, 24),
('b69c9206-78eb-450f-9349-3d306a821e7f', 'CzechCrunch - Reality', 'https://cc.cz/feed/', 'nemovitosti', true, 12),
('b69c9206-78eb-450f-9349-3d306a821e7f', 'E15 - Nemovitosti', 'https://www.e15.cz/rss/nemovitosti', 'nemovitosti', true, 12),

-- EKONOMIKA & FINANCE
('b69c9206-78eb-450f-9349-3d306a821e7f', 'Peníze.cz', 'https://www.penize.cz/rss', 'ekonomika', true, 12),
('b69c9206-78eb-450f-9349-3d306a821e7f', 'Měšec.cz', 'https://www.mesec.cz/rss/', 'ekonomika', true, 12),
('b69c9206-78eb-450f-9349-3d306a821e7f', 'Finmag', 'https://finmag.penize.cz/rss', 'ekonomika', true, 24),
('b69c9206-78eb-450f-9349-3d306a821e7f', 'Hospodářské noviny', 'https://ihned.cz/rss/', 'ekonomika', true, 12),

-- PRÁVO & LEGISLATIVA
('b69c9206-78eb-450f-9349-3d306a821e7f', 'Epravo.cz', 'https://www.epravo.cz/rss/', 'legislativa', true, 24),
('b69c9206-78eb-450f-9349-3d306a821e7f', 'Právní prostor', 'https://www.pravniprostor.cz/rss', 'legislativa', true, 24),

-- INVESTICE & OSOBNÍ FINANCE
('b69c9206-78eb-450f-9349-3d306a821e7f', 'Investiční web', 'https://www.investicniweb.cz/rss/', 'investice', true, 12),
('b69c9206-78eb-450f-9349-3d306a821e7f', 'Fondee Blog', 'https://www.fondee.cz/blog/feed/', 'investice', true, 24),

-- SPRÁVA NEMOVITOSTÍ & PRONÁJEM
('b69c9206-78eb-450f-9349-3d306a821e7f', 'Bezrealitky Blog', 'https://www.bezrealitky.cz/blog/feed/', 'pronajem', true, 24),
('b69c9206-78eb-450f-9349-3d306a821e7f', 'UlovDomov Blog', 'https://blog.ulovdomov.cz/feed/', 'pronajem', true, 24),

-- HYPOTÉKY & BANKOVNICTVÍ
('b69c9206-78eb-450f-9349-3d306a821e7f', 'Banky.cz', 'https://www.banky.cz/rss/', 'hypoteky', true, 24),
('b69c9206-78eb-450f-9349-3d306a821e7f', 'ČNB - Měnová politika', 'https://www.cnb.cz/cs/.galleries/rss/menova_politika.xml', 'hypoteky', true, 24);
