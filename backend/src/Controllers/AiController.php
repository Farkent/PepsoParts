<?php

declare(strict_types=1);

namespace Pepso\Controllers;

use Pepso\Core\Request;
use Pepso\Core\Response;
use Pepso\Services\Ai\AiService;

class AiController
{
    private AiService $ai;

    public function __construct()
    {
        $this->ai = new AiService();
    }

    // ─── POST /api/ai/chat ──────────────────────────────────────────────

    public function chat(Request $req, array $params = []): void
    {
        $body = $req->getBody();
        $message = trim((string)($body['message'] ?? ''));

        if ($message === '') {
            Response::error('Pesan tidak boleh kosong.', 'VALIDATION_ERROR', 400);
            return;
        }

        $motorSlug = !empty($body['my_motor_slug']) ? trim((string)$body['my_motor_slug']) : null;
        $history   = is_array($body['history'] ?? null) ? $body['history'] : [];
        $clientIp  = $req->getClientIp();

        $result = $this->ai->chat($message, $motorSlug, $history, $clientIp);

        Response::json($result);
    }

    // ─── POST /api/ai/search ────────────────────────────────────────────

    public function search(Request $req, array $params = []): void
    {
        $body  = $req->getBody();
        $query = trim((string)($body['query'] ?? $req->getQuery('q') ?? ''));

        if ($query === '') {
            Response::error('Kata kunci tidak boleh kosong.', 'VALIDATION_ERROR', 400);
            return;
        }

        $motorType = !empty($body['motor_type']) ? trim((string)$body['motor_type']) : $req->getQuery('motor_type');
        $clientIp  = $req->getClientIp();

        $result = $this->ai->search($query, $motorType ? (string)$motorType : null, $clientIp);

        Response::json($result);
    }

    // ─── POST /api/ai/compatibility ─────────────────────────────────────

    public function compatibility(Request $req, array $params = []): void
    {
        $body      = $req->getBody();
        $productId = (int)($body['product_id'] ?? 0);
        $motorSlug = trim((string)($body['motor_slug'] ?? ''));

        if ($productId <= 0 || $motorSlug === '') {
            Response::error('Parameter product_id dan motor_slug diperlukan.', 'VALIDATION_ERROR', 400);
            return;
        }

        $clientIp = $req->getClientIp();
        $result = $this->ai->compatibility($productId, $motorSlug, $clientIp);

        Response::json($result);
    }

    // ─── POST /api/admin/ai/describe-product ────────────────────────────

    public function describeProduct(Request $req, array $params = []): void
    {
        $body         = $req->getBody();
        $notes        = (string)($body['notes'] ?? '');
        $categoryName = (string)($body['category_name'] ?? '');
        $productName  = (string)($body['product_name'] ?? '');
        $imagePaths   = is_array($body['image_paths'] ?? null) ? $body['image_paths'] : [];
        $clientIp     = $req->getClientIp();

        $desc = $this->ai->describeProduct($imagePaths, $notes, $categoryName, $productName, $clientIp);

        Response::json([
            'description' => $desc,
        ]);
    }
}
