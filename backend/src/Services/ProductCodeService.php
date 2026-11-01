<?php

declare(strict_types=1);

namespace Pepso\Services;

use Pepso\Core\Logger;

/**
 * ProductCodeService - Generator kode produk unik
 * Format: PS-{KODE_KATEGORI}-{NNN}
 * Contoh: PS-MSN-024, PS-KLK-011
 */
class ProductCodeService
{
    private \Pepso\Repositories\ProductRepository $repo;

    public function __construct()
    {
        $this->repo = new \Pepso\Repositories\ProductRepository();
    }

    /**
     * Generate kode produk berikutnya untuk kategori tertentu.
     * @param string $categoryCode Kode 3-huruf kategori (mis. MSN, KLK)
     */
    public function generate(string $categoryCode): string
    {
        $categoryCode = strtoupper(trim($categoryCode));
        $nextSeq = $this->repo->getNextCodeSequence($categoryCode);
        return sprintf('PS-%s-%03d', $categoryCode, $nextSeq);
    }

    /**
     * Generate slug dari nama produk.
     * Menambahkan segmen acak di akhir agar unik tanpa perlu DB lookup berulang.
     */
    public static function generateSlug(string $name, int $appendNum = 0): string
    {
        // Konversi ke huruf kecil ASCII, ganti spasi/karakter khusus dengan tanda hubung
        $slug = mb_strtolower(trim($name), 'UTF-8');
        $slug = preg_replace('/[^\p{L}\p{N}\s\-]/u', '', $slug);
        $slug = preg_replace('/[\s]+/', '-', $slug);
        $slug = preg_replace('/-+/', '-', $slug);
        $slug = trim($slug, '-');
        $slug = substr($slug, 0, 80);

        if ($appendNum > 0) {
            $slug .= '-' . $appendNum;
        }

        return $slug;
    }

    /**
     * Pastikan slug produk unik di database.
     */
    public static function ensureUniqueSlug(\Pepso\Repositories\ProductRepository $repo, string $baseName, ?int $excludeId = null): string
    {
        $slug = self::generateSlug($baseName);
        $attempt = 0;

        while (true) {
            $testSlug = $attempt > 0 ? self::generateSlug($baseName, $attempt) : $slug;
            $exists = $repo->isCodeTaken($testSlug, $excludeId); // gunakan method slug check bila ada
            // Cek unik via query langsung
            $db = \Pepso\Core\Database::getConnection();
            $stmt = $db->prepare('SELECT COUNT(*) FROM products WHERE slug = :slug' . ($excludeId ? ' AND id != :id' : ''));
            $params = ['slug' => $testSlug];
            if ($excludeId) $params['id'] = $excludeId;
            $stmt->execute($params);
            if ((int)$stmt->fetchColumn() === 0) {
                return $testSlug;
            }
            $attempt++;
        }
    }
}

