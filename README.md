# 🎲 MeepleCafe - Platform Board Game Cafe & Reservasi Meja

Tugas Akhir Praktikum Pemrograman Perangkat Bergerak (PPB) 2026.

**MeepleCafe** adalah aplikasi mobile berbasis React Native (Expo SDK 58) dan backend RESTful API Node.js / Express.js yang terhubung dengan Supabase Cloud PostgreSQL & Supabase Storage. Aplikasi ini memadukan katalog koleksi permainan board game fisik terlengkap dengan sistem pemesanan meja dan ruangan bermain di kafe secara instan.

---

## 🛠️ Tech Stack & Arsitektur

* **Frontend Mobile (Expo React Native):**
  * React Native `0.88.1` & Expo SDK `~58.0.26`
  * `@react-navigation/native-stack` & `@react-navigation/bottom-tabs` (v7)
  * `@expo/vector-icons` (Ionicons & MaterialCommunityIcons)
  * `expo-image` & `expo-image-picker` (Upload foto profil)
  * `@react-native-async-storage/async-storage` (Sesi pengguna offline-first)
* **Backend Web Service (Express.js):**
  * Node.js & Express.js `4.21.2` (Arsitektur MVC)
  * Supabase Client (`@supabase/supabase-js`)
  * Siap deploy ke Vercel Serverless (`vercel.json`)
* **Database & Cloud Storage:**
  * Supabase PostgreSQL Cloud
  * Supabase Storage Bucket `avatars` (Penyimpanan foto profil)
* **Build & Distribusi APK:**
  * EAS Build (`eas-cli`) dengan profil `preview` menghasilkan file `.apk` standalone.

---

## ✨ Fitur-Fitur Utama Aplikasi

1. **Landing Page Interaktif (Mode Pengunjung/Tamu)**:
   * **Katalog Game**: Menjelajahi ratusan board game, pencarian judul, dan filter kategori genre.
   * **Tentang Kafe**: Profil kafe, jam operasional, alamat lengkap, dan fasilitas kafe.
   * Tombol masuk (*Login*) dan daftar (*Register*) di header.
2. **Sistem Autentikasi Pengguna & Keamanan**:
   * Registrasi akun baru dengan validasi username, email, nama, nomor telepon, NIM, dan program studi.
   * Login aman dengan sinkronisasi database Supabase Cloud & *local fallback cache*.
3. **5 Tab Utama Aplikasi**:
   * 🃏 **Katalog**: Tampilan visual kartu board game, detail sinopsis, aturan main, dan jumlah pemain.
   * 📋 **Daftar Game (Stok Rak)**: Manajemen inventaris stok game fisik, kode rak kafe, dan status ketersediaan.
   * 🪑 **Meja Kafe**: Pilihan area bermain (Reguler Corner, Party Arena, VIP Tatami Room).
   * 🎟️ **Tiket Saya**: Tiket reservasi aktif dengan kode booking unik (misal: `MC-8054`), rincian jam main, dan opsi pembatalan.
   * 👤 **Profil Pengguna**: Informasi akun pengguna, status online, dan tombol aksi profil.
4. **Edit Profil & Foto Avatar (Supabase Storage)**:
   * Mengunggah foto profil dari galeri perangkat menggunakan `expo-image-picker`.
   * Foto disimpan di Supabase Storage Bucket `avatars` dengan URL publik.
   * Tombol *"Hapus Foto Profil"* untuk kembali ke inisial 2 huruf bawaan.
   * Fitur perbesar foto profil satu layar penuh (*Fullscreen Viewer*) dengan mengetuk avatar di halaman profil.
5. **Form Reservasi Meja Cerdas**:
   * Data pemesan (Nama Lengkap & Nomor WhatsApp) terisi otomatis dari profil akun pengguna dan terkunci.
   * Pengguna hanya perlu menentukan jumlah pemain dan jam bermain.
   * Validasi bentrok meja dan stok game otomatis secara *real-time*.
6. **Desain Popup Kustom Konsisten (`CustomDialog`)**:
   * Semua dialog konfirmasi (logout, ajakan login, pembatalan tiket, dan notifikasi sukses/gagal) menggunakan desain modal kustom yang seragam.

---

## 🗂️ Struktur Direktori Proyek

```text
TA_PPB/
├── backend/
│   ├── src/
│   │   ├── config/          # Supabase client & environment
│   │   ├── controllers/     # Controller MVC (Auth, Game, Table, Reservation)
│   │   ├── models/          # Model data Supabase & fallback
│   │   ├── routes/          # Express route endpoints
│   │   └── index.js         # Entry point server Express.js
│   ├── supabase_schema_users.sql    # Skrip SQL tabel users & seed akun
│   ├── supabase_schema_storage.sql  # Skrip SQL storage bucket 'avatars'
│   └── package.json
├── mobile/
│   ├── assets/              # Logo, ikon aplikasi, dan splash screen
│   ├── src/
│   │   ├── api/             # apiService.js (HTTP fetch & Supabase fallback)
│   │   ├── components/      # CustomDialog, GameImage, SuccessPaymentModal
│   │   ├── context/         # AuthContext.js (State sesi login & profil)
│   │   ├── navigation/      # AppNavigator.js (RootStack, Tabs, Screen Stacks)
│   │   ├── screens/         # Seluruh layar UI React Native
│   │   └── theme/           # Palet warna konsisten MeepleCafe
│   ├── app.json             # Konfigurasi Expo & Android package
│   ├── eas.json             # Konfigurasi EAS Build APK
│   └── package.json
└── README.md
```

---

## 🚀 Panduan Menjalankan Proyek Secara Lokal

### 1. Menjalankan Backend API

Buka terminal di root proyek:

```bash
cd backend
npm install
npm run dev
```

Server API akan berjalan pada `http://localhost:3000`.

### 2. Menjalankan Frontend Mobile (Expo)

Buka terminal kedua:

```bash
cd mobile
npm install
npx expo start
```

* Buka aplikasi **Expo Go** pada perangkat smartphone Android atau iOS Anda.
* Pindai **QR Code** yang tampil di terminal.

---

## 🗄️ Konfigurasi Database Supabase

Jalankan skrip SQL berikut pada **Supabase Dashboard -> SQL Editor**:

1. **Tabel Akun Pengguna**: Jalankan skrip di `backend/supabase_schema_users.sql` untuk membuat tabel `public.users` dan akun *seed* bawaan:
   * **Username**: `lanjar`
   * **Password**: `123`
2. **Storage Bucket Foto Profil**: Jalankan skrip di `backend/supabase_schema_storage.sql` untuk membuat bucket publik `avatars` dan kebijakan izin upload file.

---

## 📦 Panduan Build APK Android (Standalone APK)

Aplikasi telah dikonfigurasi dengan **EAS Build** untuk menghasilkan file `.apk` langsung (dapat diinstal tanpa melalui Google Play Store).

### Langkah-langkah Build APK:

1. **Pastikan EAS CLI terpasang secara global**:
   ```bash
   npm install -g eas-cli
   ```

2. **Login ke Akun Expo**:
   ```bash
   eas login
   ```

3. **Masuk ke folder `mobile`**:
   ```bash
   cd mobile
   ```

4. **Jalankan Perintah Build APK**:
   ```bash
   eas build -p android --profile preview
   ```

5. **Unduh File APK**:
   * Setelah proses build selesai pada server cloud EAS, terminal akan menampilkan URL unduhan file `.apk`.
   * Anda juga dapat memindai QR Code yang muncul di terminal langsung dari smartphone Android untuk mengunduh dan menginstal APK MeepleCafe.

---

## 🧪 Akun Demo untuk Pengujian

| Peran | Username / Identifier | Kata Sandi | Keterangan |
| :--- | :--- | :--- | :--- |
| **Admin / Mahasiswa** | `lanjar` atau `21120124120023` | `123` | Akun praktikan dengan data lengkap |
| **Pendaftaran Baru** | *(Daftar via form)* | Bebas | Pengguna dapat membuat akun baru |

---

## 👨‍💻 Pengembang

* **Nama:** Lanjar Setiawan
* **NIM:** 21120124120023
* **Program Studi:** Teknik Komputer
* **Mata Kuliah:** Praktikum Pemrograman Perangkat Bergerak (PPB) 2026
* **Kelompok:** 16
