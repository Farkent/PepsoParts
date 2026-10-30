<?php

declare(strict_types=1);

namespace Pepso\Middleware;

use Pepso\Core\Request;
use Pepso\Core\Response;
use Pepso\Core\Session;

class CsrfMiddleware
{
    public function handle(Request $request): void
    {
        $method = $request->getMethod();
        // Hanya validasi mutasi data
        if (in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'], true)) {
            $uri = $request->getUri();
            // Bypass CSRF untuk login awal (karena token diambil setelah login atau saat inisialisasi)
            if ($uri === '/api/admin/login') {
                return;
            }

            $token = $request->getHeader('x-csrf-token') ?? $request->get('csrf_token');
            if (!Session::validateCsrfToken($token)) {
                Response::error('Token CSRF tidak valid atau telah kedaluwarsa. Silakan muat ulang halaman.', 'CSRF_INVALID', 403);
            }
        }
    }
}

