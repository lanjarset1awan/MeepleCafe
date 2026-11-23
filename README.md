# 🎲 MeepleCafe - Platform Board Game Cafe & Reservasi Meja

Tugas Akhir Praktikum Pemrograman Perangkat Bergerak (PPB) 2026.

**MeepleCafe** adalah aplikasi mobile berbasis React Native (Expo SDK 58) dan backend RESTful API Node.js / Express.js yang terhubung dengan Supabase Cloud PostgreSQL & Supabase Storage. Aplikasi ini memadukan katalog koleksi permainan board game fisik terlengkap dengan sistem pemesanan meja kafe secara instan, panel manajemen admin terintegrasi, serta kemampuan penjelajahan katalog saat offline (*Cache-First / Stale-While-Revalidate*).

---

## 🛠️ Tech Stack & Arsitektur

* **Frontend Mobile (Expo React Native):**
  * React Native `0.88.1` & Expo SDK `~58.0.26`
  * `@react-navigation/native-stack` & `@react-navigation/bottom-tabs` (v7)
  * Struktur layar modular terpisah (`screens/admin/` & `screens/user/`)
  * `@react-native-async-storage/async-storage` (Sesi pengguna & *Offline Cache Service*)
  * `@expo/vector-icons` (Ionicons & MaterialCommunityIcons)
  * `expo-image` & `expo-image-picker` (Upload avatar profil & bukti bayar)
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

### 1. Modul Pengguna (User Screens)
* **Landing Page Interaktif (Mode Tamu/Pengunjung):**
  * Menjelajahi katalog game unggulan, pencarian judul, dan filter kategori genre.
  * Informasi kafe lengkap: jam operasional, alamat fisik, fasilitas, dan identitas pengembang.
* **Autentikasi Pengguna & Sesi:**
  * Registrasi akun baru dengan validasi username, email, nama, nomor telepon, dan password.
  * Login dengan sinkronisasi database Supabase Cloud & *local fallback cache*.
* **5 Tab Navigasi Utama:**
  * 🃏 **Katalog Game:** Tampilan kartu board game, detail sinopsis, aturan main, durasi, jumlah pemain, dan status ketersediaan.
  * 📋 **Daftar Game (Inventaris):** Informasi detail ketersediaan box game fisik dan kode lokasi rak kafe.
  * 🪑 **Meja Kafe:** Pilihan area meja (Regular Corner, Party Arena, VIP Tatami Room) beserta fasilitas dan kapasitas.
  * 🎟️ **Tiket Saya:** Tiket reservasi aktif dengan kode booking unik (misal: `MC-8054`), filter tiket aktif vs riwayat kedaluwarsa, dan pembatalan tiket.
  * 👤 **Profil Pengguna:** Informasi profil, lencana peran (*Member* / *Admin*), riwayat tiket, dan tombol keluar.
* **Edit Profil & Foto Avatar (Supabase Storage):**
  * Perbarui data diri secara dinamis dengan validasi format.
  * Unggah foto profil dari galeri menggunakan `expo-image-picker` yang tersimpan di bucket publik Supabase.
  * Opsi hapus foto profil untuk kembali ke inisial huruf nama.
  * Fitur perbesar foto profil layar penuh (*Fullscreen Viewer*).
* **Form Reservasi Meja Cerdas:**
  * Data pemesan otomatis terkunci sesuai profil akun yang login.
  * Validasi ketersediaan meja, pemilihan board game, serta jam sesi bermain secara *real-time*.

### 2. Modul Panel Admin (Admin Screens)
* **Akses Khusus Admin:**
  * Pengguna dengan peran `Admin` memiliki tombol *"Masuk Panel Admin"* di halaman profil dan ikon pengaturan cepat di header katalog.
* **Kelola Katalog Game (`AdminGameList` & `AdminGameForm`):**
  * Melihat seluruh koleksi game dengan toggle ketersediaan instan (*Tersedia* / *Tidak Tersedia*).
  * Form CRUD game: tambah dan perbarui judul, sinopsis, aturan main, jumlah pemain, durasi bermain, kategori genre, jumlah box, dan kode rak.
* **Kelola Meja Kafe (`AdminTableList` & `AdminTableForm`):**
  * Manajemen meja bermain: nomor meja, jenis meja, kapasitas kursi, harga per jam, fasilitas, dan toggle status operasional/maintenance.
* **Verifikasi Pembayaran & Tiket (`AdminPaymentList`):**
  * Memeriksa seluruh daftar pesanan tiket masuk dengan tab status (*Pending*, *Confirmed*, *Rejected*).
  * Meninjau bukti transfer pembayaran dengan fitur *Tap to Zoom Fullscreen*.
  * Konfirmasi dan aktivasi tiket atau tolak reservasi secara instan.
* **UI & Header Admin Khusus:**
  * Header bernuansa gelap dengan eyebrow pill `[ 🛡️ ADMIN PANEL ]`, tombol kembali yang sejajar rapi dengan judul, serta bottom navbar khusus admin.

### 3. Mode Offline & Cache-First (Stale-While-Revalidate)
* **Dukungan AsyncStorage (`cacheService.js`):**
  * Data katalog game, detail game, meja kafe, dan kategori otomatis dicadangkan ke memori lokal HP.
  * Saat internet terputus, aplikasi tetap terbuka seketika tanpa stuck loading spinner.
  * Pengguna tetap dapat melihat katalog, melakukan pencarian, memfilter genre, dan membaca aturan permainan secara offline.
* **Banner Offline & Proteksi Reservasi:**
  * Muncul banner *OfflineNotice* saat perangkat berada di luar jangkauan internet.
  * Tombol pemesanan meja dan tiket dinonaktifkan otomatis saat offline guna menjaga integritas data reservasi, dilengkapi dialog informatif yang ramah pengguna.

---

## 🗂️ Struktur Direktori Proyek

```text
TA_PPB/
├── backend/
│   ├── src/
│   │   ├── config/          # Supabase client & environment
│   │   ├── controllers/     # Controller MVC (Auth, Game, Table, Reservation)
│   │   ├── models/          # Model data Supabase & default users
│   │   ├── routes/          # Express route endpoints
│   │   ├── scripts/         # generate_backup.js (Auto dump database)
│   │   └── index.js         # Entry point server Express.js
│   ├── supabase_master_backup.sql   # Master database backup lengkap
│   ├── supabase_schema_users.sql    # Skrip SQL tabel users & seed akun
│   ├── supabase_schema_storage.sql  # Skrip SQL storage bucket 'avatars'
│   └── package.json
├── mobile/
│   ├── assets/              # Logo, ikon aplikasi, dan splash screen
│   ├── src/
│   │   ├── api/             # apiService.js & config.js (Fetch HTTP, checkOnline)
│   │   ├── components/      # CustomDialog, GameImage, OfflineNotice, SuccessPaymentModal
│   │   ├── context/         # AuthContext.js (State sesi login & profil)
│   │   ├── navigation/      # AppNavigator.js (Stack & Tabs navigation)
│   │   ├── screens/         # Struktur Modular Layar:
│   │   │   ├── admin/       # Layar Panel Admin (GameList, GameForm, TableList, TableForm, PaymentList)
│   │   │   ├── user/        # Layar Pengguna (Landing, Catalog, GameDetail, Booking, Profile, Tickets, dll)
│   │   │   └── index.js     # Barrel export seluruh layar
│   │   ├── services/        # cacheService.js (AsyncStorage Cache-First SWR)
│   │   └── theme/           # Palet warna konsisten MeepleCafe
│   ├── app.json             # Konfigurasi Expo & Android package
│   ├── eas.json             # Konfigurasi EAS Build APK (Preview buildType: apk)
│   └── package.json
└── README.md
```

---

## 🚀 Panduan Menjalankan Proyek Secara Lokal

### 1. Menjalankan Backend API

Buka terminal di root direktori proyek:

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

* Buka aplikasi **Expo Go** pada smartphone Android atau iOS Anda.
* Pindai **QR Code** yang tampil di terminal untuk membuka aplikasi secara langsung.

---

## 🗄️ Konfigurasi Database Supabase

Tersedia opsi restorasi database instan:

1. Buka dashboard proyek Anda di [Supabase Cloud](https://supabase.com) -> menu **SQL Editor**.
2. Salin dan jalankan seluruh isi file `backend/supabase_master_backup.sql`.
3. Skrip otomatis membuat:
   - Seluruh tabel relasional (`game_categories`, `cafe_tables`, `board_games`, `users`, `reservations`)
   - Storage bucket publik `avatars`
   - Kebijakan izin akses penuh (*RLS Policies*)
   - Seluruh data awal (*seeds*): genre, meja, 20 katalog board game, akun admin, member, dan tiket.
4. Untuk memperbarui file backup database dari data cloud terkini kapan saja, jalankan:
   ```bash
   cd backend
   npm run backup
   ```

---

## 📦 Panduan Build Standalone APK Android (EAS Build)

Aplikasi telah dikonfigurasi dengan profil `preview` pada file `eas.json` untuk menghasilkan file installer `.apk` mandiri yang siap dipasang langsung ke HP Android tanpa Google Play Console.

### Langkah-langkah Build APK:

1. **Buka Terminal dan Masuk ke Folder `mobile`**:
   ```bash
   cd c:\TA_PPB\mobile
   ```

2. **Jalankan Perintah Build Cloud EAS**:
   ```bash
   npx eas-cli build --platform android --profile preview
   ```

3. **Petunjuk saat Muncul Pertanyaan Interaktif**:
   - Jika belum login Expo, masukkan kredensial akun Expo Anda.
   - Jika ditanya *"Generate a new Android Keystore?"*, tekan **Enter** atau pilih **`Y`** (Yes).
   - Biarkan EAS mengunggah project dan memulai antrean kompilasi di server cloud Expo.

4. **Unduh File APK**:
   - Setelah proses build selesai (sekitar 5–10 menit), terminal akan menampilkan link unduhan langsung beserta barcode/QR Code.
   - Unduh file `.apk` dan langsung pasang di smartphone Android Anda.

---

## 🧪 Akun Demo untuk Pengujian

| Peran | Username / Identifier | Kata Sandi | Keterangan Akses |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin` atau `admin@meeplecafe.com` | `Admin@123` | Akses penuh Panel Admin (Kelola Game, Meja, & Verifikasi Tiket) |
| **Member** | `lanjar` atau `lanjar@meeplecafe.com` | `123` | Akun utama pengguna dengan riwayat tiket & profil |
| **Member Baru** | *(Daftar via form registrasi)* | Bebas | Pengunjung umum dapat mendaftar akun sendiri |

---

## 👨‍💻 Pengembang

* **Nama:** Lanjar Setiawan
* **NIM:** 21120124120023
* **Kelompok:** Kelompok 16
* **Shift:** Shift 3
* **Mata Kuliah:** Praktikum Pemrograman Perangkat Bergerak (PPB) 2026
