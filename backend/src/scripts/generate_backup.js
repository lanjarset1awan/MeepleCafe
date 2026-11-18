import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, "../../.env");
dotenv.config({ path: envPath });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: cats, error: errCats } = await supabase.from("game_categories").select("*").order("name");
  if (errCats) console.error("Error cats:", errCats.message);

  const { data: tables, error: errTables } = await supabase.from("cafe_tables").select("*").order("table_number");
  if (errTables) console.error("Error tables:", errTables.message);

  const { data: games, error: errGames } = await supabase.from("board_games").select("*").order("title");
  if (errGames) console.error("Error games:", errGames.message);

  const { data: users, error: errUsers } = await supabase.from("users").select("*").order("created_at");
  if (errUsers) console.error("Error users:", errUsers.message);

  const { data: reservations, error: errRes } = await supabase.from("reservations").select("*").order("created_at");
  if (errRes) console.error("Error res:", errRes.message);

  console.log("Fetched counts:", {
    categories: cats?.length || 0,
    tables: tables?.length || 0,
    games: games?.length || 0,
    users: users?.length || 0,
    reservations: reservations?.length || 0
  });

  function escapeSql(val) {
    if (val === null || val === undefined) return "NULL";
    if (typeof val === "boolean") return val ? "TRUE" : "FALSE";
    if (typeof val === "number") return val.toString();
    return "'" + String(val).replace(/'/g, "''") + "'";
  }

  let sql = `-- ==============================================================================
-- MEEPLECAFE MASTER DATABASE BACKUP & RESTORE SCRIPT
-- ==============================================================================
-- File ini berisi seluruh skema tabel, relasi, storage bucket, hak akses, dan
-- seluruh data katalog board game, meja kafe, akun pengguna, serta data reservasi.
--
-- PANDUAN PINDAH DATABASE / SERVER SUPABASE BARU:
-- 1. Buat proyek baru di https://supabase.com
-- 2. Buka dashboard proyek -> menu 'SQL Editor' (ikon terminal/query di menu kiri)
-- 3. Klik '+ New query'
-- 4. Copy & paste seluruh teks file ini ke editor tersebut
-- 5. Klik tombol 'Run' (atau tekan Ctrl + Enter)
-- 6. Selesai! Semua tabel, relasi, bucket foto profil ('avatars'), dan 20 board game
--    beserta meja dan akun akan langsung terisi lengkap dan siap digunakan.
-- ==============================================================================

-- 0. EKSTENSI POSTGRESQL (Untuk UUID)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. SKEMA TABEL
-- ==============================================================================

-- Tabel 1: game_categories (Kategori Genre Board Game)
CREATE TABLE IF NOT EXISTS public.game_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

-- Tabel 2: cafe_tables (Daftar Meja Kafe & Area Bermain)
CREATE TABLE IF NOT EXISTS public.cafe_tables (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_number TEXT NOT NULL UNIQUE,
  table_type TEXT NOT NULL,
  capacity INT NOT NULL,
  price_per_hour NUMERIC NOT NULL,
  facilities TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE
);

-- Tabel 3: board_games (Katalog Koleksi Board Game)
CREATE TABLE IF NOT EXISTS public.board_games (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  category_id UUID REFERENCES public.game_categories(id) ON DELETE SET NULL,
  min_players INT NOT NULL,
  max_players INT NOT NULL,
  duration_minutes INT NOT NULL,
  difficulty TEXT,
  image_url TEXT,
  description TEXT,
  rules_summary TEXT,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabel 4: users (Akun Pengguna)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  email TEXT,
  phone TEXT,
  password TEXT NOT NULL,
  avatar TEXT,
  role TEXT DEFAULT 'Member',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Jika tabel users sebelumnya ada kolom nim/major, otomatis dibersihkan:
ALTER TABLE public.users DROP COLUMN IF EXISTS nim;
ALTER TABLE public.users DROP COLUMN IF EXISTS major;

-- Tabel 5: reservations (Pemesanan Meja)
CREATE TABLE IF NOT EXISTS public.reservations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_code TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  table_id UUID REFERENCES public.cafe_tables(id) ON DELETE CASCADE,
  reservation_date DATE NOT NULL,
  session_time TEXT NOT NULL,
  guest_count INT NOT NULL,
  status TEXT DEFAULT 'Confirmed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- 2. HAK AKSES & KEAMANAN (RLS DISABLE UNTUK AKSES PENUH REST API)
-- ==============================================================================
ALTER TABLE public.game_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cafe_tables DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_games DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations DISABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE public.game_categories TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.cafe_tables TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.board_games TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.users TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.reservations TO anon, authenticated, service_role;

-- ==============================================================================
-- 3. STORAGE BUCKET: avatars (Untuk Foto Profil Pengguna)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- Batas maksimal 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Kebijakan RLS Penyimpanan Supabase Storage (Akses Publik Penuh)
DROP POLICY IF EXISTS "Public Avatar Read Access" ON storage.objects;
CREATE POLICY "Public Avatar Read Access" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Public Avatar Upload Access" ON storage.objects;
CREATE POLICY "Public Avatar Upload Access" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Public Avatar Update Access" ON storage.objects;
CREATE POLICY "Public Avatar Update Access" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Public Avatar Delete Access" ON storage.objects;
CREATE POLICY "Public Avatar Delete Access" ON storage.objects FOR DELETE USING (bucket_id = 'avatars');

GRANT ALL ON TABLE storage.objects TO anon, authenticated, service_role;
GRANT ALL ON TABLE storage.buckets TO anon, authenticated, service_role;

-- ==============================================================================
-- 4. DATA SEED / BACKUP: KATEGORI GAME (game_categories)
-- ==============================================================================
`;

  cats.forEach((c) => {
    sql += `INSERT INTO public.game_categories (id, name) VALUES (${escapeSql(c.id)}, ${escapeSql(c.name)}) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;\n`;
  });

  sql += `\n-- ==============================================================================
-- 5. DATA SEED / BACKUP: MEJA KAFE (cafe_tables)
-- ==============================================================================
`;

  tables.forEach((t) => {
    sql += `INSERT INTO public.cafe_tables (id, table_number, table_type, capacity, price_per_hour, facilities, image_url, is_active)
VALUES (${escapeSql(t.id)}, ${escapeSql(t.table_number)}, ${escapeSql(t.table_type)}, ${escapeSql(t.capacity)}, ${escapeSql(t.price_per_hour)}, ${escapeSql(t.facilities)}, ${escapeSql(t.image_url)}, ${escapeSql(t.is_active)})
ON CONFLICT (id) DO UPDATE SET
  table_number = EXCLUDED.table_number,
  table_type = EXCLUDED.table_type,
  capacity = EXCLUDED.capacity,
  price_per_hour = EXCLUDED.price_per_hour,
  facilities = EXCLUDED.facilities,
  image_url = EXCLUDED.image_url,
  is_active = EXCLUDED.is_active;\n`;
  });

  sql += `\n-- ==============================================================================
-- 6. DATA SEED / BACKUP: KATALOG LENGKAP BOARD GAME (board_games)
-- ==============================================================================
`;

  games.forEach((g) => {
    sql += `INSERT INTO public.board_games (id, title, category_id, min_players, max_players, duration_minutes, difficulty, image_url, description, rules_summary, is_available, created_at)
VALUES (${escapeSql(g.id)}, ${escapeSql(g.title)}, ${escapeSql(g.category_id)}, ${escapeSql(g.min_players)}, ${escapeSql(g.max_players)}, ${escapeSql(g.duration_minutes)}, ${escapeSql(g.difficulty)}, ${escapeSql(g.image_url)}, ${escapeSql(g.description)}, ${escapeSql(g.rules_summary)}, ${escapeSql(g.is_available)}, ${escapeSql(g.created_at)})
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category_id = EXCLUDED.category_id,
  min_players = EXCLUDED.min_players,
  max_players = EXCLUDED.max_players,
  duration_minutes = EXCLUDED.duration_minutes,
  difficulty = EXCLUDED.difficulty,
  image_url = EXCLUDED.image_url,
  description = EXCLUDED.description,
  rules_summary = EXCLUDED.rules_summary,
  is_available = EXCLUDED.is_available;\n`;
  });

  sql += `\n-- ==============================================================================
-- 7. DATA SEED / BACKUP: AKUN PENGGUNA (users)
-- ==============================================================================
`;

  users.forEach((u) => {
    sql += `INSERT INTO public.users (id, name, username, email, phone, password, avatar, role, created_at)
VALUES (${escapeSql(u.id)}, ${escapeSql(u.name)}, ${escapeSql(u.username)}, ${escapeSql(u.email)}, ${escapeSql(u.phone)}, ${escapeSql(u.password)}, ${escapeSql(u.avatar)}, ${escapeSql(u.role)}, ${escapeSql(u.created_at)})
ON CONFLICT (username) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  password = EXCLUDED.password,
  avatar = EXCLUDED.avatar,
  role = EXCLUDED.role;\n`;
  });

  sql += `\n-- ==============================================================================
-- 8. DATA SEED / BACKUP: RIWAYAT & DAFTAR RESERVASI MEJA (reservations)
-- ==============================================================================
`;

  reservations.forEach((r) => {
    sql += `INSERT INTO public.reservations (id, booking_code, customer_name, customer_phone, table_id, reservation_date, session_time, guest_count, status, created_at)
VALUES (${escapeSql(r.id)}, ${escapeSql(r.booking_code)}, ${escapeSql(r.customer_name)}, ${escapeSql(r.customer_phone)}, ${escapeSql(r.table_id)}, ${escapeSql(r.reservation_date)}, ${escapeSql(r.session_time)}, ${escapeSql(r.guest_count)}, ${escapeSql(r.status)}, ${escapeSql(r.created_at)})
ON CONFLICT (id) DO UPDATE SET
  booking_code = EXCLUDED.booking_code,
  customer_name = EXCLUDED.customer_name,
  customer_phone = EXCLUDED.customer_phone,
  table_id = EXCLUDED.table_id,
  reservation_date = EXCLUDED.reservation_date,
  session_time = EXCLUDED.session_time,
  guest_count = EXCLUDED.guest_count,
  status = EXCLUDED.status;\n`;
  });

  const destPath = path.resolve(__dirname, "../../supabase_master_backup.sql");
  fs.writeFileSync(destPath, sql, "utf8");
  console.log(`Master SQL backup successfully generated at: ${destPath}`);
  console.log(`File size: ${(sql.length / 1024).toFixed(2)} KB`);
}

run().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
