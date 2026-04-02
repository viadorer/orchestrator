-- ===========================================
-- 032: Shared Media Library
-- Sdílená knihovna reálných fotek napříč projekty.
-- Fotky s is_shared=true jsou dostupné všem projektům.
-- Matching: nejdřív projekt → pak sdílené.
-- ===========================================

-- 1. Přidat is_shared flag na media_assets
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT false;

-- 2. Umožnit NULL project_id pro sdílené fotky (globální pool)
ALTER TABLE media_assets ALTER COLUMN project_id DROP NOT NULL;

-- 3. Index pro sdílené fotky
CREATE INDEX IF NOT EXISTS idx_media_assets_shared
  ON media_assets(is_shared) WHERE is_shared = true AND is_active = true;

-- 4. Nová RPC: match_media_assets_v2
-- Hledá nejdřív v projektu, pak ve sdíleném poolu.
-- Vrací navíc is_shared flag pro UI rozlišení.
CREATE OR REPLACE FUNCTION match_media_assets_v2(
  query_embedding vector(768),
  match_project_id UUID,
  match_threshold FLOAT DEFAULT 0.3,
  match_count INT DEFAULT 5,
  filter_file_type TEXT DEFAULT NULL,
  exclude_recently_used BOOLEAN DEFAULT true,
  include_shared BOOLEAN DEFAULT true
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
  ai_mood TEXT,
  ai_scene TEXT,
  ai_quality_score REAL,
  times_used INTEGER,
  similarity FLOAT,
  is_shared BOOLEAN,
  source_label TEXT  -- 'project' nebo 'shared'
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
    ma.ai_mood,
    ma.ai_scene,
    ma.ai_quality_score,
    ma.times_used,
    (1 - (ma.embedding <=> query_embedding))::FLOAT AS similarity,
    ma.is_shared,
    CASE
      WHEN ma.project_id = match_project_id THEN 'project'::TEXT
      ELSE 'shared'::TEXT
    END AS source_label
  FROM media_assets ma
  WHERE
    -- Buď patří projektu, nebo je sdílená (pokud include_shared)
    (
      ma.project_id = match_project_id
      OR (include_shared AND ma.is_shared = true)
    )
    AND ma.is_active = true
    AND ma.is_processed = true
    AND ma.embedding IS NOT NULL
    AND (filter_file_type IS NULL OR ma.file_type = filter_file_type)
    AND (NOT exclude_recently_used OR ma.last_used_at IS NULL OR ma.last_used_at < now() - interval '7 days')
    AND (1 - (ma.embedding <=> query_embedding)) > match_threshold
  ORDER BY
    -- Preferuj projektové fotky (bonus +0.05 similarity)
    CASE WHEN ma.project_id = match_project_id THEN 0.05 ELSE 0 END + (1 - (ma.embedding <=> query_embedding)) DESC,
    ma.times_used ASC,
    ma.ai_quality_score DESC NULLS LAST
  LIMIT match_count;
END;
$$;

-- 5. Ponechat starou RPC pro zpětnou kompatibilitu
-- match_media_assets() zůstává, nový kód použije match_media_assets_v2

COMMENT ON FUNCTION match_media_assets_v2 IS
  'Sémantické vyhledávání fotek - projekt + sdílená knihovna. Projektové fotky mají bonus +0.05.';

-- 6. Přidat media_source_label do content_queue pro UI
ALTER TABLE content_queue ADD COLUMN IF NOT EXISTS media_source_label TEXT;
-- 'project', 'shared', nebo NULL
