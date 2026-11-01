<?php

declare(strict_types=1);

namespace Pepso\Services\Ai;

use Pepso\Core\Database;
use Pepso\Repositories\ProductRepository;
use Pepso\Services\SearchService;
use PDO;

class MockProvider implements AiProviderInterface
{
    private PDO $db;
    private ProductRepository $productRepo;
    private SearchService $searchService;

    public function __construct()
    {
        $this->db = Database::getConnection();
        $this->productRepo = new ProductRepository();
        $this->searchService = new SearchService();
    }

    public function chat(string $message, ?string $myMotorSlug = null, array $history = []): array
    {
        $msgLower = strtolower(trim($message));

        // 1. Salam / Greeting
        if (preg_match('/\b(halo|hai|assalamu|pagi|siang|sore|malam|permisi|bang|mas)\b/i', $msgLower) && strlen($msgLower) < 20) {
            return [
                'text' => "Halo Bro! Selamat datang di PEPSO PARTS — bengkel dan penyedia sparepart bekas original Kawasaki Ninja 2-Tak (Ninja R, RR, SS) milik Mas Wahyu. Ada part atau blok mesin yang lagi dicari buat tungganganmu?",
                'suggested_products' => [],
                'quick_replies' => [
                    'Blok Seher Ninja RR',
                    'Knalpot Standar Racing',
                    'Karburator Keihin PWK/PWL',
                    'Cek stok ready hari ini'
                ],
                'fallback_to_whatsapp' => false
            ];
        }

        // 2. Tanya Lokasi / Kontak / Toko
        if (preg_match('/\b(lokasi|alamat|bengkel|toko|sentul|bogor|wa|kontak|nomor|buka)\b/i', $msgLower)) {
            return [
                'text' => "Bengkel dan gudang PEPSO PARTS berlokasi di area Sentul, Babakan Madang, Kabupaten Bogor (Dekat Sirkuit Sentul). Buka Senin-Sabtu pukul 09.00 - 17.00 WIB. Mau mampir langsung atau kirim-kirim via ekspedisi bisa banget Bro!",
                'suggested_products' => [],
                'quick_replies' => [
                    'Hubungi via WhatsApp',
                    'Cek Blok Seher 1855',
                    'Lihat Semua Katalog'
                ],
                'fallback_to_whatsapp' => true
            ];
        }

        // 3. Search related products in DB based on query
        $searchResults = $this->productRepo->search([
            'q'          => $message,
            'motor_type' => $myMotorSlug,
            'status'     => 'available',
            'per_page'   => 3,
        ]);

        $products = $searchResults['data'] ?? [];

        if (!empty($products)) {
            $count = count($products);
            $motorNote = $myMotorSlug ? " yang cocok untuk motor pilihanmu (" . strtoupper($myMotorSlug) . ")" : "";
            $replyText = "Kami punya {$count} barang rekomendasi{$motorNote} yang cocok dengan pencarianmu Bro:\n\n";

            foreach ($products as $p) {
                $priceFormatted = 'Rp ' . number_format((float)$p['price'], 0, ',', '.');
                $replyText .= "• *{$p['name']}* ({$p['code']}) — {$priceFormatted} [Kondisi: " . strtoupper($p['condition_grade'] ?? 'Good') . "]\n";
            }

            $replyText .= "\nSemua barang di atas dijamin original copotan/grade pilihan. Mau langsung checkout atau tanya detail fisiknya?";

            return [
                'text' => $replyText,
                'suggested_products' => array_map(function ($p) {
                    return [
                        'id'            => $p['id'],
                        'code'          => $p['code'],
                        'name'          => $p['name'],
                        'slug'          => $p['slug'],
                        'price'         => (float)$p['price'],
                        'stock'         => (int)$p['stock'],
                        'primary_image' => $p['primary_thumb_path'] ?? $p['primary_image_path'] ?? null,
                    ];
                }, $products),
                'quick_replies' => [
                    'Lihat detail barang pertama',
                    'Ada part Ninja RR lainnya?',
                    'Chat WhatsApp Mas Wahyu'
                ],
                'fallback_to_whatsapp' => false
            ];
        }

        // 4. Default / Fallback jika tidak ada barang yang spesifik
        return [
            'text' => "Part yang kamu maksud saat ini belum ada di etalase web Bro, atau sedang dalam proses sortir di bengkel. Silakan chat langsung ke Mas Wahyu via WhatsApp untuk pre-order atau cek ketersediaan copotan unit baru!",
            'suggested_products' => [],
            'quick_replies' => [
                'Chat WhatsApp Owner',
                'Lihat Blok & Boring',
                'Lihat Knalpot Ready'
            ],
            'fallback_to_whatsapp' => true
        ];
    }

    public function search(string $query, ?string $motorType = null): array
    {
        $q = trim($query);
        $detectedMotor = null;

        if (preg_match('/\b(ninja\s*rr|rr)\b/i', $q)) {
            $detectedMotor = 'ninja-rr';
        } elseif (preg_match('/\b(ninja\s*ss|ss)\b/i', $q)) {
            $detectedMotor = 'ninja-ss';
        } elseif (preg_match('/\b(ninja\s*r|r)\b/i', $q)) {
            $detectedMotor = 'ninja-r';
        }

        $effectiveMotor = $motorType ?: $detectedMotor;

        $results = $this->productRepo->search([
            'q'          => $q,
            'motor_type' => $effectiveMotor,
            'per_page'   => 6,
        ]);

        $products = $results['data'] ?? [];

        return [
            'intent'            => 'catalog_search',
            'detected_category' => null,
            'detected_motor'    => $effectiveMotor,
            'products'          => array_map(function ($p) {
                return [
                    'id'            => $p['id'],
                    'code'          => $p['code'],
                    'name'          => $p['name'],
                    'slug'          => $p['slug'],
                    'price'         => (float)$p['price'],
                    'stock'         => (int)$p['stock'],
                    'status'        => $p['status'],
                    'condition'     => $p['condition_grade'] ?? 'good',
                    'primary_image' => $p['primary_thumb_path'] ?? $p['primary_image_path'] ?? null,
                ];
            }, $products),
            'explanation'       => count($products) > 0
                ? "Ditemukan " . count($products) . " sparepart sesuai kata kunci '{$q}'"
                : "Tidak ada produk yang persis cocok, silakan gunakan kata kunci umum seperti 'blok seher', 'karbu', atau 'knalpot'."
        ];
    }

    public function compatibility(int $productId, string $motorSlug): array
    {
        // Ambil data produk
        $product = $this->productRepo->findById($productId);
        if (!$product) {
            return [
                'compatible'   => false,
                'product_name' => 'Produk',
                'motor_name'   => $motorSlug,
                'explanation'  => 'Produk tidak ditemukan dalam database.',
                'notes'        => null,
            ];
        }

        // Ambil tipe motor yang kompatibel dari DB
        $stmt = $this->db->prepare(
            "SELECT mt.id, mt.name, mt.slug, pmt.is_primary
             FROM product_motor_types pmt
             JOIN motor_types mt ON mt.id = pmt.motor_type_id
             WHERE pmt.product_id = ?"
        );
        $stmt->execute([$productId]);
        $compatibles = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $matched = null;
        $allMotorNames = [];
        foreach ($compatibles as $c) {
            $allMotorNames[] = $c['name'];
            if ($c['slug'] === $motorSlug) {
                $matched = $c;
            }
        }

        $motorNameTarget = match ($motorSlug) {
            'ninja-rr' => 'Kawasaki Ninja 150 RR',
            'ninja-r'  => 'Kawasaki Ninja 150 R',
            'ninja-ss' => 'Kawasaki Ninja 150 SS',
            default    => strtoupper($motorSlug),
        };

        if ($matched) {
            return [
                'compatible'   => true,
                'product_name' => $product['name'],
                'motor_name'   => $matched['name'],
                'explanation'  => "Cocok 100% Plug & Play untuk {$matched['name']}. Part ini dirancang presisi sesuai spesifikasi motor Anda.",
                'notes'        => $product['compat_notes'] ?: 'Pemasangan PNP tanpa perlu modifikasi dudukan / braket.'
            ];
        }

        return [
            'compatible'   => false,
            'product_name' => $product['name'],
            'motor_name'   => $motorNameTarget,
            'explanation'  => "Kurang cocok / tidak langsung PNP untuk {$motorNameTarget}. Produk ini terdata khusus untuk: " . implode(', ', $allMotorNames) . ".",
            'notes'        => $product['compat_notes'] ?: 'Memerlukan penyesuaian braket atau konsultasikan terlebih dahulu dengan mekanik spesialis.'
        ];
    }

    public function describeProduct(array $imagePaths, ?string $notes = null, ?string $categoryName = null, ?string $productName = null): string
    {
        $cat = $categoryName ?: 'Suku Cadang';
        $title = $productName ?: ($cat . ' Original Kawasaki Ninja 2-Tak');
        $noteText = $notes ? trim($notes) : 'Kondisi barang mulus copotan unit normal, siap pasang.';

        return "Dijual {$title} copotan original bawaan motor Kawasaki Ninja 2-Tak.\n\n" .
               "Kondisi & Spesifikasi:\n" .
               "- Status: Original Part bawaan pabrik (bukan KW / lokalan)\n" .
               "- Fisik: Masih sangat presisi, drat aman, tidak ada retak/pecah\n" .
               "- Catatan teknis: {$noteText}\n" .
               "- Fungsi: 100% normal siap pakai (Plug and Play)\n\n" .
               "Garansi fisik sesuai foto. Stok hanya ada 1 unit karena barang bekas copotan pilihan. Silakan langsung checkout sebelum keduluan!";
    }
}
