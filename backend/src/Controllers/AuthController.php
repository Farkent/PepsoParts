<?php

declare(strict_types=1);

namespace Pepso\Controllers;

use Pepso\Core\Database;
use Pepso\Core\RateLimiter;
use Pepso\Core\Request;
use Pepso\Core\Response;
use Pepso\Core\Session;

class AuthController
{
    /**
     * Login tunggal untuk Admin dan Pelanggan.
     * Jika akun cocok di tabel admins -> login sebagai admin & arahkan ke dashboard admin.
     * Jika akun cocok di tabel customers -> login sebagai pelanggan & arahkan ke katalog produk.
     */
    public function login(Request $request): void
    {
        $ipKey = 'unified_login_' . $request->getIpHash();
        if (!RateLimiter::check($ipKey, 8, 300)) {
            Response::error('Terlalu banyak percobaan login yang gagal. Silakan tunggu 5 menit.', 'RATE_LIMITED', 429);
        }

        $email = strtolower(trim((string)$request->get('email', '')));
        $password = (string)$request->get('password', '');

        if ($email === '' || $password === '') {
            Response::error('Email dan kata sandi wajib diisi.', 'VALIDATION_ERROR', 422, [
                'email' => $email === '' ? 'Email wajib diisi' : null,
                'password' => $password === '' ? 'Kata sandi wajib diisi' : null,
            ]);
        }

        $db = Database::getConnection();

        // 1. Cek tabel admins terlebih dahulu
        $stmtAdmin = $db->prepare('SELECT id, name, email, password_hash, deleted_at FROM admins WHERE LOWER(email) = :email LIMIT 1');
        $stmtAdmin->execute(['email' => $email]);
        $admin = $stmtAdmin->fetch();

        if ($admin && password_verify($password, $admin['password_hash'])) {
            if (!empty($admin['deleted_at'])) {
                Response::error('Akun admin ini telah dinonaktifkan atau dihapus.', 'ACCOUNT_DELETED', 403);
            }

            Session::start();
            Session::regenerate();
            Session::set('admin_id', (int)$admin['id']);
            Session::set('admin_name', $admin['name']);
            Session::set('admin_email', $admin['email']);

            $db->prepare('UPDATE admins SET last_login_at = NOW() WHERE id = :id')
                ->execute(['id' => $admin['id']]);

            Response::json([
                'role' => 'admin',
                'admin' => [
                    'id' => (int)$admin['id'],
                    'name' => $admin['name'],
                    'email' => $admin['email'],
                ],
                'csrf_token' => Session::getCsrfToken(),
            ]);
            return;
        }

        // 2. Cek tabel customers
        $stmtCustomer = $db->prepare('SELECT id, name, email, whatsapp, password_hash, deleted_at FROM customers WHERE LOWER(email) = :email LIMIT 1');
        $stmtCustomer->execute(['email' => $email]);
        $customer = $stmtCustomer->fetch();

        if ($customer && password_verify($password, $customer['password_hash'])) {
            if (!empty($customer['deleted_at'])) {
                Response::error('Akun pelanggan ini telah dinonaktifkan atau dihapus.', 'ACCOUNT_DELETED', 403);
            }

            Session::start();
            Session::regenerate();
            Session::set('customer_id', (int)$customer['id']);
            Session::set('customer_name', $customer['name']);
            Session::set('customer_email', $customer['email']);

            $db->prepare('UPDATE customers SET last_login_at = NOW() WHERE id = :id')
                ->execute(['id' => $customer['id']]);

            Response::json([
                'role' => 'customer',
                'customer' => [
                    'id' => (int)$customer['id'],
                    'name' => $customer['name'],
                    'email' => $customer['email'],
                    'whatsapp' => $customer['whatsapp'],
                ],
                'csrf_token' => Session::getCsrfToken(),
            ]);
            return;
        }

        // 3. Kredensial tidak cocok
        usleep(200000); // 200ms anti brute-force delay
        Response::error('Email atau kata sandi tidak cocok.', 'INVALID_CREDENTIALS', 401);
    }
}
