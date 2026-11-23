ALTER TABLE orders
  MODIFY COLUMN status enum('new','confirmed','shipped','completed','cancelled') NOT NULL DEFAULT 'new',
  ADD COLUMN courier varchar(100) DEFAULT NULL AFTER status,
  ADD COLUMN tracking_number varchar(100) DEFAULT NULL AFTER courier;
