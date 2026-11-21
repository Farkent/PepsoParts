-- ============================================================
-- PEPSO PARTS - Fitur Varian Produk
-- Jalankan SEKALI di phpMyAdmin: pilih database pepso_parts > tab SQL > Go
-- ============================================================

CREATE TABLE IF NOT EXISTS `product_variants` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(100) NOT NULL,
  `price` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `stock` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_variants_product` (`product_id`),
  CONSTRAINT `fk_variants_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `order_items`
  ADD COLUMN `variant_id` bigint(20) UNSIGNED DEFAULT NULL AFTER `product_id`,
  ADD COLUMN `variant_name` varchar(100) DEFAULT NULL AFTER `product_name`;
