<?php
/**
 * CLI Web Server Router untuk PHP Development:
 * php -S localhost:8000 -t backend/public backend/public/router.php
 */

$uri = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?? '/');

// Jika file statis fisik ada (misal di folder uploads/), layani langsung
if ($uri !== '/' && file_exists(__DIR__ . $uri)) {
    return false;
}

// Teruskan seluruh request lain ke index.php
require_once __DIR__ . '/index.php';

