-- ===========================================
-- Problémový nájemník – RSS Feedy
-- UUID: 1a99f995-7572-44c8-80a1-dec63aca3e22
-- ===========================================

-- Vyčistit existující RSS zdroje pro tento projekt
DELETE FROM rss_sources WHERE project_id = '1a99f995-7572-44c8-80a1-dec63aca3e22';

-- ===========================================
-- PRÁVNÍ ZDROJE A JUDIKATURA
-- ===========================================
INSERT INTO rss_sources (project_id, name, url, category, is_active, fetch_interval_hours) VALUES

('1a99f995-7572-44c8-80a1-dec63aca3e22', 'Nejvyšší soud ČR', 
'https://www.nsoud.cz/rss', 'legal', true, 12),

('1a99f995-7572-44c8-80a1-dec63aca3e22', 'Právní prostor', 
'https://www.pravniprostor.cz/feed', 'legal', true, 12),

('1a99f995-7572-44c8-80a1-dec63aca3e22', 'eLaw.cz', 
'http://www.elaw.cz/feed', 'legal', true, 12),

('1a99f995-7572-44c8-80a1-dec63aca3e22', 'E-justice Úřední deska', 
'https://eudeska.justice.cz/SitePages/RSS.aspx', 'legal', true, 24);

-- ===========================================
-- STÁTNÍ SPRÁVA A LEGISLATIVA
-- ===========================================
INSERT INTO rss_sources (project_id, name, url, category, is_active, fetch_interval_hours) VALUES

('1a99f995-7572-44c8-80a1-dec63aca3e22', 'Ministerstvo pro místní rozvoj', 
'https://mmr.gov.cz/cs/ostatni/web/rss', 'legal', true, 12),

('1a99f995-7572-44c8-80a1-dec63aca3e22', 'MMR - Tiskové zprávy', 
'http://www.mmr.cz/rss', 'legal', true, 12),

('1a99f995-7572-44c8-80a1-dec63aca3e22', 'Portál veřejných zakázek', 
'https://portal-vz.cz/r/rss-predchozi-web/', 'market', true, 24);

-- ===========================================
-- REALITNÍ TRH A FINANCE
-- ===========================================
INSERT INTO rss_sources (project_id, name, url, category, is_active, fetch_interval_hours) VALUES

('1a99f995-7572-44c8-80a1-dec63aca3e22', 'Kurzy.cz Reality', 
'https://www.kurzy.cz/zpravy/util/forext.dat?type=rss&col=wzReality', 'market', true, 6),

('1a99f995-7572-44c8-80a1-dec63aca3e22', 'Kurzy.cz Nemovitosti', 
'https://www.kurzy.cz/zpravy/util/forext.dat?type=rss&col=wzNemovitosti', 'market', true, 6),

('1a99f995-7572-44c8-80a1-dec63aca3e22', 'Finance.cz Bydlení', 
'https://www.finance.cz/rss/bydleni/', 'market', true, 6),

('1a99f995-7572-44c8-80a1-dec63aca3e22', 'Bezrealitky Články', 
'https://bezrealitky.webnode.cz/rss/all.xml', 'general', true, 12),

('1a99f995-7572-44c8-80a1-dec63aca3e22', 'Bezrealitky Aktuality', 
'https://bezrealitky.webnode.cz/rss/aktuality.xml', 'general', true, 12),

('1a99f995-7572-44c8-80a1-dec63aca3e22', 'Estav.cz', 
'https://www.estav.cz/cz/export', 'market', true, 12),

('1a99f995-7572-44c8-80a1-dec63aca3e22', 'Bydlení Magazín', 
'https://www.bydlenimagazin.cz/rss/', 'general', true, 12);

-- ===========================================
-- ODBORNÉ ZDROJE PRO MAJITELE
-- ===========================================
INSERT INTO rss_sources (project_id, name, url, category, is_active, fetch_interval_hours) VALUES

('1a99f995-7572-44c8-80a1-dec63aca3e22', 'OSMD - Novinky', 
'https://www.osmd.cz/rss/novinky', 'general', true, 12),

('1a99f995-7572-44c8-80a1-dec63aca3e22', 'OSMD - Aktuality v oblasti bydlení', 
'https://www.osmd.cz/rss/aktuality', 'general', true, 12);

-- ===========================================
-- POZNÁMKY K IMPLEMENTACI
-- ===========================================
-- 
-- KATEGORIE:
-- - legal: právní novinky, judikatura, legislativa
-- - market: realitní trh, ceny, trendy
-- - general: obecné rady, tipy, zkušenosti
--
-- FETCH_INTERVAL_HOURS:
-- - 6h: dynamické zdroje (Kurzy.cz, Finance.cz)
-- - 12h: standardní frekvence (právní portály, MMR, OSMD)
-- - 24h: méně časté aktualizace (úřední desky, veřejné zakázky)
--
-- KLÍČOVÁ SLOVA PRO FILTRACI (implementovat v fetcheru):
-- - nájem, nájemník, pronájem, pronajímatel
-- - byt, nemovitost, vyklizení, vystěhování
-- - smlouva, kauce, výpověď
-- - neplatič, dluh, exekuce
-- - majitel, vlastník
--
-- POZNÁMKY:
-- 1. Některé RSS feedy mohou vyžadovat user-agent nebo cookies
-- 2. Pro OSMD může být potřeba členství pro přístup k některým RSS
-- 3. Pravniprostor.cz a eLaw.cz mají kvalitní právní analýzy
-- 4. Nejvyšší soud ČR je klíčový pro aktuální judikaturu
-- 5. MMR sledovat kvůli legislativním změnám a dotacím
--
