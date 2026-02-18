-- ============================================
-- InvestCzech RSS Feeds Seed
-- České zdroje: ekonomika, investice, nemovitosti, byznys
-- ============================================

-- POZNÁMKA: Nahraď a1b2c3d4-0002-4000-8000-000000000002 za skutečné UUID InvestCzech projektu
-- Získej ho: SELECT id FROM projects WHERE slug = 'investczech';

INSERT INTO rss_sources (project_id, name, url, category, is_active, fetch_interval_hours) VALUES

-- EKONOMIKA & BYZNYS
('a1b2c3d4-0002-4000-8000-000000000002', 'Hospodářské noviny - Ekonomika', 'https://ekonomika.ihned.cz/?m=rss', 'ekonomika', true, 6),
('a1b2c3d4-0002-4000-8000-000000000002', 'Hospodářské noviny - Byznys', 'https://byznys.ihned.cz/?m=rss', 'byznys', true, 6),
('a1b2c3d4-0002-4000-8000-000000000002', 'České noviny - Ekonomika', 'https://www.ceskenoviny.cz/sluzby/rss2/?id=250', 'ekonomika', true, 12),
('a1b2c3d4-0002-4000-8000-000000000002', 'Český rozhlas - Ekonomika', 'https://www.irozhlas.cz/rss/irozhlas/section/ekonomika', 'ekonomika', true, 12),
('a1b2c3d4-0002-4000-8000-000000000002', 'Novinky.cz - Ekonomika', 'https://www.novinky.cz/rss/sekce/10', 'ekonomika', true, 12),

-- INVESTICE & FINANCE
('a1b2c3d4-0002-4000-8000-000000000002', 'Patria.cz - Investice', 'https://www.patria.cz/rss/akcie.xml', 'investice', true, 6),
('a1b2c3d4-0002-4000-8000-000000000002', 'E15.cz - Finance', 'https://www.e15.cz/rss', 'finance', true, 6),
('a1b2c3d4-0002-4000-8000-000000000002', 'Kurzy.cz - Zprávy', 'https://zpravy.kurzy.cz/rss/', 'finance', true, 12),
('a1b2c3d4-0002-4000-8000-000000000002', 'Finex.cz - Investice', 'https://finex.cz/feed/', 'investice', true, 24),

-- NEMOVITOSTI
('a1b2c3d4-0002-4000-8000-000000000002', 'Hospodářské noviny - Reality', 'https://reality.ihned.cz/?m=rss', 'nemovitosti', true, 12),
('a1b2c3d4-0002-4000-8000-000000000002', 'Kurzy.cz - Reality', 'https://www.kurzy.cz/rss/reality/', 'nemovitosti', true, 24),
('a1b2c3d4-0002-4000-8000-000000000002', 'Investown Blog', 'https://www.investown.cz/blog/rss', 'nemovitosti', true, 24),

-- TRHY & AKCIE
('a1b2c3d4-0002-4000-8000-000000000002', 'Patria.cz - Akcie', 'https://www.patria.cz/rss/akcie.xml', 'akcie', true, 6),
('a1b2c3d4-0002-4000-8000-000000000002', 'Patria.cz - Forex', 'https://www.patria.cz/rss/forex.xml', 'forex', true, 12),
('a1b2c3d4-0002-4000-8000-000000000002', 'Patria.cz - Komodity', 'https://www.patria.cz/rss/komodity.xml', 'komodity', true, 12),

-- TECHNOLOGIE & STARTUP
('a1b2c3d4-0002-4000-8000-000000000002', 'Hospodářské noviny - Tech', 'https://tech.ihned.cz/?m=rss', 'tech', true, 12),
('a1b2c3d4-0002-4000-8000-000000000002', 'StartupJobs Blog', 'https://www.startupjobs.cz/blog/feed', 'startup', true, 24),

-- MAKROEKONOMIKA & ČNB
('a1b2c3d4-0002-4000-8000-000000000002', 'ČNB - Tiskové zprávy', 'https://www.cnb.cz/cs/rss/rss_tz.xml', 'cnb', true, 24),
('a1b2c3d4-0002-4000-8000-000000000002', 'Ministerstvo financí ČR', 'https://www.mfcr.cz/cs/rss', 'vláda', true, 24);

-- Poznámka:
-- - fetch_interval_hours: 6 = 4× denně (hot news), 12 = 2× denně, 24 = 1× denně
-- - Kategorie odpovídají tématům InvestCzech projektu
-- - AI sumarizuje články a ukládá do project_news
-- - Hugo může použít aktuální data v postech o investicích, ekonomice, nemovitostech
