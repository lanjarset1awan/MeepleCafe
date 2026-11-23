-- ============================================================
-- SQL SCHEMA MIGRATION: BOARD_GAMES DENGAN STOK & POSISI RAK
-- Jalankan skrip ini di Supabase Dashboard -> SQL Editor -> Run
-- ============================================================

-- 1. Tambahkan kolom stock dan shelf_location pada tabel board_games (jika belum ada)
ALTER TABLE public.board_games 
ADD COLUMN IF NOT EXISTS stock INT DEFAULT 2,
ADD COLUMN IF NOT EXISTS shelf_location TEXT DEFAULT 'Rak A-01';

-- 2. Update variasi stok dan posisi rak permainan agar rapi & bervariasi
UPDATE public.board_games
SET 
  stock = CASE 
    WHEN difficulty = 'Hard' OR difficulty = 'Sulit' THEN 1
    WHEN max_players >= 6 THEN 3
    ELSE 2
  END,
  shelf_location = CASE 
    WHEN category_id = '9b7b06eb-e194-443c-a65c-1fa7405d974f'::uuid THEN 'Rak A-01'
    WHEN category_id = '81b57e12-38ac-453b-8bdc-90ae8f9ec4bb'::uuid THEN 'Rak B-02'
    WHEN category_id = 'a190ca0a-ca64-41b1-941d-a10bba1d7cdd'::uuid THEN 'Rak C-01'
    WHEN category_id = 'bca5b3fa-1121-42ef-99d7-b1072f0c27ac'::uuid THEN 'Rak D-03'
    ELSE 'Rak A-02'
  END;

-- 3. Beri hak akses penuh ke role anon, authenticated, service_role
GRANT ALL ON TABLE public.board_games TO anon, authenticated, service_role;
