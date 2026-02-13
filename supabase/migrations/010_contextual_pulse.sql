-- ===========================================
-- 010: Contextual Pulse – RSS/News monitoring
-- Hugo sleduje novinky a reaguje na ně
-- ===========================================

-- 1. RSS zdroje per projekt
CREATE TABLE IF NOT EXISTS rss_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,           -- "ČSÚ", "Hospodářské noviny", "Eurostat"
  url TEXT NOT NULL,            -- RSS feed URL
  category TEXT DEFAULT 'general', -- "demografie", "ekonomika", "nemovitosti"
  is_active BOOLEAN DEFAULT true,
  fetch_interval_hours INT DEFAULT 6, -- Jak často fetchovat
  last_fetched_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Stažené novinky
CREATE TABLE IF NOT EXISTS project_news (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  rss_source_id UUID REFERENCES rss_sources(id) ON DELETE SET NULL,
  source_name TEXT,
  title TEXT NOT NULL,
  link TEXT UNIQUE,             -- Prevence duplicit
  content TEXT,                 -- Stažený čistý text článku
  summary TEXT,                 -- AI shrnutí (3 klíčové body)
  relevance_score FLOAT,       -- Jak moc je relevantní pro projekt (0-1)
  published_at TIMESTAMPTZ,
  embedding vector(768),        -- Sémantické hledání
  is_processed BOOLEAN DEFAULT false,  -- Hugo už na to reagoval?
  is_used_in_post BOOLEAN DEFAULT false, -- Bylo použito v postu?
  used_in_post_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Indexy
CREATE INDEX IF NOT EXISTS idx_project_news_project ON project_news(project_id);
CREATE INDEX IF NOT EXISTS idx_project_news_processed ON project_news(project_id, is_processed);
CREATE INDEX IF NOT EXISTS idx_project_news_published ON project_news(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_rss_sources_project ON rss_sources(project_id, is_active);

-- 4. Sémantický index pro novinky (hnsw funguje i na prázdné tabulce)
CREATE INDEX IF NOT EXISTS idx_project_news_embedding ON project_news
  USING hnsw (embedding vector_cosine_ops);

-- 5. RPC: Najdi relevantní novinky pro post
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
