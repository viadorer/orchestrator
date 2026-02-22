-- ===========================================
-- 028: AIO Site Type — podpora dynamických projektů
-- Přidává typ projektu (html/nextjs/astro/hugo/sveltekit)
-- a layout_file pro injection do framework layoutů
-- ===========================================

ALTER TABLE aio_sites ADD COLUMN IF NOT EXISTS site_type TEXT NOT NULL DEFAULT 'html';
ALTER TABLE aio_sites ADD COLUMN IF NOT EXISTS layout_file TEXT;
ALTER TABLE aio_sites ADD COLUMN IF NOT EXISTS public_dir TEXT NOT NULL DEFAULT '';
ALTER TABLE aio_sites ADD COLUMN IF NOT EXISTS last_rollback_sha TEXT;

COMMENT ON COLUMN aio_sites.site_type IS 'Typ projektu: html (statický), nextjs (Next.js App/Pages Router), astro, hugo, sveltekit. Určuje strategii injection.';
COMMENT ON COLUMN aio_sites.layout_file IS 'Cesta k layout souboru pro framework injection (např. src/app/layout.tsx). Null = auto-detect.';
COMMENT ON COLUMN aio_sites.public_dir IS 'Cesta k public adresáři pro statické soubory (llms.txt, ai-data.json). Prázdný = root, "public" pro Next.js.';
COMMENT ON COLUMN aio_sites.last_rollback_sha IS 'SHA commitu před poslední injection — pro rollback.';
