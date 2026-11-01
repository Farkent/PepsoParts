<?php

declare(strict_types=1);

namespace Pepso\Repositories;

use Pepso\Core\Database;
use PDO;
use PDOException;
use RuntimeException;

class OrderRepository
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    // ─── Code & Token Generation ──────────────────────────────────────────────

    public function generateCode(): string
    {
        $date = date('ymd');
        $prefix = 'PO-' . $date . '-';

        $stmt = $this->db->prepare(
            "SELECT COUNT(*) FROM orders WHERE code LIKE ?"
        );
        $stmt->execute([$prefix . '%']);
        $seq = (int)$stmt->fetchColumn() + 1;

        return $prefix . str_pad((string)$seq, 4, '0', STR_PAD_LEFT);
    }

    public function generatePublicToken(): string
    {
        return bin2hex(random_bytes(32));
    }

    // ─── Create Order (Atomic) ────────────────────────────────────────────────

    /**
     * Creates an order atomically:
     *  1. Lock product rows with SELECT … FOR UPDATE
     *  2. Validate stock availability
     *  3. Deduct stock and auto-update status
     *  4. Insert order + order_items
     */
    public function createOrder(array $data): array
    {
        $this->db->beginTransaction();
        try {
            $orderCode   = $this->generateCode();
            $publicToken = $this->generatePublicToken();
            $totalAmount = 0.0;
            $itemSnapshots = [];

            foreach ($data['items'] as $item) {
                $productId = (int)$item['product_id'];
                $qty       = (int)$item['quantity'];

                // Lock the product row
                $stmt = $this->db->prepare(
                    "SELECT id, code, name, price, stock, status FROM products
                     WHERE id = ? AND deleted_at IS NULL
                     FOR UPDATE"
                );
                $stmt->execute([$productId]);
                $product = $stmt->fetch(PDO::FETCH_ASSOC);

                if (!$product) {
                    throw new RuntimeException("Produk ID {$productId} tidak ditemukan.");
                }
                if ($product['status'] !== 'available' || (int)$product['stock'] < $qty) {
                    throw new RuntimeException(
                        "Stok tidak cukup untuk produk \"{$product['name']}\". " .
                        "Tersedia: {$product['stock']}, diminta: {$qty}."
                    );
                }

                $unitPrice = (float)$product['price'];
                $subtotal  = $unitPrice * $qty;
                $totalAmount += $subtotal;

                $itemSnapshots[] = [
                    'product_id'   => $productId,
                    'product_code' => $product['code'] ?? ('PS-' . $productId),
                    'product_name' => $product['name'],
                    'unit_price'   => $unitPrice,
                    'quantity'     => $qty,
                    'subtotal'     => $subtotal,
                ];

                // Deduct stock
                $newStock = (int)$product['stock'] - $qty;
                $newStatus = $newStock === 0 ? 'sold' : 'available';
                $this->db->prepare(
                    "UPDATE products SET stock = ?, status = ? WHERE id = ?"
                )->execute([$newStock, $newStatus, $productId]);
            }

            // Insert order
            $stmt = $this->db->prepare(
                "INSERT INTO orders
                    (code, public_token, customer_name, customer_whatsapp,
                     customer_address, customer_note, total_amount, status)
                 VALUES (?, ?, ?, ?, ?, ?, ?, 'new')"
            );
            $stmt->execute([
                $orderCode,
                $publicToken,
                $data['customer_name'],
                $data['customer_whatsapp'],
                $data['customer_address'],
                $data['customer_note'] ?? '',
                $totalAmount,
            ]);
            $orderId = (int)$this->db->lastInsertId();

            // Insert order_items
            $itemStmt = $this->db->prepare(
                "INSERT INTO order_items
                    (order_id, product_id, product_code, product_name, unit_price, quantity, subtotal)
                 VALUES (?, ?, ?, ?, ?, ?, ?)"
            );
            foreach ($itemSnapshots as $snap) {
                $itemStmt->execute([
                    $orderId,
                    $snap['product_id'],
                    $snap['product_code'],
                    $snap['product_name'],
                    $snap['unit_price'],
                    $snap['quantity'],
                    $snap['subtotal'],
                ]);
            }

            $this->db->commit();

            return [
                'id'           => $orderId,
                'order_code'   => $orderCode,
                'code'         => $orderCode,
                'public_token' => $publicToken,
                'total_amount' => $totalAmount,
            ];
        } catch (\Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    // ─── Find Methods ─────────────────────────────────────────────────────────

    public function findByCode(string $code, string $token): ?array
    {
        $stmt = $this->db->prepare(
            "SELECT o.*, o.code as order_code, GROUP_CONCAT(
                JSON_OBJECT(
                    'id', oi.id,
                    'product_id', oi.product_id,
                    'product_code', oi.product_code,
                    'product_name', oi.product_name,
                    'unit_price', oi.unit_price,
                    'quantity', oi.quantity,
                    'subtotal', oi.subtotal
                )
             ) as items_json
             FROM orders o
             LEFT JOIN order_items oi ON oi.order_id = o.id
             WHERE o.code = ? AND o.public_token = ?
             GROUP BY o.id"
        );
        $stmt->execute([$code, $token]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            return null;
        }

        return $this->hydrateOrder($row);
    }

    public function findById(int $id, bool $withItems = false): ?array
    {
        if ($withItems) {
            $stmt = $this->db->prepare(
                "SELECT o.*, o.code as order_code, GROUP_CONCAT(
                    JSON_OBJECT(
                        'id', oi.id,
                        'product_id', oi.product_id,
                        'product_code', oi.product_code,
                        'product_name', oi.product_name,
                        'unit_price', oi.unit_price,
                        'quantity', oi.quantity,
                        'subtotal', oi.subtotal
                    )
                 ) as items_json
                 FROM orders o
                 LEFT JOIN order_items oi ON oi.order_id = o.id
                 WHERE o.id = ?
                 GROUP BY o.id"
            );
        } else {
            $stmt = $this->db->prepare("SELECT o.*, o.code as order_code FROM orders o WHERE o.id = ?");
        }

        $stmt->execute([$id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            return null;
        }

        return $withItems ? $this->hydrateOrder($row) : $row;
    }

    // ─── Admin Search / List ──────────────────────────────────────────────────

    public function search(array $params): array
    {
        $where  = ['1=1'];
        $bind   = [];
        $limit  = min((int)($params['limit'] ?? 20), 100);
        $offset = (int)($params['offset'] ?? 0);

        if (!empty($params['status'])) {
            $where[] = 'o.status = ?';
            $bind[]  = $params['status'];
        }

        if (!empty($params['q'])) {
            $where[] = '(o.code LIKE ? OR o.customer_name LIKE ? OR o.customer_whatsapp LIKE ?)';
            $q = '%' . $params['q'] . '%';
            $bind = array_merge($bind, [$q, $q, $q]);
        }

        if (!empty($params['date_from'])) {
            $where[] = 'DATE(o.created_at) >= ?';
            $bind[]  = $params['date_from'];
        }

        if (!empty($params['date_to'])) {
            $where[] = 'DATE(o.created_at) <= ?';
            $bind[]  = $params['date_to'];
        }

        $whereStr = implode(' AND ', $where);

        // Total count
        $countStmt = $this->db->prepare("SELECT COUNT(*) FROM orders o WHERE {$whereStr}");
        $countStmt->execute($bind);
        $total = (int)$countStmt->fetchColumn();

        // Data
        $dataStmt = $this->db->prepare(
            "SELECT o.id, o.code, o.code as order_code, o.customer_name, o.customer_whatsapp,
                    o.total_amount, o.status, o.created_at, o.admin_note,
                    (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as items_count
             FROM orders o
             WHERE {$whereStr}
             ORDER BY o.created_at DESC
             LIMIT ? OFFSET ?"
        );
        $dataStmt->execute(array_merge($bind, [$limit, $offset]));
        $rows = $dataStmt->fetchAll(PDO::FETCH_ASSOC);

        return ['total' => $total, 'data' => $rows];
    }

    // ─── Status Update ────────────────────────────────────────────────────────

    /**
     * Valid transitions: new→confirmed, new→cancelled
     *                    confirmed→completed, confirmed→cancelled
     */
    public function updateStatus(int $id, string $newStatus): bool
    {
        $this->db->beginTransaction();
        try {
            $stmt = $this->db->prepare("SELECT status FROM orders WHERE id = ? FOR UPDATE");
            $stmt->execute([$id]);
            $order = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$order) {
                $this->db->rollBack();
                return false;
            }

            $currentStatus = $order['status'];

            $allowedTransitions = [
                'new'       => ['confirmed', 'cancelled'],
                'confirmed' => ['completed', 'cancelled'],
            ];

            if (!isset($allowedTransitions[$currentStatus]) ||
                !in_array($newStatus, $allowedTransitions[$currentStatus], true)) {
                $this->db->rollBack();
                throw new RuntimeException(
                    "Transisi status tidak valid: {$currentStatus} → {$newStatus}"
                );
            }

            // Restore stock if cancelling a confirmed order
            if ($newStatus === 'cancelled' && $currentStatus === 'confirmed') {
                $this->restoreStock($id);
            }

            $timestampCol = match ($newStatus) {
                'confirmed' => 'confirmed_at = NOW()',
                'completed' => 'completed_at = NOW()',
                'cancelled' => 'cancelled_at = NOW()',
                default     => null,
            };

            $sql = "UPDATE orders SET status = ?" . ($timestampCol ? ", {$timestampCol}" : '') . " WHERE id = ?";
            $this->db->prepare($sql)->execute([$newStatus, $id]);

            $this->db->commit();
            return true;
        } catch (\Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    private function restoreStock(int $orderId): void
    {
        $items = $this->db->prepare(
            "SELECT product_id, quantity FROM order_items WHERE order_id = ?"
        );
        $items->execute([$orderId]);

        foreach ($items->fetchAll(PDO::FETCH_ASSOC) as $item) {
            if (!$item['product_id']) continue;

            // Lock product row
            $lock = $this->db->prepare(
                "SELECT stock, status FROM products WHERE id = ? FOR UPDATE"
            );
            $lock->execute([$item['product_id']]);
            $product = $lock->fetch(PDO::FETCH_ASSOC);

            if ($product) {
                $newStock  = (int)$product['stock'] + (int)$item['quantity'];
                $newStatus = $product['status'] === 'sold' ? 'available' : $product['status'];
                $this->db->prepare(
                    "UPDATE products SET stock = ?, status = ? WHERE id = ?"
                )->execute([$newStock, $newStatus, $item['product_id']]);
            }
        }
    }

    // ─── Admin Note ──────────────────────────────────────────────────────────

    public function updateNote(int $id, string $note): bool
    {
        $stmt = $this->db->prepare("UPDATE orders SET admin_note = ? WHERE id = ?");
        return $stmt->execute([$note, $id]);
    }

    // ─── Badge Count ─────────────────────────────────────────────────────────

    public function countNew(): int
    {
        $stmt = $this->db->query("SELECT COUNT(*) FROM orders WHERE status = 'new'");
        return (int)$stmt->fetchColumn();
    }

    // ─── Reports ─────────────────────────────────────────────────────────────

    public function stockReport(): array
    {
        $stmt = $this->db->query(
            "SELECT p.id, p.code as product_code, p.name, c.name as category,
                    p.price, p.stock, p.status
             FROM products p
             LEFT JOIN categories c ON c.id = p.category_id
             WHERE p.deleted_at IS NULL
             ORDER BY c.name, p.name"
        );
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function salesReport(string $dateFrom, string $dateTo): array
    {
        // Summary
        $summaryStmt = $this->db->prepare(
            "SELECT COUNT(*) as total_orders,
                    COALESCE(SUM(total_amount), 0) as total_revenue,
                    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
                    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders
             FROM orders
             WHERE DATE(created_at) BETWEEN ? AND ?
               AND status != 'cancelled'"
        );
        $summaryStmt->execute([$dateFrom, $dateTo]);
        $summary = $summaryStmt->fetch(PDO::FETCH_ASSOC);

        // By category
        $catStmt = $this->db->prepare(
            "SELECT c.name as category,
                    SUM(oi.quantity) as items_sold,
                    SUM(oi.subtotal) as revenue
             FROM order_items oi
             JOIN orders o ON o.id = oi.order_id
             LEFT JOIN products p ON p.id = oi.product_id
             LEFT JOIN categories c ON c.id = p.category_id
             WHERE DATE(o.created_at) BETWEEN ? AND ?
               AND o.status != 'cancelled'
             GROUP BY c.id, c.name
             ORDER BY revenue DESC"
        );
        $catStmt->execute([$dateFrom, $dateTo]);
        $byCategory = $catStmt->fetchAll(PDO::FETCH_ASSOC);

        // Orders list
        $ordersStmt = $this->db->prepare(
            "SELECT o.code as order_code, o.customer_name, o.customer_whatsapp,
                    o.total_amount, o.status, o.created_at,
                    (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as items_count
             FROM orders o
             WHERE DATE(o.created_at) BETWEEN ? AND ?
             ORDER BY o.created_at DESC"
        );
        $ordersStmt->execute([$dateFrom, $dateTo]);
        $orders = $ordersStmt->fetchAll(PDO::FETCH_ASSOC);

        return [
            'summary'     => $summary,
            'by_category' => $byCategory,
            'orders'      => $orders,
        ];
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private function hydrateOrder(array $row): array
    {
        if (!empty($row['items_json'])) {
            $row['items'] = json_decode('[' . $row['items_json'] . ']', true) ?? [];
        } else {
            $row['items'] = [];
        }
        unset($row['items_json']);
        return $row;
    }
}
