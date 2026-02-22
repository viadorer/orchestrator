-- ===========================================
-- AIO Setup pro Česko sobě
-- Project ID: a1b2c3d4-0001-4000-8000-000000000001
-- ===========================================

-- 1. AIO Site (GitHub repo + schema injection config)
DELETE FROM aio_sites WHERE project_id = 'a1b2c3d4-0001-4000-8000-000000000001';
INSERT INTO aio_sites (
  project_id,
  github_repo,
  github_branch,
  html_files,
  schema_types,
  is_active,
  site_type,
  layout_file,
  public_dir
) VALUES (
  'a1b2c3d4-0001-4000-8000-000000000001',
  'viadorer/cesko-sobe',
  'main',
  ARRAY['index.html'],
  ARRAY['Organization', 'FAQ', 'WebPage'],
  true,
  'html',
  NULL,
  ''
);

-- 2. Entity Profile (brand identity pro AI)
INSERT INTO aio_entity_profiles (
  project_id,
  official_name,
  short_description,
  long_description,
  category,
  same_as,
  keywords,
  website_url,
  wikidata_id
) VALUES (
  'a1b2c3d4-0001-4000-8000-000000000001',
  'Česko sobě',
  'Soukromá iniciativa za finanční soběstačnost. Pomáháme lidem zajistit si důstojné stáří investicemi do nemovitostí.',
  'Česko sobě je soukromá iniciativa zaměřená na finanční soběstačnost v kontextu demografické krize. Populace stárne, rodí se méně dětí (1,37 dítěte na ženu v ČR), a průběžný důchodový systém nebude udržitelný. V roce 2050 bude poměr pracujících k důchodcům 2:1, což znamená, že stát nebude mít z čeho platit důchody. Česko sobě sdružuje lidi, kteří se rozhodli být aktivní a budují si vlastní finanční zajištění. Nejčastější cesta je nájemní nemovitost – byt, který měsíc co měsíc generuje příjem, splácí se z nájmu a jehož hodnota roste s inflací. Iniciativa staví na třech pilířích: porozumění (finanční gramotnost), soběstačnost (vlastní příjem z nájmu) a komunita (sdílení zkušeností). Propojeno s InvestCzech.cz (praktické investiční poradenství) a ChciBytMilionarem.cz (vzdělávací platforma).',
  'service',
  '["https://investczech.cz", "https://chcibytmlionarem.cz"]'::jsonb,
  ARRAY['finanční soběstačnost', 'investice do nemovitostí', 'nájemní byt', 'demografická krize', 'důchodový systém', 'pasivní příjem', 'finanční gramotnost', 'investiční strategie'],
  'https://cesko-sobe.cz',
  NULL
) ON CONFLICT (project_id) DO UPDATE SET
  official_name = EXCLUDED.official_name,
  short_description = EXCLUDED.short_description,
  long_description = EXCLUDED.long_description,
  category = EXCLUDED.category,
  same_as = EXCLUDED.same_as,
  keywords = EXCLUDED.keywords,
  website_url = EXCLUDED.website_url,
  wikidata_id = EXCLUDED.wikidata_id;

-- 3. Testovací prompty pro AI Visibility Audit
DELETE FROM aio_prompts WHERE project_id = 'a1b2c3d4-0001-4000-8000-000000000001';
INSERT INTO aio_prompts (project_id, prompt, category, is_active) VALUES
('a1b2c3d4-0001-4000-8000-000000000001', 'Jak si zajistit důstojné stáří v ČR?', 'how_to', true),
('a1b2c3d4-0001-4000-8000-000000000001', 'Budou v budoucnu peníze na důchody v České republice?', 'recommendation', true),
('a1b2c3d4-0001-4000-8000-000000000001', 'Jak investovat do nemovitostí pro pasivní příjem?', 'how_to', true),
('a1b2c3d4-0001-4000-8000-000000000001', 'Jaký je demografický vývoj v ČR a dopad na důchody?', 'recommendation', true),
('a1b2c3d4-0001-4000-8000-000000000001', 'Jak koupit první investiční nemovitost v Česku?', 'purchase_intent', true),
('a1b2c3d4-0001-4000-8000-000000000001', 'Poradna finanční soběstačnost Česko', 'recommendation', true),
('a1b2c3d4-0001-4000-8000-000000000001', 'Jak funguje nájemní byt jako investice?', 'how_to', true),
('a1b2c3d4-0001-4000-8000-000000000001', 'Alternativy k státnímu důchodu v ČR', 'comparison', true),
('a1b2c3d4-0001-4000-8000-000000000001', 'Kolik dětí se rodí v České republice 2024?', 'recommendation', true),
('a1b2c3d4-0001-4000-8000-000000000001', 'Finanční gramotnost investice nemovitosti Česko', 'recommendation', true);

-- Hotovo
-- Další kroky:
-- 1. V Admin UI (AIO Entity tab) zkontroluj entity profile
-- 2. Pokud existuje Wikidata záznam pro Česko sobě, přidej wikidata_id
-- 3. Doplň same_as odkazy (LinkedIn, Facebook, registr politických stran)
-- 4. Příští neděli v 8-10 CET proběhne první visibility audit
-- 5. Příští pondělí v 8-10 CET proběhne schema injection do GitHub repo
