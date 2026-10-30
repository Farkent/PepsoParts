<?php

declare(strict_types=1);

namespace Pepso\Core;

class Logger
{
    private static ?string $logFile = null;

    private static function getLogFile(): string
    {
        if (self::$logFile === null) {
            $dir = dirname(__DIR__, 2) . '/storage/logs';
            if (!is_dir($dir)) {
                mkdir($dir, 0777, true);
            }
            self::$logFile = $dir . '/app.log';
        }
        return self::$logFile;
    }

    public static function log(string $level, string $message, array $context = []): void
    {
        $timestamp = date('Y-m-d H:i:s');
        $sanitizedContext = self::sanitize($context);
        $contextStr = !empty($sanitizedContext) ? ' ' . json_encode($sanitizedContext, JSON_UNESCAPED_SLASHES) : '';
        $line = "[{$timestamp}] [{$level}] {$message}{$contextStr}" . PHP_EOL;
        @file_put_contents(self::getLogFile(), $line, FILE_APPEND | LOCK_EX);
    }

    public static function info(string $message, array $context = []): void
    {
        self::log('INFO', $message, $context);
    }

    public static function error(string $message, array $context = []): void
    {
        self::log('ERROR', $message, $context);
    }

    public static function warning(string $message, array $context = []): void
    {
        self::log('WARNING', $message, $context);
    }

    private static function sanitize(array $data): array
    {
        $sensitiveKeys = ['password', 'password_hash', 'token', 'csrf_token', 'api_key', 'AI_API_KEY'];
        $clean = [];
        foreach ($data as $k => $v) {
            if (is_array($v)) {
                $clean[$k] = self::sanitize($v);
            } elseif (in_array(strtolower((string)$k), $sensitiveKeys, true)) {
                $clean[$k] = '********';
            } else {
                $clean[$k] = $v;
            }
        }
        return $clean;
    }
}

