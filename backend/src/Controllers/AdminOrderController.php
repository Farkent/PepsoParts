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
        $id    = (int)($params['id'] ?? 0);
        $order = $this->orders->findById($id, withItems: true);

        if (!$order) {
            $res->json(['success' => false, 'message' => 'Pesanan tidak ditemukan.'], 404);
            return;
        }

        $res->json(['success' => true, 'data' => $order]);
    }

    // ─── PATCH /api/admin/orders/{id}/status ─────────────────────────────────

    public function updateStatus(Request $req, Response $res, array $params): void
    {
        $id     = (int)($params['id'] ?? 0);
        $body   = $req->getBody();
        $status = trim($body['status'] ?? '');

        $allowed = ['confirmed', 'completed', 'cancelled'];
        if (!in_array($status, $allowed, true)) {
            $res->json([
                'success' => false,
                'message' => 'Status tidak valid. Nilai yang diizinkan: ' . implode(', ', $allowed),
            ], 422);
            return;
        }

        try {
            $ok = $this->orders->updateStatus($id, $status);
            if (!$ok) {
                $res->json(['success' => false, 'message' => 'Pesanan tidak ditemukan.'], 404);
                return;
            }
            $res->json(['success' => true, 'message' => 'Status pesanan diperbarui.']);
        } catch (\RuntimeException $e) {
            $res->json(['success' => false, 'message' => $e->getMessage()], 422);
        }
    }

    // ─── PATCH /api/admin/orders/{id}/note ───────────────────────────────────

    public function updateNote(Request $req, Response $res, array $params): void
    {
        $id   = (int)($params['id'] ?? 0);
        $body = $req->getBody();
        $note = trim($body['note'] ?? '');

        $ok = $this->orders->updateNote($id, $note);

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
}

