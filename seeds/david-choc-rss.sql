-- ============================================
-- David Choc - RSS Feeds
-- Realitní, finanční a investiční zpravodajství
-- UUID: 2d6a84eb-fb59-416e-bcec-e2a39cee1181
-- ============================================

DELETE FROM rss_sources WHERE project_id = '2d6a84eb-fb59-416e-bcec-e2a39cee1181';

INSERT INTO rss_sources (project_id, name, url, category, is_active, fetch_interval_hours) VALUES

-- NEMOVITOSTI & REALITY
('2d6a84eb-fb59-416e-bcec-e2a39cee1181', 'Hospodářské noviny - Reality', 'https://reality.ihned.cz/?m=rss', 'nemovitosti', true, 6),
('2d6a84eb-fb59-416e-bcec-e2a39cee1181', 'iDNES.cz - Bydlení', 'https://www.idnes.cz/bydleni/rss', 'bydleni', true, 6),
('2d6a84eb-fb59-416e-bcec-e2a39cee1181', 'Novinky.cz - Bydlení', 'https://www.novinky.cz/rss/sekce/11', 'bydleni', true, 12),
('2d6a84eb-fb59-416e-bcec-e2a39cee1181', 'Kurzy.cz - Reality', 'https://www.kurzy.cz/rss/reality/', 'nemovitosti', true, 12),
('2d6a84eb-fb59-416e-bcec-e2a39cee1181', 'Reality iDNES', 'https://reality.idnes.cz/rss.aspx', 'reality_zpravy', true, 12),

-- HYPOTÉKY & FINANCOVÁNÍ
('2d6a84eb-fb59-416e-bcec-e2a39cee1181', 'Hypoindex.cz', 'https://www.hypoindex.cz/feed/', 'hypoteky', true, 12),
('2d6a84eb-fb59-416e-bcec-e2a39cee1181', 'Finparáda.cz', 'https://finparada.cz/rss/', 'hypoteky', true, 24),
('2d6a84eb-fb59-416e-bcec-e2a39cee1181', 'Peníze.cz', 'https://www.penize.cz/rss', 'finance', true, 24),

-- INVESTICE & OSOBNÍ FINANCE
('2d6a84eb-fb59-416e-bcec-e2a39cee1181', 'Investown Blog', 'https://www.investown.cz/blog/rss', 'investice', true, 24),
('2d6a84eb-fb59-416e-bcec-e2a39cee1181', 'Patria.cz - Finance', 'https://www.patria.cz/rss/newsfeed.html', 'finance', true, 12),

-- EKONOMIKA & ČNB
('2d6a84eb-fb59-416e-bcec-e2a39cee1181', 'ČNB - Tiskové zprávy', 'https://www.cnb.cz/cs/rss/rss_tz.xml', 'cnb', true, 24),
('2d6a84eb-fb59-416e-bcec-e2a39cee1181', 'Hospodářské noviny - Ekonomika', 'https://ekonomika.ihned.cz/?m=rss', 'ekonomika', true, 12),
('2d6a84eb-fb59-416e-bcec-e2a39cee1181', 'E15.cz', 'https://www.e15.cz/rss', 'ekonomika', true, 12),

-- STAVEBNICTVÍ & DEVELOPEŘI
('2d6a84eb-fb59-416e-bcec-e2a39cee1181', 'TZB-info - Bydlení', 'https://www.tzb-info.cz/rss/rss-bydleni', 'stavebnictvi', true, 24),

-- PRÁVNÍ & LEGISLATIVA
('2d6a84eb-fb59-416e-bcec-e2a39cee1181', 'Ministerstvo pro místní rozvoj', 'https://www.mmr.cz/cs/rss', 'legislativa', true, 24),
('2d6a84eb-fb59-416e-bcec-e2a39cee1181', 'ČÚZK - Aktuality', 'https://www.cuzk.cz/rss/aktuality.xml', 'katastr', true, 24),

-- REGIONÁLNÍ - PLZEŇ
('2d6a84eb-fb59-416e-bcec-e2a39cee1181', 'Plzeň - iDNES', 'https://plzen.idnes.cz/rss.aspx', 'plzen', true, 12),
('2d6a84eb-fb59-416e-bcec-e2a39cee1181', 'QAP.cz - Plzeň', 'https://www.qap.cz/rss', 'plzen', true, 24);

-- ============================================
-- POZNÁMKY
-- ============================================
-- 6h: Hot news (reality, bydlení)
-- 12h: Ekonomika, hypotéky, regionální
-- 24h: Blogy, legislativa, investice
--
-- Kategorie pro content engine:
-- nemovitosti, bydleni → posty o trhu, cenách
-- hypoteky, finance → posty o financování
-- investice → posty o investičních příležitostech
-- cnb, ekonomika → makro kontext (sazby, inflace)
-- stavebnictvi → novostavby, developeři
-- legislativa, katastr → právní změny
-- plzen → lokální zprávy pro osobní brand
