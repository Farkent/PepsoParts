# PEPSO PARTS - Website Katalog & Pemesanan Sparepart Kawasaki Ninja 2-Tak

Aplikasi web katalog dan sistem pemesanan resmi untuk **PEPSO PARTS** (Bapak Wahyu Dwi Adrianto), spesialis sparepart bekas copotan original Kawasaki Ninja 2-Tak (Ninja R, Ninja RR, Ninja SS). Dikembangkan oleh tim **SeptClouds**.

---

## 🛠️ Tech Stack

- **Backend API:** PHP 8.2+ murni (tanpa framework besar), REST JSON, PDO Prepared Statements, arsitektur PSR-4 (Controller - Service - Repository).
- **Frontend:** React 18 (Vite SPA) dengan React Router DOM, Tailwind CSS (Industrial / Workshop Theme), `@fontsource/barlow-condensed`, `@fontsource/inter`, `lucide-react`.
- **Database:** MySQL 8 / MariaDB 10.6+ (InnoDB, charset `utf8mb4`).
- **AI Engine:** PHP Backend Adapter (`AiProviderInterface`), implementasi `GeminiProvider` dan `MockProvider`.

---

## 📋 Prasyarat Sistem

1. **PHP 8.2+** dengan ekstensi: `pdo_mysql`, `mbstring`, `curl`, `gd`, `fileinfo`, `openssl`.
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

### 3. Buat Akun Admin Awal
Jalankan skrip CLI pembuatan admin:
```bash
php backend/bin/create-admin.php admin@pepsoparts.com AdminNinja2T! "Admin PEPSO PARTS"
```

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
2. **Vite Frontend:** `http://127.0.0.1:5173` (membuka katalog dan mem-proxy `/api` serta `/uploads` ke PHP).

---

## 🔍 Verifikasi Health Check
Kunjungi:
`http://127.0.0.1:8000/api/health` atau `http://127.0.0.1:5173/api/health`

Respon JSON yang diharapkan:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "app_name": "PEPSO PARTS API",
    "version": "1.0.0",
    "timezone": "Asia/Jakarta",
    "php_version": "8.2.12",
    "database": {
      "status": "connected",
      "version": "10.4.32-MariaDB"
    },
    "ai": {
      "enabled": true,
      "provider": "mock"
    }
  }
}
```

---

## 📦 Build Produksi

Untuk menghasilkan berkas statis siap upload ke shared hosting / cPanel:
```bash
npm run build
```
Hasil build akan tersimpan di `frontend/dist/`.
Panduan lengkap pengunggahan ke shared hosting Apache terdapat di [docs/DEPLOY.md](file:///c:/xampp/htdocs/PEPSO%20PARTS/docs/DEPLOY.md).

---

## 📁 Struktur Dokumen
- `docs/API.md` : Dokumentasi endpoint REST API publik & admin.
- `docs/ERD.md` : Diagram relasi tabel database (Mermaid).
- `docs/ASUMSI.md` : Catatan asumsi teknis dan fungsional.
- `docs/KEAMANAN.md` : Audit mitigasi OWASP Top 10.
- `docs/PANDUAN_ADMIN.md` : Buku panduan praktis pemilik toko.
- `docs/UAT_CHECKLIST.md` : Lembar uji terima sistem (UAT).
- `docs/UAT_AI_TESTSET.md` : 30 skenario pengujian kecerdasan buatan.
