<?php

declare(strict_types=1);

require_once __DIR__ . '/../src/Autoload.php';

use Pepso\Core\Config;
use Pepso\Core\Database;
use Pepso\Core\Request;
use Pepso\Core\Response;
use Pepso\Core\Router;
use Pepso\Middleware\AuthMiddleware;
use Pepso\Middleware\CorsMiddleware;
use Pepso\Middleware\CsrfMiddleware;

use Pepso\Controllers\HealthController;
use Pepso\Controllers\MasterDataController;
use Pepso\Controllers\ProductController;
use Pepso\Controllers\SettingsController;

use Pepso\Controllers\AdminAuthController;
use Pepso\Controllers\AdminDashboardController;
use Pepso\Controllers\AdminProductController;
use Pepso\Controllers\AdminMasterController;
use Pepso\Controllers\AdminSettingsController;

// 1. Muat konfigurasi .env
Config::load(__DIR__ . '/../.env');

// 2. Set Zona Waktu Asia/Jakarta
date_default_timezone_set(Config::get('TIMEZONE', 'Asia/Jakarta'));

// 3. Inisialisasi Router
$router = new Router();

// 4. Global Middleware (CORS)
$router->use(CorsMiddleware::class);

// ─────────────────────────────────────────────────────────────
// RUTE PUBLIK
// ─────────────────────────────────────────────────────────────
$router->get('/api/health', [HealthController::class, 'index']);
$router->get('/api/settings/public', [SettingsController::class, 'getPublic']);
$router->get('/api/categories', [MasterDataController::class, 'listCategories']);
$router->get('/api/motor-types', [MasterDataController::class, 'listMotorTypes']);

$router->get('/api/products/{id}/related', [ProductController::class, 'related']);
$router->get('/api/products/{slugOrCode}', [ProductController::class, 'show']);
$router->get('/api/products', [ProductController::class, 'index']);
$router->get('/api/share/{slug}', [ProductController::class, 'shareOg']);

// ─────────────────────────────────────────────────────────────
// RUTE ADMIN - AUTENTIKASI
// ─────────────────────────────────────────────────────────────
$router->post('/api/admin/login', [AdminAuthController::class, 'login']);
$router->post('/api/admin/logout', [AdminAuthController::class, 'logout'], [AuthMiddleware::class]);
$router->get('/api/admin/me', [AdminAuthController::class, 'me'], [AuthMiddleware::class]);
$router->put('/api/admin/password', [AdminAuthController::class, 'changePassword'], [AuthMiddleware::class, CsrfMiddleware::class]);

// ─────────────────────────────────────────────────────────────
// RUTE ADMIN - DASHBOARD & BADGE
// ─────────────────────────────────────────────────────────────
$router->get('/api/admin/dashboard', [AdminDashboardController::class, 'index'], [AuthMiddleware::class]);
$router->get('/api/admin/orders/count-new', function (Request $request) {
    $db = Database::getConnection();
    $cnt = (int)$db->query("SELECT COUNT(*) FROM orders WHERE status = 'new'")->fetchColumn();
    Response::json(['count' => $cnt]);
}, [AuthMiddleware::class]);

// ─────────────────────────────────────────────────────────────
// RUTE ADMIN - KELOLA PRODUK & FOTO
// ─────────────────────────────────────────────────────────────
$router->get('/api/admin/products/next-code', [AdminProductController::class, 'nextCode'], [AuthMiddleware::class]);
$router->get('/api/admin/products', [AdminProductController::class, 'index'], [AuthMiddleware::class]);
$router->post('/api/admin/products', [AdminProductController::class, 'create'], [AuthMiddleware::class, CsrfMiddleware::class]);
$router->get('/api/admin/products/{id}', [AdminProductController::class, 'show'], [AuthMiddleware::class]);
$router->put('/api/admin/products/{id}', [AdminProductController::class, 'update'], [AuthMiddleware::class, CsrfMiddleware::class]);
$router->delete('/api/admin/products/{id}', [AdminProductController::class, 'delete'], [AuthMiddleware::class, CsrfMiddleware::class]);

$router->patch('/api/admin/products/{id}/stock', [AdminProductController::class, 'patchStock'], [AuthMiddleware::class, CsrfMiddleware::class]);
$router->patch('/api/admin/products/{id}/status', [AdminProductController::class, 'patchStatus'], [AuthMiddleware::class, CsrfMiddleware::class]);

// Gambar Produk
$router->post('/api/admin/products/{id}/images', [AdminProductController::class, 'uploadImages'], [AuthMiddleware::class, CsrfMiddleware::class]);
$router->patch('/api/admin/products/{id}/images/{imageId}', [AdminProductController::class, 'patchImage'], [AuthMiddleware::class, CsrfMiddleware::class]);
$router->delete('/api/admin/products/{id}/images/{imageId}', [AdminProductController::class, 'deleteImage'], [AuthMiddleware::class, CsrfMiddleware::class]);

// ─────────────────────────────────────────────────────────────
// RUTE ADMIN - MASTER DATA & PENGATURAN
// ─────────────────────────────────────────────────────────────
$router->get('/api/admin/categories', [AdminMasterController::class, 'listCategories'], [AuthMiddleware::class]);
$router->post('/api/admin/categories', [AdminMasterController::class, 'createCategory'], [AuthMiddleware::class, CsrfMiddleware::class]);
$router->put('/api/admin/categories/{id}', [AdminMasterController::class, 'updateCategory'], [AuthMiddleware::class, CsrfMiddleware::class]);
$router->delete('/api/admin/categories/{id}', [AdminMasterController::class, 'deleteCategory'], [AuthMiddleware::class, CsrfMiddleware::class]);

$router->get('/api/admin/motor-types', [AdminMasterController::class, 'listMotorTypes'], [AuthMiddleware::class]);
$router->post('/api/admin/motor-types', [AdminMasterController::class, 'createMotorType'], [AuthMiddleware::class, CsrfMiddleware::class]);
$router->put('/api/admin/motor-types/{id}', [AdminMasterController::class, 'updateMotorType'], [AuthMiddleware::class, CsrfMiddleware::class]);
$router->delete('/api/admin/motor-types/{id}', [AdminMasterController::class, 'deleteMotorType'], [AuthMiddleware::class, CsrfMiddleware::class]);

$router->get('/api/admin/settings', [AdminSettingsController::class, 'getSettings'], [AuthMiddleware::class]);
$router->put('/api/admin/settings', [AdminSettingsController::class, 'updateSettings'], [AuthMiddleware::class, CsrfMiddleware::class]);

// Dispatch request
$request = new Request();
$router->dispatch($request);
