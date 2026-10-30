<?php

declare(strict_types=1);

namespace Pepso\Controllers;

use Pepso\Core\Config;
use Pepso\Core\Database;
use Pepso\Core\Request;
use Pepso\Core\Response;
use Throwable;

class HealthController
{
    public function index(Request $request): void
    {
        $dbStatus = 'connected';
        $dbVersion = '';
        try {
            $pdo = Database::getConnection();
            $stmt = $pdo->query('SELECT VERSION() as v');
            $dbVersion = $stmt->fetchColumn() ?: '';
        } catch (Throwable $e) {
            $dbStatus = 'error: ' . $e->getMessage();
        }

        Response::json([
            'status' => 'healthy',
            'app_name' => 'PEPSO PARTS API',
            'version' => '1.0.0',
            'timezone' => date_default_timezone_get(),
            'current_time' => date('Y-m-d H:i:s'),
            'php_version' => PHP_VERSION,
            'database' => [
                'status' => $dbStatus,
                'version' => $dbVersion,
            ],
            'ai' => [
                'enabled' => Config::getBool('AI_ENABLED', true),
                'provider' => Config::get('AI_PROVIDER', 'mock'),
            ],
        ]);
    }
}

