# Asumsi Sistem & Batasan Operasional — PEPSO PARTS

Dokumen ini mendokumentasikan asumsi-asumsi bisnis, batasan teknis, dan keputusan arsitektur yang melandasi perancangan sistem **PEPSO PARTS**.

---

## 1. Domain Bisnis & Karakteristik Barang

1. **Spesialisasi Tunggal (Kawasaki Ninja 2-Tak):**
   - Sistem dikhususkan secara eksklusif untuk ekosistem suku cadang Kawasaki Ninja 150cc 2-Tak (Ninja 150 R, Ninja 150 RR, Ninja 150 SS).
   - Pengelompokan tipe motor tidak mencakup motor 4-tak (Ninja 250, dll.) guna menjaga fokus keotentikan dan pencocokan komponen unik (seperti Super KIPS, blok silinder 1855/1878, karbu PWK/PWL).

2. **Karakteristik Suku Cadang Bekas / Copotan:**
   - Mayoritas barang adalah part copotan motor bekas original bawaan pabrik dengan kondisi unik per unit.
   - Penilaian kondisi menggunakan standardisasi ganda:
     - **Grade Fisik:** `excellent` (Mulus / Siap Pasang), `good` (Bagus / Ada Baret Halus), `fair` (Normal / Perlu Servis Ringan), `poor` (Minus / Bahan Restorasi).
     - **Persentase Keutuhan:** Angka persentase (contoh: 90% atau 95%).
     - **Catatan Minus:** Keterangan transparan (contoh: "ada baret halus pada sirip samping, drat baut aman").
   - Stok barang bekas umumnya berjumlah terbatas (1 hingga 2 unit per barang).

3. **Mekanisme Transaksi & Komunikasi WhatsApp:**
   - Pembelian di Indonesia untuk segmen suku cadang motor hobi sangat mengandalkan negosiasi dan verifikasi visual langsung melalui WhatsApp.
   - Sistem menyediakan fitur Checkout Keranjang otomatis yang menghasilkan nomor pesanan resmi (`PO-YYMMDD-XXXX`), namun konfirmasi pembayaran dan pengiriman diselesaikan via tautan WhatsApp terformat (`wa.me`).

---

## 2. Asumsi Teknis & Arsitektur

1. **Ketiadaan Framework Besar (Native PHP 8.2+):**
   - Backend dirancang murni menggunakan PHP Native (PSR-4 autoloading manual, PDO, Router mandiri).
   - Hal ini bertujuan agar aplikasi memiliki *zero dependency vulnerability*, dapat dijalankan pada cPanel hosting murah sekalipun tanpa kompilasi server-side atau Node.js di server produksi.

2. **Format Gambar Terstandarisasi WebP:**
   - Seluruh foto produk (JPG, PNG, WebP) dikonversi otomatis ke format WebP terkompresi.
   - Menghasilkan dua ukuran: Large (maks 1600px untuk zoom lightbox) dan Thumbnail (maks 400px untuk kartu katalog).
   - Metadata EXIF dibuang seluruhnya demi keamanan dan pengurangan ukuran bandwidth seluler.

3. **Toleransi Typo & Kamus Sinonim Komunitas:**
   - Komunitas motor Ninja 2-Tak sering menggunakan istilah slang/bengkel (misal: "seher" untuk piston, "karbu" untuk karburator, "knalpot" untuk muffler, "blok kips" untuk silinder).
   - Sistem mengimplementasikan kamus sinonim dwiarah (~50 pasang istilah) dan algoritma pencocokan kemiripan kata (*Levenshtein distance* & *similar_text*) dengan ambang batas toleransi $\ge 70\%$.

4. **Arsitektur Dual AI (Mock & Gemini):**
   - Mode default aplikasi adalah `AI_PROVIDER=mock`, yang berfungsi secara mandiri, deterministik, dan bebas kuota internet dengan menganalisis basis data lokal.
   - Mode Google Gemini (`gemini-1.5-flash`) dapat diaktifkan kapan saja melalui konfigurasi `.env`. Jika koneksi API Gemini terganggu, sistem secara otomatis melakukan *graceful fallback* ke `MockProvider` tanpa menyebabkan pesan galat pada pengguna.

---

## 3. Batasan Sistem (Constraints)

1. **Metode Pembayaran Bukan Otomatis Payment Gateway:**
   - Sistem tidak mengintegrasikan Midtrans/Xendit secara langsung untuk menghindari biaya administrasi per transaksi. Pembayaran dilakukan secara transfer bank manual atau COD bengkel.
2. **Kerahasiaan Data & Token Publik:**
   - Pelanggan tidak diwajibkan mendaftar akun/kata sandi (Guest Checkout).
   - Sebagai gantinya, pelacakan pesanan diproteksi oleh *Cryptographic Public Token* 64 karakter acak yang hanya diketahui oleh pembeli saat pesanan dibuat.
