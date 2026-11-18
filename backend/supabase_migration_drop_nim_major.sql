-- ============================================================
-- SQL MIGRATION: HAPUS KOLOM NIM DAN MAJOR DI SUPABASE
-- Jalankan skrip ini di Supabase Dashboard -> SQL Editor -> Run
-- ============================================================

ALTER TABLE public.users DROP COLUMN IF EXISTS nim;
ALTER TABLE public.users DROP COLUMN IF EXISTS major;
