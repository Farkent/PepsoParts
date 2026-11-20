# Dokumen Audit Keamanan & QA — PEPSO PARTS

Dokumen ini memuat hasil audit keamanan, pengujian kualitas kode, dan matriks mitigasi risiko pada sistem katalog & pemesanan suku cadang **PEPSO PARTS** (Kawasaki Ninja 2-Tak).

---

## 1. Ringkasan Eksekutif

Audit keamanan independen telah dilakukan pada arsitektur Backend (PHP 8.2+ Native) dan Frontend (React 18 + Vite SPA). Pengujian mencakup pengujian unit/integrasi otomatis (`backend/tests/SuiteTest.php`), pemindaian kerentanan OWASP Top 10, sanitasi input/output, serta audit upload gambar dan transaksi basis data.

| Komponen | Status Evaluasi | Keterangan |
| :--- | :--- | :--- |
| **Pencegahan SQL Injection** | ✅ **LULUS** (100% Prepared Statements) | Semua query menggunakan PDO prepared statements (`:param` / `?`). Tidak ada konkatenasi string SQL mentah. |
| **Autentikasi & Kontrol Akses** | ✅ **LULUS** (RBAC & Session Terisolasi) | Sesi admin terproteksi `AuthMiddleware`, dilindungi cookie `HttpOnly` + `SameSite=Lax`. |
| **Perlindungan CSRF** | ✅ **LULUS** (Double-Submit / Session Hash) | Validasi token 64-karakter hex via `hash_equals()` pada seluruh mutasi POST/PUT/PATCH/DELETE admin. |
| **Keamanan Upload Berkas** | ✅ **LULUS** (MIME Inspection & GD Strip) | Cek MIME via `finfo`, re-encode ke WebP (membuang EXIF), eksekusi PHP diblokir via `.htaccess`. |
| **Integritas Stok & Transaksi** | ✅ **LULUS** (ACID `SELECT ... FOR UPDATE`) | Pengurangan dan pengembalian stok saat pembatalan order berjalan atomik tanpa race condition. |
| **Ketahanan Brute-Force** | ✅ **LULUS** (IP-based Rate Limiter) | Batas 5 percobaan login gagal per 5 menit dengan delay timing mitigasi (`usleep`). |
| **Sanitasi XSS** | ✅ **LULUS** | React JSX auto-escaping pada frontend, `htmlspecialchars(..., ENT_QUOTES)` pada Open Graph HTML generator. |
| **Hasil QA Automated Test** | ✅ **21 / 21 LULUS (100%)** | Menembus pengujian database, pencarian leksikal, transaksi pesanan, CSRF, dan AI fallback. |

---

## 2. Matriks Evaluasi OWASP Top 10

### A01: Broken Access Control
- **Mitigasi:**
  - Seluruh endpoint administratif (`/api/admin/*`) diverifikasi oleh `AuthMiddleware`.
  - Akses publik ke pelacakan pesanan (`/api/orders/{code}`) diwajibkan menyertakan parameter `token` acak kriptografis 64 karakter (`public_token`) yang dibuat menggunakan `random_bytes(32)`. Pengguna tidak dapat menebak nomor pesanan orang lain (mencegah IDOR).
  - Admin login bypass CSRF secara aman, namun seluruh mutasi data setelah login wajib menyertakan header `X-CSRF-Token`.

### A02: Cryptographic Failures
- **Mitigasi:**
  - Password admin disimpan menggunakan algoritma Bcrypt via `password_hash($password, PASSWORD_BCRYPT, ['cost' => 12])`.
  - Token sesi, CSRF, dan token pelacakan pesanan dibuat dengan generator CSPRNG `random_bytes()` PHP.
  - Perbandingan token CSRF menggunakan `hash_equals()` guna mencegah *timing attacks*.

### A03: Injection (SQL & Command)
- **Mitigasi:**
  - Tidak ada fungsi `eval()`, `exec()`, `passthru()`, atau `shell_exec()` di aplikasi backend.
  - Database diakses menggunakan PDO dengan mode error `PDO::ERRMODE_EXCEPTION`.
  - Repositori `ProductRepository`, `OrderRepository`, `CategoryRepository`, dan `MotorTypeRepository` menyusun klausa pencarian dinamis menggunakan placeholder berparameter terikat (`:q`, `:min_price`, `?`).

### A04: Insecure Design
- **Mitigasi:**
  - Checkout form publik dipersenjatai perangkap honeypot (`website` field tersembunyi). Jika diisi oleh bot spam, request langsung ditolak (HTTP 400).
  - Validasi ketat nomor WhatsApp (`628xxxxxxxx`) dan panjang input alamat.
  - Mesin status pesanan memiliki aturan transisi yang kaku:
    - `new` $\rightarrow$ `confirmed` atau `cancelled`
    - `confirmed` $\rightarrow$ `completed` atau `cancelled` (otomatis mengembalikan stok yang terkunci)
    - `completed` dan `cancelled` adalah status terminal (tidak dapat diubah kembali).

### A05: Security Misconfiguration
- **Mitigasi:**
  - File `.env` tidak diletakkan di direktori publik (`backend/public/`).
  - Folder `uploads/.htaccess` secara eksplisit memblokir eksekusi seluruh varian skrip: `.php`, `.phtml`, `.php5`, `.sh`, `.cgi`, dll., dan menonaktifkan directory indexing (`Options -Indexes`).
  - Pada lingkungan produksi (`APP_ENV=production`), `display_errors` dinonaktifkan di level core dan cookie sesi diatur `secure = true`.

### A06: Vulnerable and Outdated Components
- **Mitigasi:**
  - Backend dibangun dengan **PHP 8.2 Native** tanpa dependensi pihak ketiga atau framework besar (zero dependency debt).
  - Frontend menggunakan React 18, Vite 5, Tailwind CSS, dan Lucide Icons yang dikompilasi ke static assets tanpa server Node.js runtime di produksi.

### A07: Identification and Authentication Failures
- **Mitigasi:**
  - Rate limiting pada `AdminAuthController::login` (5 kegagalan per 5 menit per hash IP).
  - Regenerasi session ID (`session_regenerate_id(true)`) setelah otentikasi berhasil untuk menggugurkan *session fixation*.
  - Sesi otomatis dihapus total (`session_destroy()`, cookie session kedaluwarsa) saat logout.

### A08: Software and Data Integrity Failures
- **Mitigasi:**
  - Gambar produk yang diunggah divalidasi MIME aslinya melalui pustaka `finfo` (bukan dari ekstensi nama file atau header browser).
  - Seluruh gambar diolah ulang menggunakan pustaka GD (`imagecreatefromjpeg`/`png`/`webp`) dan disimpan ulang sebagai WebP. Proses ini menghancurkan payload steganografi atau metadata EXIF berbahaya.

### A09: Security Logging and Monitoring Failures
- **Mitigasi:**
  - Kelas `Logger::error()` dan `Logger::warning()` mencatat kegagalan operasional dan upaya login abnormal ke dalam file log terisolasi.
  - Tabel `ai_usage_logs` mencatat waktu respon, fitur, dan hash anonim alamat IP (`sha256(IP)`) tanpa menyimpan alamat IP asli pengguna secara terbuka (kepatuhan privasi data).

### A10: Server-Side Request Forgery (SSRF)
- **Mitigasi:**
  - Aplikasi tidak menerima input URL dari pengguna untuk diunduh oleh server.
  - Komunikasi keluar hanya menuju Google Gemini API endpoint resmi via cURL di `GeminiProvider.php`, dengan timeout terbatas (15 detik) dan fallback otomatis ke `MockProvider` jika jaringan bermasalah.

---

## 3. Hasil Pengujian Otomatis (QA Test Suite)

Pengujian dijalankan melalui script `backend/tests/SuiteTest.php`:

```text
===========================================
PEPSO PARTS - COMPREHENSIVE QA TEST SUITE
===========================================

1. Database & Configuration
  [PASS] Database Connection

2. Master Data Repositories
  [PASS] Categories loaded
  [PASS] Motor types loaded

3. Search Service & Typo Tolerance
  [PASS] Synonym expansion: seher -> piston
  [PASS] Typo correction: knlpot -> knalpot
  [PASS] Search query "piston" returns Blok Seher

4. Product Code Generator
  [PASS] Generated product code format PS-MSN-XXX
  [PASS] Slug generation sanitized

5. Session & CSRF Security
  [PASS] CSRF token is 64 hex characters
  [PASS] CSRF token validation matches
  [PASS] CSRF token validation rejects forged token

6. Rate Limiter
  [PASS] Rate limiter enforces max attempts

7. Order Flow & Stock Deduction
  [PASS] Order created with PO- prefix
  [PASS] Order has secure public tracking token
  [PASS] Stock atomically deducted by 2
  [PASS] Order status transition: new -> confirmed
  [PASS] Order status transition: confirmed -> cancelled
  [PASS] Stock automatically restored on order cancellation

8. AI Capabilities & Offline Fallback
  [PASS] AI Chat returns response and suggestions
  [PASS] AI Compatibility returns compatible status
  [PASS] AI Description Generator generates detailed text

===========================================
SUMMARY: 21 PASSED, 0 FAILED (100%)
===========================================
```

---

## 4. Panduan Hardening Lingkungan Produksi

1. **Konfigurasi Apache VirtualHost:**
   Arahkan `DocumentRoot` web server langsung ke folder `backend/public/`, bukan root direktori project:
   ```apache
   <VirtualHost *:80>
       ServerName pepsoparts.com
       DocumentRoot "c:/xampp/htdocs/PEPSO PARTS/backend/public"
       <Directory "c:/xampp/htdocs/PEPSO PARTS/backend/public">
           AllowOverride All
           Require all granted
       </Directory>
   </VirtualHost>
   ```

2. **Pengaturan PHP.ini:**
   - `display_errors = Off`
   - `log_errors = On`
   - `expose_php = Off`
   - `session.cookie_httponly = 1`
   - `session.use_strict_mode = 1`
   - `session.cookie_samesite = "Lax"`

3. **Sertifikat SSL/TLS:**
   - Wajib menggunakan HTTPS (Port 443) dengan TLS 1.3 / 1.2 untuk mengamankan transmisi sesi dan data pelanggan.
   - Setel `APP_ENV=production` dan `APP_URL=https://pepsoparts.com` pada file `.env`.

