<?php

declare(strict_types=1);

namespace Pepso\Repositories;

use Pepso\Core\Database;
use PDO;

class CategoryRepository
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    public function getAll(bool $onlyActive = true): array
    {
        $sql = 'SELECT * FROM categories';
        if ($onlyActive) {
            $sql .= ' WHERE is_active = 1';
        }
        $sql .= ' ORDER BY sort_order ASC, name ASC';
        return $this->db->query($sql)->fetchAll();
    }

    public function findBySlug(string $slug): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM categories WHERE slug = :slug');
        $stmt->execute(['slug' => $slug]);
        return $stmt->fetch() ?: null;
    }

    public function findById(int $id): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM categories WHERE id = :id');
        $stmt->execute(['id' => $id]);
        return $stmt->fetch() ?: null;
    }

    public function create(array $data): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO categories (name, slug, code, sort_order, is_active, created_at, updated_at) 
             VALUES (:name, :slug, :code, :sort_order, :is_active, NOW(), NOW())'
        );
        $stmt->execute([
            'name' => $data['name'],
            'slug' => $data['slug'],
            'code' => strtoupper($data['code']),
            'sort_order' => $data['sort_order'] ?? 0,
            'is_active' => (int)($data['is_active'] ?? 1),
        ]);
        return (int)$this->db->lastInsertId();
    }

    public function update(int $id, array $data): bool
    {
        $stmt = $this->db->prepare(
            'UPDATE categories SET name = :name, slug = :slug, code = :code, 
             sort_order = :sort_order, is_active = :is_active, updated_at = NOW()
             WHERE id = :id'
        );
        return $stmt->execute([
            'name' => $data['name'],
            'slug' => $data['slug'],
            'code' => strtoupper($data['code']),
            'sort_order' => $data['sort_order'] ?? 0,
            'is_active' => (int)($data['is_active'] ?? 1),
            'id' => $id,
        ]);
    }

    public function delete(int $id): bool
    {
        // Cek apakah kategori masih dipakai oleh produk aktif
        $stmt = $this->db->prepare(
            'SELECT COUNT(*) FROM products WHERE category_id = :id AND deleted_at IS NULL'
        );
        $stmt->execute(['id' => $id]);
        if ($stmt->fetchColumn() > 0) {
            throw new \RuntimeException('Kategori tidak dapat dihapus karena masih digunakan oleh produk aktif.');
        }

        $stmt = $this->db->prepare('DELETE FROM categories WHERE id = :id');
        return $stmt->execute(['id' => $id]);
    }

    public function isSlugTaken(string $slug, ?int $excludeId = null): bool
    {
        $sql = 'SELECT COUNT(*) FROM categories WHERE slug = :slug';
        $params = ['slug' => $slug];
        if ($excludeId !== null) {
            $sql .= ' AND id != :id';
            $params['id'] = $excludeId;
        }
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchColumn() > 0;
    }

    public function isCodeTaken(string $code, ?int $excludeId = null): bool
    {
        $sql = 'SELECT COUNT(*) FROM categories WHERE code = :code';
        $params = ['code' => strtoupper($code)];
        if ($excludeId !== null) {
            $sql .= ' AND id != :id';
            $params['id'] = $excludeId;
        }
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchColumn() > 0;
    }
}

