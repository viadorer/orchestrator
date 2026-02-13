-- ===========================================
-- 009: Content Queue - Media Library propojení
-- Sloupce pro matched fotky z media_assets
-- ===========================================

ALTER TABLE content_queue ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE content_queue ADD COLUMN IF NOT EXISTS matched_media_id UUID REFERENCES media_assets(id);
