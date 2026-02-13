-- ===========================================
-- getLate.dev: Profile ID per projekt
-- Profile = kontejner pro účty (brand/projekt)
-- ===========================================

ALTER TABLE projects ADD COLUMN IF NOT EXISTS late_profile_id TEXT;
