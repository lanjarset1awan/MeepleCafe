-- ============================================================
-- SQL SCHEMA: TABEL USERS (AKUN PENGGUNA MEEPLECAFE)
-- Jalankan skrip ini di Supabase Dashboard -> SQL Editor -> Run
-- ============================================================

-- 1. Buat tabel public.users
CREATE TABLE IF NOT EXISTS public.users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  email TEXT,
  phone TEXT,
  nim TEXT,
  major TEXT,
  password TEXT NOT NULL,
  avatar TEXT,
  role TEXT DEFAULT 'Member',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Nonaktifkan Row Level Security (RLS) agar REST API dapat akses penuh
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 3. Masukkan Akun Default (Lanjar Setiawan)
INSERT INTO public.users (
  id,
  name,
  username,
  email,
  phone,
  nim,
  major,
  password,
  avatar,
  role
) VALUES (
  '2d688ca5-1dbf-4e9a-bd4c-84d3f0527d2c',
  'Lanjar Setiawan',
  'lanjar',
  'lanjar@meeplecafe.com',
  '081234567890',
  '21120124120023',
  'Teknik Komputer',
  '123',
  'https://mmdrzvvnmoplbdfaiixx.supabase.co/storage/v1/object/public/avatar/2/avatar.png?t=1779476174261',
  'Mahasiswa / Member'
) ON CONFLICT (username) DO UPDATE SET
  name = EXCLUDED.name,
  nim = EXCLUDED.nim,
  major = EXCLUDED.major,
  avatar = EXCLUDED.avatar;

-- 4. Beri hak akses SELECT, INSERT, UPDATE, DELETE ke anon dan authenticated
GRANT ALL ON TABLE public.users TO anon;
GRANT ALL ON TABLE public.users TO authenticated;
GRANT ALL ON TABLE public.users TO service_role;
