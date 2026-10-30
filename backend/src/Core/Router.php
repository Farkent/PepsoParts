<?php

declare(strict_types=1);

namespace Pepso\Core;

use Throwable;

class Router
{
    private array $routes = [];
    private array $globalMiddleware = [];

    public function use(callable|string $middleware): self
    {
        $this->globalMiddleware[] = $middleware;
        return $this;
    }

    public function add(string $method, string $path, mixed $handler, array $middleware = []): self
    {
        $this->routes[] = [
            'method' => strtoupper($method),
            'path' => '/' . trim($path, '/'),
            'handler' => $handler,
            'middleware' => $middleware,
        ];
        return $this;
    }

    public function get(string $path, mixed $handler, array $middleware = []): self
    {
        return $this->add('GET', $path, $handler, $middleware);
    }

    public function post(string $path, mixed $handler, array $middleware = []): self
    {
        return $this->add('POST', $path, $handler, $middleware);
    }

    public function put(string $path, mixed $handler, array $middleware = []): self
    {
        return $this->add('PUT', $path, $handler, $middleware);
    }

    public function patch(string $path, mixed $handler, array $middleware = []): self
    {
        return $this->add('PATCH', $path, $handler, $middleware);
    }

    public function delete(string $path, mixed $handler, array $middleware = []): self
    {
        return $this->add('DELETE', $path, $handler, $middleware);
    }

    public function options(string $path, mixed $handler, array $middleware = []): self
    {
        return $this->add('OPTIONS', $path, $handler, $middleware);
    }

    public function dispatch(Request $request): void
    {
        $method = $request->getMethod();
        $uri = $request->getUri();

        // Handle global preflight OPTIONS
        if ($method === 'OPTIONS') {
            $this->runMiddleware($this->globalMiddleware, $request);
            http_response_code(204);
            exit;
        }

        // Jalankan global middleware
        $this->runMiddleware($this->globalMiddleware, $request);

        foreach ($this->routes as $route) {
            if ($route['method'] !== $method) {
                continue;
            }

            $pattern = $this->compilePattern($route['path']);
            if (preg_match($pattern, $uri, $matches)) {
                $params = array_filter($matches, 'is_string', ARRAY_FILTER_USE_KEY);

                // Jalankan route-specific middleware
                $this->runMiddleware($route['middleware'], $request);

                // Eksekusi handler
                $this->invokeHandler($route['handler'], $request, $params);
                return;
            }
        }

        Response::error("Rute {$method} {$uri} tidak ditemukan.", 'ROUTE_NOT_FOUND', 404);
    }

    private function compilePattern(string $path): string
    {
        // Ubah {param} menjadi named capture group (?P<param>[^/]+)
        $pattern = preg_replace('/\{([a-zA-Z0-9_]+)\}/', '(?P<$1>[^/]+)', $path);
        return '#^' . $pattern . '$#';
    }

    private function runMiddleware(array $middlewares, Request $request): void
    {
        foreach ($middlewares as $mw) {
            if (is_string($mw) && class_exists($mw)) {
                $instance = new $mw();
                $instance->handle($request);
            } elseif (is_callable($mw)) {
                $mw($request);
            }
        }
    }

    private function invokeHandler(mixed $handler, Request $request, array $params): void
    {
        try {
            if (is_callable($handler)) {
                $handler($request, $params);
                return;
            }

            if (is_array($handler) && count($handler) === 2) {
                [$controllerClass, $method] = $handler;
                $controller = new $controllerClass();
                $controller->$method($request, $params);
                return;
            }

            Response::error('Handler rute tidak valid.', 'INVALID_HANDLER', 500);
        } catch (Throwable $e) {
            Logger::error("Handler Exception: " . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            $isDebug = Config::getBool('APP_DEBUG', false);
            $message = $isDebug ? $e->getMessage() : 'Terjadi kesalahan internal pada server.';
            Response::error($message, 'INTERNAL_SERVER_ERROR', 500, $isDebug ? [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ] : []);
        }
    }
}

