-- ===========================================
-- 023: Fix project_news – přidat chybějící sloupce z 010_contextual_pulse
-- 
-- Problém: 001 vytvořila project_news se starým schématem (trend_id, source_url).
-- 010 použila CREATE TABLE IF NOT EXISTS → nic nepřidala.
-- Kód v fetcher.ts insertuje do neexistujících sloupců → tiše failuje.
-- ===========================================

-- Přidat chybějící sloupce (IF NOT EXISTS = bezpečné opakované spuštění)
ALTER TABLE project_news ADD COLUMN IF NOT EXISTS rss_source_id UUID REFERENCES rss_sources(id) ON DELETE SET NULL;
ALTER TABLE project_news ADD COLUMN IF NOT EXISTS source_name TEXT;
ALTER TABLE project_news ADD COLUMN IF NOT EXISTS link TEXT;
ALTER TABLE project_news ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE project_news ADD COLUMN IF NOT EXISTS relevance_score FLOAT;
ALTER TABLE project_news ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
ALTER TABLE project_news ADD COLUMN IF NOT EXISTS embedding vector(768);
ALTER TABLE project_news ADD COLUMN IF NOT EXISTS is_processed BOOLEAN DEFAULT false;
ALTER TABLE project_news ADD COLUMN IF NOT EXISTS is_used_in_post BOOLEAN DEFAULT false;
ALTER TABLE project_news ADD COLUMN IF NOT EXISTS used_in_post_id UUID;
ALTER TABLE project_news ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- Unique constraint na link (dedup)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'project_news_link_key'
  ) THEN
    ALTER TABLE project_news ADD CONSTRAINT project_news_link_key UNIQUE (link);
  END IF;
END $$;

-- Indexy z 010 (IF NOT EXISTS = bezpečné)
CREATE INDEX IF NOT EXISTS idx_project_news_project ON project_news(project_id);
CREATE INDEX IF NOT EXISTS idx_project_news_processed ON project_news(project_id, is_processed);
CREATE INDEX IF NOT EXISTS idx_project_news_published ON project_news(published_at DESC);

-- Sémantický index pro novinky
CREATE INDEX IF NOT EXISTS idx_project_news_embedding ON project_news
  USING hnsw (embedding vector_cosine_ops);

-- RPC: Najdi relevantní novinky pro post (recreate – bezpečné)
CREATE OR REPLACE FUNCTION match_news_for_post(
  query_embedding vector(768),
  match_project_id UUID,
  match_threshold FLOAT DEFAULT 0.4,
  match_count INT DEFAULT 5,
  only_unprocessed BOOLEAN DEFAULT true
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  summary TEXT,
  source_name TEXT,
  link TEXT,
  relevance_score FLOAT,
  published_at TIMESTAMPTZ,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pn.id,
    pn.title,
    pn.summary,
    pn.source_name,
    pn.link,
    pn.relevance_score,
    pn.published_at,
    1 - (pn.embedding <=> query_embedding) AS similarity
  FROM project_news pn
  WHERE pn.project_id = match_project_id
    AND pn.embedding IS NOT NULL
    AND (NOT only_unprocessed OR NOT pn.is_used_in_post)
    AND 1 - (pn.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;
