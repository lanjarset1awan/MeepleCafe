-- ============================================================
-- SQL SCHEMA: SUPABASE STORAGE BUCKET 'games'
-- Jalankan skrip ini di Supabase Dashboard -> SQL Editor -> Run
-- ============================================================

-- 1. Buat bucket 'games' dengan akses publik
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'games',
  'games',
  true,
  5242880, -- Maksimal ukuran file 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- 2. Kebijakan RLS (Row Level Security) untuk storage.objects bucket 'games'
DROP POLICY IF EXISTS "Public Games Read Access" ON storage.objects;
CREATE POLICY "Public Games Read Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'games');

DROP POLICY IF EXISTS "Public Games Upload Access" ON storage.objects;
CREATE POLICY "Public Games Upload Access"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'games');

DROP POLICY IF EXISTS "Public Games Update Access" ON storage.objects;
CREATE POLICY "Public Games Update Access"
ON storage.objects FOR UPDATE
USING (bucket_id = 'games');

DROP POLICY IF EXISTS "Public Games Delete Access" ON storage.objects;
CREATE POLICY "Public Games Delete Access"
ON storage.objects FOR DELETE
USING (bucket_id = 'games');

-- 3. Beri hak akses ke role anon dan authenticated
GRANT ALL ON TABLE storage.objects TO anon, authenticated, service_role;
GRANT ALL ON TABLE storage.buckets TO anon, authenticated, service_role;
