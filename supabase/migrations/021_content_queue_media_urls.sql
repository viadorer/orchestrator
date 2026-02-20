-- ===========================================
-- 021: Content Queue - media_urls array support
-- Umožňuje ukládat více fotek per post (carousel)
-- ===========================================

-- Přidat media_urls JSONB pole pro array URL
ALTER TABLE content_queue ADD COLUMN IF NOT EXISTS media_urls JSONB DEFAULT '[]'::jsonb;

-- Komentář
COMMENT ON COLUMN content_queue.media_urls IS 'Array of media URLs for multi-image posts (carousel). Example: ["https://...", "https://..."]';

-- Index pro rychlé dotazy
CREATE INDEX IF NOT EXISTS idx_content_queue_media_urls ON content_queue USING GIN (media_urls);
