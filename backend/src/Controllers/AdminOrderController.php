<?php

declare(strict_types=1);

namespace Pepso\Controllers;

use Pepso\Core\Request;
use Pepso\Core\Response;
use Pepso\Repositories\OrderRepository;

class AdminOrderController
{
    private OrderRepository $orders;

    public function __construct()
    {
        $this->orders = new OrderRepository();
    }

    private function orderIdentifier(array $params): string
    {
        return (string)($params['id'] ?? '');
    }

    // ─── GET /api/admin/orders ────────────────────────────────────────────────

    public function index(Request $req, Response $res): void
    {
        $params = [
            'status'    => $req->getQuery('status'),
            'q'         => $req->getQuery('q'),
            'date_from' => $req->getQuery('date_from'),
            'date_to'   => $req->getQuery('date_to'),
            'limit'     => (int)($req->getQuery('limit') ?? 20),
            'offset'    => (int)($req->getQuery('offset') ?? 0),
        ];

        $result = $this->orders->search($params);

        $res->json([
            'success' => true,
            'data'    => $result['data'],
            'meta'    => [
                'total'  => $result['total'],
                'limit'  => $params['limit'],
                'offset' => $params['offset'],
            ],
        ]);
    }

    // ─── GET /api/admin/orders/{id} ───────────────────────────────────────────

    public function show(Request $req, Response $res, array $params): void
    {
        $identifier = (string)($params['id'] ?? '');
        $order = ctype_digit($identifier)
            ? $this->orders->findById((int)$identifier, withItems: true)
            : $this->orders->findAdminByCode($identifier);

        if (!$order) {
            $res->json(['success' => false, 'message' => 'Pesanan tidak ditemukan.'], 404);
            return;
        }

        $res->json(['success' => true, 'data' => $order]);
    }

    // ─── PATCH /api/admin/orders/{id}/status ─────────────────────────────────

    public function updateStatus(Request $req, Response $res, array $params): void
    {
        $identifier = $this->orderIdentifier($params);
        $body   = $req->getBody();
        $status = trim($body['status'] ?? '');

        if ($identifier === '') {
            $res->json(['success' => false, 'message' => 'Pesanan tidak ditemukan.'], 404);
            return;
        }

        $allowed = ['confirmed', 'cancelled'];
        if (!in_array($status, $allowed, true)) {
            $res->json([
                'success' => false,
                'message' => 'Status tidak valid. Nilai yang diizinkan: ' . implode(', ', $allowed),
            ], 422);
            return;
        }

        try {
            $ok = ctype_digit($identifier)
                ? $this->orders->updateStatus((int)$identifier, $status)
                : $this->orders->updateStatusByCode($identifier, $status);
            if (!$ok) {
                $res->json(['success' => false, 'message' => 'Pesanan tidak ditemukan.'], 404);
                return;
            }
            $res->json(['success' => true, 'message' => 'Status pesanan diperbarui.']);
        } catch (\RuntimeException $e) {
            $res->json(['success' => false, 'message' => $e->getMessage()], 422);
        }
    }

    // ─── PATCH /api/admin/orders/{id}/shipping ──────────────────────────────

    public function updateShipping(Request $req, Response $res, array $params): void
    {
        $identifier = $this->orderIdentifier($params);
        $body = $req->getBody();
        $courier = trim((string)($body['courier'] ?? ''));
        $trackingNumber = trim((string)($body['tracking_number'] ?? ''));

        if ($identifier === '') {
            $res->json(['success' => false, 'message' => 'Pesanan tidak ditemukan.'], 404);
            return;
        }

        if ($courier === '' || mb_strlen($courier) > 100 ||
            $trackingNumber === '' || mb_strlen($trackingNumber) > 100) {
            $res->json([
                'success' => false,
                'message' => 'Nama kurir dan nomor resi wajib diisi (maksimal 100 karakter).',
            ], 422);
            return;
        }

        try {
            $ok = ctype_digit($identifier)
                ? $this->orders->updateShipping((int)$identifier, $courier, $trackingNumber)
                : $this->orders->updateShippingByCode($identifier, $courier, $trackingNumber);
            if (!$ok) {
                $res->json(['success' => false, 'message' => 'Pesanan tidak ditemukan.'], 404);
                return;
            }
            $res->json(['success' => true, 'message' => 'Informasi pengiriman disimpan.']);
        } catch (\RuntimeException $e) {
            $res->json(['success' => false, 'message' => $e->getMessage()], 422);
        }
    }

    // ─── PATCH /api/admin/orders/{id}/note ───────────────────────────────────

    public function updateNote(Request $req, Response $res, array $params): void
    {
        $identifier = $this->orderIdentifier($params);
        $body = $req->getBody();
        $note = trim($body['note'] ?? '');

        if ($identifier === '') {
            $res->json(['success' => false, 'message' => 'Pesanan tidak ditemukan.'], 404);
            return;
        }

        $ok = ctype_digit($identifier)
            ? $this->orders->updateNote((int)$identifier, $note)
            : $this->orders->updateNoteByCode($identifier, $note);

        if (!$ok) {
            $res->json(['success' => false, 'message' => 'Pesanan tidak ditemukan.'], 404);
            return;
        }

        $res->json(['success' => true, 'message' => 'Catatan pesanan disimpan.']);
    }

    // ─── GET /api/admin/orders/count-new ─────────────────────────────────────

    public function countNew(Request $req, Response $res): void
    {
        $count = $this->orders->countNew();
        $res->json(['success' => true, 'data' => ['count' => $count], 'count' => $count]);
    }

    public function countNotifications(Request $req, Response $res): void
    {
        $counts = $this->orders->countAdminNotifications();
        $res->json($counts);
    }

    public function acknowledgeReceivedNotification(Request $req, Response $res, array $params): void
    {
        $identifier = $this->orderIdentifier($params);
        if ($identifier === '') {
            $res->json(['success' => false, 'message' => 'Pesanan selesai tidak ditemukan.'], 404);
            return;
        }

        $ok = ctype_digit($identifier)
            ? $this->orders->acknowledgeReceivedNotification((int)$identifier)
            : $this->orders->acknowledgeReceivedNotificationByCode($identifier);

        if (!$ok) {
            $res->json(['success' => false, 'message' => 'Pesanan selesai tidak ditemukan.'], 404);
            return;
        }

        $res->json(['success' => true, 'message' => 'Pemberitahuan pesanan diterima telah ditinjau.']);
    }
}

