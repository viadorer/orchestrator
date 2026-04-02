-- ===========================================
-- 033: Carousel support + Template A/B tracking
-- ===========================================

-- 1. Template key tracking pro A/B testování šablon
ALTER TABLE content_queue ADD COLUMN IF NOT EXISTS template_key TEXT;

-- 2. Index pro template A/B analýzu
CREATE INDEX IF NOT EXISTS idx_content_queue_template_key
  ON content_queue(template_key) WHERE template_key IS NOT NULL;

-- 3. View pro template performance (engagement per template)
CREATE OR REPLACE VIEW template_performance AS
SELECT
  cq.template_key,
  COUNT(*) as total_posts,
  COUNT(*) FILTER (WHERE cq.status = 'sent') as published_posts,
  AVG((cq.ai_scores->>'overall')::FLOAT) as avg_ai_score,
  AVG(cq.engagement_score) as avg_engagement,
  MAX(cq.created_at) as last_used
FROM content_queue cq
WHERE cq.template_key IS NOT NULL
GROUP BY cq.template_key
ORDER BY avg_engagement DESC NULLS LAST;

COMMENT ON VIEW template_performance IS
  'A/B tracking šablon — průměrný engagement per template_key';
