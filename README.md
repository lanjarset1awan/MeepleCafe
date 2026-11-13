# MeepleCafe - Sistem Informasi Katalog Permainan dan Reservasi Meja Board Game Cafe

Tugas Akhir Praktikum Pemrograman Perangkat Bergerak (PPB) 2026.

Aplikasi mobile terintegrasi untuk katalog koleksi permainan board game fisik dan sistem reservasi meja kafe bermain secara instan.

---

## 🛠️ Tech Stack

* **Backend Web Service (Sesuai Modul 1):**
  * Node.js & Express.js
  * Arsitektur MVC (Model, Controller, Routes, Config)
  * Supabase Client (`@supabase/supabase-js`)
  * Siap deploy ke Vercel (`vercel.json`)
* **Database (Sesuai Modul 1):**
  * Supabase PostgreSQL Cloud
* **Frontend Mobile (Sesuai Modul 6):**
  * React Native (Expo SDK)
  * `@react-navigation/bottom-tabs` & `@react-navigation/native-stack`
  * `@expo/vector-icons`
* **Media Pengujian:**
  * Postman Collection (`MeepleCafe_API_Postman_Collection.json`)
  * Smartphone dengan aplikasi **Expo Go**

---

## 📱 7 Halaman Aplikasi (Memenuhi Syarat Minimal 5 Halaman)

1. **Hal 1: Katalog Koleksi Game (`GameListScreen`)**
   * List utama seluruh permainan dengan gambar, genre, pemain, dan tingkat kesulitan.
   * Dilengkapi fitur filter kategori dinamis & search bar.
2. **Hal 2: Detail Game & Cara Main (`GameDetailScreen`)**
   * Detail sinopsis, estimasi durasi, dan ringkasan aturan bermain (*rulebook*).
3. **Hal 3: Pilihan Meja Kafe (`TableListScreen`)**
   * List utama area bermain kafe (Reguler Corner, Party Arena, VIP Tatami Room).
4. **Hal 4: Detail Meja & Fasilitas (`TableDetailScreen`)**
   * Informasi kapasitas, harga per jam, fasilitas lengkap, dan tombol reservasi.
5. **Hal 5: Form Booking Reservasi Meja (`BookingFormScreen`)**
   * Input nama, nomor WhatsApp, tanggal, sesi jam bermain, dan jumlah tamu.
   * Method `POST` ke API untuk mendapatkan kode booking unik.
6. **Hal 6: Tiket Reservasi Aktif (`MyTicketsScreen`)**
   * Kartu tiket digital dengan kode booking (contoh: `MC-8054`), status konfirmasi, dan detail sesi.
7. **Hal 7: Profil Mahasiswa & Info Kafe (`ProfileScreen`)**
   * Biodata praktikan (Nama, NIM, Jurusan) dan informasi jam operasional kafe.

---

## 🚀 Cara Menjalankan Proyek

### 1. Menjalankan Backend API

Buka terminal pertama di VS Code:

```bash
cd backend
npm run dev
```

Server API akan berjalan di: `http://localhost:3000`

### 2. Menjalankan Frontend Mobile (Expo)

Buka terminal kedua di VS Code:

```bash
cd mobile
npx expo start
```

* Buka aplikasi **Expo Go** di HP Android atau iOS Anda.
* Scan **QR Code** yang muncul di terminal untuk membuka aplikasi di HP.

---

## 🧪 Pengujian API dengan Postman

File collection Postman tersedia di:
`backend/MeepleCafe_API_Postman_Collection.json`

Anda dapat mengimpor file ini langsung ke aplikasi Postman untuk menguji endpoint:
* `GET /api/games`
* `GET /api/tables`
* `POST /api/reservations`
* `GET /api/reservations`

