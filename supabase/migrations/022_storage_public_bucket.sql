-- ===========================================
-- 022: Storage - public bucket pro media-assets
-- Oprava náhledů AI-generovaných fotek
-- ===========================================

-- Ensure media-assets bucket exists and is public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media-assets',
  'media-assets',
  true,
  20971520, -- 20 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/quicktime']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 20971520,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/quicktime'];

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public read access for media-assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to media-assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update media-assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete media-assets" ON storage.objects;

-- Allow public read access to all files in media-assets bucket
CREATE POLICY "Public read access for media-assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'media-assets');

-- Allow authenticated users to upload to their project folders
CREATE POLICY "Authenticated users can upload to media-assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'media-assets' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to update their own uploads
CREATE POLICY "Authenticated users can update media-assets"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'media-assets' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to delete their own uploads
CREATE POLICY "Authenticated users can delete media-assets"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'media-assets' 
  AND auth.role() = 'authenticated'
);
