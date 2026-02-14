-- ===========================================
-- 017: Přidat sloupce pro Imagen do media_assets
-- source, generation_prompt chybí v původním schématu
-- ===========================================

ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'upload';
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS generation_prompt TEXT;
