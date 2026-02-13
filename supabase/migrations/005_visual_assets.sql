-- ===========================================
-- Visual Assets: Rozšíření pro grafy a obrázky
-- QuickChart.io + HTML→PNG textové karty
-- ===========================================

-- Rozšíření projects o vizuální identitu
ALTER TABLE projects ADD COLUMN IF NOT EXISTS visual_identity JSONB DEFAULT '{
  "primary_color": "#1a1a2e",
  "secondary_color": "#16213e",
  "accent_color": "#0f3460",
  "text_color": "#ffffff",
  "font": "Inter",
  "logo_url": null,
  "style": "minimal"
}'::jsonb;

-- Rozšíření content_queue o vizuální assety
ALTER TABLE content_queue ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE content_queue ADD COLUMN IF NOT EXISTS chart_url TEXT;
ALTER TABLE content_queue ADD COLUMN IF NOT EXISTS card_url TEXT;
ALTER TABLE content_queue ADD COLUMN IF NOT EXISTS visual_type TEXT DEFAULT 'none';
-- visual_type: 'none' | 'chart' | 'card' | 'photo' | 'carousel'

-- Index
CREATE INDEX IF NOT EXISTS idx_cq_visual ON content_queue(visual_type) WHERE visual_type != 'none';
