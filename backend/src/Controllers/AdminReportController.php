<?php

declare(strict_types=1);

namespace Pepso\Controllers;

use Pepso\Core\Request;
use Pepso\Core\Response;
use Pepso\Repositories\OrderRepository;

class AdminReportController
{
    private OrderRepository $orders;

    public function __construct()
    {
        $this->orders = new OrderRepository();
    }

    // ─── GET /api/admin/reports/stock ─────────────────────────────────────────

    public function stockReport(Request $req, Response $res): void
    {
        $format = $req->getQuery('format');
        $data   = $this->orders->stockReport();

        if ($format === 'csv') {
            $this->sendStockCsv($res, $data);
            return;
        }

        // Calculate totals
        $totalValue = array_sum(array_map(
            fn($r) => (float)$r['price'] * (int)$r['stock'],
            $data
        ));

        $res->json([
            'success' => true,
            'data'    => $data,
            'meta'    => [
                'total_products'    => count($data),
                'total_stock_value' => $totalValue,
            ],
        ]);
    }

    // ─── GET /api/admin/reports/orders ────────────────────────────────────────

    public function salesReport(Request $req, Response $res): void
    {
        $format   = $req->getQuery('format');
        $dateFrom = $req->getQuery('date_from') ?: date('Y-m-01'); // default: start of month
        $dateTo   = $req->getQuery('date_to')   ?: date('Y-m-d');  // default: today

        // Validate dates
        if (!$this->isValidDate($dateFrom) || !$this->isValidDate($dateTo)) {
            $res->json(['success' => false, 'message' => 'Format tanggal tidak valid (Y-m-d).'], 422);
            return;
        }

        if ($dateFrom > $dateTo) {
            $res->json(['success' => false, 'message' => 'Tanggal mulai tidak boleh setelah tanggal akhir.'], 422);
            return;
        }

        $data = $this->orders->salesReport($dateFrom, $dateTo);

        if ($format === 'csv') {
            $this->sendSalesCsv($res, $data, $dateFrom, $dateTo);
            return;
        }

        $res->json([
            'success' => true,
            'data'    => $data,
            'meta'    => [
                'date_from' => $dateFrom,
                'date_to'   => $dateTo,
            ],
        ]);
    }

    // ─── CSV Helpers ─────────────────────────────────────────────────────────

    private function sendStockCsv(Response $res, array $data): void
    {
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="laporan-stok-' . date('Ymd') . '.csv"');
        header('Cache-Control: no-cache');

        $out = fopen('php://output', 'w');

        // UTF-8 BOM for Indonesian Excel
        fwrite($out, "\xEF\xBB\xBF");

        // Header
        fputcsv($out, [
            'Kode Produk', 'Nama Produk', 'Kategori',
            'Harga (Rp)', 'Stok', 'Status', 'Nilai Stok (Rp)',
        ], ';');

        foreach ($data as $row) {
            fputcsv($out, [
                $row['product_code'],
                $row['name'],
                $row['category'],
                $row['price'],
                $row['stock'],
                $this->statusLabel($row['status']),
                (float)$row['price'] * (int)$row['stock'],
            ], ';');
        }

        fclose($out);
        exit;
    }

    private function sendSalesCsv(Response $res, array $data, string $from, string $to): void
    {
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="laporan-penjualan-' . $from . '-sd-' . $to . '.csv"');
        header('Cache-Control: no-cache');

        $out = fopen('php://output', 'w');
        fwrite($out, "\xEF\xBB\xBF");

        // Summary rows
        $s = $data['summary'];
        fputcsv($out, ['LAPORAN PENJUALAN', '', '', ''], ';');
        fputcsv($out, ['Periode', "{$from} s.d. {$to}", '', ''], ';');
        fputcsv($out, ['Total Pesanan', $s['total_orders'], '', ''], ';');
        fputcsv($out, ['Total Pendapatan (Rp)', $s['total_revenue'], '', ''], ';');
        fputcsv($out, ['Pesanan Selesai', $s['completed_orders'], '', ''], ';');
        fputcsv($out, ['Pesanan Dibatalkan', $s['cancelled_orders'], '', ''], ';');
        fputcsv($out, [], ';');

        // By category
        fputcsv($out, ['PENJUALAN PER KATEGORI', '', '', ''], ';');
        fputcsv($out, ['Kategori', 'Item Terjual', 'Pendapatan (Rp)', ''], ';');
        foreach ($data['by_category'] as $cat) {
            fputcsv($out, [$cat['category'], $cat['items_sold'], $cat['revenue'], ''], ';');
        }
        fputcsv($out, [], ';');

        // Orders detail
        fputcsv($out, ['DETAIL PESANAN', '', '', ''], ';');
        fputcsv($out, [
            'Kode Pesanan', 'Nama Pelanggan', 'WhatsApp',
            'Total (Rp)', 'Status', 'Tanggal',
        ], ';');
        foreach ($data['orders'] as $order) {
            fputcsv($out, [
                $order['order_code'],
                $order['customer_name'],
                $order['customer_whatsapp'],
                $order['total_amount'],
                $this->statusLabel($order['status']),
                $order['created_at'],
            ], ';');
        }

        fclose($out);
        exit;
    }

    private function statusLabel(string $status): string
    {
        return match ($status) {
            'new'       => 'Baru',
            'confirmed' => 'Dikonfirmasi',
            'completed' => 'Selesai',
            'cancelled' => 'Dibatalkan',
            'available' => 'Tersedia',
            'sold'      => 'Terjual',
            'unavailable' => 'Tidak Tersedia',
            default     => $status,
        };
    }

    private function isValidDate(string $date): bool
    {
        $d = \DateTime::createFromFormat('Y-m-d', $date);
        return $d && $d->format('Y-m-d') === $date;
    }
}

