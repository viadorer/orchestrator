-- ===========================================
-- 030: Wikidata Entity — propojení s Wikidata pro AI visibility
-- Přidává wikidata_id a website_url do aio_entity_profiles
-- ===========================================

ALTER TABLE aio_entity_profiles ADD COLUMN IF NOT EXISTS wikidata_id TEXT;
ALTER TABLE aio_entity_profiles ADD COLUMN IF NOT EXISTS website_url TEXT;

COMMENT ON COLUMN aio_entity_profiles.wikidata_id IS 'Wikidata Q-ID entity (např. Q40424). Používá se pro sameAs v JSON-LD. Klíčové pro AI visibility.';
COMMENT ON COLUMN aio_entity_profiles.website_url IS 'Hlavní URL webu entity. Používá se pro Organization schema a domain matching v auditech.';
