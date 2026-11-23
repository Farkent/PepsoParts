<?php

declare(strict_types=1);

require_once __DIR__ . '/../src/Autoload.php';

use Pepso\Core\Config;
use Pepso\Core\Database;
use Pepso\Core\RateLimiter;
use Pepso\Core\Session;
use Pepso\Services\SearchService;
use Pepso\Services\ProductCodeService;
use Pepso\Repositories\ProductRepository;
use Pepso\Repositories\CategoryRepository;
use Pepso\Repositories\MotorTypeRepository;
use Pepso\Repositories\OrderRepository;
use Pepso\Services\Ai\MockProvider;
use Pepso\Services\Ai\AiService;

Config::load(__DIR__ . '/../.env');
Session::start();

$passed = 0;
$failed = 0;

function assertTest(string $name, bool $condition, string $detail = ''): void {
    global $passed, $failed;
    if ($condition) {
        echo "  [PASS] {$name}\n";
        $passed++;
    } else {
        echo "  [FAIL] {$name}" . ($detail ? " - {$detail}" : '') . "\n";
        $failed++;
    }
}

echo "===========================================\n";
echo "PEPSO PARTS - COMPREHENSIVE QA TEST SUITE\n";
echo "===========================================\n\n";

// 1. Database & Health
echo "1. Database & Configuration\n";
try {
    $db = Database::getConnection();
    $stmt = $db->query('SELECT DATABASE() as db, VERSION() as ver');
    $row = $stmt->fetch();
    assertTest('Database Connection', !empty($row['db']), "DB: {$row['db']}, Ver: {$row['ver']}");
} catch (\Throwable $e) {
    assertTest('Database Connection', false, $e->getMessage());
}

// 2. Master Data Repositories
echo "\n2. Master Data Repositories\n";
$catRepo = new CategoryRepository();
$cats = $catRepo->getAll();
assertTest('Categories loaded', count($cats) >= 5, "Total: " . count($cats));

$motorRepo = new MotorTypeRepository();
$motors = $motorRepo->getAll();
assertTest('Motor types loaded', count($motors) >= 3, "Total: " . count($motors));

// 3. Search Service & Synonym Matching
echo "\n3. Search Service & Typo Tolerance\n";
$searchService = new SearchService();
$syns = $searchService->expandWithSynonyms('seher');
assertTest('Synonym expansion: seher -> piston', in_array('piston', $syns), json_encode($syns));

$closest = $searchService->findClosestWord('knlpot');
assertTest('Typo correction: knlpot -> knalpot', $closest === 'knalpot', "Got: {$closest}");

$prodRepo = new ProductRepository();
$pistonSearch = $prodRepo->search(['q' => 'piston']);
assertTest('Search query "piston" returns Blok Seher', $pistonSearch['total'] >= 1, "Count: {$pistonSearch['total']}");

// 4. Product Code Service
echo "\n4. Product Code Generator\n";
$codeService = new ProductCodeService();
$code = $codeService->generate('MSN'); // MSN = Mesin
assertTest('Generated product code format PS-MSN-XXX', str_starts_with($code, 'PS-MSN-'), "Generated: {$code}");

$slug = ProductCodeService::generateSlug('Blok Silinder Super KIPS 1855 Gold Edition!');
assertTest('Slug generation sanitized', $slug === 'blok-silinder-super-kips-1855-gold-edition', "Got: {$slug}");

// 5. CSRF & Session Security
echo "\n5. Session & CSRF Security\n";
Session::start();
$token1 = Session::getCsrfToken();
assertTest('CSRF token is 64 hex characters', strlen($token1) === 64, "Len: " . strlen($token1));
assertTest('CSRF token validation matches', Session::validateCsrfToken($token1));
assertTest('CSRF token validation rejects forged token', !Session::validateCsrfToken('forged-token-abc-123'));

// 6. Rate Limiter
echo "\n6. Rate Limiter\n";
$testKey = 'qa_test_' . time();
$allow1 = RateLimiter::check($testKey, 2, 60);
$allow2 = RateLimiter::check($testKey, 2, 60);
$allow3 = RateLimiter::check($testKey, 2, 60);
assertTest('Rate limiter enforces max attempts', $allow1 && $allow2 && !$allow3, "Attempts: 1=$allow1, 2=$allow2, 3=$allow3");

// 7. Atomic Order Flow & Stock Integrity
echo "\n7. Order Flow & Stock Deduction\n";
$orderRepo = new OrderRepository();

// Get an available product
$sampleProduct = $db->query("SELECT id, code, name, price, stock FROM products WHERE stock > 2 AND status = 'available' LIMIT 1")->fetch();
if ($sampleProduct) {
    $initialStock = (int)$sampleProduct['stock'];
    $orderData = [
        'customer_name' => 'QA Bot Tester',
        'customer_phone' => '081299887766',
        'customer_whatsapp' => '6281299887766',
        'customer_address' => 'Jl. Pengujian No. 1, Jakarta',
        'customer_notes' => 'Unit testing automatic order flow',
        'payment_method' => 'bank_transfer',
        'shipping_method' => 'jne_reg',
        'items' => [
            [
                'product_id' => (int)$sampleProduct['id'],
                'quantity' => 2,
                'price' => (float)$sampleProduct['price'],
                'product_code' => $sampleProduct['code'],
                'product_name' => $sampleProduct['name'],
            ]
        ]
    ];

    $created = $orderRepo->createOrder($orderData);
    assertTest('Order created with PO- prefix', str_starts_with($created['code'], 'PO-'), "Code: {$created['code']}");
    assertTest('Order has secure public tracking token', !empty($created['public_token']) && strlen($created['public_token']) === 64);
    $foundByCode = $orderRepo->findAdminByCode($created['order_code']);
    assertTest(
        'Admin order detail resolves the selected order code',
        (int)($foundByCode['id'] ?? 0) === (int)$created['id'],
        "Code: {$created['order_code']}"
    );
    // Verify stock deducted
    $postStock = (int)$db->query("SELECT stock FROM products WHERE id = {$sampleProduct['id']}")->fetchColumn();
    assertTest('Stock atomically deducted by 2', $postStock === $initialStock - 2, "Was: {$initialStock}, Now: {$postStock}");

    // Test order status machine: new -> confirmed
    $confirmResult = $orderRepo->updateStatusByCode($created['order_code'], 'confirmed');
    assertTest('Order status transition by code: new -> confirmed', $confirmResult);

    // Cancel order from confirmed -> stock should be restored!
    $cancelResult = $orderRepo->updateStatus((int)$created['id'], 'cancelled');
    assertTest('Order status transition: confirmed -> cancelled', $cancelResult);

    $restoredStock = (int)$db->query("SELECT stock FROM products WHERE id = {$sampleProduct['id']}")->fetchColumn();
    assertTest('Stock automatically restored on order cancellation', $restoredStock === $initialStock, "Restored: {$restoredStock}, Initial: {$initialStock}");

    // Cleanup test order
    $db->prepare("DELETE FROM order_items WHERE order_id = ?")->execute([$created['id']]);
    $db->prepare("DELETE FROM orders WHERE id = ?")->execute([$created['id']]);
} else {
    assertTest('Sample product for order test available', false, 'No products with stock > 2 found');
}

// 8. AI Service & Mock Provider
echo "\n8. AI Capabilities & Offline Fallback\n";
$ai = new AiService();
$chatRes = $ai->chat('Halo, cari blok seher ninja rr', 'ninja-rr', [], '127.0.0.1');
assertTest('AI Chat returns response and suggestions', !empty($chatRes['text']) && is_array($chatRes['suggested_products']));

$compatRes = $ai->compatibility(1, 'ninja-rr', '127.0.0.1');
assertTest('AI Compatibility returns compatible status', isset($compatRes['compatible']) && is_bool($compatRes['compatible']));

$describeRes = $ai->describeProduct([], 'Kondisi 95% orisinil cabutan', 'Mesin', 'Karburator Keihin PWK 28 Sudco', '127.0.0.1');
assertTest('AI Description Generator generates detailed text', strlen($describeRes) > 50, "Len: " . strlen($describeRes));

// Summary
echo "\n===========================================\n";
echo "SUMMARY: {$passed} PASSED, {$failed} FAILED\n";
echo "===========================================\n";

exit($failed > 0 ? 1 : 0);
