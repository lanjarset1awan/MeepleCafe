-- ==============================================================================
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
INSERT INTO public.game_categories (id, name) VALUES ('bca5b3fa-1121-42ef-99d7-b1072f0c27ac', 'Family') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO public.game_categories (id, name) VALUES ('a190ca0a-ca64-41b1-941d-a10bba1d7cdd', 'Party Game') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO public.game_categories (id, name) VALUES ('81b57e12-38ac-453b-8bdc-90ae8f9ec4bb', 'Social Deduction') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO public.game_categories (id, name) VALUES ('9b7b06eb-e194-443c-a65c-1fa7405d974f', 'Strategy') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- ==============================================================================
-- 5. DATA SEED / BACKUP: MEJA KAFE (cafe_tables)
-- ==============================================================================
INSERT INTO public.cafe_tables (id, table_number, table_type, capacity, price_per_hour, facilities, image_url, is_active)
VALUES ('2d688ca5-1dbf-4e9a-bd4c-84d3f0527d2c', 'T-01', 'Meja Reguler', 4, 30000, 'Meja Kayu Estetik, Kursi Nyaman 4 Orang, Wi-Fi Kafe', 'https://images.adsttc.com/media/images/5252/0ae2/e8e4/4e67/bf00/0574/newsletter/Photo1_Triopton_Architects.jpg?1381108442', TRUE)
ON CONFLICT (id) DO UPDATE SET
  table_number = EXCLUDED.table_number,
  table_type = EXCLUDED.table_type,
  capacity = EXCLUDED.capacity,
  price_per_hour = EXCLUDED.price_per_hour,
  facilities = EXCLUDED.facilities,
  image_url = EXCLUDED.image_url,
  is_active = EXCLUDED.is_active;
INSERT INTO public.cafe_tables (id, table_number, table_type, capacity, price_per_hour, facilities, image_url, is_active)
VALUES ('ea467f24-8f33-4108-9dd3-757f61c14676', 'T-02', 'Meja Premium', 6, 55000, 'Meja Luas 6 Orang, Sofa Nyaman, Pencahayaan Board Game, Wi-Fi Kafe', 'https://i.pinimg.com/1200x/1b/b8/3e/1bb83e4b57a34e874bcc7759c9009d5f.jpg', TRUE)
ON CONFLICT (id) DO UPDATE SET
  table_number = EXCLUDED.table_number,
  table_type = EXCLUDED.table_type,
  capacity = EXCLUDED.capacity,
  price_per_hour = EXCLUDED.price_per_hour,
  facilities = EXCLUDED.facilities,
  image_url = EXCLUDED.image_url,
  is_active = EXCLUDED.is_active;
INSERT INTO public.cafe_tables (id, table_number, table_type, capacity, price_per_hour, facilities, image_url, is_active)
VALUES ('9b762158-6de3-4142-aae9-a84e2d2548b7', 'T-VIP', 'Meja VIP', 9, 95000, 'Ruang Privat VIP Eksklusif Ber-AC, Meja Kayu Ekstra Luas 9 Orang, Sound System, Layar Smart TV, Private Game Master', 'https://i.pinimg.com/736x/29/0c/3a/290c3a2ff6431e79ecd317105f1c7c98.jpg', TRUE)
ON CONFLICT (id) DO UPDATE SET
  table_number = EXCLUDED.table_number,
  table_type = EXCLUDED.table_type,
  capacity = EXCLUDED.capacity,
  price_per_hour = EXCLUDED.price_per_hour,
  facilities = EXCLUDED.facilities,
  image_url = EXCLUDED.image_url,
  is_active = EXCLUDED.is_active;

-- ==============================================================================
-- 6. DATA SEED / BACKUP: KATALOG LENGKAP BOARD GAME (board_games)
-- ==============================================================================
INSERT INTO public.board_games (id, title, category_id, min_players, max_players, duration_minutes, difficulty, image_url, description, rules_summary, is_available, created_at)
VALUES ('c213765a-4991-44c7-96c3-d88e06a5d1ff', 'Azul', '9b7b06eb-e194-443c-a65c-1fa7405d974f', 2, 4, 40, 'Medium', 'https://cdnwpseller.gramedia.net/wp-content/uploads/2023/07/azul.jpg', 'Pemenang penghargaan Spiel des Jahres. Pemain berperan sebagai seniman ubin keramik Azulejo untuk menghiasi dinding istana Raja Manuel I dari Portugal.', 'Ambil ubin berwarna sama dari etalase pabrik, susun di baris pola dinding istana. Rangkai pola berjejer untuk mencetak skor tertinggi dan hindari ubin jatuh.', TRUE, '2026-11-13T13:19:16.417543+00:00')
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
  is_available = EXCLUDED.is_available;
INSERT INTO public.board_games (id, title, category_id, min_players, max_players, duration_minutes, difficulty, image_url, description, rules_summary, is_available, created_at)
VALUES ('e2fa8902-9e65-46f3-aa1f-b9d26e1fe91b', 'Betrayal at House on The Hill', '81b57e12-38ac-453b-8bdc-90ae8f9ec4bb', 3, 6, 60, 'Medium', 'https://cdnwpseller.gramedia.net/wp-content/uploads/2023/07/betrayal-house-hill.jpg', 'Board game horor naratif yang mendebarkan. Pemain menjelajahi rumah tua berhantu hingga salah satu pemain berubah menjadi pengkhianat mengerikan.', 'Buka ubin ruangan rumah secara acak. Ketika ''The Haunt'' terjadi, salah satu pemain menjadi pengkhianat dan kedua kubu saling bertarung bertahan hidup.', FALSE, '2026-11-13T13:19:16.417543+00:00')
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
  is_available = EXCLUDED.is_available;
INSERT INTO public.board_games (id, title, category_id, min_players, max_players, duration_minutes, difficulty, image_url, description, rules_summary, is_available, created_at)
VALUES ('54a7001d-2819-4740-a4c4-91d47e9db59a', 'Catur Klasik', '9b7b06eb-e194-443c-a65c-1fa7405d974f', 2, 2, 30, 'Medium', 'https://image.made-in-china.com/202f0j00fULZksbyENcT/High-Quality-Wooden-Chess-Game-Set-Outdoor-Game-Gift.webp', 'Permainan papan strategi dua pemain paling terkenal dan abadi sepanjang masa. Menggunakan papan kayu 64 petak, pemain mengendalikan 16 buah catur (Raja, Ratu, Benteng, Gajah, Kuda, dan Pion) untuk menyusun taktik dan menyekakmat (checkmate) Raja lawan.', 'Setiap buah catur memiliki pola langkah unik (Benteng lurus, Gajah diagonal, Kuda berbentuk L, Ratu ke segala arah). Lindungi Raja sendiri sembari mengancam dan mengunci posisi Raja lawan hingga Skakmat.', TRUE, '2026-11-15T16:13:37.365954+00:00')
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
  is_available = EXCLUDED.is_available;
INSERT INTO public.board_games (id, title, category_id, min_players, max_players, duration_minutes, difficulty, image_url, description, rules_summary, is_available, created_at)
VALUES ('03f973f0-0252-4384-965a-b5dd3025fea1', 'Cuphead Dice Game', 'bca5b3fa-1121-42ef-99d7-b1072f0c27ac', 1, 4, 25, 'Medium', 'https://cdnwpseller.gramedia.net/wp-content/uploads/2023/07/cuphead-dice-full.jpg', 'Permainan dadu bertempo cepat berlatar animasi kartun klasik 1930-an. Pemain melempar dadu untuk melompat, menangkis, dan menembak bos monster ikonik.', 'Lempar dadu secepat mungkin melawan batas waktu untuk mencocokkan simbol aksi serangan dan pertahanan sesuai pola bos lawan.', TRUE, '2026-11-13T13:19:16.417543+00:00')
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
  is_available = EXCLUDED.is_available;
INSERT INTO public.board_games (id, title, category_id, min_players, max_players, duration_minutes, difficulty, image_url, description, rules_summary, is_available, created_at)
VALUES ('b1c0c376-00de-4537-91ba-68036c678d9a', 'Disney Villainous', '9b7b06eb-e194-443c-a65c-1fa7405d974f', 2, 6, 50, 'Medium', 'https://cdnwpseller.gramedia.net/wp-content/uploads/2023/07/villainist.jpg', 'Ambil peran sebagai karakter penjahat dongeng Disney (Maleficent, Jafar, Ursula, Kapten Hook). Setiap karakter memiliki misi jahat tersendiri untuk mengalahkan pahlawan.', 'Gerakkan bidak penjahat di realm papan pribadimu, mainkan kartu kutukan, dan kirimkan kartu takdir baik ke papan pemain lain untuk menghambat lawan.', TRUE, '2026-11-13T13:19:16.417543+00:00')
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
  is_available = EXCLUDED.is_available;
INSERT INTO public.board_games (id, title, category_id, min_players, max_players, duration_minutes, difficulty, image_url, description, rules_summary, is_available, created_at)
VALUES ('525ae75b-9e37-484f-8848-5edda4dd4c69', 'Exploding Kittens', 'a190ca0a-ca64-41b1-941d-a10bba1d7cdd', 2, 5, 15, 'Easy', 'https://cdnwpseller.gramedia.net/wp-content/uploads/2023/07/exploding-kittens.jpg', 'Game kartu Russian Roulette bertema kucing penuh humor konyol. Pemain menarik kartu bergiliran sambil menghindari anak kucing yang bisa meledak seketika.', 'Tarik kartu dari tumpukan dek. Jika mendapat Exploding Kitten, kamu langsung tereliminasi kecuali memiliki kartu penjinak Defuse (laser pointer atau catnip).', TRUE, '2026-11-13T13:19:16.417543+00:00')
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
  is_available = EXCLUDED.is_available;
INSERT INTO public.board_games (id, title, category_id, min_players, max_players, duration_minutes, difficulty, image_url, description, rules_summary, is_available, created_at)
VALUES ('7a87ed42-e3e2-4bbe-90d1-1b020aea2c48', 'Gloomhaven', '9b7b06eb-e194-443c-a65c-1fa7405d974f', 1, 4, 120, 'Hard', 'https://cdnwpseller.gramedia.net/wp-content/uploads/2023/07/gloomhaven.jpg', 'Board game pertempuran taktis legendaris peringkat #1 di BoardGameGeek. Pemain menjelajahi reruntuhan kota misterius, menghadapi monster di ruang bawah tanah, dan menyelesaikan kampanye epik.', 'Pemain memilih kartu kemampuan karakter untuk menentukan giliran aksi inisiatif dan strategi serangan tanpa elemen dadu keberuntungan murni.', TRUE, '2026-11-13T13:19:16.417543+00:00')
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
  is_available = EXCLUDED.is_available;
INSERT INTO public.board_games (id, title, category_id, min_players, max_players, duration_minutes, difficulty, image_url, description, rules_summary, is_available, created_at)
VALUES ('d8980c57-6255-4239-81d5-cd9953e047ef', 'King of Tokyo', 'a190ca0a-ca64-41b1-941d-a10bba1d7cdd', 2, 6, 30, 'Easy', 'https://cdnwpseller.gramedia.net/wp-content/uploads/2023/07/king-of-tokyo.jpg', 'Bermain sebagai monster mutan raksasa, robot alien, dan gorila mekanik yang saling menghancurkan untuk menguasai kota Tokyo dalam pertarungan dadu penuh aksi seru.', 'Kocok 6 dadu hitam untuk menyerang monster lain, menyembuhkan darah, mengumpulkan energi listrik, atau mencetak 20 poin kemenangan.', TRUE, '2026-11-13T13:19:16.417543+00:00')
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
  is_available = EXCLUDED.is_available;
INSERT INTO public.board_games (id, title, category_id, min_players, max_players, duration_minutes, difficulty, image_url, description, rules_summary, is_available, created_at)
VALUES ('d168e05c-7fdc-4924-a2e0-5bce98db6614', 'Monopoly', 'bca5b3fa-1121-42ef-99d7-b1072f0c27ac', 2, 8, 60, 'Medium', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT8Ae6I467lJ25MZ19twZ11NIpemioePCAs-GeIGuqOsQ&s=10', 'Permainan papan transaksi properti paling legendaris di dunia. Kelilingi papan kota dengan dadu, beli petak tanah, bangun rumah dan hotel megah, pungut biaya sewa dari lawan yang singgah, dan jadilah taipan terkaya di MeepleCafe!', 'Lempar dua dadu untuk berkeliling papan. Beli properti tak bertuan, kembangkan komplek perumahan dan hotel, kumpulkan sewa setiap kali lawan menginjak asetmu. Atur keuangan dengan bijak agar terhindar dari kebangkrutan dan penjara!', TRUE, '2026-11-15T15:55:49.916543+00:00')
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
  is_available = EXCLUDED.is_available;
INSERT INTO public.board_games (id, title, category_id, min_players, max_players, duration_minutes, difficulty, image_url, description, rules_summary, is_available, created_at)
VALUES ('1b951b71-85dd-479a-abaf-9731580e4876', 'Patchwork', '9b7b06eb-e194-443c-a65c-1fa7405d974f', 2, 2, 30, 'Medium', 'https://cdnwpseller.gramedia.net/wp-content/uploads/2023/07/patchwork.jpg', 'Game duel strategi 2 pemain yang intim dan santai tentang seni menjahit kain perca. Susun potongan kain berbagai bentuk secara efisien di papan selimut 9x9.', 'Gunakan kancing sebagai mata uang dan waktu sebagai langkah di papan. Pilih potongan kain perca terbaik untuk mengisi selimut tanpa celah lubang kosong.', TRUE, '2026-11-13T13:19:16.417543+00:00')
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
  is_available = EXCLUDED.is_available;
INSERT INTO public.board_games (id, title, category_id, min_players, max_players, duration_minutes, difficulty, image_url, description, rules_summary, is_available, created_at)
VALUES ('a528b73a-df4b-4d38-a28e-0fc32219b5ed', 'Permainan Tetris Papan', 'bca5b3fa-1121-42ef-99d7-b1072f0c27ac', 1, 4, 20, 'Easy', 'https://cdnwpseller.gramedia.net/wp-content/uploads/2023/07/pexels-cottonbro-studio-10599438-1-1024x683.jpg', 'Versi fisik dari video game legendaris Tetris. Pemain berlomba menyusun balok-balok poliomino beraneka bentuk ke dalam grid papan permainan tanpa menyisakan celah kosong.', 'Ambil balok geometri dan susun ke dalam bingkai papan sepadat mungkin. Setiap baris yang terisi penuh akan memberikan poin bonus.', TRUE, '2026-11-13T13:19:16.417543+00:00')
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
  is_available = EXCLUDED.is_available;
INSERT INTO public.board_games (id, title, category_id, min_players, max_players, duration_minutes, difficulty, image_url, description, rules_summary, is_available, created_at)
VALUES ('26acf9bd-4cfa-4c14-8a49-d93992d61ca3', 'Puzzle', 'bca5b3fa-1121-42ef-99d7-b1072f0c27ac', 1, 4, 30, 'Easy', 'https://cdnwpseller.gramedia.net/wp-content/uploads/2023/07/pexels-pixabay-269399-1-1024x768.jpg', 'Permainan menyusun kepingan gambar yang mengasah ketelitian, kesabaran, dan kemampuan spasial. Sangat cocok dimainkan santai secara individu maupun bersama keluarga.', 'Mulai dengan menyusun kepingan tepi bingkai, kelompokkan kepingan berdasarkan warna atau pola gambar, lalu lengkapi hingga gambar utuh terbentuk.', TRUE, '2026-11-13T13:19:16.417543+00:00')
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
  is_available = EXCLUDED.is_available;
INSERT INTO public.board_games (id, title, category_id, min_players, max_players, duration_minutes, difficulty, image_url, description, rules_summary, is_available, created_at)
VALUES ('589f11fe-5a1f-41e7-8ce9-c4b8d4d54b5f', 'Root', '9b7b06eb-e194-443c-a65c-1fa7405d974f', 2, 4, 75, 'Hard', 'https://cdnwpseller.gramedia.net/wp-content/uploads/2023/07/root.jpg', 'Board game asimetris dengan ilustrasi hewan hutan yang menawan namun sarat strategi militer perebutan wilayah antara Marquisate, Eyrie Dynasties, dan Woodland Alliance.', 'Setiap faksi hewan memiliki mekanisme bermain dan syarat kemenangan yang berbeda drastis. Rencanakan ekspansi wilayah dan taktik politik hutan.', TRUE, '2026-11-13T13:19:16.417543+00:00')
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
  is_available = EXCLUDED.is_available;
INSERT INTO public.board_games (id, title, category_id, min_players, max_players, duration_minutes, difficulty, image_url, description, rules_summary, is_available, created_at)
VALUES ('4104e84e-930c-45a6-bbfb-e9948dad7049', 'Skull', 'a190ca0a-ca64-41b1-941d-a10bba1d7cdd', 3, 6, 25, 'Easy', 'https://cdnwpseller.gramedia.net/wp-content/uploads/2023/07/skull.jpg', 'Game gertakan (bluffing) klasik yang murni menguji kemampuan membaca psikologi lawan. Setiap pemain memegang kartu mawar dan kartu tengkorak rahasia.', 'Letakkan kartu tertutup. Lakukan taruhan berapa kartu yang bisa kamu buka tanpa mengenai tengkorak. Berhasil membuka 2 kali taruhan memenangkan permainan.', TRUE, '2026-11-13T13:19:16.417543+00:00')
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
  is_available = EXCLUDED.is_available;
INSERT INTO public.board_games (id, title, category_id, min_players, max_players, duration_minutes, difficulty, image_url, description, rules_summary, is_available, created_at)
VALUES ('cf200406-f7e5-4db7-a16d-5a594d184207', 'Spot It!', 'a190ca0a-ca64-41b1-941d-a10bba1d7cdd', 2, 8, 15, 'Easy', 'https://cdnwpseller.gramedia.net/wp-content/uploads/2023/07/spot-it.webp', 'Permainan kartu observasi dan refleks secepat kilat. Setiap dua kartu selalu memiliki tepat SATU simbol gambar yang cocok. Temukan dan sebutkan pertama kali!', 'Buka kartu secara bersamaan, temukan satu-satunya simbol gambar yang sama antara kartumu dengan kartu tengah, dan sebutkan namanya secepat mungkin.', TRUE, '2026-11-13T13:19:16.417543+00:00')
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
  is_available = EXCLUDED.is_available;
INSERT INTO public.board_games (id, title, category_id, min_players, max_players, duration_minutes, difficulty, image_url, description, rules_summary, is_available, created_at)
VALUES ('233684c2-0627-4b4e-b2e6-d891835d49fc', 'Stacking Game (Jenga)', 'a190ca0a-ca64-41b1-941d-a10bba1d7cdd', 2, 8, 15, 'Easy', 'https://cdnwpseller.gramedia.net/wp-content/uploads/2023/07/pexels-ketut-subiyanto-4473569-1024x683.jpg', 'Permainan memindahkan balok kayu dari bawah dan meletakkannya kembali di puncak menara. Melatih fokus, kestabilan tangan, dan ketelitian dalam mengambil keputusan.', 'Tarik satu balok kayu dari bagian tengah atau bawah menggunakan satu tangan saja, lalu letakkan di puncak menara. Pemain yang meruntuhkan menara dinyatakan kalah.', TRUE, '2026-11-13T13:19:16.417543+00:00')
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
  is_available = EXCLUDED.is_available;
INSERT INTO public.board_games (id, title, category_id, min_players, max_players, duration_minutes, difficulty, image_url, description, rules_summary, is_available, created_at)
VALUES ('20b25b5a-605b-4058-8996-8398282c409c', 'Stardew Valley: The Board Game', 'bca5b3fa-1121-42ef-99d7-b1072f0c27ac', 1, 4, 60, 'Medium', 'https://cdnwpseller.gramedia.net/wp-content/uploads/2023/07/stardew-valley-1024x1024.webp', 'Adaptasi board game dari game simulasi pedesaan populer. Pemain bekerja sama menanam tanaman, merawat hewan ternak, memancing, dan melindungi lembah dari Joja Corporation.', 'Kelola energi harian dan musim untuk menyelesaikan target wasiat Kakek sebelum musim dingin berakhir melalui kerja sama tim kooperatif.', TRUE, '2026-11-13T13:19:16.417543+00:00')
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
  is_available = EXCLUDED.is_available;
INSERT INTO public.board_games (id, title, category_id, min_players, max_players, duration_minutes, difficulty, image_url, description, rules_summary, is_available, created_at)
VALUES ('67c13766-86df-4faa-b8b1-8caedf0b003a', 'Sushi Go!', 'bca5b3fa-1121-42ef-99d7-b1072f0c27ac', 2, 5, 20, 'Easy', 'https://cdnwpseller.gramedia.net/wp-content/uploads/2023/07/sushi-go.jpg', 'Permainan kartu drafting hidangan sushi tercepat dan terlezat. Pilih kartu sushi terbaik, masukkan ke piringmu, lalu oper sisa kartu ke pemain di sampingmu.', 'Kumpulkan kombinasi sashimi untuk 10 poin, celupkan nigiri ke wasabi untuk melipatgandakan nilai, dan pastikan menyisakan tempat untuk hidangan penutup puding.', TRUE, '2026-11-13T13:19:16.417543+00:00')
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
  is_available = EXCLUDED.is_available;
INSERT INTO public.board_games (id, title, category_id, min_players, max_players, duration_minutes, difficulty, image_url, description, rules_summary, is_available, created_at)
VALUES ('a6f99a10-b8a9-44fa-b7d9-f2d839d60d5b', 'Ular Tangga Klasik', 'bca5b3fa-1121-42ef-99d7-b1072f0c27ac', 2, 6, 20, 'Easy', 'https://cdnwpseller.gramedia.net/wp-content/uploads/2023/07/snake-and-ladders.webp', 'Permainan papan klasik legendaris Indonesia yang terdiri dari 100 kotak angka. Penuh ketegangan saat bidak memanjat tangga keberuntungan atau tergelincir turun akibat ular.', 'Lempar dadu untuk menggerakkan bidak. Jika mendarat di bawah tangga, bidak langsung naik. Jika mendarat di kepala ular, bidak harus meluncur turun ke ekor.', FALSE, '2026-11-13T13:19:16.417543+00:00')
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
  is_available = EXCLUDED.is_available;
INSERT INTO public.board_games (id, title, category_id, min_players, max_players, duration_minutes, difficulty, image_url, description, rules_summary, is_available, created_at)
VALUES ('ac573938-9680-4e27-b15b-3c7490f15708', 'UNO', 'a190ca0a-ca64-41b1-941d-a10bba1d7cdd', 2, 10, 20, 'Easy', 'https://images.unsplash.com/photo-1574898943339-d0f1b814c5dd?w=800', 'Game kartu paling seru dan populer di dunia! Cocokkan warna atau angka kartu di tanganmu dengan kartu teratas di tumpukan buangan. Gunakan kartu aksi Wild, Skip, Reverse, dan Draw Four (+4) untuk mengalahkan lawan, dan jangan lupa berteriak ''UNO!'' saat tersisa satu kartu.', 'Setiap pemain dibagikan 7 kartu. Buang kartu yang cocok angka atau warnanya. Gunakan kartu spesial (Skip, Reverse, Draw Two, Wild, Wild Draw Four) untuk membalikkan giliran dan menyerang lawan. Teriak ''UNO!'' saat hanya memegang satu kartu terakhir.', TRUE, '2026-11-15T15:55:49.916543+00:00')
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
  is_available = EXCLUDED.is_available;

-- ==============================================================================
-- 7. DATA SEED / BACKUP: AKUN PENGGUNA (users)
-- ==============================================================================
INSERT INTO public.users (id, name, username, email, phone, password, avatar, role, created_at)
VALUES ('2d688ca5-1dbf-4e9a-bd4c-84d3f0527d2c', 'Lanjar Setiawan', 'lanjar', 'lanjar@meeplecafe.com', '081234567890', '123', 'https://inavrmjnfpsveippxbqj.supabase.co/storage/v1/object/public/avatars/2d688ca5-1dbf-4e9a-bd4c-84d3f0527d2c/avatar-1794997908414.jpg', 'Mahasiswa / Member', '2026-11-18T09:23:57.003435+00:00')
ON CONFLICT (username) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  password = EXCLUDED.password,
  avatar = EXCLUDED.avatar,
  role = EXCLUDED.role;
INSERT INTO public.users (id, name, username, email, phone, password, avatar, role, created_at)
VALUES ('1ec7e7fe-4fbc-4ca5-99ca-5d043066ce25', 'Setiawan', 'setiawan12', 'setiawan12@meeplecafe.com', '081234567890', '1234567*', 'https://api.dicebear.com/7.x/bottts/png?seed=setiawan12&backgroundColor=287ab8', 'Member', '2026-11-18T09:24:50.51964+00:00')
ON CONFLICT (username) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  password = EXCLUDED.password,
  avatar = EXCLUDED.avatar,
  role = EXCLUDED.role;

-- ==============================================================================
-- 8. DATA SEED / BACKUP: RIWAYAT & DAFTAR RESERVASI MEJA (reservations)
-- ==============================================================================
INSERT INTO public.reservations (id, booking_code, customer_name, customer_phone, table_id, reservation_date, session_time, guest_count, status, created_at)
VALUES ('18d2f342-d677-4ab9-b095-ab6e7e167699', 'MC-9341', 'Lanjar Setiawan [Game: Azul] [Total: Rp 60.000] [Metode: Transfer BCA]', '08123456789', '2d688ca5-1dbf-4e9a-bd4c-84d3f0527d2c', '2026-11-21', '14.00 - 16.00 (2 Jam)', 4, 'Confirmed', '2026-11-13T14:00:54.751456+00:00')
ON CONFLICT (id) DO UPDATE SET
  booking_code = EXCLUDED.booking_code,
  customer_name = EXCLUDED.customer_name,
  customer_phone = EXCLUDED.customer_phone,
  table_id = EXCLUDED.table_id,
  reservation_date = EXCLUDED.reservation_date,
  session_time = EXCLUDED.session_time,
  guest_count = EXCLUDED.guest_count,
  status = EXCLUDED.status;
INSERT INTO public.reservations (id, booking_code, customer_name, customer_phone, table_id, reservation_date, session_time, guest_count, status, created_at)
VALUES ('36e5493e-a79b-4782-9391-245dc109344f', 'MC-1581', 'Budi [Game: Sushi Go!]', '081111111', '2d688ca5-1dbf-4e9a-bd4c-84d3f0527d2c', '2026-11-21', '16.00 - 18.00 (2 Jam)', 4, 'Confirmed', '2026-11-13T14:01:06.612107+00:00')
ON CONFLICT (id) DO UPDATE SET
  booking_code = EXCLUDED.booking_code,
  customer_name = EXCLUDED.customer_name,
  customer_phone = EXCLUDED.customer_phone,
  table_id = EXCLUDED.table_id,
  reservation_date = EXCLUDED.reservation_date,
  session_time = EXCLUDED.session_time,
  guest_count = EXCLUDED.guest_count,
  status = EXCLUDED.status;
INSERT INTO public.reservations (id, booking_code, customer_name, customer_phone, table_id, reservation_date, session_time, guest_count, status, created_at)
VALUES ('4497f260-6e26-402c-ad73-52d5790068bc', 'MC-6374', 'msms [Game: Cuphead Dice Game] [Total: Rp 30.000] [Metode: Bayar di Kasir]', '07997', '2d688ca5-1dbf-4e9a-bd4c-84d3f0527d2c', '2026-10-01', '15.00 - 16.00 (1 Jam)', 4, 'Confirmed', '2026-11-15T14:43:55.794737+00:00')
ON CONFLICT (id) DO UPDATE SET
  booking_code = EXCLUDED.booking_code,
  customer_name = EXCLUDED.customer_name,
  customer_phone = EXCLUDED.customer_phone,
  table_id = EXCLUDED.table_id,
  reservation_date = EXCLUDED.reservation_date,
  session_time = EXCLUDED.session_time,
  guest_count = EXCLUDED.guest_count,
  status = EXCLUDED.status;
INSERT INTO public.reservations (id, booking_code, customer_name, customer_phone, table_id, reservation_date, session_time, guest_count, status, created_at)
VALUES ('b869f8db-fc63-4974-b618-85c123502ecf', 'MC-3468', 'sufysnaj [Game: Exploding Kittens] [Total: Rp 30.000] [Metode: Bayar di Kasir]', '34694', '2d688ca5-1dbf-4e9a-bd4c-84d3f0527d2c', '2026-11-17', '10.00 - 11.00 (1 Jam)', 4, 'Confirmed', '2026-11-15T14:55:23.136621+00:00')
ON CONFLICT (id) DO UPDATE SET
  booking_code = EXCLUDED.booking_code,
  customer_name = EXCLUDED.customer_name,
  customer_phone = EXCLUDED.customer_phone,
  table_id = EXCLUDED.table_id,
  reservation_date = EXCLUDED.reservation_date,
  session_time = EXCLUDED.session_time,
  guest_count = EXCLUDED.guest_count,
  status = EXCLUDED.status;
INSERT INTO public.reservations (id, booking_code, customer_name, customer_phone, table_id, reservation_date, session_time, guest_count, status, created_at)
VALUES ('8d6fd998-f91c-4622-a228-97ff6e4e1035', 'MC-2002', 'Lanjar [Game: Monopoly] [Total: Rp 285.000] [Metode: Transfer Mandiri]', '089793', '9b762158-6de3-4142-aae9-a84e2d2548b7', '2026-11-17', '18.00 - 21.00 (3 Jam)', 4, 'Confirmed', '2026-11-15T16:17:09.998507+00:00')
ON CONFLICT (id) DO UPDATE SET
  booking_code = EXCLUDED.booking_code,
  customer_name = EXCLUDED.customer_name,
  customer_phone = EXCLUDED.customer_phone,
  table_id = EXCLUDED.table_id,
  reservation_date = EXCLUDED.reservation_date,
  session_time = EXCLUDED.session_time,
  guest_count = EXCLUDED.guest_count,
  status = EXCLUDED.status;
INSERT INTO public.reservations (id, booking_code, customer_name, customer_phone, table_id, reservation_date, session_time, guest_count, status, created_at)
VALUES ('493bab8e-6396-483e-9d73-57759bc9fe2e', 'MC-9938', 'Lala [Game: Catur Klasik] [Total: Rp 190.000] [Metode: QRIS Instant]', '099', '9b762158-6de3-4142-aae9-a84e2d2548b7', '2026-11-17', '16.00 - 18.00 (2 Jam)', 2, 'Confirmed', '2026-11-15T16:20:24.814749+00:00')
ON CONFLICT (id) DO UPDATE SET
  booking_code = EXCLUDED.booking_code,
  customer_name = EXCLUDED.customer_name,
  customer_phone = EXCLUDED.customer_phone,
  table_id = EXCLUDED.table_id,
  reservation_date = EXCLUDED.reservation_date,
  session_time = EXCLUDED.session_time,
  guest_count = EXCLUDED.guest_count,
  status = EXCLUDED.status;
INSERT INTO public.reservations (id, booking_code, customer_name, customer_phone, table_id, reservation_date, session_time, guest_count, status, created_at)
VALUES ('27c65e51-c168-463e-be30-824e49b06345', 'MC-2258', 'Seti [Game: UNO] [Total: Rp 60.000] [Metode: Transfer Mandiri]', '089', '2d688ca5-1dbf-4e9a-bd4c-84d3f0527d2c', '2026-11-17', '19.00 - 21.00 (2 Jam)', 4, 'Confirmed', '2026-11-15T16:23:34.771257+00:00')
ON CONFLICT (id) DO UPDATE SET
  booking_code = EXCLUDED.booking_code,
  customer_name = EXCLUDED.customer_name,
  customer_phone = EXCLUDED.customer_phone,
  table_id = EXCLUDED.table_id,
  reservation_date = EXCLUDED.reservation_date,
  session_time = EXCLUDED.session_time,
  guest_count = EXCLUDED.guest_count,
  status = EXCLUDED.status;
INSERT INTO public.reservations (id, booking_code, customer_name, customer_phone, table_id, reservation_date, session_time, guest_count, status, created_at)
VALUES ('3b82442f-f089-45d3-8752-a05df9e865d7', 'MC-9298', 'bjk [Game: Azul] [Total: Rp 90.000] [Metode: Transfer BCA]', '63', '2d688ca5-1dbf-4e9a-bd4c-84d3f0527d2c', '2026-11-16', '17.00 - 20.00 (3 Jam)', 4, 'Confirmed', '2026-11-15T16:33:23.916441+00:00')
ON CONFLICT (id) DO UPDATE SET
  booking_code = EXCLUDED.booking_code,
  customer_name = EXCLUDED.customer_name,
  customer_phone = EXCLUDED.customer_phone,
  table_id = EXCLUDED.table_id,
  reservation_date = EXCLUDED.reservation_date,
  session_time = EXCLUDED.session_time,
  guest_count = EXCLUDED.guest_count,
  status = EXCLUDED.status;
INSERT INTO public.reservations (id, booking_code, customer_name, customer_phone, table_id, reservation_date, session_time, guest_count, status, created_at)
VALUES ('ce073c82-1db2-4b8d-965a-b21dc791afae', 'MC-5268', 'Testing Jam 12 Past Date [Game: UNO] [Total: Rp 60.000] [Metode: Transfer Mandiri]', '081234567890', '2d688ca5-1dbf-4e9a-bd4c-84d3f0527d2c', '2026-11-14', '12.00 - 14.00 (2 Jam)', 2, 'Confirmed', '2026-11-15T16:44:50.739525+00:00')
ON CONFLICT (id) DO UPDATE SET
  booking_code = EXCLUDED.booking_code,
  customer_name = EXCLUDED.customer_name,
  customer_phone = EXCLUDED.customer_phone,
  table_id = EXCLUDED.table_id,
  reservation_date = EXCLUDED.reservation_date,
  session_time = EXCLUDED.session_time,
  guest_count = EXCLUDED.guest_count,
  status = EXCLUDED.status;
INSERT INTO public.reservations (id, booking_code, customer_name, customer_phone, table_id, reservation_date, session_time, guest_count, status, created_at)
VALUES ('3dee4e5f-098e-43fa-b2c3-fde17cfe8598', 'MC-1428', 'lalajjek [Game: King of Tokyo] [Total: Rp 110.000] [Metode: Transfer Mandiri]', '64649', 'ea467f24-8f33-4108-9dd3-757f61c14676', '2026-11-16', '14.00 - 16.00 (2 Jam)', 4, 'Confirmed', '2026-11-15T17:46:32.376978+00:00')
ON CONFLICT (id) DO UPDATE SET
  booking_code = EXCLUDED.booking_code,
  customer_name = EXCLUDED.customer_name,
  customer_phone = EXCLUDED.customer_phone,
  table_id = EXCLUDED.table_id,
  reservation_date = EXCLUDED.reservation_date,
  session_time = EXCLUDED.session_time,
  guest_count = EXCLUDED.guest_count,
  status = EXCLUDED.status;
INSERT INTO public.reservations (id, booking_code, customer_name, customer_phone, table_id, reservation_date, session_time, guest_count, status, created_at)
VALUES ('5419ae57-1738-4d5c-8380-1cb1af6995ae', 'MC-7199', 'awan [Game: Monopoly] [Total: Rp 220.000] [Metode: Transfer Mandiri]', '0899', 'ea467f24-8f33-4108-9dd3-757f61c14676', '2026-11-18', '16.00 - 20.00 (4 Jam)', 4, 'Confirmed', '2026-11-17T04:55:12.003082+00:00')
ON CONFLICT (id) DO UPDATE SET
  booking_code = EXCLUDED.booking_code,
  customer_name = EXCLUDED.customer_name,
  customer_phone = EXCLUDED.customer_phone,
  table_id = EXCLUDED.table_id,
  reservation_date = EXCLUDED.reservation_date,
  session_time = EXCLUDED.session_time,
  guest_count = EXCLUDED.guest_count,
  status = EXCLUDED.status;
INSERT INTO public.reservations (id, booking_code, customer_name, customer_phone, table_id, reservation_date, session_time, guest_count, status, created_at)
VALUES ('2c343df5-4f86-4381-84dc-27504837ca4b', 'MC-9607', 'Lanjaf [Game: Stardew Valley: The Board Game] [Total: Rp 275.000] [Metode: Transfer BCA]', '08979', 'ea467f24-8f33-4108-9dd3-757f61c14676', '2026-11-19', '10.00 - 15.00 (5 Jam)', 4, 'Confirmed', '2026-11-17T12:15:37.255291+00:00')
ON CONFLICT (id) DO UPDATE SET
  booking_code = EXCLUDED.booking_code,
  customer_name = EXCLUDED.customer_name,
  customer_phone = EXCLUDED.customer_phone,
  table_id = EXCLUDED.table_id,
  reservation_date = EXCLUDED.reservation_date,
  session_time = EXCLUDED.session_time,
  guest_count = EXCLUDED.guest_count,
  status = EXCLUDED.status;
INSERT INTO public.reservations (id, booking_code, customer_name, customer_phone, table_id, reservation_date, session_time, guest_count, status, created_at)
VALUES ('a7941d3d-656c-42d8-a47a-3201e92ce189', 'MC-3951', 'Lanjar [Game: Exploding Kittens] [Total: Rp 55.000] [Metode: Transfer BCA]', '089', 'ea467f24-8f33-4108-9dd3-757f61c14676', '2026-11-19', '16.00 - 17.00 (1 Jam)', 4, 'Confirmed', '2026-11-17T12:28:58.592502+00:00')
ON CONFLICT (id) DO UPDATE SET
  booking_code = EXCLUDED.booking_code,
  customer_name = EXCLUDED.customer_name,
  customer_phone = EXCLUDED.customer_phone,
  table_id = EXCLUDED.table_id,
  reservation_date = EXCLUDED.reservation_date,
  session_time = EXCLUDED.session_time,
  guest_count = EXCLUDED.guest_count,
  status = EXCLUDED.status;
INSERT INTO public.reservations (id, booking_code, customer_name, customer_phone, table_id, reservation_date, session_time, guest_count, status, created_at)
VALUES ('5f14c408-22d1-46c9-8876-c1289c5cfe3b', 'MC-9513', 'hjsks [Game: Patchwork] [Total: Rp 30.000] [Metode: QRIS Instant]', '9677', '2d688ca5-1dbf-4e9a-bd4c-84d3f0527d2c', '2026-11-19', '12.00 - 13.00 (1 Jam)', 4, 'Confirmed', '2026-11-17T13:00:47.178685+00:00')
ON CONFLICT (id) DO UPDATE SET
  booking_code = EXCLUDED.booking_code,
  customer_name = EXCLUDED.customer_name,
  customer_phone = EXCLUDED.customer_phone,
  table_id = EXCLUDED.table_id,
  reservation_date = EXCLUDED.reservation_date,
  session_time = EXCLUDED.session_time,
  guest_count = EXCLUDED.guest_count,
  status = EXCLUDED.status;
INSERT INTO public.reservations (id, booking_code, customer_name, customer_phone, table_id, reservation_date, session_time, guest_count, status, created_at)
VALUES ('b1c2b038-b33f-438d-abed-14a23513f2ac', 'MC-5178', 'hem [Game: Cuphead Dice Game] [Total: Rp 475.000] [Metode: Bayar di Kasir]', '089', '9b762158-6de3-4142-aae9-a84e2d2548b7', '2026-11-18', '10.00 - 15.00 (5 Jam)', 9, 'Confirmed', '2026-11-17T13:35:52.272428+00:00')
ON CONFLICT (id) DO UPDATE SET
  booking_code = EXCLUDED.booking_code,
  customer_name = EXCLUDED.customer_name,
  customer_phone = EXCLUDED.customer_phone,
  table_id = EXCLUDED.table_id,
  reservation_date = EXCLUDED.reservation_date,
  session_time = EXCLUDED.session_time,
  guest_count = EXCLUDED.guest_count,
  status = EXCLUDED.status;
INSERT INTO public.reservations (id, booking_code, customer_name, customer_phone, table_id, reservation_date, session_time, guest_count, status, created_at)
VALUES ('cdc6ad21-a1ae-4b07-b5c5-6222ed817ea6', 'MC-3544', 'lalal [Game: Disney Villainous] [Total: Rp 110.000] [Metode: QRIS Instant]', '879', 'ea467f24-8f33-4108-9dd3-757f61c14676', '2026-11-18', '14.00 - 16.00 (2 Jam)', 6, 'Confirmed', '2026-11-17T13:49:29.723775+00:00')
ON CONFLICT (id) DO UPDATE SET
  booking_code = EXCLUDED.booking_code,
  customer_name = EXCLUDED.customer_name,
  customer_phone = EXCLUDED.customer_phone,
  table_id = EXCLUDED.table_id,
  reservation_date = EXCLUDED.reservation_date,
  session_time = EXCLUDED.session_time,
  guest_count = EXCLUDED.guest_count,
  status = EXCLUDED.status;
INSERT INTO public.reservations (id, booking_code, customer_name, customer_phone, table_id, reservation_date, session_time, guest_count, status, created_at)
VALUES ('51215f64-6f8a-4e7e-81ee-c23d365b14fa', 'MC-3504', 'lalak [Game: Puzzle] [Total: Rp 90.000] [Metode: Transfer Mandiri]', '089', '2d688ca5-1dbf-4e9a-bd4c-84d3f0527d2c', '2026-11-18', '15.00 - 18.00 (3 Jam)', 4, 'Confirmed', '2026-11-17T14:38:50.09309+00:00')
ON CONFLICT (id) DO UPDATE SET
  booking_code = EXCLUDED.booking_code,
  customer_name = EXCLUDED.customer_name,
  customer_phone = EXCLUDED.customer_phone,
  table_id = EXCLUDED.table_id,
  reservation_date = EXCLUDED.reservation_date,
  session_time = EXCLUDED.session_time,
  guest_count = EXCLUDED.guest_count,
  status = EXCLUDED.status;
INSERT INTO public.reservations (id, booking_code, customer_name, customer_phone, table_id, reservation_date, session_time, guest_count, status, created_at)
VALUES ('e4b68fe6-f7b0-46eb-b377-97a71381eb35', 'MC-7501', 'ih [Game: Puzzle] [Total: Rp 55.000] [Metode: Transfer BCA]', '23', 'ea467f24-8f33-4108-9dd3-757f61c14676', '2026-11-18', '20.00 - 21.00 (1 Jam)', 4, 'Confirmed', '2026-11-17T19:14:43.265831+00:00')
ON CONFLICT (id) DO UPDATE SET
  booking_code = EXCLUDED.booking_code,
  customer_name = EXCLUDED.customer_name,
  customer_phone = EXCLUDED.customer_phone,
  table_id = EXCLUDED.table_id,
  reservation_date = EXCLUDED.reservation_date,
  session_time = EXCLUDED.session_time,
  guest_count = EXCLUDED.guest_count,
  status = EXCLUDED.status;
INSERT INTO public.reservations (id, booking_code, customer_name, customer_phone, table_id, reservation_date, session_time, guest_count, status, created_at)
VALUES ('3c48d733-a01d-4aba-8369-4daa8ef5fdd9', 'MC-3640', 'ss [Game: Azul] [Total: Rp 30.000] [Metode: Transfer Mandiri]', '85', '2d688ca5-1dbf-4e9a-bd4c-84d3f0527d2c', '2026-11-18', '20.00 - 21.00 (1 Jam)', 4, 'Confirmed', '2026-11-18T09:04:14.578934+00:00')
ON CONFLICT (id) DO UPDATE SET
  booking_code = EXCLUDED.booking_code,
  customer_name = EXCLUDED.customer_name,
  customer_phone = EXCLUDED.customer_phone,
  table_id = EXCLUDED.table_id,
  reservation_date = EXCLUDED.reservation_date,
  session_time = EXCLUDED.session_time,
  guest_count = EXCLUDED.guest_count,
  status = EXCLUDED.status;
INSERT INTO public.reservations (id, booking_code, customer_name, customer_phone, table_id, reservation_date, session_time, guest_count, status, created_at)
VALUES ('b526010f-78c8-496e-aaa6-a627f28e7a72', 'MC-4421', 'Lanjar Setiawan [Game: Azul] [Total: Rp 60.000] [Metode: Transfer BCA]', '081234567890', '2d688ca5-1dbf-4e9a-bd4c-84d3f0527d2c', '2026-11-18', '18.00 - 20.00 (2 Jam)', 4, 'Confirmed', '2026-11-18T10:39:50.916973+00:00')
ON CONFLICT (id) DO UPDATE SET
  booking_code = EXCLUDED.booking_code,
  customer_name = EXCLUDED.customer_name,
  customer_phone = EXCLUDED.customer_phone,
  table_id = EXCLUDED.table_id,
  reservation_date = EXCLUDED.reservation_date,
  session_time = EXCLUDED.session_time,
  guest_count = EXCLUDED.guest_count,
  status = EXCLUDED.status;
INSERT INTO public.reservations (id, booking_code, customer_name, customer_phone, table_id, reservation_date, session_time, guest_count, status, created_at)
VALUES ('c1068b06-eabe-43a2-9998-5ca2f7c80ac3', 'MC-7032', 'Lanjar Setiawan [Game: Catur Klasik] [Total: Rp 165.000] [Metode: Bayar di Kasir]', '081234567890', 'ea467f24-8f33-4108-9dd3-757f61c14676', '2026-11-20', '10.00 - 13.00 (3 Jam)', 4, 'Confirmed', '2026-11-18T10:49:20.144639+00:00')
ON CONFLICT (id) DO UPDATE SET
  booking_code = EXCLUDED.booking_code,
  customer_name = EXCLUDED.customer_name,
  customer_phone = EXCLUDED.customer_phone,
  table_id = EXCLUDED.table_id,
  reservation_date = EXCLUDED.reservation_date,
  session_time = EXCLUDED.session_time,
  guest_count = EXCLUDED.guest_count,
  status = EXCLUDED.status;
INSERT INTO public.reservations (id, booking_code, customer_name, customer_phone, table_id, reservation_date, session_time, guest_count, status, created_at)
VALUES ('e39f9a7d-73d5-4624-8305-9e77e3dd1ef4', 'MC-5328', 'Lanjar Setiawan [Game: Skull] [Total: Rp 30.000] [Metode: Transfer BCA]', '081234567890', '2d688ca5-1dbf-4e9a-bd4c-84d3f0527d2c', '2026-11-19', '20.00 - 21.00 (1 Jam)', 4, 'Confirmed', '2026-11-18T11:17:59.203747+00:00')
ON CONFLICT (id) DO UPDATE SET
  booking_code = EXCLUDED.booking_code,
  customer_name = EXCLUDED.customer_name,
  customer_phone = EXCLUDED.customer_phone,
  table_id = EXCLUDED.table_id,
  reservation_date = EXCLUDED.reservation_date,
  session_time = EXCLUDED.session_time,
  guest_count = EXCLUDED.guest_count,
  status = EXCLUDED.status;
