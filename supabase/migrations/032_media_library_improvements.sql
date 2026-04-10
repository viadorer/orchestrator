-- ===========================================
-- 032: Media Library Improvements
-- Manuální tagy, cross-project sharing, pre-rendered templates
-- ===========================================

-- Manuální tagy vedle AI tagů
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS manual_tags TEXT[] DEFAULT '{}';

-- Shared flag pro cross-project použití
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT false;

-- Pre-renderovaný statický URL na content_queue (template → static PNG at approval time)
ALTER TABLE content_queue ADD COLUMN IF NOT EXISTS static_image_url TEXT;

-- Indexy
CREATE INDEX IF NOT EXISTS idx_media_assets_shared ON media_assets(is_shared) WHERE is_shared = true;
CREATE INDEX IF NOT EXISTS idx_media_assets_manual_tags ON media_assets USING gin(manual_tags);
