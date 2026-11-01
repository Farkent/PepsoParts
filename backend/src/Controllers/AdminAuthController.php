<?php

declare(strict_types=1);

namespace Pepso\Controllers;

use Pepso\Core\Database;
use Pepso\Core\RateLimiter;
use Pepso\Core\Request;
use Pepso\Core\Response;
use Pepso\Core\Session;

class AdminAuthController
{
    public function login(Request $request): void
    {
        $ipKey = 'login_' . $request->getIpHash();
        if (!RateLimiter::check($ipKey, 5, 300)) {
            Response::error('Terlalu banyak percobaan login yang gagal. Silakan tunggu 5 menit.', 'RATE_LIMITED', 429);
        }

        $email = trim((string)$request->get('email', ''));
        $password = (string)$request->get('password', '');

        if ($email === '' || $password === '') {
            Response::error('Email dan kata sandi wajib diisi.', 'VALIDATION_ERROR', 422, [
                'email' => $email === '' ? 'Email wajib diisi' : null,
                'password' => $password === '' ? 'Kata sandi wajib diisi' : null,
            ]);
        }

        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT id, name, email, password_hash FROM admins WHERE email = :email LIMIT 1');
        $stmt->execute(['email' => $email]);
        $admin = $stmt->fetch();

        if (!$admin || !password_verify($password, $admin['password_hash'])) {
            // Beri sedikit delay untuk memperlambat brute-force
            usleep(200000); // 200ms
            Response::error('Email atau kata sandi tidak cocok.', 'INVALID_CREDENTIALS', 401);
        }

        // Login Berhasil: Regenerate ID sesi & simpan admin_id
        Session::start();
        Session::regenerate();
        Session::set('admin_id', (int)$admin['id']);
        Session::set('admin_name', $admin['name']);
        Session::set('admin_email', $admin['email']);

        // Update last_login_at
        $db->prepare('UPDATE admins SET last_login_at = NOW() WHERE id = :id')->execute(['id' => $admin['id']]);

        $csrfToken = Session::getCsrfToken();

        Response::json([
            'admin' => [
                'id' => (int)$admin['id'],
                'name' => $admin['name'],
                'email' => $admin['email'],
            ],
            'csrf_token' => $csrfToken,
        ]);
    }

    public function logout(Request $request): void
    {
        Session::destroy();
        Response::json(['message' => 'Berhasil keluar.']);
    }

    public function me(Request $request): void
    {
        Session::start();
        $adminId = Session::get('admin_id');
        if (!$adminId) {
            Response::error('Belum login.', 'UNAUTHORIZED', 401);
        }

        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT id, name, email, last_login_at FROM admins WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $adminId]);
        $admin = $stmt->fetch();

        if (!$admin) {
            Session::destroy();
            Response::error('Akun admin tidak ditemukan.', 'UNAUTHORIZED', 401);
        }

        Response::json([
            'admin' => [
                'id' => (int)$admin['id'],
                'name' => $admin['name'],
                'email' => $admin['email'],
                'last_login_at' => $admin['last_login_at'],
            ],
            'csrf_token' => Session::getCsrfToken(),
        ]);
    }

    public function changePassword(Request $request): void
    {
        Session::start();
        $adminId = Session::get('admin_id');
        if (!$adminId) {
            Response::error('Belum login.', 'UNAUTHORIZED', 401);
        }

        $currentPassword = (string)$request->get('current_password', '');
        $newPassword = (string)$request->get('new_password', '');

        if (strlen($newPassword) < 8) {
            Response::error('Kata sandi baru minimal 8 karakter.', 'VALIDATION_ERROR', 422, [
                'new_password' => 'Minimal 8 karakter',
            ]);
        }

        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT password_hash FROM admins WHERE id = :id');
        $stmt->execute(['id' => $adminId]);
        $hash = $stmt->fetchColumn();

        if (!$hash || !password_verify($currentPassword, $hash)) {
            Response::error('Kata sandi saat ini tidak cocok.', 'INVALID_PASSWORD', 400);
        }

        $newHash = password_hash($newPassword, PASSWORD_BCRYPT, ['cost' => 12]);
        $db->prepare('UPDATE admins SET password_hash = :hash, updated_at = NOW() WHERE id = :id')
           ->execute(['hash' => $newHash, 'id' => $adminId]);

        Response::json(['message' => 'Kata sandi berhasil diperbarui.']);
    }
}

