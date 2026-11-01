<?php

declare(strict_types=1);

namespace Pepso\Repositories;

use Pepso\Core\Database;
use PDO;

class MotorTypeRepository
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    public function getAll(bool $onlyActive = true): array
    {
        $sql = 'SELECT * FROM motor_types';
        if ($onlyActive) {
            $sql .= ' WHERE is_active = 1';
        }
        $sql .= ' ORDER BY name ASC';
        return $this->db->query($sql)->fetchAll();
    }

    public function findById(int $id): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM motor_types WHERE id = :id');
        $stmt->execute(['id' => $id]);
        return $stmt->fetch() ?: null;
    }

    public function findBySlug(string $slug): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM motor_types WHERE slug = :slug');
        $stmt->execute(['slug' => $slug]);
        return $stmt->fetch() ?: null;
    }

    public function create(array $data): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO motor_types (name, slug, year_from, year_to, notes, is_active, created_at, updated_at)
             VALUES (:name, :slug, :year_from, :year_to, :notes, :is_active, NOW(), NOW())'
        );
        $stmt->execute([
            'name'      => $data['name'],
            'slug'      => $data['slug'],
            'year_from' => $data['year_from'] ?? null,
            'year_to'   => $data['year_to'] ?? null,
            'notes'     => $data['notes'] ?? null,
            'is_active' => (int)($data['is_active'] ?? 1),
        ]);
        return (int)$this->db->lastInsertId();
    }

    public function update(int $id, array $data): bool
    {
        $stmt = $this->db->prepare(
            'UPDATE motor_types SET name = :name, slug = :slug, year_from = :year_from,
             year_to = :year_to, notes = :notes, is_active = :is_active, updated_at = NOW()
             WHERE id = :id'
        );
        return $stmt->execute([
            'name'      => $data['name'],
            'slug'      => $data['slug'],
            'year_from' => $data['year_from'] ?? null,
            'year_to'   => $data['year_to'] ?? null,
            'notes'     => $data['notes'] ?? null,
            'is_active' => (int)($data['is_active'] ?? 1),
            'id'        => $id,
        ]);
    }

    public function delete(int $id): bool
    {
        // Cek pivot
        $stmt = $this->db->prepare('SELECT COUNT(*) FROM product_motor_types WHERE motor_type_id = :id');
        $stmt->execute(['id' => $id]);
        if ($stmt->fetchColumn() > 0) {
            throw new \RuntimeException('Tipe motor tidak dapat dihapus karena masih terhubung dengan produk.');
        }
        $stmt = $this->db->prepare('DELETE FROM motor_types WHERE id = :id');
        return $stmt->execute(['id' => $id]);
    }

    public function isSlugTaken(string $slug, ?int $excludeId = null): bool
    {
        $sql = 'SELECT COUNT(*) FROM motor_types WHERE slug = :slug';
        $params = ['slug' => $slug];
        if ($excludeId !== null) {
            $sql .= ' AND id != :id';
            $params['id'] = $excludeId;
        }
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchColumn() > 0;
    }
}

