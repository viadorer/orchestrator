-- ===========================================
-- 015: Media Assets - People Tagging
-- Přidání pole pro identifikaci osob na fotkách
-- ===========================================

-- Přidat sloupec ai_people pro jména osob na fotce
ALTER TABLE media_assets 
ADD COLUMN IF NOT EXISTS ai_people TEXT[] DEFAULT '{}';

-- Index pro rychlé vyhledávání podle osob
CREATE INDEX IF NOT EXISTS idx_media_assets_people ON media_assets USING gin(ai_people);

-- Komentář
COMMENT ON COLUMN media_assets.ai_people IS 'Jména osob identifikovaných na fotce/videu (AI nebo manuálně zadané)';
