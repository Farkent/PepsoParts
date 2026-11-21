-- ============================================================
-- PEPSO PARTS - Foto per varian
-- Jalankan SEKALI di phpMyAdmin: pilih database pepso_parts > tab SQL > Go
-- (Jalankan setelah 001_product_variants.sql)
-- ============================================================
ALTER TABLE `product_variants`
  ADD COLUMN `image_id` bigint(20) UNSIGNED DEFAULT NULL AFTER `stock`;
