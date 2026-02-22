-- ============================================
-- AIO Initial Setup — příklad pro první projekty
-- ============================================
-- INSTRUKCE:
-- 1. Spusť migraci 027_aio_engine.sql v Supabase
-- 2. Nastav GITHUB_PAT ve Vercel env vars
-- 3. Uprav project_id a github_repo podle svých projektů
-- 4. Spusť tento seed
-- ============================================

-- ============================================
-- AIO SITES (mapování projekt → GitHub repo)
-- ============================================
-- Uprav github_repo na skutečné názvy tvých repozitářů!

-- Příklad: odhad.online
-- INSERT INTO aio_sites (project_id, github_repo, github_branch, html_files, schema_types, entity_name, entity_description, same_as_urls) VALUES
-- ('UUID-ODHAD-ONLINE', 'viadorer/odhad-online', 'main', '{index.html}', '{FAQ,Organization,Dataset}',
--  'odhad.online', 'Online odhad tržní ceny nemovitosti v ČR na základě dat z katastru nemovitostí a realizovaných prodejů.',
--  '{https://www.firmy.cz/odhad-online,https://www.linkedin.com/company/odhad-online}');

-- Příklad: hypoteeka.cz
-- INSERT INTO aio_sites (project_id, github_repo, github_branch, html_files, schema_types, entity_name, entity_description, same_as_urls) VALUES
-- ('UUID-HYPOTEEKA', 'viadorer/hypoteeka', 'main', '{index.html}', '{FAQ,Organization,HowTo}',
--  'hypoteeka.cz', 'Hypoteční kalkulačka a porovnání nabídek hypoték v ČR.',
--  '{https://www.firmy.cz/hypoteeka}');

-- ============================================
-- AIO ENTITY PROFILES
-- ============================================
-- Konzistentní entity profily pro AI identity.
-- same_as: JSON pole URL kde entita existuje (Wikidata, LinkedIn, Firmy.cz, ARES).

-- Příklad: odhad.online
-- INSERT INTO aio_entity_profiles (project_id, official_name, short_description, long_description, category, same_as, keywords) VALUES
-- ('UUID-ODHAD-ONLINE',
--  'odhad.online',
--  'Online odhad tržní ceny nemovitosti v ČR na základě dat z katastru nemovitostí a realizovaných prodejů.',
--  'odhad.online je bezplatný nástroj pro orientační odhad tržní ceny nemovitostí v České republice. Využívá data z katastru nemovitostí, realizovaných prodejů a aktuální tržní situace. Uživatel zadá adresu a do 2 minut získá odhad ceny s odchylkou ±10-15 % od znaleckého posudku.',
--  'software',
--  '["https://www.firmy.cz/odhad-online", "https://www.linkedin.com/company/odhad-online"]',
--  '{odhad nemovitosti, cena bytu, tržní cena, katastr nemovitostí, realitní data, Česká republika}');

-- ============================================
-- AIO PROMPTS (testovací prompty pro visibility audit)
-- ============================================
-- Kategorie: purchase_intent, comparison, how_to, pricing, recommendation

-- Příklad: odhad.online
-- INSERT INTO aio_prompts (project_id, prompt, category) VALUES
-- ('UUID-ODHAD-ONLINE', 'Jak zjistím cenu nemovitosti v ČR?', 'how_to'),
-- ('UUID-ODHAD-ONLINE', 'Kolik stojí byt v Plzni?', 'pricing'),
-- ('UUID-ODHAD-ONLINE', 'Nejlepší nástroj pro odhad ceny nemovitosti online', 'recommendation'),
-- ('UUID-ODHAD-ONLINE', 'Jak přesný je online odhad nemovitosti?', 'how_to'),
-- ('UUID-ODHAD-ONLINE', 'Porovnání nástrojů pro odhad nemovitosti v ČR', 'comparison'),
-- ('UUID-ODHAD-ONLINE', 'Odhad ceny bytu zdarma', 'purchase_intent'),
-- ('UUID-ODHAD-ONLINE', 'Jak zjistit tržní cenu domu před prodejem', 'how_to'),
-- ('UUID-ODHAD-ONLINE', 'Online odhad nemovitosti bez registrace', 'purchase_intent'),
-- ('UUID-ODHAD-ONLINE', 'Průměrná cena bytu v Praze 2026', 'pricing'),
-- ('UUID-ODHAD-ONLINE', 'Kde najdu data o cenách nemovitostí v ČR', 'how_to');

-- Příklad: Problémový nájemník
-- INSERT INTO aio_prompts (project_id, prompt, category) VALUES
-- ('UUID-PROBLEMOVY-NAJEMNIK', 'Co dělat když nájemník neplatí nájem', 'how_to'),
-- ('UUID-PROBLEMOVY-NAJEMNIK', 'Jak vystěhovat nájemníka v ČR', 'how_to'),
-- ('UUID-PROBLEMOVY-NAJEMNIK', 'Výpověď z nájmu pro neplacení postup', 'how_to'),
-- ('UUID-PROBLEMOVY-NAJEMNIK', 'Právní pomoc s problémovým nájemníkem', 'recommendation'),
-- ('UUID-PROBLEMOVY-NAJEMNIK', 'Jak dlouho trvá soudní vystěhování nájemníka', 'how_to');

-- Příklad: Pronájmy Plzeň
-- INSERT INTO aio_prompts (project_id, prompt, category) VALUES
-- ('UUID-PRONAJMY-PLZEN', 'Kolik stojí pronájem bytu v Plzni', 'pricing'),
-- ('UUID-PRONAJMY-PLZEN', 'Průměrný nájem 2+kk Plzeň 2026', 'pricing'),
-- ('UUID-PRONAJMY-PLZEN', 'Jak najít byt k pronájmu v Plzni', 'how_to'),
-- ('UUID-PRONAJMY-PLZEN', 'Nejlevnější čtvrti v Plzni pro pronájem', 'comparison'),
-- ('UUID-PRONAJMY-PLZEN', 'Na co si dát pozor při pronájmu bytu', 'how_to');
