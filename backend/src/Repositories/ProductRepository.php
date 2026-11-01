<?php

declare(strict_types=1);

namespace Pepso\Repositories;

use Pepso\Core\Database;
use Pepso\Services\SearchService;
use PDO;

class ProductRepository
{
    private PDO $db;
    private SearchService $searchService;

    public function __construct()
    {
        $this->db = Database::getConnection();
        $this->searchService = new SearchService();
    }

    /**
     * Bangun query dasar dengan JOIN dan kondisi soft-delete.
     */
    private function baseSelect(): string
    {
        return <<<SQL
        SELECT
            p.id, p.code, p.slug, p.name, p.category_id,
            p.condition_grade, p.condition_percent, p.condition_note,
            p.price, p.stock, p.status, p.compat_notes,
            p.sold_at, p.created_at, p.updated_at,
            c.name AS category_name, c.slug AS category_slug, c.code AS category_code,
            pi.path AS primary_image_path, pi.thumb_path AS primary_thumb_path,
            GROUP_CONCAT(DISTINCT mt.name ORDER BY pmt.is_primary DESC SEPARATOR ', ') AS motor_types_text,
            GROUP_CONCAT(DISTINCT mt.slug ORDER BY pmt.is_primary DESC SEPARATOR ',') AS motor_type_slugs
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_primary = 1
        LEFT JOIN product_motor_types pmt ON pmt.product_id = p.id
        LEFT JOIN motor_types mt ON mt.id = pmt.motor_type_id
        WHERE p.deleted_at IS NULL
        SQL;
    }

    /**
     * Cari produk dengan filter lengkap.
     * Mengembalikan ['data' => [...], 'total' => int]
     */
    public function search(array $params): array
    {
        $q          = trim($params['q'] ?? '');
        $category   = trim($params['category'] ?? '');
        $motorType  = trim($params['motor_type'] ?? '');
        $condition  = trim($params['condition'] ?? '');
        $availability = trim($params['availability'] ?? '');
        $sort       = $params['sort'] ?? 'default';
        $page       = max(1, (int)($params['page'] ?? 1));
        $perPage    = min(48, max(1, (int)($params['per_page'] ?? 12)));

        $where = ['p.deleted_at IS NULL'];
        $bindings = [];

        // Filter Kategori
        if ($category !== '') {
            $where[] = 'c.slug = :category';
            $bindings['category'] = $category;
        }

        // Filter Tipe Motor
        if ($motorType !== '') {
            $where[] = 'EXISTS (
                SELECT 1 FROM product_motor_types pmt2
                JOIN motor_types mt2 ON mt2.id = pmt2.motor_type_id
                WHERE pmt2.product_id = p.id AND mt2.slug = :motor_type
            )';
            $bindings['motor_type'] = $motorType;
        }

        // Filter Kondisi
        if ($condition !== '') {
            $where[] = 'p.condition_grade = :condition';
            $bindings['condition'] = $condition;
        }

        // Filter Ketersediaan
        if ($availability === 'available') {
            $where[] = "(p.status = 'available' AND p.stock > 0)";
        } elseif ($availability === 'sold') {
            $where[] = "p.status = 'sold'";
        } elseif ($availability === 'unavailable') {
            $where[] = "p.status = 'unavailable'";
        }

        // Search Query dengan sinonim
        $candidateIds = null;
        if ($q !== '') {
            $normalizedQ = $this->searchService->normalize($q);
            $expandedWords = $this->searchService->expandWithSynonyms($normalizedQ);

            // FULLTEXT-like filter di PHP: ambil semua kandidat dulu lalu skor
            $searchWhereParts = [];
            $searchBindings = [];
            foreach ($expandedWords as $i => $word) {
                $key = "sw{$i}";
                $searchWhereParts[] = "(p.code LIKE :{$key}_c OR p.name LIKE :{$key}_n 
                    OR c.name LIKE :{$key}_cat OR p.description LIKE :{$key}_d
                    OR mt.name LIKE :{$key}_m)";
                $searchBindings["{$key}_c"]   = '%' . $word . '%';
                $searchBindings["{$key}_n"]   = '%' . $word . '%';
                $searchBindings["{$key}_cat"] = '%' . $word . '%';
                $searchBindings["{$key}_d"]   = '%' . $word . '%';
                $searchBindings["{$key}_m"]   = '%' . $word . '%';
            }

            if (!empty($searchWhereParts)) {
                $where[] = '(' . implode(' OR ', $searchWhereParts) . ')';
                $bindings = array_merge($bindings, $searchBindings);
            }
        }

        $whereClause = implode(' AND ', $where);

        // Hitung total
        $countSql = "SELECT COUNT(DISTINCT p.id) 
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_primary = 1
            LEFT JOIN product_motor_types pmt ON pmt.product_id = p.id
            LEFT JOIN motor_types mt ON mt.id = pmt.motor_type_id
            WHERE {$whereClause}";

        $countStmt = $this->db->prepare($countSql);
        $countStmt->execute($bindings);
        $total = (int)$countStmt->fetchColumn();

        // Urutan
        $orderBy = match ($sort) {
            'price_asc'  => 'p.price ASC',
            'price_desc' => 'p.price DESC',
            'newest'     => 'p.created_at DESC',
            default      => "CASE WHEN p.status = 'available' AND p.stock > 0 THEN 0 ELSE 1 END ASC, p.created_at DESC",
        };

        // Fetch data halaman
        $offset = ($page - 1) * $perPage;
        $sql = "SELECT
            p.id, p.code, p.slug, p.name, p.category_id,
            p.condition_grade, p.condition_percent, p.condition_note,
            p.price, p.stock, p.status, p.compat_notes, p.created_at,
            c.name AS category_name, c.slug AS category_slug, c.code AS category_code,
            pi.path AS primary_image_path, pi.thumb_path AS primary_thumb_path,
            GROUP_CONCAT(DISTINCT mt.name ORDER BY pmt.is_primary DESC SEPARATOR ', ') AS motor_types_text,
            GROUP_CONCAT(DISTINCT mt.slug ORDER BY pmt.is_primary DESC SEPARATOR ',') AS motor_type_slugs
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_primary = 1
            LEFT JOIN product_motor_types pmt ON pmt.product_id = p.id
            LEFT JOIN motor_types mt ON mt.id = pmt.motor_type_id
            WHERE {$whereClause}
            GROUP BY p.id
            ORDER BY {$orderBy}
            LIMIT :limit OFFSET :offset";

        $stmt = $this->db->prepare($sql);
        foreach ($bindings as $k => $v) {
            $stmt->bindValue($k, $v);
        }
        $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        $rows = $stmt->fetchAll();

        // Jika ada query teks: skor relevansi & urutkan ulang di PHP
        if ($q !== '' && $sort === 'default') {
            $normalizedQ = $this->searchService->normalize($q);
            $expandedWords = $this->searchService->expandWithSynonyms($normalizedQ);
            usort($rows, function (array $a, array $b) use ($expandedWords) {
                $scoreA = $this->searchService->scoreProduct($a, $expandedWords);
                $scoreB = $this->searchService->scoreProduct($b, $expandedWords);
                return $scoreB <=> $scoreA;
            });
        }

        return [
            'data'     => array_map([$this, 'formatProduct'], $rows),
            'total'    => $total,
            'page'     => $page,
            'per_page' => $perPage,
        ];
    }

    /**
     * Cari produk berdasarkan slug atau kode produk (case-insensitive).
     */
    public function findBySlugOrCode(string $slugOrCode): ?array
    {
        $sql = $this->baseSelect() . "
            AND (p.slug = :slug OR LOWER(p.code) = LOWER(:code))
            GROUP BY p.id LIMIT 1";
        $stmt = $this->db->prepare($sql);
        $stmt->execute(['slug' => $slugOrCode, 'code' => $slugOrCode]);
        $row = $stmt->fetch();
        if (!$row) {
            return null;
        }

        $product = $this->formatProduct($row);

        // Ambil semua gambar
        $product['images'] = $this->getImages((int)$row['id']);

        // Ambil semua tipe motor yang cocok
        $product['motor_types'] = $this->getMotorTypes((int)$row['id']);

        return $product;
    }

    public function findById(int $id, bool $withDetails = false): ?array
    {
        $sql = $this->baseSelect() . ' AND p.id = :id GROUP BY p.id LIMIT 1';
        $stmt = $this->db->prepare($sql);
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        if (!$row) {
            return null;
        }

        $product = $this->formatProduct($row);

        if ($withDetails) {
            $product['images'] = $this->getImages($id);
            $product['motor_types'] = $this->getMotorTypes($id);
        }

        return $product;
    }

    public function getImages(int $productId): array
    {
        $stmt = $this->db->prepare(
            'SELECT * FROM product_images WHERE product_id = :id ORDER BY sort_order ASC'
        );
        $stmt->execute(['id' => $productId]);
        return $stmt->fetchAll();
    }

    public function getMotorTypes(int $productId): array
    {
        $stmt = $this->db->prepare(
            'SELECT mt.*, pmt.is_primary FROM motor_types mt
             JOIN product_motor_types pmt ON pmt.motor_type_id = mt.id
             WHERE pmt.product_id = :id
             ORDER BY pmt.is_primary DESC, mt.name ASC'
        );
        $stmt->execute(['id' => $productId]);
        return $stmt->fetchAll();
    }

    /**
     * Dapatkan kandidat produk terkait untuk fitur A5 (rekomendasi).
     */
    public function getRelatedCandidates(int $productId, array $motorTypeIds, int $categoryId, int $limit = 8): array
    {
        if (empty($motorTypeIds)) {
            return [];
        }

        $inPlaceholders = implode(',', array_fill(0, count($motorTypeIds), '?'));

        $sql = "SELECT
            p.id, p.code, p.slug, p.name, p.category_id, p.price, p.stock, p.status,
            p.condition_grade, p.condition_percent, p.condition_note, p.compat_notes,
            c.name AS category_name, c.slug AS category_slug, c.code AS category_code,
            pi.path AS primary_image_path, pi.thumb_path AS primary_thumb_path,
            GROUP_CONCAT(DISTINCT mt.name SEPARATOR ', ') AS motor_types_text,
            GROUP_CONCAT(DISTINCT mt.slug SEPARATOR ',') AS motor_type_slugs
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_primary = 1
            LEFT JOIN product_motor_types pmt ON pmt.product_id = p.id
            LEFT JOIN motor_types mt ON mt.id = pmt.motor_type_id
            WHERE p.deleted_at IS NULL
              AND p.status = 'available' AND p.stock > 0
              AND p.id != ?
              AND p.category_id != ?
              AND EXISTS (
                  SELECT 1 FROM product_motor_types pmt2
                  WHERE pmt2.product_id = p.id AND pmt2.motor_type_id IN ({$inPlaceholders})
              )
            GROUP BY p.id
            ORDER BY RAND()
            LIMIT ?";

        $params = array_merge([$productId, $categoryId], $motorTypeIds, [$limit]);

        $stmt = $this->db->prepare($sql);
        foreach ($params as $i => $val) {
            $stmt->bindValue($i + 1, $val, is_int($val) ? PDO::PARAM_INT : PDO::PARAM_STR);
        }
        $stmt->execute();
        return array_map([$this, 'formatProduct'], $stmt->fetchAll());
    }

    /**
     * Buat produk baru.
     */
    public function create(array $data): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO products (code, slug, name, category_id, description,
             condition_grade, condition_percent, condition_note, price, stock, status,
             compat_notes, created_at, updated_at)
             VALUES (:code, :slug, :name, :category_id, :description,
             :condition_grade, :condition_percent, :condition_note, :price, :stock, :status,
             :compat_notes, NOW(), NOW())'
        );
        $stmt->execute([
            'code'             => strtoupper($data['code']),
            'slug'             => $data['slug'],
            'name'             => $data['name'],
            'category_id'      => $data['category_id'],
            'description'      => $data['description'] ?? null,
            'condition_grade'  => $data['condition_grade'] ?? 'good',
            'condition_percent'=> $data['condition_percent'] ?? null,
            'condition_note'   => $data['condition_note'] ?? null,
            'price'            => (int)$data['price'],
            'stock'            => (int)($data['stock'] ?? 1),
            'status'           => $data['status'] ?? 'available',
            'compat_notes'     => $data['compat_notes'] ?? null,
        ]);
        return (int)$this->db->lastInsertId();
    }

    /**
     * Update produk.
     */
    public function update(int $id, array $data): bool
    {
        $stmt = $this->db->prepare(
            'UPDATE products SET code = :code, name = :name, category_id = :category_id,
             description = :description, condition_grade = :condition_grade,
             condition_percent = :condition_percent, condition_note = :condition_note,
             price = :price, stock = :stock, status = :status, compat_notes = :compat_notes,
             updated_at = NOW()
             WHERE id = :id AND deleted_at IS NULL'
        );
        return $stmt->execute([
            'code'             => strtoupper($data['code']),
            'name'             => $data['name'],
            'category_id'      => $data['category_id'],
            'description'      => $data['description'] ?? null,
            'condition_grade'  => $data['condition_grade'] ?? 'good',
            'condition_percent'=> $data['condition_percent'] ?? null,
            'condition_note'   => $data['condition_note'] ?? null,
            'price'            => (int)$data['price'],
            'stock'            => (int)($data['stock'] ?? 0),
            'status'           => $data['status'] ?? 'available',
            'compat_notes'     => $data['compat_notes'] ?? null,
            'id'               => $id,
        ]);
    }

    /**
     * Soft delete produk. Tolak bila ada pesanan aktif.
     */
    public function softDelete(int $id): bool
    {
        // Cek pesanan aktif
        $stmt = $this->db->prepare(
            "SELECT COUNT(*) FROM order_items oi
             JOIN orders o ON o.id = oi.order_id
             WHERE oi.product_id = :id AND o.status IN ('new', 'confirmed')"
        );
        $stmt->execute(['id' => $id]);
        if ($stmt->fetchColumn() > 0) {
            throw new \RuntimeException('Produk tidak dapat dihapus karena masih ada pesanan aktif yang mengandung barang ini.');
        }

        $stmt = $this->db->prepare('UPDATE products SET deleted_at = NOW() WHERE id = :id');
        return $stmt->execute(['id' => $id]);
    }

    /**
     * Update stok dan otomatis kelola status sold/available.
     * Dipanggil dalam transaksi DB bila diperlukan.
     */
    public function updateStock(int $id, int $newStock, bool $inTransaction = false): array
    {
        $stmt = $this->db->prepare('SELECT id, stock, status FROM products WHERE id = :id FOR UPDATE');
        $stmt->execute(['id' => $id]);
        $product = $stmt->fetch();

        if (!$product) {
            throw new \RuntimeException('Produk tidak ditemukan.');
        }

        $newStatus = $product['status'];
        $soldAt = null;

        if ($newStock <= 0 && $product['status'] === 'available') {
            $newStock = 0;
            $newStatus = 'sold';
            $soldAt = 'NOW()';
        } elseif ($newStock > 0 && $product['status'] === 'sold') {
            $newStatus = 'available';
        }

        if ($soldAt) {
            $stmt = $this->db->prepare(
                'UPDATE products SET stock = :stock, status = :status, sold_at = NOW(), updated_at = NOW() WHERE id = :id'
            );
        } else {
            $stmt = $this->db->prepare(
                'UPDATE products SET stock = :stock, status = :status, sold_at = NULL, updated_at = NOW() WHERE id = :id'
            );
        }

        $stmt->execute(['stock' => $newStock, 'status' => $newStatus, 'id' => $id]);

        return ['stock' => $newStock, 'status' => $newStatus];
    }

    /**
     * Tandai produk sebagai Terjual, Tidak Tersedia, atau Aktifkan.
     */
    public function updateStatus(int $id, string $action): array
    {
        $stmt = $this->db->prepare('SELECT id, stock, status FROM products WHERE id = :id AND deleted_at IS NULL');
        $stmt->execute(['id' => $id]);
        $product = $stmt->fetch();

        if (!$product) {
            throw new \RuntimeException('Produk tidak ditemukan.');
        }

        match ($action) {
            'sell' => $this->db->prepare(
                "UPDATE products SET status = 'sold', stock = 0, sold_at = NOW(), updated_at = NOW() WHERE id = :id"
            )->execute(['id' => $id]),
            'unavailable' => $this->db->prepare(
                "UPDATE products SET status = 'unavailable', updated_at = NOW() WHERE id = :id"
            )->execute(['id' => $id]),
            'activate' => (function () use ($id, $product) {
                if ((int)$product['stock'] <= 0) {
                    throw new \RuntimeException("Stok harus lebih dari 0 untuk mengaktifkan produk.");
                }
                $this->db->prepare(
                    "UPDATE products SET status = 'available', sold_at = NULL, updated_at = NOW() WHERE id = :id"
                )->execute(['id' => $id]);
            })(),
            default => throw new \RuntimeException("Aksi status '{$action}' tidak valid.")
        };

        return $this->findById($id) ?? [];
    }

    /**
     * Sinkronisasi tipe motor produk.
     */
    public function syncMotorTypes(int $productId, array $motorTypeIds, int $primaryId = 0): void
    {
        $this->db->prepare('DELETE FROM product_motor_types WHERE product_id = :id')
            ->execute(['id' => $productId]);

        foreach ($motorTypeIds as $motorId) {
            $stmt = $this->db->prepare(
                'INSERT INTO product_motor_types (product_id, motor_type_id, is_primary) VALUES (:pid, :mid, :primary)'
            );
            $stmt->execute([
                'pid'     => $productId,
                'mid'     => (int)$motorId,
                'primary' => (int)($motorId == $primaryId),
            ]);
        }
    }

    /**
     * Cek apakah kode produk sudah dipakai.
     */
    public function isCodeTaken(string $code, ?int $excludeId = null): bool
    {
        $sql = 'SELECT COUNT(*) FROM products WHERE LOWER(code) = LOWER(:code) AND deleted_at IS NULL';
        $params = ['code' => $code];
        if ($excludeId !== null) {
            $sql .= ' AND id != :id';
            $params['id'] = $excludeId;
        }
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchColumn() > 0;
    }

    /**
     * Ambil nomor urut terakhir kode produk per kategori untuk generator otomatis.
     */
    public function getNextCodeSequence(string $categoryCode): int
    {
        $pattern = 'PS-' . strtoupper($categoryCode) . '-%';
        $stmt = $this->db->prepare(
            "SELECT code FROM products WHERE code LIKE :pattern AND deleted_at IS NULL ORDER BY code DESC LIMIT 1"
        );
        $stmt->execute(['pattern' => $pattern]);
        $last = $stmt->fetchColumn();

        if (!$last) {
            return 1;
        }

        $parts = explode('-', $last);
        $lastNum = (int)end($parts);
        return $lastNum + 1;
    }

    /**
     * Format baris produk DB menjadi struktur konsisten.
     */
    private function formatProduct(array $row): array
    {
        return [
            'id'               => (int)$row['id'],
            'code'             => $row['code'],
            'slug'             => $row['slug'],
            'name'             => $row['name'],
            'category_id'      => (int)$row['category_id'],
            'category_name'    => $row['category_name'] ?? null,
            'category_slug'    => $row['category_slug'] ?? null,
            'category_code'    => $row['category_code'] ?? null,
            'condition_grade'  => $row['condition_grade'],
            'condition_percent'=> $row['condition_percent'] !== null ? (int)$row['condition_percent'] : null,
            'condition_note'   => $row['condition_note'] ?? null,
            'price'            => (int)$row['price'],
            'stock'            => (int)$row['stock'],
            'status'           => $row['status'],
            'compat_notes'     => $row['compat_notes'] ?? null,
            'sold_at'          => $row['sold_at'] ?? null,
            'created_at'       => $row['created_at'] ?? null,
            'primary_image'    => $row['primary_image_path'] ?? $row['primary_thumb_path'] ?? null,
            'primary_thumb'    => $row['primary_thumb_path'] ?? null,
            'motor_types_text' => $row['motor_types_text'] ?? null,
            'motor_type_slugs' => $row['motor_type_slugs'] ?? null,
        ];
    }

    /**
     * Ambil statistik dashboard.
     */
    public function getDashboardStats(): array
    {
        $stmt = $this->db->query(
            "SELECT
                COUNT(*) AS total,
                SUM(CASE WHEN status = 'available' AND stock > 0 THEN 1 ELSE 0 END) AS available,
                SUM(CASE WHEN status = 'sold' THEN 1 ELSE 0 END) AS sold,
                SUM(CASE WHEN status = 'unavailable' THEN 1 ELSE 0 END) AS unavailable
             FROM products WHERE deleted_at IS NULL"
        );
        return $stmt->fetch() ?: ['total' => 0, 'available' => 0, 'sold' => 0, 'unavailable' => 0];
    }
}

