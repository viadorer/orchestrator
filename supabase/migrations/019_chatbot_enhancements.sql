-- Migration 019: Chatbot Enhancements
-- KB embedding for semantic search + chatbot config columns

-- 1. Add embedding column to knowledge_base for semantic search in chatbot
ALTER TABLE knowledge_base ADD COLUMN IF NOT EXISTS embedding vector(768);

-- 2. Create index for fast similarity search
CREATE INDEX IF NOT EXISTS idx_kb_embedding ON knowledge_base USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- 3. Add chatbot-specific columns to projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS chat_allowed_origins JSONB DEFAULT '[]'::jsonb;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS chat_welcome_message TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS chat_color TEXT DEFAULT '#7c3aed';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS chat_enabled BOOLEAN DEFAULT true;

-- 4. RPC function for semantic KB search (used by chatbot)
CREATE OR REPLACE FUNCTION match_kb_entries(
  query_embedding vector(768),
  match_project_id UUID,
  match_threshold FLOAT DEFAULT 0.3,
  match_count INT DEFAULT 15
)
RETURNS TABLE (
  id UUID,
  category TEXT,
  title TEXT,
  content TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kb.id,
    kb.category,
    kb.title,
    kb.content,
    1 - (kb.embedding <=> query_embedding) AS similarity
  FROM knowledge_base kb
  WHERE kb.project_id = match_project_id
    AND kb.is_active = true
    AND kb.embedding IS NOT NULL
    AND 1 - (kb.embedding <=> query_embedding) > match_threshold
  ORDER BY kb.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 5. Index for faster chatbot queries
CREATE INDEX IF NOT EXISTS idx_kb_project_active ON knowledge_base (project_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_prompts_project_active ON project_prompt_templates (project_id, is_active) WHERE is_active = true;
