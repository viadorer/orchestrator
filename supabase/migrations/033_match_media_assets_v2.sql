-- ===========================================
-- 033: match_media_assets v2
-- Preferuje reálné fotky (source='upload') nad AI-generovanými
-- Podporuje cross-project shared assets
-- Cooldown 14 dní (z 7)
-- ===========================================

CREATE OR REPLACE FUNCTION match_media_assets(
  query_embedding vector(768),
  match_project_id UUID,
  match_threshold FLOAT DEFAULT 0.3,
  match_count INT DEFAULT 5,
  filter_file_type TEXT DEFAULT NULL,
  exclude_recently_used BOOLEAN DEFAULT true,
  include_shared BOOLEAN DEFAULT false
)
RETURNS TABLE (
  id UUID,
  project_id UUID,
  storage_path TEXT,
  public_url TEXT,
  file_name TEXT,
  file_type TEXT,
  ai_description TEXT,
  ai_tags TEXT[],
  manual_tags TEXT[],
  ai_mood TEXT,
  ai_scene TEXT,
  ai_quality_score REAL,
  times_used INTEGER,
  source TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ma.id,
    ma.project_id,
    ma.storage_path,
    ma.public_url,
    ma.file_name,
    ma.file_type,
    ma.ai_description,
    ma.ai_tags,
    ma.manual_tags,
    ma.ai_mood,
    ma.ai_scene,
    ma.ai_quality_score,
    ma.times_used,
    ma.source,
    1 - (ma.embedding <=> query_embedding) AS similarity
  FROM media_assets ma
  WHERE (ma.project_id = match_project_id OR (include_shared AND ma.is_shared = true))
    AND ma.is_active = true
    AND ma.is_processed = true
    AND ma.embedding IS NOT NULL
    AND (filter_file_type IS NULL OR ma.file_type = filter_file_type)
    AND (NOT exclude_recently_used OR ma.last_used_at IS NULL OR ma.last_used_at < now() - interval '14 days')
    AND 1 - (ma.embedding <=> query_embedding) > match_threshold
  ORDER BY
    CASE WHEN ma.source = 'upload' THEN 0 ELSE 1 END ASC,  -- prefer real photos
    similarity DESC,
    ma.ai_quality_score DESC NULLS LAST,
    ma.times_used ASC  -- prefer less used
  LIMIT match_count;
END;
$$;
