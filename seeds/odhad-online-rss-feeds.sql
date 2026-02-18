-- ============================================
-- Odhad.online RSS Feeds Seed
-- České zdroje: nemovitosti, reality, hypotéky, bydlení, trh
-- ============================================

-- UUID projektu Odhad.online: 879f733f-8dcc-48ca-a42b-808234821365

INSERT INTO rss_sources (project_id, name, url, category, is_active, fetch_interval_hours) VALUES

-- NEMOVITOSTI & REALITY (hlavní téma)
('879f733f-8dcc-48ca-a42b-808234821365', 'Hospodářské noviny - Reality', 'https://reality.ihned.cz/?m=rss', 'nemovitosti', true, 6),
('879f733f-8dcc-48ca-a42b-808234821365', 'iDNES.cz - Bydlení', 'https://www.idnes.cz/bydleni/rss', 'bydleni', true, 6),
('879f733f-8dcc-48ca-a42b-808234821365', 'Novinky.cz - Bydlení', 'https://www.novinky.cz/rss/sekce/11', 'bydleni', true, 12),
('879f733f-8dcc-48ca-a42b-808234821365', 'Kurzy.cz - Reality', 'https://www.kurzy.cz/rss/reality/', 'nemovitosti', true, 12),
('879f733f-8dcc-48ca-a42b-808234821365', 'Investown Blog', 'https://www.investown.cz/blog/rss', 'investicni_nemovitosti', true, 24),

-- HYPOTÉKY & FINANCOVÁNÍ
('879f733f-8dcc-48ca-a42b-808234821365', 'Hypoindex.cz', 'https://www.hypoindex.cz/feed/', 'hypoteky', true, 12),
('879f733f-8dcc-48ca-a42b-808234821365', 'Finparáda.cz - Hypotéky', 'https://finparada.cz/rss/', 'hypoteky', true, 24),
('879f733f-8dcc-48ca-a42b-808234821365', 'Peníze.cz - Hypotéky', 'https://www.penize.cz/rss', 'finance', true, 24),

-- TRHY & CENY NEMOVITOSTÍ
('879f733f-8dcc-48ca-a42b-808234821365', 'Sreality.cz - Novinky', 'https://www.sreality.cz/rss', 'trh_nemovitosti', true, 12),
('879f733f-8dcc-48ca-a42b-808234821365', 'Bezrealitky.cz - Blog', 'https://www.bezrealitky.cz/blog/feed', 'reality_blog', true, 24),
('879f733f-8dcc-48ca-a42b-808234821365', 'Reality iDNES', 'https://reality.idnes.cz/rss.aspx', 'reality_zpravy', true, 12),

-- EKONOMIKA & ÚROKOVÉ SAZBY (kontext pro hypotéky)
('879f733f-8dcc-48ca-a42b-808234821365', 'ČNB - Tiskové zprávy', 'https://www.cnb.cz/cs/rss/rss_tz.xml', 'cnb', true, 24),
('879f733f-8dcc-48ca-a42b-808234821365', 'Hospodářské noviny - Ekonomika', 'https://ekonomika.ihned.cz/?m=rss', 'ekonomika', true, 12),
('879f733f-8dcc-48ca-a42b-808234821365', 'E15.cz - Finance', 'https://www.e15.cz/rss', 'finance', true, 12),

-- STAVEBNICTVÍ & DEVELOPEŘI
('879f733f-8dcc-48ca-a42b-808234821365', 'Stavebnictví.info', 'https://www.stavebnictvi.info/rss', 'stavebnictvi', true, 24),
('879f733f-8dcc-48ca-a42b-808234821365', 'TZB-info - Bydlení', 'https://www.tzb-info.cz/rss/rss-bydleni', 'bydleni_tech', true, 24),

-- PRÁVNÍ & LEGISLATIVA (katastr, daně, právo)
('879f733f-8dcc-48ca-a42b-808234821365', 'Ministerstvo pro místní rozvoj', 'https://www.mmr.cz/cs/rss', 'legislativa', true, 24),
('879f733f-8dcc-48ca-a42b-808234821365', 'Katastr nemovitostí ČR', 'https://www.cuzk.cz/rss/aktuality.xml', 'katastr', true, 24),

-- REGIONÁLNÍ ZPRÁVY (lokální trhy)
('879f733f-8dcc-48ca-a42b-808234821365', 'Praha - iDNES', 'https://praha.idnes.cz/rss.aspx', 'praha', true, 24),
('879f733f-8dcc-48ca-a42b-808234821365', 'Brno - iDNES', 'https://brno.idnes.cz/rss.aspx', 'brno', true, 24),
('879f733f-8dcc-48ca-a42b-808234821365', 'Ostrava - iDNES', 'https://ostrava.idnes.cz/rss.aspx', 'ostrava', true, 24);

-- ============================================
-- POZNÁMKY K FEEDŮM
-- ============================================

-- FREKVENCE FETCHOVÁNÍ:
-- - 6 hodin (4× denně): Hot news - reality, bydlení, hlavní zpravodajské servery
-- - 12 hodin (2× denně): Ekonomika, hypotéky, trh nemovitostí
-- - 24 hodin (1× denně): Blogy, legislativa, regionální zprávy, technické články

-- KATEGORIE A JEJICH VYUŽITÍ:
-- 1. nemovitosti, bydleni, reality_zpravy → hlavní témata pro posty o cenách, trendech
-- 2. hypoteky, finance → kontext pro posty o financování, sazbách
-- 3. trh_nemovitosti → statistiky, analýzy trhu
-- 4. cnb, ekonomika → makroekonomický kontext (inflace, sazby ČNB)
-- 5. stavebnictvi → novostavby, developeři, nabídka
-- 6. legislativa, katastr → změny v zákonech, daně z nemovitostí
-- 7. praha, brno, ostrava → lokální trendy pro regionální posty

-- CONTENT STRATEGY:
-- Hugo může využít RSS data pro:
-- - "Ceny bytů v Praze vzrostly o X % - co to znamená pro vás?"
-- - "ČNB snížila sazby - ideální čas na refinancování hypotéky"
-- - "Nová legislativa pro katastr - jak to ovlivní odhady?"
-- - "Developeři spouští 5 nových projektů v Brně - analýza cen"
-- - "Průměrná doba prodeje se zkrátila na X dní - proč?"

-- AI SUMARIZACE:
-- - Články jsou automaticky sumarizovány Gemini AI
-- - Uloženy do project_news s embeddingy (pgvector)
-- - Hugo může vyhledat relevantní novinky pro každý post
-- - Zvyšuje aktuálnost a relevanci obsahu

-- MONITORING:
-- - Kontroluj rss_fetch_log pro chyby
-- - Některé RSS feedy mohou být nestabilní nebo změnit URL
-- - Pravidelně aktualizuj seznam feedů podle dostupnosti
