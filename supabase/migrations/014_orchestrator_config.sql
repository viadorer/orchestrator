-- ===========================================
-- Přidání sloupce orchestrator_config do projects
-- Kód ho masivně používá (agent-orchestrator, content-engine, UI)
-- ale v DB existuje jen agent_settings z migrace 002
-- ===========================================

ALTER TABLE projects ADD COLUMN IF NOT EXISTS orchestrator_config JSONB DEFAULT '{
  "enabled": false,
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
