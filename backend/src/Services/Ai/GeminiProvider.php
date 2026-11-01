<?php

declare(strict_types=1);

namespace Pepso\Services\Ai;

use Pepso\Core\Config;
use Pepso\Core\Database;
use Pepso\Repositories\ProductRepository;
use PDO;
use RuntimeException;

class GeminiProvider implements AiProviderInterface
{
    private string $apiKey;
    private string $model;
    private MockProvider $fallback;
    private PDO $db;

    public function __construct()
    {
        $this->apiKey   = Config::get('GEMINI_API_KEY', '');
        $this->model    = Config::get('GEMINI_MODEL', 'gemini-1.5-flash');
        $this->fallback = new MockProvider();
        $this->db       = Database::getConnection();
    }

    public function chat(string $message, ?string $myMotorSlug = null, array $history = []): array
    {
        if (empty($this->apiKey)) {
            return $this->fallback->chat($message, $myMotorSlug, $history);
        }

        try {
            $catalogContext = $this->getCatalogContext();
            $systemInstruction = "Anda adalah Asisten Virtual cerdas untuk 'PEPSO PARTS', toko spesialis suku cadang dan sparepart bekas original Kawasaki Ninja 2-Tak (Ninja R, RR, SS) milik Mas Wahyu Dwi Adrianto di Sentul, Bogor. " .
                "Jawab dengan ramah, bergaya anak motor/komunitas Ninja 2-Tak, informatif, dan padat. Jangan pernah mengarang produk atau harga yang tidak ada di katalog. " .
                "Katalog Produk Ready Saat Ini:\n{$catalogContext}\n" .
                "Format output Anda HARUS berupa JSON murni dengan format:\n" .
                "{\n" .
                '  "text": "jawaban penjelasan Anda", ' . "\n" .
                '  "suggested_product_ids": [1, 2], ' . "\n" .
                '  "quick_replies": ["pertanyaan 1", "pertanyaan 2"], ' . "\n" .
                '  "fallback_to_whatsapp": false ' . "\n" .
                "}";

            $contents = [];
            foreach ($history as $h) {
                $role = ($h['role'] ?? 'user') === 'user' ? 'user' : 'model';
                $contents[] = [
                    'role'  => $role,
                    'parts' => [['text' => $h['text'] ?? '']]
                ];
            }
            $userPrompt = $message . ($myMotorSlug ? " (Motor pengguna: {$myMotorSlug})" : "");
            $contents[] = [
                'role'  => 'user',
                'parts' => [['text' => $userPrompt]]
            ];

            $response = $this->callGeminiApi($contents, $systemInstruction, jsonMode: true);
            $parsed = json_decode($response, true);

            if (!is_array($parsed) || empty($parsed['text'])) {
                return $this->fallback->chat($message, $myMotorSlug, $history);
            }

            // Fetch suggested products
            $suggestedProducts = [];
            if (!empty($parsed['suggested_product_ids']) && is_array($parsed['suggested_product_ids'])) {
                $ids = array_map('intval', $parsed['suggested_product_ids']);
                $placeholders = implode(',', array_fill(0, count($ids), '?'));
                $stmt = $this->db->prepare(
                    "SELECT p.id, p.code, p.name, p.slug, p.price, p.stock,
                            (SELECT thumb_path FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image
                     FROM products p
                     WHERE p.id IN ({$placeholders}) AND p.deleted_at IS NULL"
                );
                $stmt->execute($ids);
                $suggestedProducts = $stmt->fetchAll(PDO::FETCH_ASSOC);
            }

            return [
                'text'                 => $parsed['text'],
                'suggested_products'   => $suggestedProducts,
                'quick_replies'        => $parsed['quick_replies'] ?? ['Blok Seher', 'Knalpot', 'Tanya WA Mas Wahyu'],
                'fallback_to_whatsapp' => (bool)($parsed['fallback_to_whatsapp'] ?? false),
            ];
        } catch (\Throwable $e) {
            error_log("GeminiProvider::chat error: " . $e->getMessage());
            return $this->fallback->chat($message, $myMotorSlug, $history);
        }
    }

    public function search(string $query, ?string $motorType = null): array
    {
        // For search, MockProvider leverages SQL fulltext + synonyms which is deterministic and accurate
        return $this->fallback->search($query, $motorType);
    }

    public function compatibility(int $productId, string $motorSlug): array
    {
        // Compatibility check is strictly deterministic from database relations
        return $this->fallback->compatibility($productId, $motorSlug);
    }

    public function describeProduct(array $imagePaths, ?string $notes = null, ?string $categoryName = null, ?string $productName = null): string
    {
        if (empty($this->apiKey)) {
            return $this->fallback->describeProduct($imagePaths, $notes, $categoryName, $productName);
        }

        try {
            $cat = $categoryName ?: 'Sparepart Ninja 2-Tak';
            $title = $productName ?: ($cat . ' Original');
            $prompt = "Buatkan deskripsi produk penjualan yang profesional, meyakinkan, dan ramah untuk e-commerce suku cadang motor bekas 'PEPSO PARTS'.\n" .
                      "Nama Produk: {$title}\n" .
                      "Kategori: {$cat}\n" .
                      "Catatan Kondisi dari Mekanik: " . ($notes ?: 'Original copotan normal mulus') . "\n\n" .
                      "Tuliskan dalam Bahasa Indonesia dengan format rapi (bullet point kelebihan, kondisi fisik, fungsi, dan jaminan PNP). Hindari kata-kata lebay.";

            $contents = [
                [
                    'role'  => 'user',
                    'parts' => [['text' => $prompt]]
                ]
            ];

            $response = $this->callGeminiApi($contents, jsonMode: false);
            return trim($response);
        } catch (\Throwable $e) {
            error_log("GeminiProvider::describeProduct error: " . $e->getMessage());
            return $this->fallback->describeProduct($imagePaths, $notes, $categoryName, $productName);
        }
    }

    // ─── Gemini HTTP Client ───────────────────────────────────────────────────

    private function callGeminiApi(array $contents, ?string $systemInstruction = null, bool $jsonMode = false): string
    {
        $url = "https://generativelanguage.googleapis.com/v1beta/models/{$this->model}:generateContent?key={$this->apiKey}";

        $payload = [
            'contents' => $contents,
            'generationConfig' => [
                'temperature'     => 0.4,
                'maxOutputTokens' => 800,
            ]
        ];

        if ($jsonMode) {
            $payload['generationConfig']['responseMimeType'] = 'application/json';
        }

        if ($systemInstruction) {
            $payload['systemInstruction'] = [
                'parts' => [['text' => $systemInstruction]]
            ];
        }

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => json_encode($payload),
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
            CURLOPT_TIMEOUT        => 10,
        ]);

        $result   = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlErr  = curl_error($ch);
        curl_close($ch);

        if ($curlErr) {
            throw new RuntimeException("cURL Gemini error: {$curlErr}");
        }

        if ($httpCode !== 200) {
            throw new RuntimeException("Gemini API HTTP status {$httpCode}: {$result}");
        }

        $data = json_decode($result, true);
        $candidateText = $data['candidates'][0]['content']['parts'][0]['text'] ?? '';

        if (!$candidateText) {
            throw new RuntimeException("Respon Gemini kosong atau tidak valid.");
        }

        return $candidateText;
    }

    private function getCatalogContext(): string
    {
        $stmt = $this->db->query(
            "SELECT p.id, p.code, p.name, p.price, p.stock, c.name as category
             FROM products p
             LEFT JOIN categories c ON c.id = p.category_id
             WHERE p.status = 'available' AND p.deleted_at IS NULL
             ORDER BY p.id ASC
             LIMIT 30"
        );
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $out = "";
        foreach ($rows as $r) {
            $price = number_format((float)$r['price'], 0, ',', '.');
            $out .= "- ID: {$r['id']} | Kode: {$r['code']} | {$r['name']} | Kategori: {$r['category']} | Harga: Rp{$price} | Stok: {$r['stock']}\n";
        }
        return $out;
    }
}
