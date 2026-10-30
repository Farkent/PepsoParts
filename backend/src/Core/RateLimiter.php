<?php

declare(strict_types=1);

namespace Pepso\Core;

use PDO;
use Exception;

class RateLimiter
{
    public static function check(string $key, int $maxHits, int $windowSeconds): bool
    {
        try {
            $db = Database::getConnection();
            $now = time();

            $stmt = $db->prepare('SELECT hits, window_start FROM rate_limits WHERE limit_key = :key');
            $stmt->execute(['key' => $key]);
            $row = $stmt->fetch();

            if (!$row) {
                $ins = $db->prepare('INSERT INTO rate_limits (limit_key, hits, window_start) VALUES (:key, 1, :now)');
                $ins->execute(['key' => $key, 'now' => $now]);
                return true;
            }

            $windowStart = (int)$row['window_start'];
            $hits = (int)$row['hits'];

            if ($now - $windowStart >= $windowSeconds) {
                // Reset window
                $upd = $db->prepare('UPDATE rate_limits SET hits = 1, window_start = :now WHERE limit_key = :key');
                $upd->execute(['now' => $now, 'key' => $key]);
                return true;
            }

            if ($hits >= $maxHits) {
                return false;
            }

            $upd = $db->prepare('UPDATE rate_limits SET hits = hits + 1 WHERE limit_key = :key');
            $upd->execute(['key' => $key]);
            return true;
        } catch (Exception $e) {
            Logger::error("RateLimiter error: " . $e->getMessage());
            // Fail open jika database bermasalah agar tidak memblokir user wajar
            return true;
        }
    }
}

