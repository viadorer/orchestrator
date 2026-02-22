-- ============================================
-- AIO Initial Setup — reálná data pro orchestrátor
-- ============================================
-- INSTRUKCE:
-- 1. Spusť migraci 027_aio_engine.sql v Supabase
-- 2. Nastav GITHUB_PAT ve Vercel env vars
-- 3. Spusť tento seed
-- ============================================
-- POZNÁMKA: Projekty které nemají GitHub repo (odhad.online, Pronájmy Plzeň,
-- Problémový nájemník) — vytvoř pro ně repo na GitHubu a odkomentuj příslušné řádky.
-- ============================================

-- ============================================
-- 1. AIO SITES (mapování projekt → GitHub repo)
-- ============================================

-- VitalSpace (má repo: viadorer/vitalspace-dark)
INSERT INTO aio_sites (project_id, github_repo, github_branch, html_files, schema_types, is_active, entity_name, entity_description, same_as_urls) VALUES
('ab968db8-40df-4115-8a2d-4d634cbd60ed', 'viadorer/vitalspace-dark', 'main', '{index.html}', '{FAQ,Organization}', true,
 'VitalSpace', 'Ozonová sanitace pro longevity a wellness. Profesionální dezinfekce a sanitace prostor ozonem.',
 '{}');

-- hypoteeka-AI (má repo: viadorer/hypoteeka-AI)
-- POZNÁMKA: Toto je Next.js app, ne statický HTML. Schema injection bude do public/index.html nebo layout.
-- INSERT INTO aio_sites (project_id, github_repo, github_branch, html_files, schema_types, is_active, entity_name, entity_description, same_as_urls) VALUES
-- ('UUID-HYPOTEEKA', 'viadorer/hypoteeka-AI', 'main', '{index.html}', '{FAQ,Organization,HowTo}', true,
--  'hypoteeka.cz', 'Hypoteční kalkulačka a porovnání nabídek hypoték v ČR.',
--  '{}');

-- ČeskoSobě (má repo: viadorer/ceskosobe)
-- INSERT INTO aio_sites (project_id, github_repo, github_branch, html_files, schema_types, is_active, entity_name, entity_description, same_as_urls) VALUES
-- ('UUID-CESKO-SOBE', 'viadorer/ceskosobe', 'main', '{index.html}', '{FAQ,Organization}', true,
--  'ČeskoSobě', 'Platforma pro podporu českých podnikatelů a lokální ekonomiky.',
--  '{}');

-- InvestCzech (má repo: viadorer/InvestCzech)
-- INSERT INTO aio_sites (project_id, github_repo, github_branch, html_files, schema_types, is_active, entity_name, entity_description, same_as_urls) VALUES
-- ('UUID-INVESTCZECH', 'viadorer/InvestCzech', 'main', '{index.html}', '{FAQ,Organization,Dataset}', true,
--  'InvestCzech', 'Investiční platforma zaměřená na české nemovitosti a ekonomiku.',
--  '{}');

-- Odhad.online (NEMÁ repo — vytvoř viadorer/odhad-online a odkomentuj)
-- INSERT INTO aio_sites (project_id, github_repo, github_branch, html_files, schema_types, is_active, entity_name, entity_description, same_as_urls) VALUES
-- ('879f733f-8dcc-48ca-a42b-808234821365', 'viadorer/odhad-online', 'main', '{index.html}', '{FAQ,Organization,Dataset,HowTo}', true,
--  'odhad.online', 'Online odhad tržní ceny nemovitosti v ČR na základě dat z katastru nemovitostí a realizovaných prodejů.',
--  '{}');

-- Problémový nájemník (NEMÁ repo — vytvoř viadorer/problemovy-najemnik a odkomentuj)
-- INSERT INTO aio_sites (project_id, github_repo, github_branch, html_files, schema_types, is_active, entity_name, entity_description, same_as_urls) VALUES
-- ('1a99f995-7572-44c8-80a1-dec63aca3e22', 'viadorer/problemovy-najemnik', 'main', '{index.html}', '{FAQ,Organization,HowTo}', true,
--  'Problémový nájemník', 'Průvodce pro majitele bytů řešící obtížné situace s nájemníky. Právní postupy, vzory dokumentů, kalkulačky.',
--  '{}');

-- Pronájmy Plzeň (NEMÁ repo — vytvoř viadorer/pronajmy-plzen a odkomentuj)
-- INSERT INTO aio_sites (project_id, github_repo, github_branch, html_files, schema_types, is_active, entity_name, entity_description, same_as_urls) VALUES
-- ('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'viadorer/pronajmy-plzen', 'main', '{index.html}', '{FAQ,Organization,Dataset}', true,
--  'Pronájmy Plzeň', 'Komunita a průvodce pronájmy bytů v Plzni. Aktuální ceny, tipy pro nájemníky i pronajímatele.',
--  '{}');

-- ============================================
-- 2. AIO ENTITY PROFILES
-- ============================================

-- VitalSpace
INSERT INTO aio_entity_profiles (project_id, official_name, short_description, long_description, category, same_as, keywords) VALUES
('ab968db8-40df-4115-8a2d-4d634cbd60ed',
 'VitalSpace',
 'Ozonová sanitace pro longevity a wellness. Profesionální dezinfekce a sanitace prostor ozonem.',
 'VitalSpace nabízí profesionální ozonovou sanitaci prostor. Ozon ničí 99,9 % bakterií, virů a plísní bez chemikálií. Služba je určena pro domácnosti, kanceláře, hotely a wellness centra. Ozonová sanitace zlepšuje kvalitu vzduchu a podporuje zdravé prostředí pro longevity.',
 'service',
 '[]',
 '{ozonová sanitace, dezinfekce ozonem, wellness, longevity, kvalita vzduchu, profesionální sanitace}');

-- Odhad.online
INSERT INTO aio_entity_profiles (project_id, official_name, short_description, long_description, category, same_as, keywords) VALUES
('879f733f-8dcc-48ca-a42b-808234821365',
 'odhad.online',
 'Online odhad tržní ceny nemovitosti v ČR na základě dat z katastru nemovitostí a realizovaných prodejů.',
 'odhad.online je bezplatný nástroj pro orientační odhad tržní ceny nemovitostí v České republice. Využívá data z katastru nemovitostí, realizovaných prodejů a aktuální tržní situace. Uživatel zadá adresu a typ nemovitosti a do 2 minut získá odhad ceny. Odchylka od znaleckého posudku činí ±10-15 %. Služba pokrývá byty, domy a pozemky ve všech krajích ČR.',
 'software',
 '[]',
 '{odhad nemovitosti, cena bytu, tržní cena, katastr nemovitostí, realitní data, Česká republika, online odhad, cena domu}');

-- Problémový nájemník
INSERT INTO aio_entity_profiles (project_id, official_name, short_description, long_description, category, same_as, keywords) VALUES
('1a99f995-7572-44c8-80a1-dec63aca3e22',
 'Problémový nájemník',
 'Průvodce pro majitele bytů řešící obtížné situace s nájemníky v ČR. Právní postupy, vzory dokumentů, kalkulačky.',
 'Problémový nájemník je informační portál pro majitele bytů v České republice, kteří řeší obtížné situace s nájemníky. Poskytuje právní postupy podle občanského zákoníku, vzory dokumentů (výpověď, předžalobní výzva), kalkulačky ušlého nájemného a časové osy řešení. Obsah je konzultován s advokáty a vychází z aktuální judikatury.',
 'information',
 '[]',
 '{problémový nájemník, neplacení nájmu, výpověď z nájmu, vystěhování nájemníka, práva pronajímatele, občanský zákoník, nájemní smlouva}');

-- Pronájmy Plzeň
INSERT INTO aio_entity_profiles (project_id, official_name, short_description, long_description, category, same_as, keywords) VALUES
('c99fce94-ae19-4f6b-9777-6d2af28ff960',
 'Pronájmy Plzeň',
 'Komunita a průvodce pronájmy bytů v Plzni. Aktuální ceny, tipy pro nájemníky i pronajímatele.',
 'Pronájmy Plzeň je komunitní platforma zaměřená na trh s pronájmy bytů v Plzni a okolí. Poskytuje aktuální data o cenách nájmů podle čtvrtí, tipy pro nájemníky i pronajímatele, informace o právech a povinnostech obou stran. Komunita na Facebooku sdružuje přes 1 700 členů.',
 'community',
 '[]',
 '{pronájem bytu Plzeň, nájem Plzeň, cena pronájmu, byt k pronájmu, Plzeň čtvrti, Slovany, Bory, Doubravka}');

-- ============================================
-- 3. AIO PROMPTS (testovací prompty pro visibility audit)
-- ============================================

-- Odhad.online — 10 promptů
INSERT INTO aio_prompts (project_id, prompt, category) VALUES
('879f733f-8dcc-48ca-a42b-808234821365', 'Jak zjistím cenu nemovitosti v ČR?', 'how_to'),
('879f733f-8dcc-48ca-a42b-808234821365', 'Kolik stojí byt v Plzni?', 'pricing'),
('879f733f-8dcc-48ca-a42b-808234821365', 'Nejlepší nástroj pro odhad ceny nemovitosti online', 'recommendation'),
('879f733f-8dcc-48ca-a42b-808234821365', 'Jak přesný je online odhad nemovitosti?', 'how_to'),
('879f733f-8dcc-48ca-a42b-808234821365', 'Porovnání nástrojů pro odhad nemovitosti v ČR', 'comparison'),
('879f733f-8dcc-48ca-a42b-808234821365', 'Odhad ceny bytu zdarma', 'purchase_intent'),
('879f733f-8dcc-48ca-a42b-808234821365', 'Jak zjistit tržní cenu domu před prodejem', 'how_to'),
('879f733f-8dcc-48ca-a42b-808234821365', 'Online odhad nemovitosti bez registrace', 'purchase_intent'),
('879f733f-8dcc-48ca-a42b-808234821365', 'Průměrná cena bytu v Praze 2026', 'pricing'),
('879f733f-8dcc-48ca-a42b-808234821365', 'Kde najdu data o cenách nemovitostí v ČR', 'how_to');

-- Problémový nájemník — 10 promptů
INSERT INTO aio_prompts (project_id, prompt, category) VALUES
('1a99f995-7572-44c8-80a1-dec63aca3e22', 'Co dělat když nájemník neplatí nájem', 'how_to'),
('1a99f995-7572-44c8-80a1-dec63aca3e22', 'Jak vystěhovat nájemníka v ČR', 'how_to'),
('1a99f995-7572-44c8-80a1-dec63aca3e22', 'Výpověď z nájmu pro neplacení postup', 'how_to'),
('1a99f995-7572-44c8-80a1-dec63aca3e22', 'Právní pomoc s problémovým nájemníkem', 'recommendation'),
('1a99f995-7572-44c8-80a1-dec63aca3e22', 'Jak dlouho trvá soudní vystěhování nájemníka', 'how_to'),
('1a99f995-7572-44c8-80a1-dec63aca3e22', 'Vzor výpovědi z nájmu pro neplacení', 'purchase_intent'),
('1a99f995-7572-44c8-80a1-dec63aca3e22', 'Předžalobní výzva nájemníkovi vzor', 'purchase_intent'),
('1a99f995-7572-44c8-80a1-dec63aca3e22', 'Kolik stojí soudní vystěhování nájemníka', 'pricing'),
('1a99f995-7572-44c8-80a1-dec63aca3e22', 'Práva pronajímatele při neplacení nájmu', 'how_to'),
('1a99f995-7572-44c8-80a1-dec63aca3e22', 'Jak napsat výpověď z nájmu', 'how_to');

-- Pronájmy Plzeň — 10 promptů
INSERT INTO aio_prompts (project_id, prompt, category) VALUES
('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'Kolik stojí pronájem bytu v Plzni', 'pricing'),
('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'Průměrný nájem 2+kk Plzeň 2026', 'pricing'),
('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'Jak najít byt k pronájmu v Plzni', 'how_to'),
('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'Nejlevnější čtvrti v Plzni pro pronájem', 'comparison'),
('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'Na co si dát pozor při pronájmu bytu', 'how_to'),
('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'Pronájem bytu Plzeň Slovany cena', 'pricing'),
('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'Pronájem bytu Plzeň Bory cena', 'pricing'),
('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'Kde hledat pronájem bytu v Plzni', 'recommendation'),
('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'Porovnání cen pronájmů v Plzni podle čtvrtí', 'comparison'),
('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'Průměrná cena pronájmu garsonky Plzeň', 'pricing');

-- VitalSpace — 5 promptů
INSERT INTO aio_prompts (project_id, prompt, category) VALUES
('ab968db8-40df-4115-8a2d-4d634cbd60ed', 'Ozonová sanitace prostor', 'how_to'),
('ab968db8-40df-4115-8a2d-4d634cbd60ed', 'Dezinfekce ozonem účinnost', 'how_to'),
('ab968db8-40df-4115-8a2d-4d634cbd60ed', 'Ozonová sanitace cena', 'pricing'),
('ab968db8-40df-4115-8a2d-4d634cbd60ed', 'Jak funguje ozonová dezinfekce', 'how_to'),
('ab968db8-40df-4115-8a2d-4d634cbd60ed', 'Ozonová sanitace pro wellness', 'recommendation');
