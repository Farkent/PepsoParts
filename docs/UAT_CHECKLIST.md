# Lembar Pengujian Penerimaan Pengguna (UAT Checklist) — PEPSO PARTS

Daftar periksa ini digunakan oleh tim pengembang (SeptClouds) dan pemilik bisnis (Mas Wahyu Dwi Adrianto) untuk memverifikasi seluruh fungsi aplikasi sebelum peluncuran resmi.

---

## 1. Modul Publik & Pembeli (Catalog & Checkout)

| No | Skenario Pengujian | Langkah Pengujian | Hasil yang Diharapkan | Status |
| :--- | :--- | :--- | :--- | :---: |
| 1.1 | **Navigasi Beranda** | Akses halaman utama `/` | Banner toko, statistik ringkas, filter kategori, dan kartu produk tampil rapi. | [x] Lulus |
| 1.2 | **Pencarian Kata Kunci Biasa** | Ketik "karburator" di input cari | Menampilkan produk karburator Keihin PWK/PWL. | [x] Lulus |
| 1.3 | **Pencarian Sinonim Slang** | Ketik "seher" di input cari | Menampilkan produk Blok Silinder & Piston (sinonim bekerja). | [x] Lulus |
| 1.4 | **Toleransi Kesalahan Ketik (Typo)** | Ketik "knlpot" atau "karbu" | Menampilkan knalpot / karburator yang relevan. | [x] Lulus |
| 1.5 | **Filter Tipe Motor** | Pilih tombol filter "Ninja 150 RR" | Katalog hanya menampilkan barang yang kompatibel dengan Ninja RR. | [x] Lulus |
| 1.6 | **Filter Kondisi & Harga** | Geser rentang harga dan pilih grade "Mulus" | Barang terfilter sesuai kriteria harga dan grade. | [x] Lulus |
| 1.7 | **Halaman Detail Produk** | Klik salah satu kartu barang | Tampil galeri gambar, zoom lightbox, badge grade, catatan minus, dan tombol aksi. | [x] Lulus |
| 1.8 | **Cek Kompatibilitas Motor Interaktif** | Pada detail produk, klik salah satu tombol tipe motor | Menampilkan lencana hijau "Cocok PNP" atau peringatan tidak cocok secara instan. | [x] Lulus |
| 1.9 | **Rekomendasi Produk Terkait** | Gulir ke bawah di halaman detail produk | Menampilkan hingga 4 rekomendasi barang kategori lain yang cocok untuk motor yang sama. | [x] Lulus |
| 1.10 | **Keranjang Belanja** | Klik "Tambah ke Keranjang", lalu buka `/keranjang` | Barang masuk keranjang, jumlah qty dapat diubah, subtotal terhitung otomatis. | [x] Lulus |
| 1.11 | **Formulir Checkout & WhatsApp** | Isi nama, WhatsApp `0812...`, alamat, lalu submit | Pesanan `PO-YYMMDD-XXXX` terbuat, diarahkan ke pelacakan & tombol chat WhatsApp terbuka dengan pesan terformat rapi. | [x] Lulus |
| 1.12 | **Pelacakan Pesanan Publik** | Buka URL `/pesanan/PO-XXXXXX?token=...` | Status pesanan, estimasi, dan rincian item tampil dengan token rahasia. | [x] Lulus |
| 1.13 | **Asisten Percakapan AI (Floating Chat)** | Klik ikon chat melayang di kanan bawah | Chatbot menyapa ramah khas komunitas 2T, memberikan rekomendasi part dan tombol WhatsApp. | [x] Lulus |

---

## 2. Modul Portal Administrator (Admin Portal)

| No | Skenario Pengujian | Langkah Pengujian | Hasil yang Diharapkan | Status |
| :--- | :--- | :--- | :--- | :---: |
| 2.1 | **Proteksi Login & Brute-force** | Akses `/admin/login`, coba salah 5x | Sistem mengunci dengan pesan "Terlalu banyak percobaan login". | [x] Lulus |
| 2.2 | **Login Admin Berhasil** | Masukkan email & password benar | Masuk ke dashboard, cookie sesi terbuat, token CSRF aktif. | [x] Lulus |
| 2.3 | **Dashboard Metrik** | Buka menu Ringkasan | Kartu metrik total produk, stok, barang terjual, dan tabel 5 pesanan terbaru tampil akurat. | [x] Lulus |
| 2.4 | **Kode Barang Otomatis** | Buka form Tambah Produk, pilih kategori Mesin | Kode terisi otomatis `PS-MSN-XXX` dengan nomor urut berikutnya. | [x] Lulus |
| 2.5 | **Draf Deskripsi AI** | Isi nama part, klik "⚡ Buat Draf dengan AI" | Kotak deskripsi otomatis terisi teks profesional dan persuasif. | [x] Lulus |
| 2.6 | **Multi-upload Foto WebP** | Unggah beberapa gambar JPG/PNG | Gambar otomatis di-convert ke WebP, dapat diset foto utama (cover). | [x] Lulus |
| 2.7 | **Kelola Cepat Stok** | Buka menu Kelola Stok, klik tombol `+` atau `-` | Kuantitas stok berubah seketika; jika stok 0, status otomatis jadi `Terjual`. | [x] Lulus |
| 2.8 | **Manajemen Pesanan Masuk** | Buka menu Pesanan, ubah status pesanan ke `Confirmed` | Status tersimpan; notifikasi status terbarui di halaman publik pelanggan. | [x] Lulus |
| 2.9 | **Pembatalan Order & Restorasi Stok** | Batalkan pesanan yang berstatus `Confirmed` | Stok barang otomatis bertambah kembali ke database. | [x] Lulus |
| 2.10 | **Ekspor Laporan Stok & Penjualan** | Buka menu Laporan, klik tombol "Ekspor CSV" | File CSV terunduh dengan separator titik koma `;` dan karakter UTF-8 terbaca sempurna di Excel. | [x] Lulus |
| 2.11 | **Ganti Kata Sandi** | Buka Pengaturan Toko, ubah password admin | Password baru terenkripsi Bcrypt; login berikutnya wajib menggunakan password baru. | [x] Lulus |
| 2.12 | **Logout Aman** | Klik tombol Keluar di sidebar | Sesi dihancurkan, dialihkan ke halaman login, rute `/admin` tidak dapat diakses kembali. | [x] Lulus |

---

## 3. Pengujian Non-Fungsional (Keamanan & Kinerja)

| No | Aspek Pengujian | Kriteria Lulus | Status |
| :--- | :--- | :--- | :---: |
| 3.1 | **Pencegahan SQL Injection** | Seluruh masukan `q`, `category_id`, payload POST memakai PDO parameter binding. | [x] Lulus |
| 3.2 | **Perlindungan CSRF** | Header `X-CSRF-Token` dicek ketat pada seluruh aksi POST/PUT/PATCH/DELETE admin. | [x] Lulus |
| 3.3 | **Folder Upload Terisolasi** | Eksekusi file skrip di dalam `/uploads` diblokir via `.htaccess`. | [x] Lulus |
| 3.4 | **Responsivitas Perangkat Seluler** | Tampilan responsive 100% pada layar smartphone (360px - 414px) hingga desktop monitor (1920px). | [x] Lulus |
| 3.5 | **Kecepatan Build Frontend** | Kompilasi Vite SPA di bawah 10 detik tanpa peringatan error. | [x] Lulus |

