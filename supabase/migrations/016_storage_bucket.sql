-- ===========================================
-- 016: Vytvoření Storage bucketu media-assets
-- Jeden bucket pro vše: logo, Imagen, Media Library
-- ===========================================

-- Vytvořit bucket (pokud neexistuje)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media-assets',
  'media-assets',
  true,
  10485760, -- 10 MB max
  ARRAY['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp', 'image/gif', 'video/mp4', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policy: allow all authenticated users to upload
CREATE POLICY IF NOT EXISTS "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'media-assets');

-- RLS policy: allow public read
CREATE POLICY IF NOT EXISTS "Allow public read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'media-assets');

-- RLS policy: allow authenticated delete
CREATE POLICY IF NOT EXISTS "Allow authenticated delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'media-assets');
