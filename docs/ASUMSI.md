# Catatan Asumsi Proyek: PEPSO PARTS

Dokumen ini mencatat asumsi-asumsi teknis dan fungsional yang diambil selama pengerjaan proyek PEPSO PARTS sesuai panduan Bagian 3 Aturan 3.

---

### 1. Lingkungan Pengembangan Windows & XAMPP
- **PHP Binary:** Lokasi default PHP di sistem pengguna adalah `C:\xampp\php\php.exe` (PHP 8.2.12).
- **Ekstensi GD & PDO:** Ekstensi `extension=gd` telah diaktifkan di `C:\xampp\php\php.ini` untuk pemrosesan resize foto dan konversi WebP.
- **Port Layanan Dev:** Backend PHP CLI server berjalan pada port `8000` (`http://127.0.0.1:8000`), dan Vite Frontend berjalan pada port `5173` (`http://127.0.0.1:5173`). Vite bertindak sebagai reverse-proxy untuk `/api` dan `/uploads`.

### 2. Autoloader PHP Mandiri
- Mengingat tidak semua komputer lokal klien memiliki Composer global yang terpasang di PATH, autoloader PSR-4 mandiri (`backend/src/Autoload.php`) disertakan langsung dalam kode sumber. Autoloader ini memetakan namespace `Pepso\` ke direktori `backend/src/` secara otomatis tanpa ketergantungan composer dump-autoload. File `composer.json` tetap disediakan untuk kompatibilitas standar.

### 3. Normalisasi WhatsApp & Format Rupiah
- Format nomor telepon pelanggan dan pemilik dinormalisasi secara otomatis menjadi awalan internasional `628xxxxxxxx` pada saat pembuatan tautan `wa.me`.
- Format mata uang menggunakan Rupiah Indonesia tanpa angka desimal/sen, misal `Rp1.250.000`, menggunakan pemisah titik ribuan khas Indonesia.

### 4. Mode AI Default (Mock Provider)
- Default konfigurasi di `.env` adalah `AI_PROVIDER=mock`. Hal ini menjamin bahwa seluruh fitur AI (Chat, Smart Search, Pengecekan Kecocokan, Rekomendasi Terkait, Pembuat Deskripsi) dapat diuji dan diverifikasi secara 100% deterministik dan bebas biaya tanpa membutuhkan API key eksternal.
- Ketika API key Gemini disuplai, sistem cukup mengubah `AI_PROVIDER=gemini` tanpa perubahan kode.

### 5. Aturan Ketersediaan & Soft Delete
- Produk dengan `stock = 0` otomatis berstatus `sold`.
- Penghapusan produk bersifat soft-delete (`deleted_at`), dan backend menolak penghapusan produk jika masih terdapat pesanan aktif (`new` atau `confirmed`) yang memuat produk tersebut.
