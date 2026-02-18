-- ===========================================
-- 020: Multi-Platform Content Variants
-- 
-- Adds support for generating platform-specific
-- content variants from a single topic/theme.
-- Each variant is a separate row in content_queue
-- linked by content_group_id.
-- ===========================================

-- content_group_id: links variants of the same topic across platforms
ALTER TABLE content_queue
ADD COLUMN IF NOT EXISTS content_group_id UUID;

-- target_platform: the specific platform this variant is optimized for
-- (replaces the old platforms[] array approach for generated content)
ALTER TABLE content_queue
ADD COLUMN IF NOT EXISTS target_platform TEXT;

-- image_spec: stores the recommended image dimensions for this platform variant
-- e.g. {"width": 1200, "height": 627, "aspectRatio": "1.91:1", "label": "landscape"}
ALTER TABLE content_queue
ADD COLUMN IF NOT EXISTS image_spec JSONB;

-- Index for grouping variants together
CREATE INDEX IF NOT EXISTS idx_cq_content_group
ON content_queue(content_group_id)
WHERE content_group_id IS NOT NULL;

-- Index for filtering by target platform
CREATE INDEX IF NOT EXISTS idx_cq_target_platform
ON content_queue(project_id, target_platform)
WHERE target_platform IS NOT NULL;

-- Update source CHECK to include new variant source
-- First drop the old constraint, then add the new one
ALTER TABLE content_queue DROP CONSTRAINT IF EXISTS content_queue_source_check;
ALTER TABLE content_queue ADD CONSTRAINT content_queue_source_check
CHECK (source IN ('ai_generated', 'manual', 'ai_news', 'human_priority', 'platform_variant'));

-- Update status CHECK to include 'rejected' and 'published' if not already present
ALTER TABLE content_queue DROP CONSTRAINT IF EXISTS content_queue_status_check;
ALTER TABLE content_queue ADD CONSTRAINT content_queue_status_check
CHECK (status IN ('draft', 'review', 'approved', 'scheduled', 'sent', 'failed', 'rejected', 'published', 'cancelled'));

-- ===========================================
-- View: Content groups with their variants
-- ===========================================
CREATE OR REPLACE VIEW content_group_overview AS
SELECT
  cq.content_group_id,
  cq.project_id,
  p.name AS project_name,
  COUNT(*) AS variant_count,
  ARRAY_AGG(DISTINCT cq.target_platform) FILTER (WHERE cq.target_platform IS NOT NULL) AS platforms,
  ARRAY_AGG(DISTINCT cq.status) AS statuses,
  MIN(cq.created_at) AS created_at,
  MAX(cq.scheduled_for) AS latest_scheduled_for,
  AVG((cq.ai_scores->>'overall')::NUMERIC) AS avg_score
FROM content_queue cq
JOIN projects p ON p.id = cq.project_id
WHERE cq.content_group_id IS NOT NULL
GROUP BY cq.content_group_id, cq.project_id, p.name
ORDER BY created_at DESC;

-- ===========================================
-- post_history: add platform column for tracking
-- ===========================================
ALTER TABLE post_history
ADD COLUMN IF NOT EXISTS platform TEXT;

CREATE INDEX IF NOT EXISTS idx_ph_platform
ON post_history(project_id, platform);

-- ===========================================
-- Comment for documentation
-- ===========================================
COMMENT ON COLUMN content_queue.content_group_id IS 'Links platform-specific variants of the same topic. All variants share this UUID.';
COMMENT ON COLUMN content_queue.target_platform IS 'The specific platform this content is optimized for (e.g. linkedin, instagram, facebook).';
COMMENT ON COLUMN content_queue.image_spec IS 'Recommended image dimensions for this platform: {width, height, aspectRatio, label}.';
