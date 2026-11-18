-- ============================================================
-- SQL SCHEMA: SUPABASE STORAGE BUCKET 'avatars'
-- Jalankan skrip ini di Supabase Dashboard -> SQL Editor -> Run
-- ============================================================

-- 1. Buat bucket 'avatars' dengan akses publik
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- Maksimal ukuran file 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- 2. Kebijakan RLS (Row Level Security) untuk storage.objects
-- Izinkan akses baca (SELECT/Download) publik untuk semua orang
DROP POLICY IF EXISTS "Public Avatar Read Access" ON storage.objects;
CREATE POLICY "Public Avatar Read Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Izinkan upload (INSERT) foto profil baru
DROP POLICY IF EXISTS "Public Avatar Upload Access" ON storage.objects;
CREATE POLICY "Public Avatar Upload Access"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars');

-- Izinkan perbarui (UPDATE) foto profil
DROP POLICY IF EXISTS "Public Avatar Update Access" ON storage.objects;
CREATE POLICY "Public Avatar Update Access"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars');

-- Izinkan hapus (DELETE) foto profil
DROP POLICY IF EXISTS "Public Avatar Delete Access" ON storage.objects;
CREATE POLICY "Public Avatar Delete Access"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars');

-- 3. Beri hak akses ke role anon dan authenticated
GRANT ALL ON TABLE storage.objects TO anon, authenticated, service_role;
GRANT ALL ON TABLE storage.buckets TO anon, authenticated, service_role;
