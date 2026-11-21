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

        // 1. Sapaan / Greeting
        if (preg_match('/\b(halo|hai|assalamu|pagi|siang|sore|malam|permisi|bang|mas|bro|gan)\b/i', $msgLower) && strlen($msgLower) < 30) {
            return [
                'text' => "Halo Bro! Selamat datang di PEPSO PARTS — bengkel dan penyedia sparepart bekas original Kawasaki Ninja 2-Tak (Ninja R, RR, SS) milik Mas Wahyu Dwi Adrianto di Sentul, Bogor. Ada sparepart yang lagi dicari atau mau konsultasi seputar mesin Ninja 2T Bro?",
                'suggested_products' => $this->getFeaturedProducts(2),
                'quick_replies' => [
                    'Blok Seher Ninja RR',
                    'Cara rawat Super KIPS',
                    'Rekomendasi oli samping',
                    'Lokasi bengkel Sentul'
                ],
                'fallback_to_whatsapp' => false
            ];
        }

        // 2. Pertanyaan Lokasi / Alamat / Bengkel / Jam Buka
        if (preg_match('/\b(lokasi|alamat|bengkel|toko|sentul|bogor|maps|posisi|buka|tutup|jam operasional)\b/i', $msgLower)) {
            return [
                'text' => "Bengkel dan gudang PEPSO PARTS berlokasi di area Sentul, Babakan Madang, Kabupaten Bogor (Dekat Sirkuit Sentul). Buka Senin–Sabtu pukul 09.00 - 17.00 WIB (Minggu janjian dulu). Mau mampir langsung untuk cek fisik barang atau kirim via ekspedisi ke seluruh Indonesia bisa banget Bro!",
                'suggested_products' => [],
                'quick_replies' => [
                    'Hubungi via WhatsApp',
                    'Lihat Katalog Ready',
                    'Tanya Pengiriman Luar Kota'
                ],
                'fallback_to_whatsapp' => true
            ];
        }

        // 3. Super KIPS (Perawatan, macet, fungsi, setting)
        if (preg_match('/\b(kips|super kips|superkips|macet|nyangkut|katup|valves|valve)\b/i', $msgLower)) {
            return [
                'text' => "Tips Super KIPS dari Mas Wahyu Bro:\n\n" .
                          "1. *Karakter KIPS:* Katup Super KIPS normalnya mulai membuka di putaran 7.000 RPM. Sensasinya motor bakal ngejambak kuat.\n" .
                          "2. *Penyebab Macet:* Kerak oli samping dan sisa karbon pembakaran menumpuk di batang katup/gigi pemutar.\n" .
                          "3. *Perawatan Rutin:* Bersihkan rumah katup KIPS pakai karbu cleaner atau bensin tiap 3.000-5.000 km. Pastikan oli samping tidak terlalu pekat atau berkualitas jelek.\n" .
                          "4. *Gigi KIPS Rompal:* Kalau macet parah jangan dipaksa puntir gas tinggi karena gigi as kips bisa rompal. Kami ada stok katup & blok kips original copotan jika butuh penggantian Bro!",
                'suggested_products' => $this->findProductsByKeyword('kips'),
                'quick_replies' => [
                    'Cek Blok Silinder Super KIPS',
                    'Rekomendasi Oli Samping',
                    'Konsultasi via WhatsApp'
                ],
                'fallback_to_whatsapp' => false
            ];
        }

        // 4. Rekomendasi Oli Samping & Rasio Bensin
        if (preg_match('/\b(oli|olsam|oli samping|takaran|motul|idemitsu|castrol|enviro|asap)\b/i', $msgLower)) {
            return [
                'text' => "Panduan Oli Samping Ninja 2-Tak ala PEPSO PARTS:\n\n" .
                          "• *Harian Standar:* Motul 510, Idemitsu 2T, Castrol Power 1 2T, atau Pertamina Enviro 2T (aroma wangi, kerak rendah).\n" .
                          "• *Touring / Spek Porting:* Motul 710, Ipone Samourai, Castrol A747, atau Shell Advance Ultra 2T.\n" .
                          "• *Setelan Pompa Oli:* Pastikan pompa oli samping aktif normal. Kalau main campur tangki (pre-mix), takarannya sekitar 25ml - 30ml per 1 liter bensin.\n" .
                          "• *Asap Terlalu Pekat:* Biasanya setelan pompa oli terlalu boros atau packing kruk as bocor menyedot oli mesin.",
                'suggested_products' => [],
                'quick_replies' => [
                    'Blok Seher Standar',
                    'Karburator PWK 28',
                    'Tanya Settingan ke Mas Wahyu'
                ],
                'fallback_to_whatsapp' => false
            ];
        }

        // 5. Perbedaan Blok Silinder (1855 vs 1878 vs Blok Boringan)
        if (preg_match('/\b(1855|1878|blok|boring|silinder|seher|piston|oversize|ob|obsh|overbos)\b/i', $msgLower)) {
            return [
                'text' => "Perbedaan Blok Ninja 2-Tak yang sering ditanyakan Bro:\n\n" .
                          "• *Blok 1855 Gold (Thailand):* Blok legendaris Ninja RR/R era CBU & CKD awal. Material liner Electrofusion sangat licin dan tahan panas, kompresi padat, tenaga atas galak.\n" .
                          "• *Blok 1878 (Lokal):* Blok bawaan Ninja RR New era KMI lokal. Karakternya lebih ramah harian dengan efisiensi bahan bakar yang baik.\n" .
                          "• *Catatan Penting:* Blok orisinil Ninja tidak bisa dikorter (harus ganti seher satu set/ganti blok jika baret dalam), kecuali di-overbos (OB) liner baja. Di PEPSO PARTS, kami mengutamakan blok orisinil copotan tanpa overbos!",
                'suggested_products' => $this->findProductsByKeyword('blok'),
                'quick_replies' => [
                    'Lihat Stok Blok 1855',
                    'Lihat Stok Blok 1878',
                    'Tanya Kondisi Blok ke WA'
                ],
                'fallback_to_whatsapp' => false
            ];
        }

        // 6. Karburator & Settingan Jetting (PWK, PWL, Mikuni)
        if (preg_match('/\b(karbu|karburator|pwk|pwl|sudco|pj|mj|pilot jet|main jet|mbrebet|ngorok|boros)\b/i', $msgLower)) {
            return [
                'text' => "Tips Karburator Ninja 150 2-Tak:\n\n" .
                          "• *PWL 26 (Standar Ninja R/SS):* Irit, langsam stabil, sangat cocok untuk pemakaian harian santai.\n" .
                          "• *Mikuni VM 28 (Standar Ninja RR):* Karbu bawaan RR dengan karakter nafas panjang.\n" .
                          "• *Keihin PWK 28 (Sudco / KX85):* Favorit buat yang suka tarikan spontan dan nafas atas melesat. Respon skep semi-flat langsung instan.\n" .
                          "• *Tips Mbrebet:* Periksa busi, bersihkan pilot jet, dan cek karet intake dari kebocoran angin palsu. Kami ready karbu copotan orisinil siap pakai Bro!",
                'suggested_products' => $this->findProductsByKeyword('karburator'),
                'quick_replies' => [
                    'Lihat Karburator PWK 28',
                    'Lihat Karburator PWL 26',
                    'Chat Mas Wahyu'
                ],
                'fallback_to_whatsapp' => false
            ];
        }

        // 7. Knalpot & Suara Garing
        if (preg_match('/\b(knalpot|muffler|garing|racing|telo|perut|silincer|bobok)\b/i', $msgLower)) {
            return [
                'text' => "Pilihan Knalpot Ninja 2-Tak di PEPSO PARTS:\n\n" .
                          "• *Knalpot Standar Copotan:* Suara adem khas pabrik, aman dari tilang, tenaga bawah padat.\n" .
                          "• *Knalpot Standar Bobokan:* Tampilan tetap standar kaleng tapi suara garing gemrincing khas 2-tak dan nafas lebih lega.\n" .
                          "• *Knalpot Racing Perut 40/41:* Bahan galvanis / stainless dengan silincer alu/karbon buat putaran atas maksimal.",
                'suggested_products' => $this->findProductsByKeyword('knalpot'),
                'quick_replies' => [
                    'Knalpot Standar Ninja RR',
                    'Knalpot Racing Harian',
                    'Tanya Ongkir Knalpot'
                ],
                'fallback_to_whatsapp' => false
            ];
        }

        // 8. Pengiriman, Ekspedisi, Packing, Garansi & COD
        if (preg_match('/\b(kirim|ekspedisi|ongkir|jne|jnt|cargo|packing|kayu|garansi|cod|rekber|bayar|transfer)\b/i', $msgLower)) {
            return [
                'text' => "Informasi Pengiriman & Transaksi PEPSO PARTS:\n\n" .
                          "• *Pengiriman:* Melayani kirim ke seluruh pelosok Indonesia via JNE, J&T, SiCepat, atau Cargo (Indah/Baraka) untuk barang berat seperti blok mesin/knalpot.\n" .
                          "• *Packing Aman:* Menggunakan kardus tebal, bubble wrap berlapis, dan opsi packing kayu untuk blok silinder agar sirip tidak patah.\n" .
                          "• *Garansi:* Barang dipastikan sesuai foto & deskripsi. Sebelum dikirim kami fotokan/videokan kondisi detailnya via WhatsApp.\n" .
                          "• *Pembayaran:* Transfer bank langsung atau COD langsung di bengkel Sentul.",
                'suggested_products' => [],
                'quick_replies' => [
                    'Cek Ongkir via WhatsApp',
                    'Lokasi Bengkel Sentul',
                    'Lihat Semua Katalog'
                ],
                'fallback_to_whatsapp' => true
            ];
        }

        // 9. Cari produk langsung di database jika user mengetik nama part
        $searchResults = $this->productRepo->search([
            'q'          => $message,
            'motor_type' => $myMotorSlug,
            'status'     => 'available',
            'per_page'   => 3,
        ]);

        $products = $searchResults['data'] ?? [];

        if (!empty($products)) {
            $count = count($products);
            $motorNote = $myMotorSlug ? " yang cocok untuk " . strtoupper($myMotorSlug) : "";
            $replyText = "Kami punya {$count} barang rekomendasi{$motorNote} yang cocok dengan pencarianmu Bro:\n\n";

            foreach ($products as $p) {
                $priceFormatted = 'Rp ' . number_format((float)$p['price'], 0, ',', '.');
                $replyText .= "• *{$p['name']}* ({$p['code']}) — {$priceFormatted} [Kondisi: " . strtoupper($p['condition_grade'] ?? 'Good') . "]\n";
            }

            $replyText .= "\nSemua barang di atas dijamin original copotan pilihan Mas Wahyu. Mau langsung checkout atau tanya detail fisiknya Bro?";

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
                    'Bisa nego via WhatsApp?',
                    'Beli via Keranjang Belanja',
                    'Tanya Part Lainnya'
                ],
                'fallback_to_whatsapp' => false
            ];
        }

        // 10. Jawaban Umum Cerdas & Ramah (Mampu menjawab apa pun seputar Ninja 2-Tak dan bengkel)
        return [
            'text' => "Pertanyaan bagus Bro! Soal '{$message}', di PEPSO PARTS kami fokus pada suku cadang bekas original copotan dan restorasi performa Kawasaki Ninja 150 2-Tak (Ninja R, RR, SS).\n\n" .
                      "Kalau barang yang kamu maksud belum ada di etalase web, bisa jadi unit motor bahan baru masuk dan lagi proses pembongkaran di bengkel Sentul. Kamu bisa langsung ngobrol bareng Mas Wahyu di WhatsApp untuk tanya stok gudang, konsultasi kecocokan part, atau request barang copotan tertentu!",
            'suggested_products' => $this->getFeaturedProducts(2),
            'quick_replies' => [
                'Chat WhatsApp Mas Wahyu',
                'Cek Stok Blok Seher',
                'Cek Stok Knalpot',
                'Lokasi Bengkel Sentul'
            ],
            'fallback_to_whatsapp' => true
        ];
    }

    private function getFeaturedProducts(int $limit = 2): array
    {
        try {
            $stmt = $this->db->prepare(
                "SELECT p.id, p.code, p.name, p.slug, p.price, p.stock,
                        (SELECT thumb_path FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image
                 FROM products p
                 WHERE p.status = 'available' AND p.deleted_at IS NULL
                 ORDER BY p.id DESC
                 LIMIT ?"
            );
            $stmt->bindValue(1, $limit, PDO::PARAM_INT);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
        } catch (\Throwable $e) {
            return [];
        }
    }

    private function findProductsByKeyword(string $keyword, int $limit = 3): array
    {
        try {
            $stmt = $this->db->prepare(
                "SELECT p.id, p.code, p.name, p.slug, p.price, p.stock,
                        (SELECT thumb_path FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image
                 FROM products p
                 WHERE p.name LIKE ? AND p.status = 'available' AND p.deleted_at IS NULL
                 LIMIT ?"
            );
            $stmt->bindValue(1, '%' . $keyword . '%', PDO::PARAM_STR);
            $stmt->bindValue(2, $limit, PDO::PARAM_INT);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
        } catch (\Throwable $e) {
            return [];
        }
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
        $noteText = $notes ? trim($notes) : 'Kondisi barang mulus copotan unit normal, drat dan sirip aman, siap pasang.';

        return "Dijual {$title} copotan original bawaan motor Kawasaki Ninja 2-Tak (Kondisi Istimewa Pilihan Mas Wahyu PEPSO PARTS).\n\n" .
               "Kondisi Fisik & Spesifikasi:\n" .
               "• Keaslian: 100% Original Kawasaki OEM bawaan motor (Bukan part variasi murah / KW)\n" .
               "• Keutuhan: Fisik terawat, drat baut utuh, sirip pendingin tidak ada yang patah, tidak ada retak/pecah\n" .
               "• Catatan Mekanik: {$noteText}\n" .
               "• Kompatibilitas: Plug & Play presisi untuk tunggangan Ninja 150 kesayangan Anda\n\n" .
               "Jaminan barang sesuai deskripsi dan foto detail. Stok sangat terbatas (hanya 1 unit per seri copotan). Silakan langsung amankan order atau konsultasi pemasangan via WhatsApp!";
    }
}
