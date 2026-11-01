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

    // ─── POST /api/ai/chat ────────────────────────────────────────────────────

    public function chat(Request $req, Response $res): void
    {
        $body = $req->getBody();
        $message = trim($body['message'] ?? '');

        if ($message === '') {
            $res->json(['success' => false, 'message' => 'Pesan tidak boleh kosong.'], 400);
            return;
        }

        $motorSlug = !empty($body['my_motor_slug']) ? trim($body['my_motor_slug']) : null;
        $history   = is_array($body['history'] ?? null) ? $body['history'] : [];
        $clientIp  = $req->getClientIp();

        $result = $this->ai->chat($message, $motorSlug, $history, $clientIp);

        $res->json([
            'success' => true,
            'data'    => $result,
        ]);
    }

    // ─── POST /api/ai/search ──────────────────────────────────────────────────

    public function search(Request $req, Response $res): void
    {
        $body  = $req->getBody();
        $query = trim($body['query'] ?? $req->getQuery('q') ?? '');

        if ($query === '') {
            $res->json(['success' => false, 'message' => 'Kata kunci tidak boleh kosong.'], 400);
            return;
        }

        $motorType = !empty($body['motor_type']) ? trim($body['motor_type']) : $req->getQuery('motor_type');
        $clientIp  = $req->getClientIp();

        $result = $this->ai->search($query, $motorType, $clientIp);

        $res->json([
            'success' => true,
            'data'    => $result,
        ]);
    }

    // ─── POST /api/ai/compatibility ───────────────────────────────────────────

    public function compatibility(Request $req, Response $res): void
    {
        $body      = $req->getBody();
        $productId = (int)($body['product_id'] ?? 0);
        $motorSlug = trim($body['motor_slug'] ?? '');

        if ($productId <= 0 || $motorSlug === '') {
            $res->json(['success' => false, 'message' => 'Parameter product_id dan motor_slug diperlukan.'], 400);
            return;
        }

        $clientIp = $req->getClientIp();
        $result = $this->ai->compatibility($productId, $motorSlug, $clientIp);

        $res->json([
            'success' => true,
            'data'    => $result,
        ]);
    }

    // ─── POST /api/admin/ai/describe-product ──────────────────────────────────

    public function describeProduct(Request $req, Response $res): void
    {
        $body         = $req->getBody();
        $notes        = $body['notes'] ?? '';
        $categoryName = $body['category_name'] ?? '';
        $productName  = $body['product_name'] ?? '';
        $imagePaths   = is_array($body['image_paths'] ?? null) ? $body['image_paths'] : [];
        $clientIp     = $req->getClientIp();

        $desc = $this->ai->describeProduct($imagePaths, $notes, $categoryName, $productName, $clientIp);

        $res->json([
            'success' => true,
            'data'    => [
                'description' => $desc,
            ],
        ]);
    }
}
