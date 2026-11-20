# Panduan Penerapan (Deployment Guide) — PEPSO PARTS

Panduan ini menjelaskan cara mempublikasikan sistem **PEPSO PARTS** pada berbagai lingkungan: cPanel Shared Hosting, VPS Linux (Ubuntu), dan Lingkungan Lokal (XAMPP).

---

## 1. Spesifikasi Server Minimum (System Requirements)

- **PHP Version:** PHP 8.2 atau lebih baru.
- **Ekstensi PHP Wajib:**
  - `pdo_mysql` (koneksi basis data MariaDB/MySQL)
  - `gd` (pemrosesan & kompresi WebP gambar produk)
  - `fileinfo` (inspeksi MIME type biner)
  - `curl` (komunikasi dengan API Google Gemini jika mode `AI_PROVIDER=gemini`)
  - `mbstring`, `json`, `session`
- **Web Server:** Apache 2.4+ (dengan modul `mod_rewrite` aktif) atau Nginx 1.20+.
- **Database:** MariaDB 10.4+ atau MySQL 8.0+.
- **Penyimpanan:** Minimal 500 MB ruang kosong untuk galeri foto WebP.

---

## 2. Struktur Build & Direktori Produksi

Pada lingkungan produksi, aplikasi terdiri dari dua komponen utama:
1. **Frontend (Static SPA):** Dibangun dengan Vite ke direktori `frontend/dist/`.
2. **Backend (PHP Core):** Terletak pada direktori `backend/`.

Struktur penempatan file yang direkomendasikan pada server:
```text
/home/username/
├── pepso_app/                   <-- Direktori privat (di luar web root)
│   ├── backend/
│   │   ├── src/                 <-- Logika inti PHP & Repositori
│   │   ├── .env                 <-- Konfigurasi rahasia & kredensial DB
│   │   └── uploads/             <-- Tempat penyimpanan foto produk
│   └── database/
│       └── schema.sql           <-- Skema database
└── public_html/                 <-- Web Root Publik (dapat diakses internet)
    ├── assets/                  <-- Hasil build Vite JS & CSS (dari frontend/dist/assets)
    ├── uploads/                 <-- Simlink atau direktori file foto publik
    ├── index.html               <-- File HTML utama Single Page App (frontend/dist/index.html)
    ├── index.php                <-- Entry point API PHP (backend/public/index.php)
    └── .htaccess                <-- Aturan rewrite URL Apache
```

---

## 3. Penerapan pada cPanel Shared Hosting

### Langkah 1: Siapkan Basis Data
1. Buka cPanel $\rightarrow$ **MySQL Database Wizard**.
2. Buat database baru (misal: `user_pepso_parts`).
3. Buat pengguna database dan berikan **ALL PRIVILEGES**.
4. Buka **phpMyAdmin**, pilih database tersebut, lalu impor berkas:
   - `database/schema.sql` (struktur 12 tabel)
   - `database/seed_sample.sql` (opsional: data awal 14 part Ninja 2T).

### Langkah 2: Build Frontend
Di komputer lokal Anda, lakukan kompilasi aset frontend:
```bash
cd frontend
npm run build
```
File hasil kompilasi akan berada di folder `frontend/dist/`.

### Langkah 3: Unggah Berkas ke cPanel
1. Unggah seluruh isi folder `backend/` ke direktori privat: `/home/user/pepso_backend/`.
2. Unggah isi folder `frontend/dist/` langsung ke dalam folder `public_html/`.
3. Salin file `backend/public/index.php` ke dalam `public_html/api/index.php` (atau atur rute via `.htaccess`).

### Langkah 4: Konfigurasi File `.env`
Edit berkas `/home/user/pepso_backend/.env`:
```ini
APP_NAME="PEPSO PARTS"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://pepsoparts.com

DB_HOST=localhost
DB_PORT=3306
DB_NAME=user_pepso_parts
DB_USER=user_pepso_admin
DB_PASS="KatasandiDatabaseKuat123!"

UPLOAD_DIR=/home/user/public_html/uploads
UPLOAD_BASE_URL=/uploads

AI_PROVIDER=mock
# Ganti dengan key asli jika ingin mode Gemini:
# AI_PROVIDER=gemini
# GEMINI_API_KEY="AIzaSy..."
```

### Langkah 5: Konfigurasi `.htaccess` pada `public_html`
Buat berkas `.htaccess` di dalam `public_html/` untuk merutekan API dan SPA:
```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /

    # 1. Arahkan /api/* ke backend PHP
    RewriteCond %{REQUEST_URI} ^/api/ [NC]
    RewriteRule ^api/(.*)$ index.php [L,QSA]

    # 2. Layani file statis yang ada secara langsung
    RewriteCond %{REQUEST_FILENAME} -f [OR]
    RewriteCond %{REQUEST_FILENAME} -d
    RewriteRule ^ - [L]

    # 3. Rute sisanya ke Single Page Application React (HTML5 pushState)
    RewriteRule ^ index.html [L]
</IfModule>
```

---

## 4. Penerapan pada VPS Linux (Ubuntu 22.04 / 24.04 LTS)

### Langkah 1: Instalasi Paket PHP 8.2 & Nginx/Apache
```bash
sudo apt update
sudo apt install -y php8.2-fpm php8.2-mysql php8.2-gd php8.2-curl php8.2-mbstring php8.2-xml nginx mariadb-server git
```

### Langkah 2: Klon Repositori & Persiapan
```bash
cd /var/www
sudo git clone https://github.com/Farkent/PepsoParts.git pepso-parts
cd pepso-parts
sudo chown -R www-data:www-data /var/www/pepso-parts/backend/public/uploads
sudo chmod -R 775 /var/www/pepso-parts/backend/public/uploads
```

### Langkah 3: Konfigurasi Nginx Server Block
Sunting `/etc/nginx/sites-available/pepsoparts.com`:
```nginx
server {
    listen 80;
    server_name pepsoparts.com www.pepsoparts.com;
    root /var/www/pepso-parts/frontend/dist;
    index index.html;

    client_max_body_size 10M;

    # Frontend SPA
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        root /var/www/pepso-parts/backend/public;
        try_files $uri /index.php?$query_string;

        location ~ \.php$ {
            include snippets/fastcgi-php.conf;
            fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
            fastcgi_param SCRIPT_FILENAME /var/www/pepso-parts/backend/public/index.php;
        }
    }

    # Uploads
    location /uploads/ {
        alias /var/www/pepso-parts/backend/public/uploads/;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
}
```
Aktifkan konfigurasi dan terapkan SSL gratis Let's Encrypt:
```bash
sudo ln -s /etc/nginx/sites-available/pepsoparts.com /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d pepsoparts.com -d www.pepsoparts.com
```

---

## 5. Inisialisasi Akun Admin Perdana

Setelah basis data terhubung, buat akun admin awal menggunakan CLI:
```bash
php backend/bin/create-admin.php "Wahyu Dwi Adrianto" admin@pepsoparts.com "AdminNinja2T!"
```

Setelah itu, buka peramban dan login melalui:
`https://pepsoparts.com/admin/login`
Ganti kata sandi secara berkala di menu **Admin $\rightarrow$ Pengaturan Toko $\rightarrow$ Ganti Kata Sandi**.

