<?php

declare(strict_types=1);

namespace Pepso\Controllers;

use Pepso\Core\Database;
use Pepso\Core\Request;
use Pepso\Core\Response;
use Pepso\Repositories\ProductRepository;

class AdminDashboardController
{
    private ProductRepository $productRepo;

    public function __construct()
    {
        $this->productRepo = new ProductRepository();
    }

    public function index(Request $request): void
    {
        $db = Database::getConnection();

        // 1. Hitung statistik produk
        $productStats = $this->productRepo->getDashboardStats();
        $total = (int)$productStats['total'];
        $available = (int)$productStats['available'];
        $sold = (int)$productStats['sold'];

        $availPct = $total > 0 ? (int)round(($available / $total) * 100) : 0;
        $soldPct  = $total > 0 ? (int)round(($sold / $total) * 100) : 0;

        // 2. Hitung pesanan baru
        $stmtNewOrders = $db->query("SELECT COUNT(*) FROM orders WHERE status = 'new'");
        $newOrdersCount = (int)$stmtNewOrders->fetchColumn();

        // 3. Produk terbaru (6 produk)
        $latestProductsResult = $this->productRepo->search(['per_page' => 6, 'sort' => 'newest']);

        // 4. Pesanan baru terkini (5 pesanan)
        $stmtOrders = $db->query(
            "SELECT id, code, public_token, customer_name, customer_whatsapp, total_amount, status, created_at
             FROM orders
             ORDER BY created_at DESC
             LIMIT 5"
        );
        $recentOrders = $stmtOrders->fetchAll();

        Response::json([
            'cards' => [
                'total_products' => [
                    'value' => $total,
                    'note'  => "{$total} total katalog",
                ],
                'available_products' => [
                    'value' => $available,
                    'note'  => "{$availPct}% dari total",
                ],
                'sold_products' => [
                    'value' => $sold,
                    'note'  => "{$soldPct}% dari total",
                ],
                'new_orders' => [
                    'value' => $newOrdersCount,
                    'note'  => $newOrdersCount > 0 ? 'Perlu konfirmasi' : 'Tidak ada antrean',
                ],
            ],
            'recent_products' => $latestProductsResult['data'],
            'recent_orders'   => $recentOrders,
        ]);
    }
}
