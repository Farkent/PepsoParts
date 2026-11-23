-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 20, 2026 at 07:18 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `pepso_parts`
--

-- --------------------------------------------------------

--
-- Table structure for table `admins`
--

CREATE TABLE `admins` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `last_login_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `admins`
--

INSERT INTO `admins` (`id`, `name`, `email`, `password_hash`, `last_login_at`, `created_at`, `updated_at`) VALUES
(1, 'Admin PEPSO PARTS (Wahyu Dwi Adrianto)', 'admin@pepsoparts.com', '$2y$12$iIiubViUvTfwmvrvQNy7lOLnk0aOzrPrVx.g9YrETE9bt1GOS0BM6', '2026-11-01 15:05:18', '2026-10-30 16:18:37', '2026-11-01 15:05:18');

-- --------------------------------------------------------

--
-- Table structure for table `ai_cache`
--

CREATE TABLE `ai_cache` (
  `cache_key` varchar(100) NOT NULL,
  `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`payload`)),
  `expires_at` datetime NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `ai_cache`
--

INSERT INTO `ai_cache` (`cache_key`, `payload`, `expires_at`, `created_at`) VALUES
('chat_3df9a08465a08ab402dc718d90feab88', '{\"text\":\"Part yang kamu maksud saat ini belum ada di etalase web Bro, atau sedang dalam proses sortir di bengkel. Silakan chat langsung ke Mas Wahyu via WhatsApp untuk pre-order atau cek ketersediaan copotan unit baru!\",\"suggested_products\":[],\"quick_replies\":[\"Chat WhatsApp Owner\",\"Lihat Blok & Boring\",\"Lihat Knalpot Ready\"],\"fallback_to_whatsapp\":true}', '2026-11-01 09:59:14', '2026-11-01 14:59:14'),
('chat_9c00fe1d54f6a244fae7c04ee1265642', '{\"text\":\"Part yang kamu maksud saat ini belum ada di etalase web Bro, atau sedang dalam proses sortir di bengkel. Silakan chat langsung ke Mas Wahyu via WhatsApp untuk pre-order atau cek ketersediaan copotan unit baru!\",\"suggested_products\":[],\"quick_replies\":[\"Chat WhatsApp Owner\",\"Lihat Blok & Boring\",\"Lihat Knalpot Ready\"],\"fallback_to_whatsapp\":true}', '2026-11-19 20:58:52', '2026-11-20 01:58:05'),
('compat_1_ninja-rr', '{\"compatible\":false,\"product_name\":\"Blok Seher Ninja RR Original Seri 1855\",\"motor_name\":\"Kawasaki Ninja 150 RR\",\"explanation\":\"Kurang cocok \\/ tidak langsung PNP untuk Kawasaki Ninja 150 RR. Produk ini terdata khusus untuk: Ninja RR 150.\",\"notes\":\"Khusus Ninja RR 150. Lubang baut knalpot dan porting berbeda dengan Ninja R Super KIPS lama.\"}', '2026-11-20 19:58:05', '2026-11-20 01:58:05'),
('search_802d83b90e1584c6ff2ca83efea43f00', '{\"intent\":\"catalog_search\",\"detected_category\":null,\"detected_motor\":null,\"products\":[{\"id\":6,\"code\":\"PS-MSN-027\",\"name\":\"Knalpot Standar Ninja RR Bobok Adem\",\"slug\":\"knalpot-standar-ninja-rr-bobok-adem\",\"price\":600000,\"stock\":1,\"status\":\"available\",\"condition\":\"fair\",\"primary_image\":null},{\"id\":2,\"code\":\"PS-MSN-025\",\"name\":\"Blok Seher Ninja R Super KIPS Seri 1878\",\"slug\":\"blok-seher-ninja-r-super-kips-1878\",\"price\":950000,\"stock\":1,\"status\":\"available\",\"condition\":\"good\",\"primary_image\":null}],\"explanation\":\"Ditemukan 2 sparepart sesuai kata kunci \'knalpot standar\'\"}', '2026-11-01 09:29:14', '2026-11-01 14:59:14');

-- --------------------------------------------------------

--
-- Table structure for table `ai_usage_logs`
--

CREATE TABLE `ai_usage_logs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `feature` varchar(50) NOT NULL,
  `status` varchar(20) NOT NULL,
  `ip_hash` varchar(64) NOT NULL,
  `latency_ms` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `ai_usage_logs`
--

INSERT INTO `ai_usage_logs` (`id`, `feature`, `status`, `ip_hash`, `latency_ms`, `created_at`) VALUES
(1, 'chat', 'error', '12ca17b49af2289436f303e0166030a21e525d266e209267433801a8fd4071a0', 39, '2026-11-01 14:57:15'),
(2, 'chat', 'success', '12ca17b49af2289436f303e0166030a21e525d266e209267433801a8fd4071a0', 69, '2026-11-01 14:59:14'),
(3, 'search', 'success', '12ca17b49af2289436f303e0166030a21e525d266e209267433801a8fd4071a0', 38, '2026-11-01 14:59:14'),
(4, 'describe_product', 'success', '12ca17b49af2289436f303e0166030a21e525d266e209267433801a8fd4071a0', 0, '2026-11-01 14:59:14'),
(5, 'chat', 'success', '12ca17b49af2289436f303e0166030a21e525d266e209267433801a8fd4071a0', 15, '2026-11-20 01:58:05'),
(6, 'compatibility', 'success', '12ca17b49af2289436f303e0166030a21e525d266e209267433801a8fd4071a0', 2, '2026-11-20 01:58:05'),
(7, 'describe_product', 'success', '12ca17b49af2289436f303e0166030a21e525d266e209267433801a8fd4071a0', 0, '2026-11-20 01:58:05'),
(8, 'chat', 'success', '12ca17b49af2289436f303e0166030a21e525d266e209267433801a8fd4071a0', 4, '2026-11-20 01:58:52'),
(9, 'describe_product', 'success', '12ca17b49af2289436f303e0166030a21e525d266e209267433801a8fd4071a0', 0, '2026-11-20 01:58:52');

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(100) NOT NULL,
  `slug` varchar(100) NOT NULL,
  `code` varchar(3) NOT NULL COMMENT 'Kode 3 huruf: MSN, KLK, BDI, KKI, AKS',
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `name`, `slug`, `code`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Mesin', 'mesin', 'MSN', 1, 1, '2026-10-30 16:15:05', '2026-10-30 16:15:05'),
(2, 'Kelistrikan', 'kelistrikan', 'KLK', 2, 1, '2026-10-30 16:15:05', '2026-10-30 16:15:05'),
(3, 'Bodi', 'bodi', 'BDI', 3, 1, '2026-10-30 16:15:05', '2026-10-30 16:15:05'),
(4, 'Kaki-Kaki', 'kaki-kaki', 'KKI', 4, 1, '2026-10-30 16:15:05', '2026-10-30 16:15:05'),
(5, 'Aksesori', 'aksesori', 'AKS', 5, 1, '2026-10-30 16:15:05', '2026-10-30 16:15:05');

-- --------------------------------------------------------

--
-- Table structure for table `motor_types`
--

CREATE TABLE `motor_types` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(100) NOT NULL,
  `slug` varchar(100) NOT NULL,
  `year_from` int(11) DEFAULT NULL,
  `year_to` int(11) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `motor_types`
--

INSERT INTO `motor_types` (`id`, `name`, `slug`, `year_from`, `year_to`, `notes`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Ninja R 150', 'ninja-r-150', 1996, 2015, 'Tipe naked/standar lampu bulat atau barong', 1, '2026-10-30 16:15:05', '2026-10-30 16:15:05'),
(2, 'Ninja RR 150', 'ninja-rr-150', 2002, 2015, 'Tipe full fairing (Old RR / New RR ZX150)', 1, '2026-10-30 16:15:05', '2026-10-30 16:15:05'),
(3, 'Ninja SS 150', 'ninja-ss-150', 2012, 2015, 'Varian lampu bulat tangki dan bodi mirip Ninja R', 1, '2026-10-30 16:15:05', '2026-10-30 16:15:05');

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `code` varchar(50) NOT NULL COMMENT 'PO-YYMMDD-XXXX',
  `public_token` varchar(64) NOT NULL,
  `customer_id` bigint(20) UNSIGNED DEFAULT NULL,
  `customer_name` varchar(120) NOT NULL,
  `customer_whatsapp` varchar(30) NOT NULL,
  `customer_address` text NOT NULL,
  `customer_note` text DEFAULT NULL,
  `status` enum('new','confirmed','completed','cancelled') NOT NULL DEFAULT 'new',
  `total_amount` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `admin_note` text DEFAULT NULL,
  `confirmed_at` datetime DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `cancelled_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `customers`
--

CREATE TABLE `customers` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `whatsapp` varchar(30) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `last_login_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `order_items`
--

CREATE TABLE `order_items` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `order_id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED DEFAULT NULL,
  `product_code` varchar(50) NOT NULL,
  `product_name` varchar(200) NOT NULL,
  `unit_price` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `quantity` int(10) UNSIGNED NOT NULL DEFAULT 1,
  `subtotal` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `code` varchar(50) NOT NULL COMMENT 'Format: PS-{CAT}-{NNN}',
  `slug` varchar(150) NOT NULL,
  `name` varchar(200) NOT NULL,
  `category_id` bigint(20) UNSIGNED NOT NULL,
  `description` text DEFAULT NULL,
  `condition_grade` enum('excellent','good','fair','poor') NOT NULL DEFAULT 'good',
  `condition_percent` tinyint(3) UNSIGNED DEFAULT NULL,
  `condition_note` varchar(255) DEFAULT NULL,
  `price` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `stock` int(10) UNSIGNED NOT NULL DEFAULT 1,
  `status` enum('available','sold','unavailable') NOT NULL DEFAULT 'available',
  `compat_notes` text DEFAULT NULL,
  `sold_at` datetime DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `code`, `slug`, `name`, `category_id`, `description`, `condition_grade`, `condition_percent`, `condition_note`, `price`, `stock`, `status`, `compat_notes`, `sold_at`, `deleted_at`, `created_at`, `updated_at`) VALUES
(1, 'PS-MSN-024', 'blok-seher-ninja-rr-original-1855', 'Blok Seher Ninja RR Original Seri 1855', 1, 'Blok silinder copotan Ninja RR kode 1855 original Kawasaki. Boring liner masih asli belum overbos/OB, lubang KIPS normal lancar tanpa macet. Sirip utuh tidak ada retak atau patah.', 'good', 85, 'Boring mulus no baret, KIPS lancar', 1250000, 1, 'available', 'Khusus Ninja RR 150. Lubang baut knalpot dan porting berbeda dengan Ninja R Super KIPS lama.', NULL, NULL, '2026-10-30 16:15:05', '2026-11-01 14:22:04'),
(2, 'PS-MSN-025', 'blok-seher-ninja-r-super-kips-1878', 'Blok Seher Ninja R Super KIPS Seri 1878', 1, 'Blok seher original seri 1878 untuk Ninja R / SS Super KIPS. Kondisi standar belum sok/OB, dinding silinder masih halus siap pasang.', 'good', 80, 'Belum OB, ada tanda pemakaian wajar', 950000, 1, 'available', 'Cocok untuk Ninja R dan Ninja SS. Bisa dipasang ke Ninja RR tapi posisi leher knalpot perlu penyesuaian bracket.', NULL, NULL, '2026-10-30 16:15:05', '2026-10-30 16:15:05'),
(3, 'PS-KLK-011', 'cdi-ninja-r-super-kips-original', 'CDI Ninja R Super Kips Original Denso', 2, 'Unit CDI original bawaan motor Ninja R Super KIPS kode 1535. Pengapian stabil, soket utuh tidak ada kabel jumperan, arus normal sudah ditest.', 'good', 80, 'Pengapian normal joss, kabel utuh', 675000, 2, 'available', 'Khusus Ninja R / SS Super Kips. TIDAK COCOK untuk Ninja RR yang memakai CDI 1454 atau Ninja R non-KIPS.', NULL, NULL, '2026-10-30 16:15:05', '2026-10-30 16:15:05'),
(4, 'PS-KLK-012', 'cdi-ninja-rr-denso-1454-original', 'CDI Ninja RR Denso 1454 Original Copotan', 2, 'CDI legendaris Ninja RR Old 1454 original Denso Japan. Kurva pengapian galak di rpm atas, servo KIPS buka presisi.', 'excellent', 95, 'Sangat mulus istimewa, KIPS servo aktif', 1850000, 1, 'available', 'Khusus Ninja RR 150 (Old RR maupun New RR). Soket berbeda dengan Ninja R.', NULL, NULL, '2026-10-30 16:15:05', '2026-10-30 16:15:05'),
(5, 'PS-MSN-026', 'karburator-keihin-pwl-26-ninja-r-original', 'Karburator Keihin PWL 26 Ninja R Original', 1, 'Karburator copotan Ninja R Keihin PWL 26. Skep mulus no baret, cuk normal, langsam stabil.', 'good', 85, 'Skep aman, langsam enak', 550000, 0, 'sold', 'Standar Ninja R 150. Bisa diaplikasikan ke motor 2T lain dengan penyesuaian intake.', '2026-11-01 14:01:11', NULL, '2026-10-30 16:15:05', '2026-11-01 14:01:11'),
(6, 'PS-MSN-027', 'knalpot-standar-ninja-rr-bobok-adem', 'Knalpot Standar Ninja RR Bobok Adem', 1, 'Perut knalpot original Ninja RR sudah bobokan adem gurih. Suara KIPS teriak padat, leher aman belum penyok.', 'fair', 75, 'Cat ulang tahan panas, suara padat', 600000, 1, 'available', 'Bracket dan dudukan khusus rangka Ninja RR.', NULL, NULL, '2026-10-30 16:15:05', '2026-10-30 16:15:05'),
(7, 'PS-KLK-013', 'spul-magnet-ninja-r-original-mitsuba', 'Spul Magnet Ninja R Original Mitsuba', 2, 'Satu set spul dan magnet pengapian copotan motor Ninja R. Gulungan tembaga mulus pabrik, magnet tidak gompal.', 'good', 80, 'Arus pengisian dan lampu stabil', 420000, 1, 'available', 'PNP ke Ninja R dan Ninja SS.', NULL, NULL, '2026-10-30 16:15:05', '2026-10-30 16:15:05'),
(8, 'PS-KLK-014', 'kiprok-regulator-ninja-rr-original-sh640', 'Kiprok Regulator Ninja RR Original Shindengen SH640', 2, 'Regulator rectifier original Shindengen SH640 Ninja RR. Pengisian aki normal anti overcharge, soket 5 pin mulus.', 'excellent', 90, 'Voltase pengisian stabil 14.2V', 350000, 1, 'available', 'Standar Ninja RR 150. Menghindari aki tekor atau servo KIPS error.', NULL, NULL, '2026-10-30 16:15:05', '2026-10-30 16:15:05'),
(9, 'PS-BDI-001', 'fairing-atas-ninja-rr-new-hijau-original', 'Fairing Atas Ninja RR New Hijau Original', 3, 'Batok fairing atas original Kawasaki Ninja RR New warna hijau metalik. Dudukan baut dan kupingan utuh, ada lecet pemakaian minor.', 'fair', 70, 'Ada lecet halus sudut kanan, dudukan utuh', 450000, 1, 'available', 'Khusus rangka fairing Ninja RR New 150.', NULL, NULL, '2026-10-30 16:15:05', '2026-10-30 16:15:05'),
(10, 'PS-BDI-002', 'tangki-bensin-ninja-r-hitam-original', 'Tangki Bensin Ninja R Hitam Original', 3, 'Tangki bensin copotan Ninja R warna hitam striping orisinil. Dalam tangki bersih sudah dibersihkan karat, no bocor/rembes.', 'fair', 75, 'Cat orisinil ada baret wajar, tidak bocor', 500000, 0, 'sold', 'Cocok untuk Ninja R dan Ninja SS rangka bulat/kotak.', '2026-11-01 14:01:11', NULL, '2026-10-30 16:15:05', '2026-11-01 14:01:11'),
(11, 'PS-KKI-001', 'shock-belakang-ninja-rr-original-showa', 'Shockbreaker Belakang Ninja RR Original Showa', 4, 'Monoshock Showa original copotan Ninja RR. Rebound empuk dan normal, as mulus tidak baret atau bocor oli.', 'good', 85, 'Rebound aktif, no rembes oli', 750000, 1, 'available', 'Ukuran panjang dan dudukan pro-link khusus Ninja RR.', NULL, NULL, '2026-10-30 16:15:05', '2026-10-30 16:15:05'),
(12, 'PS-KKI-002', 'velg-palang-3-enkei-ninja-r-original', 'Velg Bintang Palang 3 Enkei Ninja R Original Set', 4, 'Sepasang velg depan-belakang Enkei original Ninja R ring 17-18. Bibir velg lempeng no geol, rumah bearing rapat.', 'good', 85, 'Lempeng no geol, cat bawaan pabrik', 1100000, 1, 'available', 'Depan tromol disc kecil, belakang tromol Ninja R.', NULL, NULL, '2026-10-30 16:15:05', '2026-10-30 16:15:05'),
(13, 'PS-AKS-001', 'behel-belakang-ninja-r-original-kawasaki', 'Behel Belakang Ninja R Original Kawasaki', 5, 'Behel pegangan belakang original Ninja R. Bahan kokoh aluminium cor bawaan pabrik, drat baut aman.', 'excellent', 90, 'Cat mulus, drat baut aman no selek', 180000, 3, 'available', 'Cocok untuk Ninja R dan SS.', NULL, NULL, '2026-10-30 16:15:05', '2026-11-20 01:58:52'),
(14, 'PS-AKS-002', 'tutup-kips-cnc-ninja-150-r-rr-ss', 'Tutup Blok KIPS CNC Duralium Ninja 150 R / RR / SS', 5, 'Cover tutup mekanisme Super KIPS bahan dural CNC finishing anodize rapi. Dilengkapi seal karet baru anti bocor oli samping.', 'excellent', 95, 'Baru pakai sebentar, seal karet baru', 1250000, 4, 'available', 'Universal PNP untuk semua Kawasaki Ninja 150 2-Tak (R, RR, SS).', NULL, NULL, '2026-10-30 16:15:05', '2026-10-30 16:15:05'),
(15, 'PS-MSN-028', 'kruk-as-bandul-zx150-ninja-rr-copotan', 'Kruk As Bandul ZX150 Ninja RR Copotan', 1, 'Kruk as original copotan Ninja RR Old.', 'good', 85, 'Stang seher padat no goyang, drat aman', 1750000, 0, 'sold', NULL, '2026-11-01 13:58:17', '2026-11-01 13:58:17', '2026-11-01 13:58:17', '2026-11-01 13:58:17');

-- --------------------------------------------------------

--
-- Table structure for table `product_images`
--

CREATE TABLE `product_images` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `path` varchar(255) NOT NULL,
  `thumb_path` varchar(255) NOT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `is_primary` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `product_images`
--

INSERT INTO `product_images` (`id`, `product_id`, `path`, `thumb_path`, `sort_order`, `is_primary`, `created_at`) VALUES
(1, 1, '/uploads/sample_mesin_1.svg', '/uploads/sample_mesin_1.svg', 1, 1, '2026-10-30 16:15:05'),
(2, 2, '/uploads/sample_mesin_2.svg', '/uploads/sample_mesin_2.svg', 1, 1, '2026-10-30 16:15:05'),
(3, 3, '/uploads/sample_kelistrikan_1.svg', '/uploads/sample_kelistrikan_1.svg', 1, 1, '2026-10-30 16:15:05'),
(4, 4, '/uploads/sample_kelistrikan_2.svg', '/uploads/sample_kelistrikan_2.svg', 1, 1, '2026-10-30 16:15:05'),
(5, 5, '/uploads/sample_mesin_3.svg', '/uploads/sample_mesin_3.svg', 1, 1, '2026-10-30 16:15:05'),
(6, 6, '/uploads/sample_mesin_4.svg', '/uploads/sample_mesin_4.svg', 1, 1, '2026-10-30 16:15:05'),
(7, 7, '/uploads/sample_kelistrikan_3.svg', '/uploads/sample_kelistrikan_3.svg', 1, 1, '2026-10-30 16:15:05'),
(8, 8, '/uploads/sample_kelistrikan_4.svg', '/uploads/sample_kelistrikan_4.svg', 1, 1, '2026-10-30 16:15:05'),
(9, 9, '/uploads/sample_bodi_1.svg', '/uploads/sample_bodi_1.svg', 1, 1, '2026-10-30 16:15:05'),
(10, 10, '/uploads/sample_bodi_2.svg', '/uploads/sample_bodi_2.svg', 1, 1, '2026-10-30 16:15:05'),
(11, 11, '/uploads/sample_kaki_1.svg', '/uploads/sample_kaki_1.svg', 1, 1, '2026-10-30 16:15:05'),
(12, 12, '/uploads/sample_kaki_2.svg', '/uploads/sample_kaki_2.svg', 1, 1, '2026-10-30 16:15:05'),
(13, 13, '/uploads/sample_aksesori_1.svg', '/uploads/sample_aksesori_1.svg', 1, 1, '2026-10-30 16:15:05'),
(14, 14, '/uploads/sample_aksesori_2.svg', '/uploads/sample_aksesori_2.svg', 1, 1, '2026-10-30 16:15:05');

-- --------------------------------------------------------

--
-- Table structure for table `product_motor_types`
--

CREATE TABLE `product_motor_types` (
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `motor_type_id` bigint(20) UNSIGNED NOT NULL,
  `is_primary` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `product_motor_types`
--

INSERT INTO `product_motor_types` (`product_id`, `motor_type_id`, `is_primary`) VALUES
(1, 2, 1),
(2, 1, 1),
(2, 3, 0),
(3, 1, 1),
(3, 3, 0),
(4, 2, 1),
(5, 1, 1),
(5, 3, 0),
(6, 2, 1),
(7, 1, 1),
(7, 3, 0),
(8, 2, 1),
(9, 2, 1),
(10, 1, 1),
(10, 3, 0),
(11, 2, 1),
(12, 1, 1),
(13, 1, 1),
(13, 3, 0),
(14, 1, 1),
(14, 2, 0),
(14, 3, 0),
(15, 2, 1);

-- --------------------------------------------------------

--
-- Table structure for table `rate_limits`
--

CREATE TABLE `rate_limits` (
  `limit_key` varchar(100) NOT NULL,
  `hits` int(11) NOT NULL DEFAULT 1,
  `window_start` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `rate_limits`
--

INSERT INTO `rate_limits` (`limit_key`, `hits`, `window_start`) VALUES
('login_12ca17b49af2289436f303e0166030a21e525d266e209267433801a8fd4071a0', 1, 1793520318),
('qa_test_1795114685', 2, 1795114685),
('qa_test_1795114732', 2, 1795114732);

-- --------------------------------------------------------

--
-- Table structure for table `settings`
--

CREATE TABLE `settings` (
  `setting_key` varchar(50) NOT NULL,
  `setting_value` text DEFAULT NULL,
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `settings`
--

INSERT INTO `settings` (`setting_key`, `setting_value`, `updated_at`) VALUES
('about_text', 'PEPSO PARTS adalah penyedia spesialis sparepart bekas copotan original Kawasaki Ninja 2-Tak (Ninja R, Ninja RR, Ninja SS). Telah beroperasi lebih dari 2 tahun memberikan solusi part berkualitas, terverifikasi kondisi fisik dan fungsionalnya, dengan kejujuran spesifikasi.', '2026-10-30 16:15:05'),
('address', 'Jl. Sukarno Hatta No. 99, Malang, Jawa Timur', '2026-10-30 16:15:05'),
('facebook_url', 'https://facebook.com/marketplace/profile/pepsoparts', '2026-10-30 16:15:05'),
('opening_hours', 'Senin - Sabtu: 08:30 - 17:00 WIB (Minggu Libur)', '2026-10-30 16:15:05'),
('shopee_url', 'https://shopee.co.id/pepsoparts', '2026-10-30 16:15:05'),
('store_name', 'PEPSO PARTS', '2026-10-30 16:15:05'),
('whatsapp_number', '6281234567890', '2026-10-30 16:15:05');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admins`
--
ALTER TABLE `admins`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `customers`
--
ALTER TABLE `customers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `ai_cache`
--
ALTER TABLE `ai_cache`
  ADD PRIMARY KEY (`cache_key`),
  ADD KEY `idx_cache_expires` (`expires_at`);

--
-- Indexes for table `ai_usage_logs`
--
ALTER TABLE `ai_usage_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_ai_logs_created` (`created_at`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`),
  ADD UNIQUE KEY `code` (`code`);

--
-- Indexes for table `motor_types`
--
ALTER TABLE `motor_types`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`),
  ADD UNIQUE KEY `public_token` (`public_token`),
  ADD KEY `idx_orders_customer_created` (`customer_id`,`created_at`),
  ADD KEY `idx_orders_status_created` (`status`,`created_at`);

--
-- Indexes for table `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_items_order` (`order_id`),
  ADD KEY `fk_items_product` (`product_id`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`),
  ADD UNIQUE KEY `slug` (`slug`),
  ADD KEY `idx_products_cat_status` (`category_id`,`status`),
  ADD KEY `idx_products_deleted_at` (`deleted_at`),
  ADD KEY `idx_products_status` (`status`);

--
-- Indexes for table `product_images`
--
ALTER TABLE `product_images`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_images_product` (`product_id`,`sort_order`);

--
-- Indexes for table `product_motor_types`
--
ALTER TABLE `product_motor_types`
  ADD PRIMARY KEY (`product_id`,`motor_type_id`),
  ADD KEY `fk_pmt_motor` (`motor_type_id`);

--
-- Indexes for table `rate_limits`
--
ALTER TABLE `rate_limits`
  ADD PRIMARY KEY (`limit_key`);

--
-- Indexes for table `settings`
--
ALTER TABLE `settings`
  ADD PRIMARY KEY (`setting_key`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admins`
--
ALTER TABLE `admins`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `customers`
--
ALTER TABLE `customers`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ai_usage_logs`
--
ALTER TABLE `ai_usage_logs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `motor_types`
--
ALTER TABLE `motor_types`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `product_images`
--
ALTER TABLE `product_images`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `fk_items_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `fk_orders_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `fk_products_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `product_images`
--
ALTER TABLE `product_images`
  ADD CONSTRAINT `fk_images_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `product_motor_types`
--
ALTER TABLE `product_motor_types`
  ADD CONSTRAINT `fk_pmt_motor` FOREIGN KEY (`motor_type_id`) REFERENCES `motor_types` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_pmt_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
