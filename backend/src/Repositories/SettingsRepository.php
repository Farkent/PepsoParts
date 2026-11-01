<?php

declare(strict_types=1);

namespace Pepso\Repositories;

use Pepso\Core\Database;
use PDO;

class SettingsRepository
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    public function getAll(): array
    {
        $stmt = $this->db->query('SELECT setting_key, setting_value FROM settings');
        $rows = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
        return $rows ?: [];
    }

    public function get(string $key, ?string $default = null): ?string
    {
        $stmt = $this->db->prepare('SELECT setting_value FROM settings WHERE setting_key = :key');
        $stmt->execute(['key' => $key]);
        $val = $stmt->fetchColumn();
        return ($val !== false) ? (string)$val : $default;
    }

    public function set(string $key, ?string $value): void
    {
        $stmt = $this->db->prepare(
            'INSERT INTO settings (setting_key, setting_value, updated_at)
             VALUES (:key, :value, NOW())
             ON DUPLICATE KEY UPDATE setting_value = :value, updated_at = NOW()'
        );
        $stmt->execute(['key' => $key, 'value' => $value]);
    }

    public function setMany(array $pairs): void
    {
        foreach ($pairs as $key => $value) {
            $this->set((string)$key, $value !== null ? (string)$value : null);
        }
    }

    public function getPublic(): array
    {
        $all = $this->getAll();
        // Hanya kembalikan kunci yang aman untuk publik (jangan kembalikan kredensial admin)
        $publicKeys = [
            'store_name', 'whatsapp_number', 'about_text',
            'address', 'opening_hours', 'facebook_url', 'shopee_url',
        ];
        return array_filter($all, fn($key) => in_array($key, $publicKeys, true), ARRAY_FILTER_USE_KEY);
    }
}

