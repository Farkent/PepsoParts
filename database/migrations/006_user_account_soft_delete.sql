-- Migration 006: Soft Delete dan Role untuk Akun Pengguna & Admin
-- Mendukung Skenario Penghapusan Akun tanpa merusak integritas data transaksi

-- 1. Tambah kolom deleted_at pada tabel customers
ALTER TABLE customers
  ADD COLUMN deleted_at DATETIME DEFAULT NULL AFTER updated_at,
  ADD KEY idx_customers_deleted_at (deleted_at);

-- 2. Tambah kolom role dan deleted_at pada tabel admins
ALTER TABLE admins
  ADD COLUMN role VARCHAR(30) NOT NULL DEFAULT 'admin' AFTER email,
  ADD COLUMN deleted_at DATETIME DEFAULT NULL AFTER updated_at,
  ADD KEY idx_admins_deleted_at (deleted_at);

-- 3. Set admin pertama (ID 1) sebagai super_admin
UPDATE admins SET role = 'super_admin' WHERE id = 1;
