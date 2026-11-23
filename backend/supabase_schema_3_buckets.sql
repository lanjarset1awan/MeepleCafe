-- ============================================================
-- SQL SCHEMA: 3 SUPABASE STORAGE BUCKETS MEEPLECAFE
-- 1. 'avatars'  -> Khusus Foto Profil / Avatar Pengguna
-- 2. 'games'    -> Khusus Gambar Sampul / Cover Katalog Board Game
-- 3. 'tickets'  -> Khusus Bukti Transfer / Pembayaran Tiket Reservasi
--
-- Jalankan skrip ini di Supabase Dashboard -> SQL Editor -> Run
-- ============================================================

-- 1. DAFTARKAN 3 BUCKET KE STORAGE.BUCKETS
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  -- Bucket 1: Avatar Pengguna
  (
    'avatars',
    'avatars',
    true,
    5242880, -- 5 MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  ),
  -- Bucket 2: Katalog Board Game
  (
    'games',
    'games',
    true,
    10485760, -- 10 MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  ),
  -- Bucket 3: Bukti Transfer Pembayaran Tiket
  (
    'tickets',
    'tickets',
    true,
    10485760, -- 10 MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  )
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================================
-- 2. KEBIJAKAN RLS (ROW LEVEL SECURITY) UNTUK BUCKET 'avatars'
-- ============================================================
DROP POLICY IF EXISTS "Public Avatar Read Access" ON storage.objects;
CREATE POLICY "Public Avatar Read Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Public Avatar Upload Access" ON storage.objects;
CREATE POLICY "Public Avatar Upload Access"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Public Avatar Update Access" ON storage.objects;
CREATE POLICY "Public Avatar Update Access"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Public Avatar Delete Access" ON storage.objects;
CREATE POLICY "Public Avatar Delete Access"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars');

-- ============================================================
-- 3. KEBIJAKAN RLS (ROW LEVEL SECURITY) UNTUK BUCKET 'games'
-- ============================================================
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

-- ============================================================
-- 4. KEBIJAKAN RLS (ROW LEVEL SECURITY) UNTUK BUCKET 'tickets'
-- ============================================================
DROP POLICY IF EXISTS "Public Tickets Read Access" ON storage.objects;
CREATE POLICY "Public Tickets Read Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'tickets');

DROP POLICY IF EXISTS "Public Tickets Upload Access" ON storage.objects;
CREATE POLICY "Public Tickets Upload Access"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'tickets');

DROP POLICY IF EXISTS "Public Tickets Update Access" ON storage.objects;
CREATE POLICY "Public Tickets Update Access"
ON storage.objects FOR UPDATE
USING (bucket_id = 'tickets');

DROP POLICY IF EXISTS "Public Tickets Delete Access" ON storage.objects;
CREATE POLICY "Public Tickets Delete Access"
ON storage.objects FOR DELETE
USING (bucket_id = 'tickets');

-- ============================================================
-- 5. BERIKAN HAK AKSES ROLE UNTUK OBJEK & BUCKET
-- ============================================================
GRANT ALL ON TABLE storage.objects TO anon, authenticated, service_role;
GRANT ALL ON TABLE storage.buckets TO anon, authenticated, service_role;
