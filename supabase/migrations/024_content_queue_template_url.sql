-- ===========================================
-- 024: Content Queue - template_url column
-- Přidání template_url pro brand šablony s fotkou
-- ===========================================

ALTER TABLE content_queue ADD COLUMN IF NOT EXISTS template_url TEXT;

-- Backfill: pokud existuje card_url a začíná /api/visual/template, zkopíruj do template_url
UPDATE content_queue 
SET template_url = card_url 
WHERE card_url IS NOT NULL 
  AND card_url LIKE '/api/visual/template%'
  AND template_url IS NULL;
