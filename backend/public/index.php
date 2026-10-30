<?php

declare(strict_types=1);

require_once __DIR__ . '/../src/Autoload.php';

use Pepso\Core\Config;
use Pepso\Core\Request;
use Pepso\Core\Router;
use Pepso\Middleware\CorsMiddleware;
use Pepso\Controllers\HealthController;

// 1. Muat konfigurasi .env
Config::load(__DIR__ . '/../.env');

// 2. Set Zona Waktu Asia/Jakarta
date_default_timezone_set(Config::get('TIMEZONE', 'Asia/Jakarta'));

// 3. Inisialisasi Router
$router = new Router();

// 4. Global Middleware
$router->use(CorsMiddleware::class);

// 5. Rute Dasar (Fase 1)
$router->get('/api/health', [HealthController::class, 'index']);

// 6. Muat dan jalankan request
$request = new Request();
$router->dispatch($request);

