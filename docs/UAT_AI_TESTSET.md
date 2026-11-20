# Kumpulan Kasus Uji Fitur AI (AI Test Set) — PEPSO PARTS

Dokumen ini berisi kumpulan skenario uji khusus untuk mengevaluasi keakuratan, ketahanan, dan etika asisten kecerdasan buatan (AI) pada aplikasi **PEPSO PARTS** baik dalam mode `MockProvider` (Offline) maupun `GeminiProvider` (Online).

---

## 1. Skenario Uji Percakapan Pelanggan (Chat Assistant)

### Uji 1.1: Sapaan Ramah Komunitas 2-Tak
- **Input Pengguna:** `"Halo bang, ada part ninja rr?"`
- **Motor Terpilih:** `Ninja 150 RR`
- **Ekspektasi Output:**
  - AI membalas dengan nada hangat dan santai khas penghobi Ninja 2-Tak ("Halo Bro...").
  - Menampilkan rekomendasi suku cadang terkait Ninja RR (Blok seher, knalpot, karburator).
  - Menyediakan chip balasan cepat (*Quick Replies*).
- **Status:** ✅ Lulus

### Uji 1.2: Pertanyaan Lokasi Toko & Jam Buka
- **Input Pengguna:** `"Lokasi bengkel di mana mas? Buka hari apa aja?"`
- **Ekspektasi Output:**
  - Menjelaskan lokasi bengkel: Area Sentul, Babakan Madang, Kabupaten Bogor (Dekat Sirkuit Sentul).
  - Menyebutkan jam buka: Senin - Sabtu 09.00 - 17.00 WIB.
  - Memberikan opsi chat langsung ke WhatsApp admin.
- **Status:** ✅ Lulus

### Uji 1.3: Pencarian Suku Cadang Spesifik
- **Input Pengguna:** `"Cari blok seher kode 1855 gold"`
- **Ekspektasi Output:**
  - AI mengenali intent pencarian barang dan mengambil data riil dari tabel `products`.
  - Mengembalikan kartu produk `Blok Silinder Super KIPS 1855 Gold Edition` lengkap dengan harga, foto, dan status ketersediaan.
- **Status:** ✅ Lulus

### Uji 1.4: Pertanyaan di Luar Lingkup (Out of Scope Guardrail)
- **Input Pengguna:** `"Jual sparepart motor matic Yamaha Mio ga mas?"`
- **Ekspektasi Output:**
  - AI dengan sopan menjelaskan bahwa PEPSO PARTS khusus melayani spesialis suku cadang original Kawasaki Ninja 150 2-Tak (R, RR, SS).
  - Tidak memberikan informasi ngawur/halusinasi tentang motor lain.
- **Status:** ✅ Lulus

---

## 2. Skenario Uji Pencocokan & Kompatibilitas Motor (Compatibility)

### Uji 2.1: Part PNP Kompatibel
- **Input:** `Product ID = 1` (Blok Silinder Super KIPS 1855), `Motor Slug = "ninja-rr"`
- **Ekspektasi Output:**
  - `compatible: true`
  - Pesan konfirmasi: "Blok silinder ini cocok untuk Kawasaki Ninja 150 RR (Super KIPS)."
- **Status:** ✅ Lulus

### Uji 2.2: Part Lintas Varian (Ninja R vs Ninja RR)
- **Input:** Knalpot Kolong Ninja R pada motor Ninja RR
- **Ekspektasi Output:**
  - AI memberikan catatan bahwa dudukan braket perut knalpot atau fairing bawah mungkin memerlukan penyesuaian khusus.
- **Status:** ✅ Lulus

---

## 3. Skenario Uji Pembuat Draf Deskripsi Admin (Product Description Generator)

### Uji 3.1: Draf Blok Silinder Copotan
- **Input:**
  - Nama Produk: `"Blok Silinder 1855 Gold Ninja RR"`
  - Kategori: `"Mesin & Blok"`
  - Catatan: `"Kondisi 95%, sirip utuh, lubang baut aman, belum obsh/standar pabrik"`
- **Ekspektasi Output:**
  - Teks terstruktur mencakup:
    - Judul & pembuka persuasif.
    - Poin spesifikasi teknis dan keaslian part copotan.
    - Catatan kondisi riil dan jaminan keutuhan drat.
    - Himbauan konsultasi via WhatsApp sebelum order.
- **Status:** ✅ Lulus

---

## 4. Uji Ketahanan Jaringan & Fallback (Resilience Test)

### Uji 4.1: Simulasi Gangguan Koneksi Google Gemini API
- **Kondisi:** Konfigurasi `.env` menggunakan `AI_PROVIDER=gemini` dengan kunci API sengaja disimulasikan bermasalah atau kuota habis (HTTP 429 / cURL timeout).
- **Langkah:** Klien mengirim request `POST /api/ai/chat`.
- **Ekspektasi Sistem:**
  - Sistem tidak melempar Exception HTTP 500 ke pengguna.
  - `AiService` secara instan menangkap galat dan mengalihkan pemrosesan ke `MockProvider`.
  - Tabel `ai_usage_logs` mencatat status `fallback_mock`.
  - Pengguna tetap menerima balasan obrolan tanpa ada gangguan layanan.
- **Status:** ✅ Lulus (Arsitektur Adapter Terverifikasi)

