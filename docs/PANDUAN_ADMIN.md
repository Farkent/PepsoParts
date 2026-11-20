# Panduan Administrator — PEPSO PARTS

Panduan ini ditujukan bagi Mas Wahyu Dwi Adrianto dan staf pengelola toko **PEPSO PARTS** untuk mengoperasikan portal administrasi secara optimal.

---

## 1. Masuk ke Portal Admin (Login)

1. Buka peramban (browser) dan akses alamat:
   `http://localhost:5173/admin/login` (atau `https://pepsoparts.com/admin/login` di produksi).
2. Masukkan kredensial administrator:
   - **Email:** `admin@pepsoparts.com`
   - **Kata Sandi:** `AdminNinja2T!`
3. Klik tombol **Masuk ke Portal Admin**.
4. Sistem dilindungi dari percobaan login berulang (maksimal 5 kali salah).

---

## 2. Navigasi Menu Admin

Setelah berhasil masuk, Anda akan melihat panel sisi kiri (*sidebar*) dengan menu navigasi:
- **Ringkasan (Dashboard):** Statistik cepat toko, stok tersedia, barang terjual, dan 5 pesanan terbaru.
- **Katalog Produk:** Daftar seluruh suku cadang, tambah produk, edit, dan hapus.
- **Kelola Stok:** Manajemen cepat stok barang dan sakelar status ketersediaan.
- **Pesanan Masuk:** Daftar order dari pelanggan, verifikasi pembayaran, dan input resi.
- **Laporan:** Rekapitulasi inventaris barang dan laporan penjualan bulanan (ekspor CSV/Excel).
- **Kategori:** Manajemen grup kategori suku cadang.
- **Tipe Motor:** Manajemen varian Ninja (150 R, RR, SS).
- **Pengaturan Toko:** Mengubah nama toko, nomor WhatsApp tujuan, jam operasional, dan ganti kata sandi admin.

---

## 3. Menambah & Mengedit Produk Baru

### Langkah Menambah Produk:
1. Klik menu **Katalog Produk** $\rightarrow$ klik tombol oranye **+ Tambah Produk Baru** di pojok kanan atas.
2. **Kartu 1: Informasi Dasar**
   - **Kategori:** Pilih kategori part (misal: Mesin & Blok).
   - **Kode Produk:** Terisi otomatis oleh sistem (contoh: `PS-MSN-028`). Anda tidak perlu mengetik manual.
   - **Nama Produk:** Tulis nama barang secara jelas (contoh: `Blok Silinder 1855 Gold Ninja RR Original Copotan`).
   - **Nomor Part OEM:** (Opsional) Masukkan kode part pabrik Kawasaki jika ada.
3. **Kartu 2: Kondisi Barang (Transparansi Copotan)**
   - **Grade Kondisi:** Pilih salah satu:
     - `Mulus`: Fisik mendekati baru (95% - 100%).
     - `Bagus`: Ada goresan halus wajar pemakaian (85% - 94%).
     - `Normal`: Berfungsi baik, lecet wajar (75% - 84%).
     - `Minus`: Ada lecet jelas/perlu perbaikan (di bawah 75%).
   - **Persentase (%):** Ketik angka (misal: `95`).
   - **Catatan Kondisi:** Tulis detail fisik secara jujur (contoh: `Sirip blok utuh tidak ada yang patah, lubang baut drat aman`).
4. **Kartu 3: Harga & Inventaris**
   - **Harga Jual (Rp):** Masukkan nominal rupiah (contoh: `3200000`).
   - **Jumlah Stok:** Masukkan kuantitas fisik (misal: `1`).
   - **Status Ketersediaan:** `Tersedia` (Tampil di katalog) atau `Disimpan / Draft`.
5. **Kartu 4: Kompatibilitas Tipe Motor**
   - Centang varian motor yang cocok untuk part ini (Ninja 150 RR, Ninja 150 R, Ninja 150 SS).
6. **Kartu 5: Deskripsi Produk & Fitur AI**
   - Anda dapat menulis deskripsi manual, ATAU:
   - Klik tombol **"⚡ Buat Draf dengan AI"**! Asisten AI akan otomatis merangkai paragraf deskripsi yang menarik, terstruktur, dan persuasif sesuai spesifikasi part.
7. **Kartu 6: Galeri Foto Produk**
   - Unggah satu atau beberapa foto dari kamera/galeri handphone.
   - Sistem secara otomatis mengompresi dan mengubah formatnya menjadi WebP ringan.
   - Klik tanda **Bintang** pada salah satu foto untuk menjadikannya foto utama (cover).
8. Klik tombol **Simpan Produk**.

---

## 4. Memproses Pesanan Pelanggan

Ketika ada pelanggan yang melakukan checkout:
1. Notifikasi badge angka merah akan muncul di menu **Pesanan Masuk**.
2. Klik pesanan terkait untuk membuka halaman **Detail Pesanan**.
3. Periksa rincian item, nomor WhatsApp, dan alamat pengiriman pelanggan.
4. Anda dapat langsung mengklik tombol **"Hubungi via WhatsApp"** untuk membuka percakapan dengan pelanggan.
5. **Memperbarui Status Pesanan:**
   - Ubah status menjadi `Diproses (Confirmed)` setelah pembeli mentransfer dana pembayaran.
   - Masukkan nomor resi ekspedisi pada kotak **Catatan Internal / Resi**, lalu klik **Simpan Catatan**.
   - Ubah status menjadi `Selesai (Completed)` setelah barang diterima oleh pembeli.
   - Jika pesanan dibatalkan, pilih `Batalkan (Cancelled)`: **Stok barang yang sebelumnya terkunci akan otomatis dikembalikan ke katalog!**

---

## 5. Mengunduh Laporan ke Excel (CSV Export)

1. Buka menu **Laporan**.
2. **Tab Laporan Stok:**
   - Menampilkan total aset inventaris toko dan barang yang menipis.
   - Klik tombol **"Ekspor CSV"** untuk mengunduh rekap stok ke Excel.
3. **Tab Laporan Penjualan:**
   - Pilih rentang tanggal (**Dari Tanggal** dan **Sampai Tanggal**).
   - Klik tombol **"Filter"**.
   - Sistem akan menampilkan total omset penjualan, total pesanan, dan rata-rata transaksi.
   - Klik tombol **"Ekspor CSV"** untuk mencetak file Excel siap pembukuan (menggunakan format separator titik koma `;` standar Excel Indonesia).

---

## 6. Mengamankan Akun Admin

Untuk keamanan toko:
1. Buka menu **Pengaturan Toko** $\rightarrow$ gulir ke bawah pada bagian **Ganti Kata Sandi**.
2. Masukkan kata sandi saat ini, lalu masukkan kata sandi baru (minimal 8 karakter kombinasi huruf dan angka).
3. Klik **Perbarui Kata Sandi**.
4. Selalu klik tombol **Keluar (Logout)** di sudut kiri bawah sidebar jika selesai menggunakan komputer bersama.

