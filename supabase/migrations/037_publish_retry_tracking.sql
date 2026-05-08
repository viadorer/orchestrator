-- ===========================================
-- 037: Publish retry tracking + orphan detection
-- ===========================================
-- Adds bookkeeping columns to content_queue so the publish route can:
--   1. Retry transient failures with exponential backoff
--   2. Detect "orphaned" posts (sent to getLate but no webhook arrived)
--   3. Show a clean failure trail in Daily Brief / admin UI
--
-- All columns are nullable + default-friendly so existing rows keep working
-- without backfill. Safe to apply at any time.

-- Track how many times we've tried to publish this post.
-- Resets to 0 when status moves to 'approved' (caller clears it).
ALTER TABLE content_queue
  ADD COLUMN IF NOT EXISTS publish_attempts INTEGER NOT NULL DEFAULT 0;

-- Most recent publish error message (NULL on success or before first attempt).
-- Truncated to first ~500 chars; full stack lives in agent_log.
ALTER TABLE content_queue
  ADD COLUMN IF NOT EXISTS last_publish_error TEXT;

-- Time of last publish attempt — drives backoff scheduling for the cron retry loop.
ALTER TABLE content_queue
  ADD COLUMN IF NOT EXISTS last_publish_attempt_at TIMESTAMPTZ;

-- Flag set by the orphan detector when status='sent' but no webhook arrived
-- within the expected window (default 2h). Surfaced in Daily Brief.
ALTER TABLE content_queue
  ADD COLUMN IF NOT EXISTS webhook_orphaned BOOLEAN NOT NULL DEFAULT false;

-- Index makes the cron retry loop cheap: pull approved posts with attempts < N
-- ordered by last attempt time, so we naturally space them out.
CREATE INDEX IF NOT EXISTS idx_content_queue_retry
  ON content_queue (status, last_publish_attempt_at)
  WHERE status = 'approved';

-- Index for the orphan detector — finds 'sent' posts whose webhook never arrived.
CREATE INDEX IF NOT EXISTS idx_content_queue_orphan_check
  ON content_queue (status, sent_at)
  WHERE status = 'sent' AND webhook_orphaned = false;
