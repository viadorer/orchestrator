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

-- Aktualizace constraint pro content_type - přidání 'blog'
ALTER TABLE content_queue DROP CONSTRAINT IF EXISTS content_queue_content_type_check;

ALTER TABLE content_queue ADD CONSTRAINT content_queue_content_type_check 
CHECK (content_type IN (
  -- Legacy types (backward compatibility)
  'educational',
  'soft_sell',
  'hard_sell',
  'news',
  'engagement',
  
  -- Platform-specific types
  'story',
  'social_proof',
  'bts',
  'local',
  'promo',
  'quick_tip',
  'insight',
  'data_post',
  'opinion',
  'case_study',
  'career',
  'standalone',
  'thread',
  'quote',
  'myth_vs_truth',
  
  -- Blog content type
  'blog',
  'social'
));
