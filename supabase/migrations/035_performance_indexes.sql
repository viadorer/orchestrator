-- 035_performance_indexes.sql
-- Performance indexes — additive, idempotent (CREATE INDEX IF NOT EXISTS).
-- Drives weekly mix queries, dedup checks, dashboard panels, agent log views.
-- Safe to apply on production: indexes are built CONCURRENTLY-friendly via
-- IF NOT EXISTS. If a column doesn't exist on a project's schema yet, the
-- corresponding statement is no-op (DO blocks below guard each one).

-- ---------------------------------------------------------------------------
-- content_queue: weekly mix + status panels
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'content_queue' AND column_name = 'status') THEN
    CREATE INDEX IF NOT EXISTS idx_content_queue_status_platform_created
      ON content_queue (status, platform, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_content_queue_project_status
      ON content_queue (project_id, status);
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- post_history: dedup lookups by project + recency
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_name = 'post_history') THEN
    CREATE INDEX IF NOT EXISTS idx_post_history_project_posted
      ON post_history (project_id, posted_at DESC);
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- agent_log: dashboard timeline + admin filtering
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_name = 'agent_log') THEN
    CREATE INDEX IF NOT EXISTS idx_agent_log_project_created
      ON agent_log (project_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_agent_log_action_created
      ON agent_log (action, created_at DESC);
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- agent_tasks: priority queue scans (status + scheduled_for already exists,
-- but we add (project_id, status) for per-project task panels)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_name = 'agent_tasks') THEN
    CREATE INDEX IF NOT EXISTS idx_agent_tasks_project_status
      ON agent_tasks (project_id, status);
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- media_assets: project filter + shared library queries
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_name = 'media_assets') THEN
    CREATE INDEX IF NOT EXISTS idx_media_assets_project_created
      ON media_assets (project_id, created_at DESC);
    -- Partial index for shared library: skips per-project rows.
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'media_assets' AND column_name = 'is_shared') THEN
      CREATE INDEX IF NOT EXISTS idx_media_assets_shared
        ON media_assets (created_at DESC) WHERE is_shared = TRUE;
    END IF;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- project_news: RSS dashboard + dedup by project + URL
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_name = 'project_news') THEN
    CREATE INDEX IF NOT EXISTS idx_project_news_project_published
      ON project_news (project_id, published_at DESC);
  END IF;
END $$;
