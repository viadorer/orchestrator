-- ===========================================
-- 018: Content Queue - vizuální sloupce + generation_context
-- visual_type, chart_url, card_url, editor_review, generation_context
-- ===========================================

ALTER TABLE content_queue ADD COLUMN IF NOT EXISTS visual_type TEXT;
ALTER TABLE content_queue ADD COLUMN IF NOT EXISTS chart_url TEXT;
ALTER TABLE content_queue ADD COLUMN IF NOT EXISTS card_url TEXT;
ALTER TABLE content_queue ADD COLUMN IF NOT EXISTS editor_review JSONB;
ALTER TABLE content_queue ADD COLUMN IF NOT EXISTS generation_context JSONB;
ALTER TABLE content_queue ADD COLUMN IF NOT EXISTS edited_text TEXT;
ALTER TABLE content_queue ADD COLUMN IF NOT EXISTS feedback_note TEXT;
