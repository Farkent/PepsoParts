<?php

declare(strict_types=1);

namespace Pepso\Controllers;

use Pepso\Core\Database;
use Pepso\Core\Request;
use Pepso\Core\Response;
use Pepso\Core\Session;
use PDO;

class AdminUserController
{
    /**
     * Menampilkan daftar pengguna (pelanggan dan/atau administrator).
     */
    public function index(Request $request): void
    {
        $db = Database::getConnection();
        $type = strtolower((string)$request->get('type', 'customer')); // 'customer' | 'admin' | 'all'
        $search = trim((string)$request->get('q', ''));
        $status = strtolower((string)$request->get('status', 'all')); // 'all' | 'active' | 'deleted'
        $page = max(1, (int)$request->get('page', 1));
        $perPage = max(5, min(50, (int)$request->get('per_page', 15)));
        $offset = ($page - 1) * $perPage;

        if ($type === 'admin') {
            $this->listAdmins($db, $search, $status, $page, $perPage, $offset);
            return;
        }

        // Default: list customers
        $this->listCustomers($db, $search, $status, $page, $perPage, $offset);
    }

    /**
     * Menghapus (Soft Delete) akun pengguna oleh Admin.
     * Endpoint: DELETE /api/admin/users/{id}
     */
    public function delete(Request $request, array $params): void
    {
        $targetId = (int)($params['id'] ?? 0);
        if ($targetId <= 0) {
            Response::error('ID pengguna tidak valid.', 'INVALID_ID', 400);
        }

        $type = strtolower((string)$request->get('type', 'customer'));
        $db = Database::getConnection();
        $currentAdminId = (int)Session::get('admin_id', 0);

        if ($type === 'admin') {
            $this->deleteAdmin($db, $targetId, $currentAdminId);
            return;
        }

        $this->deleteCustomer($db, $targetId);
    }

    /**
     * Memulihkan (Restore) akun pengguna yang sebelumnya dihapus (soft-delete).
     * Endpoint: PATCH /api/admin/users/{id}/restore
     */
    public function restore(Request $request, array $params): void
    {
        $targetId = (int)($params['id'] ?? 0);
        if ($targetId <= 0) {
            Response::error('ID pengguna tidak valid.', 'INVALID_ID', 400);
        }

        $type = strtolower((string)$request->get('type', 'customer'));
        $db = Database::getConnection();

        $table = $type === 'admin' ? 'admins' : 'customers';
        $stmt = $db->prepare("SELECT id, name, email, deleted_at FROM {$table} WHERE id = :id LIMIT 1");
        $stmt->execute(['id' => $targetId]);
        $user = $stmt->fetch();

        if (!$user) {
            Response::error('Pengguna tidak ditemukan.', 'USER_NOT_FOUND', 404);
        }

        if (empty($user['deleted_at'])) {
            Response::error('Akun pengguna ini masih aktif.', 'ALREADY_ACTIVE', 400);
        }

        $updateStmt = $db->prepare("UPDATE {$table} SET deleted_at = NULL, updated_at = NOW() WHERE id = :id");
        $updateStmt->execute(['id' => $targetId]);

        Response::json([
            'message' => "Akun {$user['name']} ({$user['email']}) berhasil dipulihkan dan aktif kembali.",
        ]);
    }

    private function listCustomers(PDO $db, string $search, string $status, int $page, int $perPage, int $offset): void
    {
        $where = [];
        $params = [];

        if ($search !== '') {
            $where[] = '(c.name LIKE :search_name OR c.email LIKE :search_email OR c.whatsapp LIKE :search_wa)';
            $params['search_name'] = "%{$search}%";
            $params['search_email'] = "%{$search}%";
            $params['search_wa'] = "%{$search}%";
        }

        if ($status === 'active') {
            $where[] = 'c.deleted_at IS NULL';
        } elseif ($status === 'deleted') {
            $where[] = 'c.deleted_at IS NOT NULL';
        }

        $whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';

        // Hitung total data
        $countStmt = $db->prepare("SELECT COUNT(*) FROM customers c {$whereClause}");
        $countStmt->execute($params);
        $total = (int)$countStmt->fetchColumn();

        // Ambil data pelanggan beserta jumlah pesanan
        $query = "
            SELECT c.id, c.name, c.email, c.whatsapp, c.created_at, c.last_login_at, c.deleted_at,
                   (SELECT COUNT(*) FROM orders o WHERE o.customer_id = c.id) AS orders_count,
                   (SELECT COALESCE(SUM(total_amount), 0) FROM orders o WHERE o.customer_id = c.id AND o.status != 'cancelled') AS total_spent
            FROM customers c
            {$whereClause}
            ORDER BY c.created_at DESC
            LIMIT :limit OFFSET :offset
        ";

        $stmt = $db->prepare($query);
        foreach ($params as $key => $val) {
            $stmt->bindValue($key, $val);
        }
        $stmt->bindValue('limit', $perPage, PDO::PARAM_INT);
        $stmt->bindValue('offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        $rows = $stmt->fetchAll();
        $formatted = array_map(function ($row) {
            return [
                'id' => (int)$row['id'],
                'type' => 'customer',
                'name' => $row['name'],
                'email' => $row['email'],
                'whatsapp' => $row['whatsapp'],
                'created_at' => $row['created_at'],
                'last_login_at' => $row['last_login_at'],
                'deleted_at' => $row['deleted_at'],
                'is_deleted' => !empty($row['deleted_at']),
                'orders_count' => (int)$row['orders_count'],
                'total_spent' => (float)$row['total_spent'],
            ];
        }, $rows);

        // Ambil ringkasan statistik
        $statsStmt = $db->query('
            SELECT 
                COUNT(*) AS total,
                SUM(CASE WHEN deleted_at IS NULL THEN 1 ELSE 0 END) AS active,
                SUM(CASE WHEN deleted_at IS NOT NULL THEN 1 ELSE 0 END) AS deleted
            FROM customers
        ');
        $stats = $statsStmt->fetch() ?: ['total' => 0, 'active' => 0, 'deleted' => 0];

        Response::json([
            'data' => $formatted,
            'meta' => [
                'total' => $total,
                'page' => $page,
                'per_page' => $perPage,
                'last_page' => (int)ceil($total / $perPage),
                'stats' => [
                    'total' => (int)$stats['total'],
                    'active' => (int)$stats['active'],
                    'deleted' => (int)$stats['deleted'],
                ],
            ],
        ]);
    }

    private function listAdmins(PDO $db, string $search, string $status, int $page, int $perPage, int $offset): void
    {
        $where = [];
        $params = [];

        if ($search !== '') {
            $where[] = '(a.name LIKE :search_name OR a.email LIKE :search_email)';
            $params['search_name'] = "%{$search}%";
            $params['search_email'] = "%{$search}%";
        }

        if ($status === 'active') {
            $where[] = 'a.deleted_at IS NULL';
        } elseif ($status === 'deleted') {
            $where[] = 'a.deleted_at IS NOT NULL';
        }

        $whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';

        $countStmt = $db->prepare("SELECT COUNT(*) FROM admins a {$whereClause}");
        $countStmt->execute($params);
        $total = (int)$countStmt->fetchColumn();

        $query = "
            SELECT a.id, a.name, a.email, a.role, a.created_at, a.last_login_at, a.deleted_at
            FROM admins a
            {$whereClause}
            ORDER BY a.id ASC
            LIMIT :limit OFFSET :offset
        ";

        $stmt = $db->prepare($query);
        foreach ($params as $key => $val) {
            $stmt->bindValue($key, $val);
        }
        $stmt->bindValue('limit', $perPage, PDO::PARAM_INT);
        $stmt->bindValue('offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        $rows = $stmt->fetchAll();
        $formatted = array_map(function ($row) {
            return [
                'id' => (int)$row['id'],
                'type' => 'admin',
                'name' => $row['name'],
                'email' => $row['email'],
                'role' => $row['role'] ?? 'admin',
                'created_at' => $row['created_at'],
                'last_login_at' => $row['last_login_at'],
                'deleted_at' => $row['deleted_at'],
                'is_deleted' => !empty($row['deleted_at']),
            ];
        }, $rows);

        $statsStmt = $db->query('
            SELECT 
                COUNT(*) AS total,
                SUM(CASE WHEN deleted_at IS NULL THEN 1 ELSE 0 END) AS active,
                SUM(CASE WHEN deleted_at IS NOT NULL THEN 1 ELSE 0 END) AS deleted
            FROM admins
        ');
        $stats = $statsStmt->fetch() ?: ['total' => 0, 'active' => 0, 'deleted' => 0];

        Response::json([
            'data' => $formatted,
            'meta' => [
                'total' => $total,
                'page' => $page,
                'per_page' => $perPage,
                'last_page' => (int)ceil($total / $perPage),
                'stats' => [
                    'total' => (int)$stats['total'],
                    'active' => (int)$stats['active'],
                    'deleted' => (int)$stats['deleted'],
                ],
            ],
        ]);
    }

    private function deleteCustomer(PDO $db, int $targetId): void
    {
        $stmt = $db->prepare('SELECT id, name, email, deleted_at FROM customers WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $targetId]);
        $customer = $stmt->fetch();

        if (!$customer) {
            Response::error('Akun pelanggan tidak ditemukan.', 'USER_NOT_FOUND', 404);
        }

        if (!empty($customer['deleted_at'])) {
            Response::error('Akun pelanggan ini sudah dalam status terhapus.', 'ALREADY_DELETED', 400);
        }

        // Soft delete: tandai deleted_at = NOW() agar transaksi masa lalu tetap valid
        $updateStmt = $db->prepare('UPDATE customers SET deleted_at = NOW(), updated_at = NOW() WHERE id = :id');
        $updateStmt->execute(['id' => $targetId]);

        Response::json([
            'message' => "Akun pelanggan '{$customer['name']}' ({$customer['email']}) berhasil dihapus. Riwayat transaksi masa lalu tetap aman di pembukuan toko.",
        ]);
    }

    private function deleteAdmin(PDO $db, int $targetId, int $currentAdminId): void
    {
        // 1. Cegah admin menghapus akunnya sendiri melalui panel ini
        if ($targetId === $currentAdminId) {
            Response::error(
                'Anda tidak dapat menghapus akun Anda sendiri dari menu manajemen admin ini. Silakan gunakan fitur hapus akun mandiri pada pengaturan profil.',
                'SELF_DELETION_FORBIDDEN',
                400
            );
        }

        $stmt = $db->prepare('SELECT id, name, email, role, deleted_at FROM admins WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $targetId]);
        $targetAdmin = $stmt->fetch();

        if (!$targetAdmin) {
            Response::error('Akun admin tidak ditemukan.', 'USER_NOT_FOUND', 404);
        }

        if (!empty($targetAdmin['deleted_at'])) {
            Response::error('Akun admin ini sudah dalam status terhapus.', 'ALREADY_DELETED', 400);
        }

        // 2. Cegah penghapusan akun super_admin
        if (($targetAdmin['role'] ?? '') === 'super_admin' || $targetId === 1) {
            Response::error('Akun Super Admin utama tidak dapat dihapus demi keamanan sistem.', 'SUPER_ADMIN_PROTECTED', 403);
        }

        // 3. Cegah penghapusan admin terakhir agar sistem tidak terkunci
        $countStmt = $db->prepare('SELECT COUNT(*) FROM admins WHERE deleted_at IS NULL AND id != :id');
        $countStmt->execute(['id' => $targetId]);
        $remainingAdmins = (int)$countStmt->fetchColumn();

        if ($remainingAdmins < 1) {
            Response::error('Tidak dapat menghapus admin ini karena merupakan admin aktif terakhir. Sistem membutuhkan minimal satu admin aktif agar tidak terkunci.', 'LAST_ADMIN_PROTECTED', 403);
        }

        // Soft delete admin
        $updateStmt = $db->prepare('UPDATE admins SET deleted_at = NOW(), updated_at = NOW() WHERE id = :id');
        $updateStmt->execute(['id' => $targetId]);

        Response::json([
            'message' => "Akun admin '{$targetAdmin['name']}' ({$targetAdmin['email']}) berhasil dihapus.",
        ]);
    }
}
