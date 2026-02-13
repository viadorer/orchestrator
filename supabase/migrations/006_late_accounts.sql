-- ===========================================
-- getLate.dev: Per-platform Account IDs
-- Každá síť má vlastní accountId v getLate
-- ===========================================

-- Nový sloupec: mapování platforma → getLate accountId
-- Formát: {"facebook": "698f7c19fd3d49fbfa3e3835", "linkedin": "abc123", ...}
ALTER TABLE projects ADD COLUMN IF NOT EXISTS late_accounts JSONB DEFAULT '{}'::jsonb;

-- Index pro rychlé hledání projektů s nakonfigurovanými účty
CREATE INDEX IF NOT EXISTS idx_projects_late_accounts ON projects USING gin(late_accounts);
