<?php

declare(strict_types=1);

namespace Pepso\Middleware;

use Pepso\Core\Config;
use Pepso\Core\Request;

class CorsMiddleware
{
    public function handle(Request $request): void
    {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        $allowedOrigins = explode(',', Config::get('CORS_ALLOWED_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173'));
        $allowedOrigins = array_map('trim', $allowedOrigins);

        if (!empty($origin) && in_array($origin, $allowedOrigins, true)) {
            header("Access-Control-Allow-Origin: {$origin}");
            header('Access-Control-Allow-Credentials: true');
        } elseif (Config::get('APP_ENV') === 'local') {
            header("Access-Control-Allow-Origin: {$origin}");
            header('Access-Control-Allow-Credentials: true');
        }

        header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-CSRF-Token, X-Requested-With, X-HTTP-Method-Override');
        header('Access-Control-Max-Age: 86400');

        // Security headers
        header('X-Content-Type-Options: nosniff');
        header('X-Frame-Options: SAMEORIGIN');
        header('Referrer-Policy: strict-origin-when-cross-origin');
    }
}

