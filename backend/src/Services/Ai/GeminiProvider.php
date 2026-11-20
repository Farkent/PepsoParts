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
        $this->apiKey   = (string)(Config::get('GEMINI_API_KEY') ?: Config::get('AI_API_KEY', ''));
        $this->model    = (string)(Config::get('AI_MODEL_TEXT') ?: Config::get('GEMINI_MODEL', 'gemini-1.5-flash'));
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
            $systemInstruction = "Anda adalah Asisten Virtual Ahli & Mekanik Konsultan resmi untuk 'PEPSO PARTS', toko dan bengkel spesialis suku cadang bekas original Kawasaki Ninja 150 2-Tak (Ninja R, RR, SS) milik Mas Wahyu Dwi Adrianto yang berlokasi di Sentul, Bogor. " .
                "Gaya komunikasi Anda: Ramah, santun namun akrab dengan bahasa komunitas pecinta motor Ninja 2-Tak (gunakan sapaan 'Bro' atau 'Mas'), solutif, paham teknis mesin 2-tak (Super KIPS, karburator PWK/PWL, blok silinder 1855/1878, oli samping, knalpot). " .
                "Anda dapat menjawab SEMUA pertanyaan seputar suku cadang, cara perawatan, masalah teknis motor 2-tak, konsultasi pembelian, informasi toko, maupun pertanyaan umum. " .
                "Jika pengguna menanyakan ketersediaan produk, rujuklah pada data stok katalog ready berikut ini. Jangan mengarang harga atau stok di luar data katalog:\n" .
                "Katalog Produk Ready Saat Ini:\n{$catalogContext}\n\n" .
                "Format output Anda HARUS berupa JSON valid tanpa teks lain di luar kurung kurawal, dengan format:\n" .
                "{\n" .
                '  "text": "Jawaban lengkap, informatif, dan ramah Anda", ' . "\n" .
                '  "suggested_product_ids": [1, 2], ' . "\n" .
                '  "quick_replies": ["pertanyaan singkat 1", "pertanyaan singkat 2", "pertanyaan singkat 3"], ' . "\n" .
                '  "fallback_to_whatsapp": false ' . "\n" .
                "}";

            $contents = [];
            foreach ($history as $h) {
                $role = ($h['role'] ?? 'user') === 'user' ? 'user' : 'model';
                $contents[] = [
                    'role'  => $role,
                    'parts' => [['text' => (string)($h['text'] ?? '')]]
                ];
            }

            $userPrompt = $message;
            if ($myMotorSlug) {
                $userPrompt .= " (Pengguna mengendarai motor: {$myMotorSlug})";
            }

            $contents[] = [
                'role'  => 'user',
                'parts' => [['text' => $userPrompt]]
            ];

            $response = $this->callGeminiApi($contents, $systemInstruction, jsonMode: true);
            
            // Clean markdown blocks if present
            $cleaned = trim($response);
            if (str_starts_with($cleaned, '```')) {
                $cleaned = preg_replace('/^```(?:json)?\s*/i', '', $cleaned);
                $cleaned = preg_replace('/\s*```$/', '', $cleaned);
                $cleaned = trim($cleaned);
            }

            $parsed = json_decode($cleaned, true);

            if (!is_array($parsed) || empty($parsed['text'])) {
                return $this->fallback->chat($message, $myMotorSlug, $history);
            }

            // Fetch suggested products by IDs
            $suggestedProducts = [];
            if (!empty($parsed['suggested_product_ids']) && is_array($parsed['suggested_product_ids'])) {
                $ids = array_map('intval', array_filter($parsed['suggested_product_ids'], 'is_numeric'));
                if (!empty($ids)) {
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
            }

            return [
                'text'                 => $parsed['text'],
                'suggested_products'   => $suggestedProducts,
                'quick_replies'        => $parsed['quick_replies'] ?? ['Konsultasi via WA Mas Wahyu', 'Cek Blok Seher', 'Cek Knalpot'],
                'fallback_to_whatsapp' => (bool)($parsed['fallback_to_whatsapp'] ?? false),
            ];
        } catch (\Throwable $e) {
            error_log("GeminiProvider::chat error: " . $e->getMessage());
            return $this->fallback->chat($message, $myMotorSlug, $history);
        }
    }

    public function search(string $query, ?string $motorType = null): array
    {
        return $this->fallback->search($query, $motorType);
    }

    public function compatibility(int $productId, string $motorSlug): array
    {
        return $this->fallback->compatibility($productId, $motorSlug);
    }

    public function describeProduct(array $imagePaths, ?string $notes = null, ?string $categoryName = null, ?string $productName = null): string
    {
        if (empty($this->apiKey)) {
            return $this->fallback->describeProduct($imagePaths, $notes, $categoryName, $productName);
        }

        try {
            $cat = $categoryName ?: 'Sparepart Kawasaki Ninja 2-Tak';
            $title = $productName ?: ($cat . ' Original');
            $prompt = "Buatkan deskripsi produk penjualan suku cadang motor bekas original untuk toko online 'PEPSO PARTS' (Milik Mas Wahyu Dwi Adrianto di Sentul).\n\n" .
                      "Nama Produk: {$title}\n" .
                      "Kategori: {$cat}\n" .
                      "Catatan Kondisi Fisik: " . ($notes ?: 'Original copotan normal mulus, drat dan sirip aman') . "\n\n" .
                      "Instruksi Penulisan:\n" .
                      "1. Tulis dalam Bahasa Indonesia yang profesional, jujur, meyakinkan para penghobi motor Ninja 2-Tak.\n" .
                      "2. Susun dengan format rapi (Pembuka, Poin Keaslian OEM, Kondisi Fisik & Drat, Jaminan PNP, dan Himbauan Checkout).\n" .
                      "3. Berikan penekanan bahwa barang copotan stoknya sangat terbatas.";

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

    private function callGeminiApi(array $contents, ?string $systemInstruction = null, bool $jsonMode = false): string
    {
        $url = "https://generativelanguage.googleapis.com/v1beta/models/{$this->model}:generateContent?key={$this->apiKey}";

        $payload = [
            'contents' => $contents,
            'generationConfig' => [
                'temperature'     => 0.5,
                'maxOutputTokens' => 1000,
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
            CURLOPT_TIMEOUT        => 15,
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
