ALTER TABLE orders
  ADD COLUMN admin_received_notified_at datetime DEFAULT NULL AFTER completed_at;

UPDATE orders
SET admin_received_notified_at = NOW()
WHERE status = 'completed' AND admin_received_notified_at IS NULL;