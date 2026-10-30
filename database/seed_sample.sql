-- ==============================================================================
-- PEPSO PARTS - Sample Seed Data
-- PERHATIAN: Hapus atau reset sebelum rilis produksi (go-live)
-- ==============================================================================

SET NAMES utf8mb4;
SET time_zone = '+07:00';
SET foreign_key_checks = 0;

TRUNCATE TABLE `order_items`;
TRUNCATE TABLE `orders`;
TRUNCATE TABLE `product_images`;
TRUNCATE TABLE `product_motor_types`;
TRUNCATE TABLE `products`;
TRUNCATE TABLE `motor_types`;
TRUNCATE TABLE `categories`;
TRUNCATE TABLE `settings`;

-- 1. Kategori (5 kategori)
INSERT INTO `categories` (`id`, `name`, `slug`, `code`, `sort_order`, `is_active`) VALUES
(1, 'Mesin', 'mesin', 'MSN', 1, 1),
(2, 'Kelistrikan', 'kelistrikan', 'KLK', 2, 1),
(3, 'Bodi', 'bodi', 'BDI', 3, 1),
(4, 'Kaki-Kaki', 'kaki-kaki', 'KKI', 4, 1),
(5, 'Aksesori', 'aksesori', 'AKS', 5, 1);

-- 2. Tipe Motor Kawasaki Ninja 2-Tak
INSERT INTO `motor_types` (`id`, `name`, `slug`, `year_from`, `year_to`, `notes`, `is_active`) VALUES
(1, 'Ninja R 150', 'ninja-r-150', 1996, 2015, 'Tipe naked/standar lampu bulat atau barong', 1),
(2, 'Ninja RR 150', 'ninja-rr-150', 2002, 2015, 'Tipe full fairing (Old RR / New RR ZX150)', 1),
(3, 'Ninja SS 150', 'ninja-ss-150', 2012, 2015, 'Varian lampu bulat tangki dan bodi mirip Ninja R', 1);

-- 3. Settings Toko
INSERT INTO `settings` (`setting_key`, `setting_value`) VALUES
('store_name', 'PEPSO PARTS'),
('whatsapp_number', '6281234567890'),
('about_text', 'PEPSO PARTS adalah penyedia spesialis sparepart bekas copotan original Kawasaki Ninja 2-Tak (Ninja R, Ninja RR, Ninja SS). Telah beroperasi lebih dari 2 tahun memberikan solusi part berkualitas, terverifikasi kondisi fisik dan fungsionalnya, dengan kejujuran spesifikasi.'),
('address', 'Jl. Sukarno Hatta No. 99, Malang, Jawa Timur'),
('opening_hours', 'Senin - Sabtu: 08:30 - 17:00 WIB (Minggu Libur)'),
('facebook_url', 'https://facebook.com/marketplace/profile/pepsoparts'),
('shopee_url', 'https://shopee.co.id/pepsoparts');

-- 4. Produk Contoh (14 Produk Kawasaki Ninja 2-Tak)
INSERT INTO `products` (`id`, `code`, `slug`, `name`, `category_id`, `description`, `condition_grade`, `condition_percent`, `condition_note`, `price`, `stock`, `status`, `compat_notes`, `sold_at`) VALUES
-- 1. Blok Seher Ninja RR
(1, 'PS-MSN-024', 'blok-seher-ninja-rr-original-1855', 'Blok Seher Ninja RR Original Seri 1855', 1, 
 'Blok silinder copotan Ninja RR kode 1855 original Kawasaki. Boring liner masih asli belum overbos/OB, lubang KIPS normal lancar tanpa macet. Sirip utuh tidak ada retak atau patah.', 
 'good', 85, 'Boring mulus no baret, KIPS lancar', 1250000, 1, 'available', 'Khusus Ninja RR 150. Lubang baut knalpot dan porting berbeda dengan Ninja R Super KIPS lama.', NULL),

-- 2. Blok Seher Ninja R (Pasangan perbandingan)
(2, 'PS-MSN-025', 'blok-seher-ninja-r-super-kips-1878', 'Blok Seher Ninja R Super KIPS Seri 1878', 1,
 'Blok seher original seri 1878 untuk Ninja R / SS Super KIPS. Kondisi standar belum sok/OB, dinding silinder masih halus siap pasang.',
 'good', 80, 'Belum OB, ada tanda pemakaian wajar', 950000, 1, 'available', 'Cocok untuk Ninja R dan Ninja SS. Bisa dipasang ke Ninja RR tapi posisi leher knalpot perlu penyesuaian bracket.', NULL),

-- 3. CDI Ninja R Super Kips
(3, 'PS-KLK-011', 'cdi-ninja-r-super-kips-original', 'CDI Ninja R Super Kips Original Denso', 2,
 'Unit CDI original bawaan motor Ninja R Super KIPS kode 1535. Pengapian stabil, soket utuh tidak ada kabel jumperan, arus normal sudah ditest.',
 'good', 80, 'Pengapian normal joss, kabel utuh', 675000, 2, 'available', 'Khusus Ninja R / SS Super Kips. TIDAK COCOK untuk Ninja RR yang memakai CDI 1454 atau Ninja R non-KIPS.', NULL),

-- 4. CDI Ninja RR Denso 1454 (Pasangan perbandingan)
(4, 'PS-KLK-012', 'cdi-ninja-rr-denso-1454-original', 'CDI Ninja RR Denso 1454 Original Copotan', 2,
 'CDI legendaris Ninja RR Old 1454 original Denso Japan. Kurva pengapian galak di rpm atas, servo KIPS buka presisi.',
 'excellent', 95, 'Sangat mulus istimewa, KIPS servo aktif', 1850000, 1, 'available', 'Khusus Ninja RR 150 (Old RR maupun New RR). Soket berbeda dengan Ninja R.', NULL),

-- 5. Karburator Keihin PWL 26 (Terjual)
(5, 'PS-MSN-026', 'karburator-keihin-pwl-26-ninja-r-original', 'Karburator Keihin PWL 26 Ninja R Original', 1,
 'Karburator copotan Ninja R Keihin PWL 26. Skep mulus no baret, cuk normal, langsam stabil.',
 'good', 85, 'Skep aman, langsam enak', 550000, 0, 'sold', 'Standar Ninja R 150. Bisa diaplikasikan ke motor 2T lain dengan penyesuaian intake.', '2026-10-25 10:15:00'),

-- 6. Knalpot Standar Bobokan Ninja RR
(6, 'PS-MSN-027', 'knalpot-standar-ninja-rr-bobok-adem', 'Knalpot Standar Ninja RR Bobok Adem', 1,
 'Perut knalpot original Ninja RR sudah bobokan adem gurih. Suara KIPS teriak padat, leher aman belum penyok.',
 'fair', 75, 'Cat ulang tahan panas, suara padat', 600000, 1, 'available', 'Bracket dan dudukan khusus rangka Ninja RR.', NULL),

-- 7. Spul Magnet Ninja R
(7, 'PS-KLK-013', 'spul-magnet-ninja-r-original-mitsuba', 'Spul Magnet Ninja R Original Mitsuba', 2,
 'Satu set spul dan magnet pengapian copotan motor Ninja R. Gulungan tembaga mulus pabrik, magnet tidak gompal.',
 'good', 80, 'Arus pengisian dan lampu stabil', 420000, 1, 'available', 'PNP ke Ninja R dan Ninja SS.', NULL),

-- 8. Kiprok Ninja RR Original SH640
(8, 'PS-KLK-014', 'kiprok-regulator-ninja-rr-original-sh640', 'Kiprok Regulator Ninja RR Original Shindengen SH640', 2,
 'Regulator rectifier original Shindengen SH640 Ninja RR. Pengisian aki normal anti overcharge, soket 5 pin mulus.',
 'excellent', 90, 'Voltase pengisian stabil 14.2V', 350000, 1, 'available', 'Standar Ninja RR 150. Menghindari aki tekor atau servo KIPS error.', NULL),

-- 9. Fairing Atas Ninja RR Hijau
(9, 'PS-BDI-001', 'fairing-atas-ninja-rr-new-hijau-original', 'Fairing Atas Ninja RR New Hijau Original', 3,
 'Batok fairing atas original Kawasaki Ninja RR New warna hijau metalik. Dudukan baut dan kupingan utuh, ada lecet pemakaian minor.',
 'fair', 70, 'Ada lecet halus sudut kanan, dudukan utuh', 450000, 1, 'available', 'Khusus rangka fairing Ninja RR New 150.', NULL),

-- 10. Tangki Bensin Ninja R Hitam (Terjual)
(10, 'PS-BDI-002', 'tangki-bensin-ninja-r-hitam-original', 'Tangki Bensin Ninja R Hitam Original', 3,
 'Tangki bensin copotan Ninja R warna hitam striping orisinil. Dalam tangki bersih sudah dibersihkan karat, no bocor/rembes.',
 'fair', 75, 'Cat orisinil ada baret wajar, tidak bocor', 500000, 0, 'sold', 'Cocok untuk Ninja R dan Ninja SS rangka bulat/kotak.', '2026-10-27 14:00:00'),

-- 11. Shockbreaker Belakang Showa Ninja RR
(11, 'PS-KKI-001', 'shock-belakang-ninja-rr-original-showa', 'Shockbreaker Belakang Ninja RR Original Showa', 4,
 'Monoshock Showa original copotan Ninja RR. Rebound empuk dan normal, as mulus tidak baret atau bocor oli.',
 'good', 85, 'Rebound aktif, no rembes oli', 750000, 1, 'available', 'Ukuran panjang dan dudukan pro-link khusus Ninja RR.', NULL),

-- 12. Velg Enkei Ninja R Depan Belakang
(12, 'PS-KKI-002', 'velg-palang-3-enkei-ninja-r-original', 'Velg Bintang Palang 3 Enkei Ninja R Original Set', 4,
 'Sepasang velg depan-belakang Enkei original Ninja R ring 17-18. Bibir velg lempeng no geol, rumah bearing rapat.',
 'good', 85, 'Lempeng no geol, cat bawaan pabrik', 1100000, 1, 'available', 'Depan tromol disc kecil, belakang tromol Ninja R.', NULL),

-- 13. Behel Belakang Ninja R Original
(13, 'PS-AKS-001', 'behel-belakang-ninja-r-original-kawasaki', 'Behel Belakang Ninja R Original Kawasaki', 5,
 'Behel pegangan belakang original Ninja R. Bahan kokoh aluminium cor bawaan pabrik, drat baut aman.',
 'excellent', 90, 'Cat mulus, drat baut aman no selek', 180000, 3, 'available', 'Cocok untuk Ninja R dan SS.', NULL),

-- 14. Tutup KIPS CNC Ninja 150 R/RR
(14, 'PS-AKS-002', 'tutup-kips-cnc-ninja-150-r-rr-ss', 'Tutup Blok KIPS CNC Duralium Ninja 150 R / RR / SS', 5,
 'Cover tutup mekanisme Super KIPS bahan dural CNC finishing anodize rapi. Dilengkapi seal karet baru anti bocor oli samping.',
 'excellent', 95, 'Baru pakai sebentar, seal karet baru', 1250000, 4, 'available', 'Universal PNP untuk semua Kawasaki Ninja 150 2-Tak (R, RR, SS).', NULL);

-- 5. Relasi Produk dengan Tipe Motor (product_motor_types)
INSERT INTO `product_motor_types` (`product_id`, `motor_type_id`, `is_primary`) VALUES
-- Blok RR (hanya RR)
(1, 2, 1),
-- Blok R (Ninja R utama, SS cocok)
(2, 1, 1),
(2, 3, 0),
-- CDI Ninja R (Ninja R utama, SS cocok)
(3, 1, 1),
(3, 3, 0),
-- CDI Ninja RR (hanya RR)
(4, 2, 1),
-- Karbu PWL 26 (Ninja R utama, SS cocok)
(5, 1, 1),
(5, 3, 0),
-- Knalpot RR
(6, 2, 1),
-- Spul Magnet R & SS
(7, 1, 1),
(7, 3, 0),
-- Kiprok RR
(8, 2, 1),
-- Fairing RR
(9, 2, 1),
-- Tangki R & SS
(10, 1, 1),
(10, 3, 0),
-- Shock RR
(11, 2, 1),
-- Velg Ninja R
(12, 1, 1),
-- Behel Ninja R & SS
(13, 1, 1),
(13, 3, 0),
-- Tutup KIPS CNC (Universal semua Ninja 150)
(14, 1, 1),
(14, 2, 0),
(14, 3, 0);

-- 6. Placeholder Gambar Lokal
INSERT INTO `product_images` (`product_id`, `path`, `thumb_path`, `sort_order`, `is_primary`) VALUES
(1, '/uploads/sample_mesin_1.svg', '/uploads/sample_mesin_1.svg', 1, 1),
(2, '/uploads/sample_mesin_2.svg', '/uploads/sample_mesin_2.svg', 1, 1),
(3, '/uploads/sample_kelistrikan_1.svg', '/uploads/sample_kelistrikan_1.svg', 1, 1),
(4, '/uploads/sample_kelistrikan_2.svg', '/uploads/sample_kelistrikan_2.svg', 1, 1),
(5, '/uploads/sample_mesin_3.svg', '/uploads/sample_mesin_3.svg', 1, 1),
(6, '/uploads/sample_mesin_4.svg', '/uploads/sample_mesin_4.svg', 1, 1),
(7, '/uploads/sample_kelistrikan_3.svg', '/uploads/sample_kelistrikan_3.svg', 1, 1),
(8, '/uploads/sample_kelistrikan_4.svg', '/uploads/sample_kelistrikan_4.svg', 1, 1),
(9, '/uploads/sample_bodi_1.svg', '/uploads/sample_bodi_1.svg', 1, 1),
(10, '/uploads/sample_bodi_2.svg', '/uploads/sample_bodi_2.svg', 1, 1),
(11, '/uploads/sample_kaki_1.svg', '/uploads/sample_kaki_1.svg', 1, 1),
(12, '/uploads/sample_kaki_2.svg', '/uploads/sample_kaki_2.svg', 1, 1),
(13, '/uploads/sample_aksesori_1.svg', '/uploads/sample_aksesori_1.svg', 1, 1),
(14, '/uploads/sample_aksesori_2.svg', '/uploads/sample_aksesori_2.svg', 1, 1);

SET foreign_key_checks = 1;

