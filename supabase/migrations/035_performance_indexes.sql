-- 035_performance_indexes.sql
-- Performance indexes — additive, idempotent (CREATE INDEX IF NOT EXISTS).
-- Drives weekly mix queries, dedup checks, dashboard panels, agent log views.
--
-- Each block is guarded by `DO $$ … END $$` that checks for the column
-- existence first — this keeps the migration safe against schema drift
-- (e.g. older Supabase projects that haven't applied migration 020 yet
-- and therefore don't have content_queue.target_platform).
--
-- Re-run safe: every CREATE INDEX uses IF NOT EXISTS.

-- ---------------------------------------------------------------------------
-- content_queue: weekly mix queries (filter project_id + target_platform +
-- status + created_at) and review/queue panels.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  -- Composite index for the weekly mix lookup in content-engine.ts:
  --   WHERE project_id = ? AND target_platform = ? AND status IN (...)
  --     AND created_at >= ?
  -- Partial index keeps it small — old single-platform legacy rows have
  -- target_platform = NULL and aren't relevant to mix decisions.
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'content_queue' AND column_name = 'target_platform') THEN
    CREATE INDEX IF NOT EXISTS idx_content_queue_project_target_status_created
      ON content_queue (project_id, target_platform, status, created_at DESC)
      WHERE target_platform IS NOT NULL;
  END IF;

  -- General per-project status panel (review queue, scheduled list, …).
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'content_queue' AND column_name = 'status') THEN
    CREATE INDEX IF NOT EXISTS idx_content_queue_project_status
      ON content_queue (project_id, status);
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- post_history: dedup lookups by project + recency.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'post_history' AND column_name = 'posted_at'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_post_history_project_posted
      ON post_history (project_id, posted_at DESC);
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- agent_log: dashboard timeline + admin filtering.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agent_log' AND column_name = 'project_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_agent_log_project_created
      ON agent_log (project_id, created_at DESC);
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agent_log' AND column_name = 'action'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_agent_log_action_created
      ON agent_log (action, created_at DESC);
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- agent_tasks: per-project task panels (status filter is most selective).
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agent_tasks' AND column_name = 'status'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_agent_tasks_project_status
      ON agent_tasks (project_id, status);
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- media_assets: project filter + shared library partial index.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'media_assets' AND column_name = 'project_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_media_assets_project_created
      ON media_assets (project_id, created_at DESC);
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'media_assets' AND column_name = 'is_shared'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_media_assets_shared
      ON media_assets (created_at DESC) WHERE is_shared = TRUE;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- project_news: RSS dashboard ordered by publish date.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'project_news' AND column_name = 'published_at'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_project_news_project_published
      ON project_news (project_id, published_at DESC);
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Cleanup of any half-baked index from the original buggy migration version
-- that referenced the non-existent column "platform".
-- ---------------------------------------------------------------------------
DROP INDEX IF EXISTS idx_content_queue_status_platform_created;
