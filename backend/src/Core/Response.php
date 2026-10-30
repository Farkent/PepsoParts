<?php

declare(strict_types=1);

namespace Pepso\Core;

class Response
{
    public static function json(mixed $data, int $statusCode = 200, ?array $meta = null, array $headers = []): void
    {
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=utf-8');

        foreach ($headers as $k => $v) {
            header("{$k}: {$v}");
        }

        $payload = [
            'success' => true,
            'data' => $data,
        ];

        if ($meta !== null) {
            $payload['meta'] = $meta;
        }

        echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    public static function error(string $message, string $code = 'ERROR', int $statusCode = 400, array $fields = [], array $headers = []): void
    {
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=utf-8');

        foreach ($headers as $k => $v) {
            header("{$k}: {$v}");
        }

        $payload = [
            'success' => false,
            'error' => [
                'code' => $code,
                'message' => $message,
                'fields' => (object)$fields,
            ],
        ];

        echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    public static function html(string $html, int $statusCode = 200): void
    {
        http_response_code($statusCode);
        header('Content-Type: text/html; charset=utf-8');
        echo $html;
        exit;
    }

    public static function csv(string $filename, array $headers, array $rows): void
    {
        http_response_code(200);
        header('Content-Type: text/csv; charset=UTF-8');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('Pragma: no-cache');
        header('Expires: 0');

        // Output UTF-8 BOM untuk Excel Indonesia
        echo "\xEF\xBB\xBF";

        $output = fopen('php://output', 'w');
        // Gunakan titik-koma ';' sebagai pemisah agar terbuka benar di Excel regional Indonesia
        fputcsv($output, $headers, ';');
        foreach ($rows as $row) {
            fputcsv($output, $row, ';');
        }
        fclose($output);
        exit;
    }
}

