<?php

declare(strict_types=1);

namespace Pepso\Services\Ai;

use Pepso\Core\Config;
use Pepso\Core\Database;
use PDO;

class AiService
{
    private AiProviderInterface $provider;
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
        $providerType = Config::get('AI_PROVIDER', 'mock');

        if ($providerType === 'gemini' && !empty(Config::get('GEMINI_API_KEY'))) {
            $this->provider = new GeminiProvider();
        } else {
            $this->provider = new MockProvider();
        }
    }

    public function chat(string $message, ?string $myMotorSlug = null, array $history = [], string $clientIp = ''): array
    {
        $start = microtime(true);
        $status = 'success';

        // Check cache for identical single-turn messages
        $cacheKey = 'chat_' . md5(trim($message) . '_' . ($myMotorSlug ?? ''));
        if (empty($history)) {
            $cached = $this->getCache($cacheKey);
            if ($cached) {
                return $cached;
            }
        }

        try {
            $res = $this->provider->chat($message, $myMotorSlug, $history);

            if (empty($history) && !empty($res['text'])) {
                $this->setCache($cacheKey, $res, 3600); // 1 hour TTL
            }

            return $res;
        } catch (\Throwable $e) {
            $status = 'error';
            error_log("AiService::chat error: " . $e->getMessage());
            // Fallback to mock
            $mock = new MockProvider();
            return $mock->chat($message, $myMotorSlug, $history);
        } finally {
            $latency = (int)((microtime(true) - $start) * 1000);
            $this->logUsage('chat', $status, $clientIp, $latency);
        }
    }

    public function search(string $query, ?string $motorType = null, string $clientIp = ''): array
    {
        $start = microtime(true);
        $status = 'success';
        $cacheKey = 'search_' . md5(strtolower(trim($query)) . '_' . ($motorType ?? ''));

        $cached = $this->getCache($cacheKey);
        if ($cached) {
            return $cached;
        }

        try {
            $res = $this->provider->search($query, $motorType);
            $this->setCache($cacheKey, $res, 1800); // 30 mins TTL
            return $res;
        } catch (\Throwable $e) {
            $status = 'error';
            error_log("AiService::search error: " . $e->getMessage());
            $mock = new MockProvider();
            return $mock->search($query, $motorType);
        } finally {
            $latency = (int)((microtime(true) - $start) * 1000);
            $this->logUsage('search', $status, $clientIp, $latency);
        }
    }

    public function compatibility(int $productId, string $motorSlug, string $clientIp = ''): array
    {
        $start = microtime(true);
        $status = 'success';
        $cacheKey = 'compat_' . $productId . '_' . $motorSlug;

        $cached = $this->getCache($cacheKey);
        if ($cached) {
            return $cached;
        }

        try {
            $res = $this->provider->compatibility($productId, $motorSlug);
            $this->setCache($cacheKey, $res, 86400); // 24 hours TTL
            return $res;
        } catch (\Throwable $e) {
            $status = 'error';
            error_log("AiService::compatibility error: " . $e->getMessage());
            $mock = new MockProvider();
            return $mock->compatibility($productId, $motorSlug);
        } finally {
            $latency = (int)((microtime(true) - $start) * 1000);
            $this->logUsage('compatibility', $status, $clientIp, $latency);
        }
    }

    public function describeProduct(array $imagePaths, ?string $notes = null, ?string $categoryName = null, ?string $productName = null, string $clientIp = ''): string
    {
        $start = microtime(true);
        $status = 'success';

        try {
            return $this->provider->describeProduct($imagePaths, $notes, $categoryName, $productName);
        } catch (\Throwable $e) {
            $status = 'error';
            error_log("AiService::describeProduct error: " . $e->getMessage());
            $mock = new MockProvider();
            return $mock->describeProduct($imagePaths, $notes, $categoryName, $productName);
        } finally {
            $latency = (int)((microtime(true) - $start) * 1000);
            $this->logUsage('describe_product', $status, $clientIp, $latency);
        }
    }

    // ─── Cache Helpers ────────────────────────────────────────────────────────

    private function getCache(string $key): ?array
    {
        try {
            $stmt = $this->db->prepare(
                "SELECT payload FROM ai_cache WHERE cache_key = ? AND expires_at > NOW()"
            );
            $stmt->execute([$key]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($row && !empty($row['payload'])) {
                return json_decode($row['payload'], true);
            }
        } catch (\Throwable $e) {
            // Silently ignore cache read errors
        }
        return null;
    }

    private function setCache(string $key, array $payload, int $ttlSeconds = 3600): void
    {
        try {
            $expiresAt = date('Y-m-d H:i:s', time() + $ttlSeconds);
            $stmt = $this->db->prepare(
                "INSERT INTO ai_cache (cache_key, payload, expires_at)
                 VALUES (?, ?, ?)
                 ON DUPLICATE KEY UPDATE payload = VALUES(payload), expires_at = VALUES(expires_at)"
            );
            $stmt->execute([$key, json_encode($payload), $expiresAt]);
        } catch (\Throwable $e) {
            // Silently ignore cache write errors
        }
    }

    // ─── Logging Helpers ──────────────────────────────────────────────────────

    private function logUsage(string $feature, string $status, string $ip, int $latencyMs): void
    {
        try {
            $ipHash = hash('sha256', $ip ?: '127.0.0.1');
            $stmt = $this->db->prepare(
                "INSERT INTO ai_usage_logs (feature, status, ip_hash, latency_ms)
                 VALUES (?, ?, ?, ?)"
            );
            $stmt->execute([$feature, $status, $ipHash, $latencyMs]);
        } catch (\Throwable $e) {
            // Silently ignore log write errors
        }
    }
}
