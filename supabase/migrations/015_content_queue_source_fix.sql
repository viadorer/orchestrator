-- ===========================================
-- 015: Fix content_queue source CHECK constraint
-- Kód používá 'human_priority' ale constraint povoluje jen 3 hodnoty
-- Také přidáme 'rejected' do status CHECK
-- ===========================================

-- Oprava source constraint – přidat 'human_priority'
ALTER TABLE content_queue DROP CONSTRAINT IF EXISTS content_queue_source_check;
ALTER TABLE content_queue ADD CONSTRAINT content_queue_source_check
  CHECK (source IN ('ai_generated', 'manual', 'ai_news', 'human_priority'));

-- Oprava status constraint – přidat 'rejected' (používá agent-orchestrator)
ALTER TABLE content_queue DROP CONSTRAINT IF EXISTS content_queue_status_check;
ALTER TABLE content_queue ADD CONSTRAINT content_queue_status_check
  CHECK (status IN ('draft', 'review', 'approved', 'scheduled', 'sent', 'failed', 'rejected'));
