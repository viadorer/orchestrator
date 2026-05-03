-- 036_usage_ledger.sql
-- AI cost & token accounting. Independent of agent_log so heavy aggregation
-- queries don't compete with operational logs. Writes are append-only.
--
-- Pricing snapshots are held alongside every row so historical reports
-- remain stable when provider pricing changes.

CREATE TABLE IF NOT EXISTS usage_ledger (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID REFERENCES projects(id) ON DELETE SET NULL,
  task_id         UUID, -- optional FK to agent_tasks (no constraint to avoid coupling)
  source          TEXT NOT NULL,             -- 'content-engine' | 'hugo-editor' | 'visual-agent' | 'rss' | …
  provider        TEXT NOT NULL,             -- 'google' | 'openai' | …
  model           TEXT NOT NULL,             -- 'gemini-2.0-pro' | 'gemini-2.0-flash' | …
  input_tokens    INTEGER NOT NULL DEFAULT 0,
  output_tokens   INTEGER NOT NULL DEFAULT 0,
  -- USD per 1M tokens at time of call. Both nullable for non-token sources.
  input_price     NUMERIC(10, 6),
  output_price    NUMERIC(10, 6),
  -- Computed cost in USD. NULL if pricing unknown.
  cost_usd        NUMERIC(12, 6) GENERATED ALWAYS AS (
    COALESCE(input_tokens  * input_price  / 1000000.0, 0) +
    COALESCE(output_tokens * output_price / 1000000.0, 0)
  ) STORED,
  meta            JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usage_ledger_project_created
  ON usage_ledger (project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_ledger_model_created
  ON usage_ledger (model, created_at DESC);

-- Per-project monthly summary (use materialised view if you want point-in-time
-- snapshots; here we use a regular view because cardinality is small and the
-- table is append-only).
CREATE OR REPLACE VIEW usage_monthly_summary AS
SELECT
  project_id,
  DATE_TRUNC('month', created_at) AS month,
  provider,
  model,
  SUM(input_tokens)  AS input_tokens,
  SUM(output_tokens) AS output_tokens,
  SUM(cost_usd)      AS cost_usd,
  COUNT(*)           AS calls
FROM usage_ledger
GROUP BY project_id, DATE_TRUNC('month', created_at), provider, model;

-- RLS: same model as agent_log — authenticated users see their data via
-- joins on projects.user_id. (Tightening to per-user is a follow-up.)
ALTER TABLE usage_ledger ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'usage_ledger' AND policyname = 'usage_ledger_authenticated_select'
  ) THEN
    CREATE POLICY usage_ledger_authenticated_select
      ON usage_ledger FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;
