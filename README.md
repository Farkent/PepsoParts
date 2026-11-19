# PEPSO PARTS - Website Katalog & Pemesanan Sparepart Kawasaki Ninja 2-Tak

Aplikasi web katalog dan sistem pemesanan resmi untuk **PEPSO PARTS** (Bapak Wahyu Dwi Adrianto), spesialis sparepart bekas copotan original Kawasaki Ninja 2-Tak (Ninja R, Ninja RR, Ninja SS). Dikembangkan oleh tim **SeptClouds**.

- **Repository GitHub:** [https://github.com/Farkent/PepsoParts.git](https://github.com/Farkent/PepsoParts.git)
- **Cabang Utama:** `main`

---

## 🛠️ Tech Stack

- **Backend API:** PHP 8.2+ murni (tanpa framework besar), REST JSON, PDO Prepared Statements, arsitektur PSR-4 (Controller - Service - Repository).
- **Frontend:** React 18 (Vite SPA) dengan React Router DOM, Tailwind CSS (Industrial / Workshop Theme), `@fontsource/barlow-condensed`, `@fontsource/inter`, `lucide-react`.
- **Database:** MySQL 8 / MariaDB 10.4+ (InnoDB, charset `utf8mb4`).
- **AI Engine:** PHP Backend Adapter (`AiProviderInterface`), implementasi `GeminiProvider` (Google Gemini 1.5 Flash) dan `MockProvider` (Offline / Deterministic).

---

## 📋 Prasyarat Sistem

1. **PHP 8.2+** dengan ekstensi aktif: `pdo_mysql`, `mbstring`, `curl`, `gd`, `fileinfo`, `openssl`.
2. **MySQL / MariaDB** (dapat menggunakan XAMPP atau Laragon).
3. **Node.js LTS** (v18+ atau v20+) dan **npm**.

---

## 🚀 Panduan Instalasi Lokal (Windows / XAMPP)

### 1. Konfigurasi Database
Pastikan layanan MySQL di XAMPP / MariaDB aktif.
Buat database dan impor skema serta data seed contoh:

```bash
# Buka terminal di folder proyek
mysql -u root -e "CREATE DATABASE IF NOT EXISTS pepso_parts CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Impor Skema Tabel
mysql -u root pepso_parts < database/schema.sql

# Impor Data Contoh (14 produk Kawasaki Ninja 2-Tak)
mysql -u root pepso_parts < database/seed_sample.sql
```

*(Pada PowerShell: `Get-Content database/schema.sql -Raw | mysql -u root pepso_parts`)*

### 2. Konfigurasi Lingkungan (`.env`)
Salin berkas konfigurasi di backend:
```bash
cp backend/.env.example backend/.env
```
Sesuaikan kredensial database `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASS` jika diperlukan.

### 3. Kredensial Administrator Default
Akun admin bawaan yang telah disediakan:
- **URL Login Admin:** `http://localhost:5173/admin/login`
- **Email:** `admin@pepsoparts.com`
- **Kata Sandi:** `AdminNinja2T!`

*(Untuk membuat akun baru via CLI: `php backend/bin/create-admin.php "Wahyu Dwi Adrianto" admin@pepsoparts.com "AdminNinja2T!"`)*

### 4. Pasang Dependensi Frontend
```bash
cd frontend
npm install
cd ..
```

---

## 💻 Menjalankan Server Development

Cukup jalankan satu perintah dari direktori root proyek:
```bash
npm run dev
```

Perintah di atas akan menjalankan secara bersamaan:
1. **PHP API Server:** `http://127.0.0.1:8000`
2. **Vite Frontend:** `http://127.0.0.1:5173` (membuka katalog publik dan mem-proxy `/api` serta `/uploads` ke PHP).

---

## 🧪 Menjalankan Pengujian Otomatis (QA Test Suite)

Sistem dilengkapi test suite mandiri yang menguji 21 skenario (Database, Repository, Sinonim, Toleransi Typo, Transaksi Atomik, Pemotongan & Pengembalian Stok, Sesi CSRF, Rate Limiter, dan AI Fallback):

```bash
php backend/tests/SuiteTest.php
```

Hasil eksekusi:
```text
===========================================
PEPSO PARTS - COMPREHENSIVE QA TEST SUITE
===========================================
1. Database & Configuration: [PASS]
2. Master Data Repositories: [PASS]
3. Search Service & Typo Tolerance: [PASS]
4. Product Code Generator: [PASS]
5. Session & CSRF Security: [PASS]
6. Rate Limiter: [PASS]
7. Order Flow & Stock Deduction: [PASS]
8. AI Capabilities & Offline Fallback: [PASS]
===========================================
SUMMARY: 21 PASSED, 0 FAILED (100%)
===========================================
```

---

## 📦 Build Produksi

Untuk menghasilkan berkas statis siap upload ke shared hosting / cPanel / VPS:
```bash
npm run build --prefix frontend
```
Hasil build akan tersimpan di `frontend/dist/`.
Panduan lengkap pengunggahan ke shared hosting Apache terdapat di [docs/DEPLOY.md](docs/DEPLOY.md).

---

## 📁 Indeks Dokumentasi Lengkap

Seluruh dokumentasi teknis dan operasional tersedia di folder `docs/`:
- [docs/API.md](docs/API.md) : Spesifikasi lengkap seluruh endpoint REST API (Publik & Admin).
- [docs/ERD.md](docs/ERD.md) : Diagram Relasi Entitas 12 tabel basis data (Mermaid) dan kamus data.
- [docs/DEPLOY.md](docs/DEPLOY.md) : Panduan penerapan di cPanel Shared Hosting, VPS Linux, & XAMPP.
- [docs/ASUMSI.md](docs/ASUMSI.md) : Asumsi domain bisnis, batasan teknis, dan trade-off arsitektur.
- [docs/KEAMANAN.md](docs/KEAMANAN.md) : Laporan audit keamanan mitigasi OWASP Top 10 (SQLi, CSRF, XSS, upload security).
- [docs/PANDUAN_ADMIN.md](docs/PANDUAN_ADMIN.md) : Buku manual praktis pengoperasian toko untuk Mas Wahyu Dwi Adrianto.
- [docs/UAT_CHECKLIST.md](docs/UAT_CHECKLIST.md) : Lembar checklist pengujian penerimaan pengguna (UAT).
- [docs/UAT_AI_TESTSET.md](docs/UAT_AI_TESTSET.md) : Kumpulan skenario pengujian intent dan ketahanan asisten AI.
