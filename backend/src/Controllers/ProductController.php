<?php

declare(strict_types=1);

namespace Pepso\Controllers;

use Pepso\Core\Request;
use Pepso\Core\Response;
use Pepso\Repositories\ProductRepository;
use Pepso\Repositories\SettingsRepository;
use Pepso\Services\ProductCodeService;

class ProductController
{
    private ProductRepository $repo;
    private SettingsRepository $settings;

    public function __construct()
    {
        $this->repo     = new ProductRepository();
        $this->settings = new SettingsRepository();
    }

    /** GET /api/products */
    public function index(Request $request): void
    {
        $params = $request->getQueryParams();
        $result = $this->repo->search($params);

        Response::json(
            $result['data'],
            200,
            [
                'page'     => $result['page'],
                'per_page' => $result['per_page'],
                'total'    => $result['total'],
                'pages'    => (int)ceil($result['total'] / $result['per_page']),
            ]
        );
    }

    /** GET /api/products/{slugOrCode} */
    public function show(Request $request, array $params): void
    {
        $slugOrCode = $params['slugOrCode'] ?? '';
        if ($slugOrCode === '') {
            Response::error('Parameter tidak valid.', 'INVALID_PARAM', 400);
        }

        $product = $this->repo->findBySlugOrCode($slugOrCode);
        if (!$product) {
            Response::error("Produk '{$slugOrCode}' tidak ditemukan.", 'PRODUCT_NOT_FOUND', 404);
        }

        Response::json($product);
    }

    /** GET /api/products/{id}/related */
    public function related(Request $request, array $params): void
    {
        $id = (int)($params['id'] ?? 0);
        $product = $this->repo->findById($id, true);

        if (!$product) {
            Response::json([]);
            return;
        }

        $motorTypes = $this->repo->getMotorTypes($id);
        $motorTypeIds = array_column($motorTypes, 'id');

        $candidates = $this->repo->getRelatedCandidates(
            $id,
            $motorTypeIds,
            $product['category_id'],
            4
        );

        // Tambahkan alasan sederhana (rule-based untuk fase ini; bisa digantikan AI di fase 5)
        $related = array_map(function ($item) use ($product) {
            $item['reason'] = 'Cocok dengan tipe motor yang sama, beda kategori';
            return $item;
        }, $candidates);

        Response::json($related);
    }

    /** GET /api/share/{slug} - HTML Open Graph untuk crawler media sosial */
    public function shareOg(Request $request, array $params): void
    {
        $slug = $params['slug'] ?? '';
        $product = $this->repo->findBySlugOrCode($slug);

        if (!$product) {
            http_response_code(404);
            header('Content-Type: text/html; charset=utf-8');
            echo '<html><body><h1>Produk tidak ditemukan</h1></body></html>';
            exit;
        }

        $storeName = $this->settings->get('store_name', 'PEPSO PARTS');
        $waNumber  = $this->settings->get('whatsapp_number', '');
        $appUrl    = \Pepso\Core\Config::get('APP_URL', 'http://localhost:5173');

        $title    = htmlspecialchars($product['name'] . ' - ' . $product['code'] . ' | ' . $storeName, ENT_QUOTES);
        $harga    = 'Rp' . number_format((int)$product['price'], 0, ',', '.');
        $grade    = match ($product['condition_grade']) {
            'excellent' => 'Mulus',
            'good'      => 'Bagus',
            'fair'      => 'Normal',
            'poor'      => 'Minus',
            default     => $product['condition_grade'],
        };
        $pct = $product['condition_percent'] ? ' ' . $product['condition_percent'] . '%' : '';
        $desc = htmlspecialchars("Harga: {$harga} | Kondisi: {$grade}{$pct} | {$product['category_name']} - Kawasaki Ninja 2-Tak", ENT_QUOTES);

        $imageUrl = '';
        if (!empty($product['primary_image'])) {
            $img = $product['primary_image'];
            $imageUrl = str_starts_with($img, 'http') ? $img : rtrim($appUrl, '/') . $img;
        }

        $productUrl = rtrim($appUrl, '/') . '/produk/' . urlencode($product['slug']);
        $waUrl      = "https://wa.me/{$waNumber}?text=" . urlencode(
            "Halo PEPSO PARTS, saya tertarik dengan:\n"
            . $product['name'] . " (Kode: " . $product['code'] . ")\n"
            . "Harga: {$harga}\n"
            . "Link: {$productUrl}"
        );

        $html = <<<HTML
<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{$title}</title>
<meta name="description" content="{$desc}">
<!-- Open Graph / Facebook / WhatsApp -->
<meta property="og:type" content="product">
<meta property="og:url" content="{$productUrl}">
<meta property="og:title" content="{$title}">
<meta property="og:description" content="{$desc}">
<meta property="og:image" content="{$imageUrl}">
<meta property="og:image:width" content="800">
<meta property="og:image:height" content="600">
<meta property="og:site_name" content="{$storeName}">
<meta property="og:locale" content="id_ID">
<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{$title}">
<meta name="twitter:description" content="{$desc}">
<meta name="twitter:image" content="{$imageUrl}">
<!-- Product Price Meta -->
<meta property="product:price:amount" content="{$product['price']}">
<meta property="product:price:currency" content="IDR">
<!-- Redirect pengguna biasa ke SPA React -->
<script>
  var ua = navigator.userAgent || '';
  var crawlers = /facebookexternalhit|WhatsApp|Twitterbot|TelegramBot|Slackbot|LinkedInBot/i;
  if (!crawlers.test(ua)) {
    window.location.replace('{$productUrl}');
  }
</script>
</head>
<body style="font-family:sans-serif;max-width:600px;margin:40px auto;padding:20px;">
  <h1 style="color:#111214">{$title}</h1>
  <p style="color:#656770">{$desc}</p>
  <p><a href="{$productUrl}" style="color:#F05A22;font-weight:bold">Lihat di katalog PEPSO PARTS</a></p>
  <p><a href="{$waUrl}" style="background:#25D366;color:white;padding:10px 20px;text-decoration:none;display:inline-block">Pesan via WhatsApp</a></p>
</body>
</html>
HTML;

        Response::html($html);
    }
}

