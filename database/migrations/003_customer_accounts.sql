CREATE TABLE customers (
  id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  name varchar(100) NOT NULL,
  email varchar(150) NOT NULL,
  whatsapp varchar(30) NOT NULL,
  password_hash varchar(255) NOT NULL,
  last_login_at datetime DEFAULT NULL,
  created_at datetime NOT NULL DEFAULT current_timestamp(),
  updated_at datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (id),
  UNIQUE KEY email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE orders
  ADD COLUMN customer_id bigint(20) UNSIGNED DEFAULT NULL AFTER public_token,
  ADD KEY idx_orders_customer_created (customer_id, created_at),
  ADD CONSTRAINT fk_orders_customer
    FOREIGN KEY (customer_id) REFERENCES customers (id)
    ON DELETE SET NULL ON UPDATE CASCADE;
