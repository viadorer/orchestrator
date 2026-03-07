-- =============================================
-- Blog System: rozšíření content_queue + blog_config
-- =============================================

-- Rozšíření content_queue o blog metadata
ALTER TABLE content_queue ADD COLUMN IF NOT EXISTS content_type TEXT NOT NULL DEFAULT 'social';
-- 'social' | 'blog'

ALTER TABLE content_queue ADD COLUMN IF NOT EXISTS blog_meta JSONB;
-- { title, slug, excerpt, seo_title, seo_description, category, category_name, image_alt, date_formatted, read_time, keywords, featured }

ALTER TABLE content_queue ADD COLUMN IF NOT EXISTS markdown_body TEXT;
-- Plný obsah článku (HTML fragment nebo markdown)

-- Index pro filtrování blog postů
CREATE INDEX IF NOT EXISTS idx_content_queue_content_type ON content_queue(content_type);
