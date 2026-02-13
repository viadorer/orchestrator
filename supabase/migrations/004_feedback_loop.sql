-- ===========================================
-- Feedback Loop + Editor Review columns
-- Hugo se učí z tvých úprav
-- ===========================================

-- Přidáme sloupce pro feedback loop do content_queue
ALTER TABLE content_queue ADD COLUMN IF NOT EXISTS edited_text TEXT;
ALTER TABLE content_queue ADD COLUMN IF NOT EXISTS feedback_note TEXT;
ALTER TABLE content_queue ADD COLUMN IF NOT EXISTS editor_review JSONB;
ALTER TABLE content_queue ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'ai_generated';

-- Index pro rychlé hledání feedbacku per projekt
CREATE INDEX IF NOT EXISTS idx_cq_feedback ON content_queue(project_id, updated_at DESC) WHERE edited_text IS NOT NULL;

-- Index pro source (human_priority vs ai_generated)
CREATE INDEX IF NOT EXISTS idx_cq_source ON content_queue(source);
