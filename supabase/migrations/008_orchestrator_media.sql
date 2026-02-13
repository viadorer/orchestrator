-- ===========================================
-- 008: Per-Project Orchestrator + Media Library
-- Hugo autonomie: každý projekt = nezávislý mozek
-- Media: Supabase Storage + AI tagging + pgvector
-- ===========================================

-- 1. Per-project orchestrator config
-- Každý projekt má vlastní frekvenci, časy, strategii
ALTER TABLE projects ADD COLUMN IF NOT EXISTS orchestrator_config JSONB DEFAULT '{
  "enabled": true,
  "posting_frequency": "daily",
  "posting_times": ["09:00", "15:00"],
  "max_posts_per_day": 2,
  "content_strategy": "4-1-1",
  "auto_publish": false,
  "auto_publish_threshold": 8.5,
  "timezone": "Europe/Prague",
  "media_strategy": "auto",
  "platforms_priority": [],
  "pause_weekends": false
}'::jsonb;

-- 2. Media Assets – fotky, videa, grafiky per projekt
-- AI-tagged přes Gemini Vision, sémanticky prohledávatelné přes pgvector
CREATE TABLE IF NOT EXISTS media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Storage
  storage_path TEXT NOT NULL,          -- project-media/{project_id}/photos/abc.jpg
  public_url TEXT NOT NULL,            -- veřejná URL pro getLate mediaItems
  file_name TEXT,                      -- původní název souboru
  file_type TEXT NOT NULL DEFAULT 'image', -- image, video, document, graphic
  mime_type TEXT,
  file_size INTEGER,                   -- bytes
  width INTEGER,                       -- px
  height INTEGER,                      -- px
  duration_seconds REAL,               -- pro videa
  
  -- AI-generated metadata (Gemini Vision)
  ai_description TEXT,                 -- "Žena podpisuje hypoteční smlouvu v kanceláři"
  ai_tags TEXT[] DEFAULT '{}',         -- {"hypotéka", "smlouva", "kancelář", "žena"}
  ai_objects TEXT[] DEFAULT '{}',      -- {"person", "document", "pen", "desk"}
  ai_colors TEXT[] DEFAULT '{}',       -- {"#1a2b3c", "#ffffff", "#0066cc"}
  ai_mood TEXT,                        -- professional, casual, happy, dramatic, warm
  ai_scene TEXT,                       -- office, outdoor, home, studio, abstract
  ai_quality_score REAL,               -- 0-10, kvalita fotky
  
  -- Sémantický vektor pro matching s posty
  embedding vector(768),               -- Gemini text-embedding-004
  
  -- Usage tracking
  times_used INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  last_used_in TEXT,                   -- ID postu kde byla naposledy použita
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_processed BOOLEAN DEFAULT false,  -- AI tagging proběhl?
  processing_error TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexy
CREATE INDEX IF NOT EXISTS idx_media_assets_project ON media_assets(project_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_type ON media_assets(file_type);
CREATE INDEX IF NOT EXISTS idx_media_assets_processed ON media_assets(is_processed) WHERE NOT is_processed;
CREATE INDEX IF NOT EXISTS idx_media_assets_active ON media_assets(project_id, is_active) WHERE is_active;
CREATE INDEX IF NOT EXISTS idx_media_assets_tags ON media_assets USING gin(ai_tags);

-- pgvector index pro sémantické vyhledávání fotek
-- ivfflat je rychlejší pro < 1M vektorů, hnsw pro > 1M
CREATE INDEX IF NOT EXISTS idx_media_assets_embedding ON media_assets 
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- 3. Supabase Storage bucket policy (RLS)
-- Bucket 'project-media' se vytvoří ručně v Supabase Dashboard
-- nebo přes: INSERT INTO storage.buckets (id, name, public) VALUES ('project-media', 'project-media', true);

-- 4. Trigger pro updated_at
CREATE OR REPLACE FUNCTION update_media_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER media_assets_updated_at
  BEFORE UPDATE ON media_assets
  FOR EACH ROW EXECUTE FUNCTION update_media_updated_at();

-- 5. RPC: Sémantické vyhledávání fotek pro post
CREATE OR REPLACE FUNCTION match_media_assets(
  query_embedding vector(768),
  match_project_id UUID,
  match_threshold FLOAT DEFAULT 0.3,
  match_count INT DEFAULT 5,
  filter_file_type TEXT DEFAULT NULL,
  exclude_recently_used BOOLEAN DEFAULT true
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
    ma.ai_mood,
    ma.ai_scene,
    ma.ai_quality_score,
    ma.times_used,
    1 - (ma.embedding <=> query_embedding) AS similarity
  FROM media_assets ma
  WHERE ma.project_id = match_project_id
    AND ma.is_active = true
    AND ma.is_processed = true
    AND ma.embedding IS NOT NULL
    AND (filter_file_type IS NULL OR ma.file_type = filter_file_type)
    AND (NOT exclude_recently_used OR ma.last_used_at IS NULL OR ma.last_used_at < now() - interval '7 days')
    AND 1 - (ma.embedding <=> query_embedding) > match_threshold
  ORDER BY
    similarity DESC,
    ma.times_used ASC,  -- preferuj méně použité
    ma.ai_quality_score DESC NULLS LAST
  LIMIT match_count;
END;
$$;

-- 6. RPC: Increment media usage counter
CREATE OR REPLACE FUNCTION increment_media_usage(asset_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE media_assets
  SET times_used = times_used + 1,
      last_used_at = now()
  WHERE id = asset_id;
END;
$$;
