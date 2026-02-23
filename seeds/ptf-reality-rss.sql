-- ============================================
-- PTF Reality - RSS Feeds
-- Realitní zpravodajství + Plzeň region
-- UUID: 15a83244-d502-4407-8f90-c761170b1d9d
-- ============================================

DELETE FROM rss_sources WHERE project_id = '15a83244-d502-4407-8f90-c761170b1d9d';

INSERT INTO rss_sources (project_id, name, url, category, is_active, fetch_interval_hours) VALUES

-- NEMOVITOSTI & REALITY
('15a83244-d502-4407-8f90-c761170b1d9d', 'Hospodářské noviny - Reality', 'https://reality.ihned.cz/?m=rss', 'nemovitosti', true, 6),
('15a83244-d502-4407-8f90-c761170b1d9d', 'iDNES.cz - Bydlení', 'https://www.idnes.cz/bydleni/rss', 'bydleni', true, 6),
('15a83244-d502-4407-8f90-c761170b1d9d', 'Novinky.cz - Bydlení', 'https://www.novinky.cz/rss/sekce/11', 'bydleni', true, 12),
('15a83244-d502-4407-8f90-c761170b1d9d', 'Kurzy.cz - Reality', 'https://www.kurzy.cz/rss/reality/', 'nemovitosti', true, 12),
('15a83244-d502-4407-8f90-c761170b1d9d', 'Reality iDNES', 'https://reality.idnes.cz/rss.aspx', 'reality_zpravy', true, 12),

-- HYPOTÉKY (kontext pro klienty)
('15a83244-d502-4407-8f90-c761170b1d9d', 'Hypoindex.cz', 'https://www.hypoindex.cz/feed/', 'hypoteky', true, 12),

-- EKONOMIKA
('15a83244-d502-4407-8f90-c761170b1d9d', 'ČNB - Tiskové zprávy', 'https://www.cnb.cz/cs/rss/rss_tz.xml', 'cnb', true, 24),
('15a83244-d502-4407-8f90-c761170b1d9d', 'E15.cz', 'https://www.e15.cz/rss', 'ekonomika', true, 12),

-- STAVEBNICTVÍ
('15a83244-d502-4407-8f90-c761170b1d9d', 'TZB-info - Bydlení', 'https://www.tzb-info.cz/rss/rss-bydleni', 'stavebnictvi', true, 24),

-- LEGISLATIVA
('15a83244-d502-4407-8f90-c761170b1d9d', 'Ministerstvo pro místní rozvoj', 'https://www.mmr.cz/cs/rss', 'legislativa', true, 24),
('15a83244-d502-4407-8f90-c761170b1d9d', 'ČÚZK - Aktuality', 'https://www.cuzk.cz/rss/aktuality.xml', 'katastr', true, 24),

-- PLZEŇ REGION
('15a83244-d502-4407-8f90-c761170b1d9d', 'Plzeň - iDNES', 'https://plzen.idnes.cz/rss.aspx', 'plzen', true, 12),
('15a83244-d502-4407-8f90-c761170b1d9d', 'QAP.cz - Plzeň', 'https://www.qap.cz/rss', 'plzen', true, 24);
