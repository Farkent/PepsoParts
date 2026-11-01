<?php

declare(strict_types=1);

require_once __DIR__ . '/../src/Autoload.php';

use Pepso\Core\Config;
use Pepso\Core\Request;
use Pepso\Core\Router;
use Pepso\Core\Session;
use Pepso\Middleware\CorsMiddleware;
use Pepso\Controllers\HealthController;
use Pepso\Controllers\MasterDataController;
use Pepso\Controllers\ProductController;
use Pepso\Controllers\SettingsController;

// 1. Muat konfigurasi .env
Config::load(__DIR__ . '/../.env');

// 2. Set Zona Waktu Asia/Jakarta
date_default_timezone_set(Config::get('TIMEZONE', 'Asia/Jakarta'));

// 3. Inisialisasi Router
$router = new Router();

// 4. Global Middleware (CORS selalu diterapkan)
$router->use(CorsMiddleware::class);

// ─────────────────────────────────────────────────────────────
// RUTE PUBLIK
// ─────────────────────────────────────────────────────────────

// Health Check
$router->get('/api/health', [HealthController::class, 'index']);

// Settings Publik
$router->get('/api/settings/public', [SettingsController::class, 'getPublic']);

// Master Data
$router->get('/api/categories',  [MasterDataController::class, 'listCategories']);
$router->get('/api/motor-types', [MasterDataController::class, 'listMotorTypes']);

// Produk Publik (urutan penting: spesifik lebih dulu)
$router->get('/api/products/{id}/related', [ProductController::class, 'related']);
$router->get('/api/products/{slugOrCode}', [ProductController::class, 'show']);
$router->get('/api/products',              [ProductController::class, 'index']);

// Open Graph Share (untuk crawler WhatsApp / Facebook)
$router->get('/api/share/{slug}', [ProductController::class, 'shareOg']);

// ─────────────────────────────────────────────────────────────
// RUTE ADMIN (akan ditambahkan di Fase 3)
// ─────────────────────────────────────────────────────────────
// Placeholder untuk kebutuhan CORS preflight pada admin endpoints
$router->options('/api/admin/{any}', function () { http_response_code(204); exit; });

// ─────────────────────────────────────────────────────────────
// Dispatch Request
// ─────────────────────────────────────────────────────────────
$request = new Request();
$router->dispatch($request);
