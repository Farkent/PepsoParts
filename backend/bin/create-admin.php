<?php
/**
 * CLI Tool: Pembuatan akun Admin PEPSO PARTS
 * Penggunaan: php backend/bin/create-admin.php [email] [password] [nama]
 */

declare(strict_types=1);

require_once __DIR__ . '/../src/Autoload.php';

use Pepso\Core\Config;
use Pepso\Core\Database;

Config::load(__DIR__ . '/../.env');

$email = $argv[1] ?? Config::get('ADMIN_SEED_EMAIL', 'admin@pepsoparts.com');
$password = $argv[2] ?? Config::get('ADMIN_SEED_PASSWORD', 'AdminNinja2T!');
$name = $argv[3] ?? 'Admin PEPSO PARTS (Wahyu Dwi Adrianto)';

if (empty($email) || empty($password)) {
    echo "ERROR: Email dan password tidak boleh kosong.\n";
    echo "Penggunaan: php backend/bin/create-admin.php <email> <password> [nama]\n";
    exit(1);
}

echo "--- Pembuatan Akun Admin PEPSO PARTS ---\n";
echo "Email: {$email}\n";
echo "Nama : {$name}\n";

$db = Database::getConnection();

// Cek apakah admin sudah ada
$stmt = $db->prepare('SELECT id FROM admins WHERE email = :email');
$stmt->execute(['email' => $email]);
$existing = $stmt->fetch();

$hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);

if ($existing) {
    $upd = $db->prepare('UPDATE admins SET password_hash = :hash, name = :name, updated_at = NOW() WHERE id = :id');
    $upd->execute([
        'hash' => $hash,
        'name' => $name,
        'id' => $existing['id'],
    ]);
    echo "SUKSES: Akun admin '{$email}' berhasil diperbarui.\n";
} else {
    $ins = $db->prepare('INSERT INTO admins (name, email, password_hash, created_at) VALUES (:name, :email, :hash, NOW())');
    $ins->execute([
        'name' => $name,
        'email' => $email,
        'hash' => $hash,
    ]);
    echo "SUKSES: Akun admin baru '{$email}' berhasil dibuat.\n";
}

