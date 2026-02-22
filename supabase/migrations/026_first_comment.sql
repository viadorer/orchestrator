-- ===========================================
-- 026: First Comment support
-- Přidání first_comment sloupce pro Facebook/Instagram/LinkedIn
-- PODPORUJE: Facebook, Instagram, LinkedIn
-- NEPODPORUJE: X, TikTok, YouTube
-- ===========================================

ALTER TABLE content_queue ADD COLUMN IF NOT EXISTS first_comment TEXT;

COMMENT ON COLUMN content_queue.first_comment IS 'Auto-posted first comment (Facebook/Instagram/LinkedIn). Obvykle obsahuje odkaz mimo síť. LinkedIn best practice: odkaz v komentáři = vyšší reach (LinkedIn potlačuje URL v postu o 40-50%). X, TikTok first comment nepodporují.';

-- Přidat website_url do projects pro generování first_comment odkazů
ALTER TABLE projects ADD COLUMN IF NOT EXISTS website_url TEXT;

COMMENT ON COLUMN projects.website_url IS 'URL webu projektu. Použito v first_comment jako {{WEBSITE_URL}} variable. Např. https://problemovynajemnik.cz';
