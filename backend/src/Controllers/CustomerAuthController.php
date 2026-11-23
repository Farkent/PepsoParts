<?php

declare(strict_types=1);

namespace Pepso\Controllers;

use Pepso\Core\Database;
use Pepso\Core\RateLimiter;
use Pepso\Core\Request;
use Pepso\Core\Response;
use Pepso\Core\Session;
use Pepso\Repositories\OrderRepository;
use PDOException;

class CustomerAuthController
{
    public function register(Request $request): void
    {
        if (!RateLimiter::check('customer_register_' . $request->getIpHash(), 5, 3600)) {
            Response::error('Terlalu banyak pendaftaran dari jaringan ini. Silakan coba lagi nanti.', 'RATE_LIMITED', 429);
        }

        $body = $request->getBody();
        $name = trim((string)($body['name'] ?? ''));
        $email = strtolower(trim((string)($body['email'] ?? '')));
        $whatsapp = $this->normalizeWhatsApp((string)($body['whatsapp'] ?? ''));
        $password = (string)($body['password'] ?? '');
        $errors = [];

        if ($name === '' || mb_strlen($name) > 100) {
            $errors['name'] = 'Nama wajib diisi (maksimal 100 karakter).';
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 150) {
            $errors['email'] = 'Format email tidak valid.';
        }
        if ($whatsapp === false) {
            $errors['whatsapp'] = 'Nomor WhatsApp tidak valid.';
        }
        if (strlen($password) < 8) {
            $errors['password'] = 'Kata sandi minimal 8 karakter.';
        }

        if ($errors) {
            Response::error('Periksa kembali data pendaftaran.', 'VALIDATION_ERROR', 422, $errors);
        }

        $db = Database::getConnection();
        try {
            $stmt = $db->prepare(
                'INSERT INTO customers (name, email, whatsapp, password_hash) VALUES (:name, :email, :whatsapp, :password_hash)'
            );
            $stmt->execute([
                'name' => $name,
                'email' => $email,
                'whatsapp' => $whatsapp,
                'password_hash' => password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]),
            ]);
        } catch (PDOException $e) {
            if ($e->getCode() === '23000') {
                Response::error('Email tersebut sudah terdaftar. Silakan masuk.', 'EMAIL_ALREADY_REGISTERED', 409, [
                    'email' => 'Email sudah digunakan.',
                ]);
            }
            throw $e;
        }

        $customer = [
            'id' => (int)$db->lastInsertId(),
            'name' => $name,
            'email' => $email,
            'whatsapp' => $whatsapp,
        ];

        $this->startCustomerSession($customer);
        Response::json([
            'customer' => $customer,
            'csrf_token' => Session::getCsrfToken(),
        ], 201);
    }

    public function login(Request $request): void
    {
        $ipKey = 'customer_login_' . $request->getIpHash();
        if (!RateLimiter::check($ipKey, 5, 300)) {
            Response::error('Terlalu banyak percobaan masuk. Silakan tunggu 5 menit.', 'RATE_LIMITED', 429);
        }

        $email = strtolower(trim((string)$request->get('email', '')));
        $password = (string)$request->get('password', '');
        if ($email === '' || $password === '') {
            Response::error('Email dan kata sandi wajib diisi.', 'VALIDATION_ERROR', 422, [
                'email' => $email === '' ? 'Email wajib diisi.' : null,
                'password' => $password === '' ? 'Kata sandi wajib diisi.' : null,
            ]);
        }

        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT id, name, email, whatsapp, password_hash FROM customers WHERE email = :email LIMIT 1');
        $stmt->execute(['email' => $email]);
        $record = $stmt->fetch();

        if (!$record || !password_verify($password, $record['password_hash'])) {
            usleep(200000);
            Response::error('Email atau kata sandi tidak cocok.', 'INVALID_CREDENTIALS', 401);
        }

        $db->prepare('UPDATE customers SET last_login_at = NOW() WHERE id = :id')
            ->execute(['id' => $record['id']]);

        $customer = [
            'id' => (int)$record['id'],
            'name' => $record['name'],
            'email' => $record['email'],
            'whatsapp' => $record['whatsapp'],
        ];
        $this->startCustomerSession($customer);

        Response::json([
            'customer' => $customer,
            'csrf_token' => Session::getCsrfToken(),
        ]);
    }

    public function me(Request $request): void
    {
        Session::start();
        $customerId = (int)Session::get('customer_id', 0);
        if (!$customerId) {
            Response::error('Belum masuk ke akun pelanggan.', 'UNAUTHORIZED', 401);
        }

        $stmt = Database::getConnection()->prepare(
            'SELECT id, name, email, whatsapp, created_at FROM customers WHERE id = :id LIMIT 1'
        );
        $stmt->execute(['id' => $customerId]);
        $customer = $stmt->fetch();

        if (!$customer) {
            Session::remove('customer_id');
            Session::remove('customer_name');
            Session::remove('customer_email');
            Response::error('Akun pelanggan tidak ditemukan.', 'UNAUTHORIZED', 401);
        }

        $customer['id'] = (int)$customer['id'];
        Response::json([
            'customer' => $customer,
            'csrf_token' => Session::getCsrfToken(),
        ]);
    }

    public function logout(Request $request): void
    {
        Session::remove('customer_id');
        Session::remove('customer_name');
        Session::remove('customer_email');
        Response::json(['message' => 'Berhasil keluar dari akun pelanggan.']);
    }

    public function orders(Request $request): void
    {
        $stmt = Database::getConnection()->prepare(
            "SELECT o.code, o.public_token, o.status, o.courier, o.tracking_number, o.total_amount, o.created_at,
                    (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) AS items_count
             FROM orders o
             WHERE o.customer_id = :customer_id
             ORDER BY o.created_at DESC"
        );
        $stmt->execute(['customer_id' => (int)Session::get('customer_id')]);
        Response::json($stmt->fetchAll());
    }

    public function confirmOrderReceived(Request $request, array $params): void
    {
        $customerId = (int)Session::get('customer_id', 0);
        $code = trim((string)($params['code'] ?? ''));

        try {
            $orders = new OrderRepository();
            $updated = $orders->confirmOrderReceived($customerId, $code);
            if (!$updated) {
                Response::error('Pesanan tidak ditemukan di akun Anda.', 'ORDER_NOT_FOUND', 404);
            }

            Response::json(['message' => 'Pesanan ditandai selesai. Toko akan menerima pemberitahuan.']);
        } catch (\RuntimeException $e) {
            Response::error($e->getMessage(), 'INVALID_ORDER_STATUS', 422);
        }
    }

    private function startCustomerSession(array $customer): void
    {
        Session::start();
        Session::regenerate();
        Session::set('customer_id', $customer['id']);
        Session::set('customer_name', $customer['name']);
        Session::set('customer_email', $customer['email']);
    }

    private function normalizeWhatsApp(string $number): string|false
    {
        $number = preg_replace('/\D/', '', $number);
        if (str_starts_with($number, '0')) {
            $number = '62' . substr($number, 1);
        } elseif (str_starts_with($number, '8')) {
            $number = '62' . $number;
        } elseif (!str_starts_with($number, '62')) {
            return false;
        }

        return strlen($number) >= 10 && strlen($number) <= 15 ? $number : false;
    }
}
