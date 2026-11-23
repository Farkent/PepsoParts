# Dokumentasi REST API — PEPSO PARTS

Sistem API backend **PEPSO PARTS** dibangun menggunakan PHP 8.2+ Native dengan pola arsitektur RESTful JSON API.

- **Base URL Pengembangan:** `http://localhost:8000/api` (atau proxied via Vite pada `http://localhost:5173/api`)
- **Format Pertukaran Data:** JSON (`Content-Type: application/json; charset=utf-8`)
- **Autentikasi:** Cookie-based session (`pepso_session`); mutasi akun dan pesanan memerlukan Header `X-CSRF-Token`.

---

## 1. Konvensi Respon API

### Respon Berhasil (Success)
```json
{
  "success": true,
  "data": { ... }
}
```

### Respon Gagal (Error)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Pesan deskripsi kesalahan.",
    "details": {
      "field_name": "Keterangan validasi field"
    }
  }
}
```

### Kode Status HTTP
- `200 OK`: Permintaan berhasil diproses.
- `201 Created`: Entitas baru berhasil dibuat.
- `400 Bad Request`: Payload salah atau parameter tidak lengkap.
- `401 Unauthorized`: Belum login atau sesi telah berakhir.
- `403 Forbidden`: Token CSRF salah atau tidak valid.
- `404 Not Found`: Data atau rute tidak ditemukan.
- `422 Unprocessable Entity`: Validasi bisnis/input gagal.
- `429 Too Many Requests`: Terkena pembatasan rate limit.
- `500 Internal Server Error`: Kesalahan server internal.

---

## 2. Endpoint Publik (Public API)

### 2.1 Kesehatan Sistem (Health Check)
- **`GET /api/health`**
  - **Deskripsi:** Memeriksa status kesehatan server PHP dan koneksi basis data MariaDB/MySQL.
  - **Respon:**
    ```json
    {
      "success": true,
      "data": {
        "status": "healthy",
        "php_version": "8.2.12",
        "database": {
          "status": "connected",
          "version": "10.4.32-MariaDB"
        }
      }
    }
    ```

### 2.2 Data Master
- **`GET /api/categories`**
  - Mengambil daftar kategori suku cadang aktif.
- **`GET /api/motor-types`**
  - Mengambil daftar tipe motor kompatibel (Ninja 150 R, RR, SS).
- **`GET /api/settings/public`**
  - Mengambil profil publik toko (nama toko, WhatsApp, alamat, jam operasional).

### 2.3 Katalog Produk
- **`GET /api/products`**
  - **Query Parameters:**
    - `q` (string): Kata kunci pencarian leksikal / sinonim / nomor part.
    - `category_id` (int): Filter berdasarkan ID kategori.
    - `motor_type` (string): Slug motor (contoh: `ninja-rr`, `ninja-r`, `ninja-ss`).
    - `condition_grade` (string): `excellent` | `good` | `fair` | `poor`.
    - `status` (string): `available` | `sold` | `all`.
    - `min_price` (int), `max_price` (int): Rentang harga.
    - `sort` (string): `newest` | `price_asc` | `price_desc`.
    - `page` (int, default: 1), `limit` (int, default: 12).
- **`GET /api/products/{slugOrCode}`**
  - Mengambil detail lengkap produk berdasarkan slug SEO atau kode barang (contoh: `PS-MSN-001`).
- **`GET /api/products/{id}/related`**
  - Mengambil hingga 4 produk terkait berdasarkan kecocokan tipe motor dan kategori silang.
- **`GET /api/share/{slug}`**
  - Menghasilkan halaman HTML statis Open Graph dengan meta tag kaya untuk crawler media sosial (Facebook, WhatsApp, Twitter).

### 2.4 Transaksi & Keranjang
- **`POST /api/cart/validate`**
  - **Payload:** `{"items": [{"product_id": 1, "quantity": 1}]}`
  - **Deskripsi:** Memvalidasi ketersediaan stok produk sebelum checkout.
- **`POST /api/orders`**
  - **Autentikasi:** Sesi pelanggan aktif dan header `X-CSRF-Token`.
  - **Payload:**
    ```json
    {
      "customer_name": "Budi Santoso",
      "customer_phone": "081234567890",
      "customer_whatsapp": "081234567890",
      "customer_address": "Jl. Raya Bogor No. 12, Bogor",
      "customer_notes": "Tolong packing kayu",
      "payment_method": "bank_transfer",
      "shipping_method": "jne_reg",
      "items": [
        {"product_id": 1, "quantity": 1}
      ],
      "website": "" // Honeypot field (wajib kosong)
    }
    ```
  - **Respon:** Menghasilkan kode pesanan `PO-YYMMDD-XXXX`, token publik, dan URL langsung WhatsApp.
- **`GET /api/orders/{code}?token={public_token}`**
  - **Deskripsi:** Melacak status pesanan publik pelanggan secara aman.

### 2.5 Akun Pelanggan
- **`POST /api/customer/register`**
  - **Payload:** `{"name":"Budi Santoso","email":"budi@example.com","whatsapp":"081234567890","password":"minimal8karakter"}`
  - Membuat akun pelanggan dan langsung memulai sesi. Pendaftaran dibatasi 5 kali per jam per alamat IP.
- **`POST /api/customer/login`**
  - **Payload:** `{"email":"budi@example.com","password":"..."}`
  - Rate limit 5 percobaan per 5 menit.
- **`GET /api/customer/me`** — Mengambil profil akun dan token CSRF sesi.
- **`POST /api/customer/logout`** — Mengakhiri sesi pelanggan; membutuhkan header `X-CSRF-Token`.
- **`GET /api/customer/orders`** — Riwayat pesanan milik akun yang sedang masuk.

### 2.6 Fitur Cerdas (AI API)
- **`POST /api/ai/chat`**
  - **Payload:**
    ```json
    {
      "message": "Cari blok seher ninja rr ori",
      "my_motor_slug": "ninja-rr",
      "history": []
    }
    ```
  - **Respon:** Mengembalikan jawaban ramah, daftar `suggested_products`, tombol `quick_replies`, dan indikator `fallback_to_whatsapp`.
- **`POST /api/ai/search`**
  - **Payload:** `{"query": "knalpot kolong", "motor_type": "ninja-r"}`
- **`POST /api/ai/compatibility`**
  - **Payload:** `{"product_id": 1, "motor_slug": "ninja-rr"}`
  - **Respon:** Memeriksa kompatibilitas fisik part terhadap varian motor tertentu.

---

## 3. Endpoint Administratif (Admin API - Protected)

Seluruh rute ini mewajibkan sesi aktif admin dan header `X-CSRF-Token` pada aksi mutasi.

### 3.1 Autentikasi
- **`POST /api/admin/login`**
  - **Payload:** `{"email": "admin@pepsoparts.com", "password": "..."}`
  - **Rate Limit:** Maksimal 5 percobaan per 5 menit.
- **`POST /api/admin/logout`**
  - Menghancurkan sesi admin.
- **`GET /api/admin/me`**
  - Mengambil data profil admin saat ini dan memperbarui token CSRF.
- **`POST /api/admin/change-password`**
  - **Payload:** `{"current_password": "...", "new_password": "..."}`

### 3.2 Dashboard & Laporan
- **`GET /api/admin/dashboard`**
  - Mengambil metrik total barang, stok tersedia, terjual, dan daftar 5 pesanan terbaru.
- **`GET /api/admin/reports/stock?format={json|csv}`**
  - Menghasilkan rekap inventaris stok suku cadang beserta estimasi nilai modal/aset.
- **`GET /api/admin/reports/orders?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD&format={json|csv}`**
  - Menghasilkan rekap omset penjualan dan item terlaris.

### 3.3 Manajemen Produk
- **`GET /api/admin/products`** — Daftar produk terkelola dengan pagination.
- **`GET /api/admin/products/{id}`** — Detail spesifik produk admin.
- **`GET /api/admin/products/next-code?category_id={id}`** — Mendapatkan kode barang terurut berikutnya otomatis.
- **`POST /api/admin/products`** — Menambah produk baru.
- **`PUT /api/admin/products/{id}`** — Memperbarui data produk.
- **`DELETE /api/admin/products/{id}`** — Menghapus produk (Soft Delete `deleted_at = NOW()`).
- **`PATCH /api/admin/products/{id}/stock`** — Penyesuaian kuantitas stok cepat.
- **`PATCH /api/admin/products/{id}/status`** — Mengubah status (`available`, `sold`, `unavailable`).
- **`POST /api/admin/products/{id}/images`** — Mengunggah foto produk (Multi-upload WebP).
- **`PATCH /api/admin/products/{id}/images/{imageId}`** — Menetapkan foto utama (`is_primary`) atau urutan.
- **`DELETE /api/admin/products/{id}/images/{imageId}`** — Menghapus foto produk secara fisik dan DB.
- **`POST /api/admin/ai/describe-product`** — Membantu menyusun draf deskripsi produk profesional via AI.

### 3.4 Manajemen Pesanan
- **`GET /api/admin/orders`** — Daftar pesanan masuk dengan filter status, tanggal, dan pencarian nama/telepon.
- **`GET /api/admin/orders/{id}`** — Detail pesanan lengkap dan rincian item.
- **`PATCH /api/admin/orders/{id}/status`** — Admin mengonfirmasi atau membatalkan pesanan. Status `completed` hanya dapat diatur pelanggan setelah pesanan dikirim.
- **`PATCH /api/admin/orders/{id}/shipping`** — Menyimpan `courier` dan `tracking_number`; pesanan `confirmed` otomatis menjadi `shipped`.
- **`PATCH /api/customer/orders/{code}/received`** — Pelanggan pemilik pesanan mengonfirmasi barang diterima; pesanan `shipped` menjadi `completed`.
- **`GET /api/admin/orders/count-notifications`** — Jumlah pesanan baru dan konfirmasi penerimaan pelanggan yang belum ditinjau admin.
- **`PATCH /api/admin/orders/{id}/received-notification`** — Menandai pemberitahuan konfirmasi penerimaan pelanggan sudah ditinjau.
- **`PATCH /api/admin/orders/{id}/note`** — Menyimpan catatan tambahan dari admin.
- **`GET /api/admin/orders/count-new`** — Mengambil jumlah pesanan berstatus `new` untuk penanda lencana notifikasi.

### 3.5 Manajemen Master Data & Pengaturan Toko
- **`GET /api/admin/categories`**, **`POST`**, **`PUT`**, **`DELETE`**
- **`GET /api/admin/motor-types`**, **`POST`**, **`PUT`**, **`DELETE`**
- **`GET /api/admin/settings`**, **`PUT /api/admin/settings`**

