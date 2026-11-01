<?php

declare(strict_types=1);

namespace Pepso\Controllers;

use Pepso\Core\Request;
use Pepso\Core\Response;
use Pepso\Repositories\OrderRepository;
use Pepso\Repositories\SettingsRepository;

class OrderController
{
    private OrderRepository   $orders;
    private SettingsRepository $settings;

    public function __construct()
    {
        $this->orders   = new OrderRepository();
        $this->settings = new SettingsRepository();
    }

    // ─── POST /api/cart/validate ──────────────────────────────────────────────

    public function validateCart(Request $req, Response $res): void
    {
        $body  = $req->getBody();
        $items = $body['items'] ?? [];

        if (!is_array($items)) {
            $res->json(['success' => false, 'message' => 'Format item tidak valid.'], 400);
            return;
        }

        $db = \Pepso\Core\Database::getConnection();
        $validated = [];
        $allValid = true;

        foreach ($items as $item) {
            $productId = (int)($item['product_id'] ?? 0);
            $qty       = (int)($item['quantity'] ?? 1);

            $stmt = $db->prepare(
                "SELECT id, name, price, stock, status FROM products WHERE id = ? AND deleted_at IS NULL"
            );
            $stmt->execute([$productId]);
            $p = $stmt->fetch(\PDO::FETCH_ASSOC);

            if (!$p) {
                $allValid = false;
                $validated[] = [
                    'product_id' => $productId,
                    'valid'      => false,
                    'error'      => 'Produk sudah tidak tersedia.',
                ];
                continue;
            }

            $isAvailable = $p['status'] === 'available' && (int)$p['stock'] >= $qty;
            if (!$isAvailable) {
                $allValid = false;
            }

            $validated[] = [
                'product_id' => $productId,
                'valid'      => $isAvailable,
                'name'       => $p['name'],
                'price'      => (float)$p['price'],
                'stock'      => (int)$p['stock'],
                'status'     => $p['status'],
                'error'      => !$isAvailable 
                    ? ($p['status'] !== 'available' ? 'Produk sudah habis/tidak aktif.' : "Sisa stok hanya {$p['stock']}.")
                    : null,
            ];
        }

        $res->json([
            'success'   => true,
            'all_valid' => $allValid,
            'items'     => $validated,
        ]);
    }

    // ─── POST /api/orders ─────────────────────────────────────────────────────

    public function createOrder(Request $req, Response $res): void
    {
        $body = $req->getBody();

        // Honeypot check — must be absent or empty
        if (!empty($body['website'])) {
            $res->json(['success' => false, 'message' => 'Bad request.'], 400);
            return;
        }

        // Validate required fields
        $errors = [];
        $name = trim($body['customer_name'] ?? '');
        $wa   = trim($body['customer_whatsapp'] ?? '');
        $addr = trim($body['customer_address'] ?? '');
        $note = trim($body['customer_note'] ?? '');

        if ($name === '') {
            $errors['customer_name'] = 'Nama tidak boleh kosong.';
        }
        if ($wa === '') {
            $errors['customer_whatsapp'] = 'Nomor WhatsApp tidak boleh kosong.';
        } else {
            $wa = $this->normalizeWhatsApp($wa);
            if (!$wa) {
                $errors['customer_whatsapp'] = 'Format nomor WhatsApp tidak valid.';
            }
        }
        if ($addr === '') {
            $errors['customer_address'] = 'Alamat tidak boleh kosong.';
        }

        $items = $body['items'] ?? [];
        if (!is_array($items) || count($items) === 0) {
            $errors['items'] = 'Keranjang belanja kosong.';
        } else {
            foreach ($items as $i => $item) {
                if (empty($item['product_id']) || !is_numeric($item['product_id'])) {
                    $errors["items.{$i}.product_id"] = 'ID produk tidak valid.';
                }
                $qty = (int)($item['quantity'] ?? 0);
                if ($qty < 1 || $qty > 999) {
                    $errors["items.{$i}.quantity"] = 'Jumlah produk harus antara 1-999.';
                }
            }
        }

        if (!empty($errors)) {
            $res->json(['success' => false, 'message' => 'Validasi gagal.', 'errors' => $errors], 422);
            return;
        }

        try {
            $result = $this->orders->createOrder([
                'customer_name'      => $name,
                'customer_whatsapp'  => $wa,
                'customer_address'   => $addr,
                'customer_note'      => $note,
                'items'              => $items,
            ]);

            // Build WhatsApp URL to admin
            $settings    = $this->settings->getAll();
            $adminWa     = $settings['whatsapp_number'] ?? '';
            $storeName   = $settings['store_name'] ?? 'PEPSO PARTS';
            $waMessage   = "Halo {$storeName}! Saya telah membuat pesanan dengan kode *{$result['order_code']}*. " .
                           "Mohon dikonfirmasi. Terima kasih! 🛵";
            $waUrl       = $adminWa
                ? 'https://wa.me/' . preg_replace('/\D/', '', $adminWa) .
                  '?text=' . rawurlencode($waMessage)
                : null;

            $res->json([
                'success' => true,
                'message' => 'Pesanan berhasil dibuat.',
                'data'    => [
                    'order_code'   => $result['order_code'],
                    'public_token' => $result['public_token'],
                    'total_amount' => $result['total_amount'],
                    'whatsapp_url' => $waUrl,
                ],
            ], 201);
        } catch (\RuntimeException $e) {
            $res->json(['success' => false, 'message' => $e->getMessage()], 409);
        } catch (\Throwable $e) {
            error_log('OrderController::createOrder error: ' . $e->getMessage());
            $res->json(['success' => false, 'message' => 'Terjadi kesalahan server.'], 500);
        }
    }

    // ─── GET /api/orders/{code}?token={token} ─────────────────────────────────

    public function trackOrder(Request $req, Response $res, array $params): void
    {
        $code  = trim($params['code'] ?? '');
        $token = trim($req->getQuery('token') ?? '');

        if ($code === '' || $token === '') {
            $res->json(['success' => false, 'message' => 'Parameter tidak lengkap.'], 400);
            return;
        }

        $order = $this->orders->findByCode($code, $token);

        if (!$order) {
            $res->json(['success' => false, 'message' => 'Pesanan tidak ditemukan.'], 404);
            return;
        }

        // Remove sensitive token from public response
        unset($order['public_token']);

        $res->json(['success' => true, 'data' => $order]);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    /**
     * Normalize WhatsApp number to 628xxxxxxxxx format.
     * Returns false if format is invalid.
     */
    private function normalizeWhatsApp(string $number): string|false
    {
        $number = preg_replace('/\D/', '', $number);

        if (str_starts_with($number, '62')) {
            // already international
        } elseif (str_starts_with($number, '0')) {
            $number = '62' . substr($number, 1);
        } elseif (str_starts_with($number, '8')) {
            $number = '62' . $number;
        } else {
            return false;
        }

        // Must be 10–15 digits after prefix
        if (strlen($number) < 10 || strlen($number) > 15) {
            return false;
        }

        return $number;
    }
}

