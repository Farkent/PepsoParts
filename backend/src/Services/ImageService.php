<?php

declare(strict_types=1);

namespace Pepso\Services;

use Pepso\Core\Config;
use Pepso\Core\Logger;
use RuntimeException;

class ImageService
{
    private string $uploadDir;
    private int $maxBytes;

    public function __construct()
    {
        $this->uploadDir = dirname(__DIR__, 2) . '/public/uploads';
        if (!is_dir($this->uploadDir)) {
            @mkdir($this->uploadDir, 0755, true);
        }
        $maxMb = Config::getInt('UPLOAD_MAX_MB', 10);
        $this->maxBytes = $maxMb * 1024 * 1024;
    }

    /**
     * Memproses file upload:
     * - Validasi ukuran dan ekstensi
     * - Cek MIME asli via finfo
     * - Re-encode via GD (membuang EXIF dan metadata berbahaya)
     * - Buat file large (maks 1600px) dan thumbnail (maks 400px) berformat WebP
     * 
     * @return array{path: string, thumb_path: string}
     */
    public function processUpload(array $file): array
    {
        if (!isset($file['error']) || $file['error'] !== UPLOAD_ERR_OK) {
            throw new RuntimeException('Gagal mengunggah file. Kode error: ' . ($file['error'] ?? 'UNKNOWN'));
        }

        if ($file['size'] > $this->maxBytes) {
            throw new RuntimeException('Ukuran file melebihi batas maksimal ' . ($this->maxBytes / 1024 / 1024) . ' MB.');
        }

        // Cek MIME type sebenarnya
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mime = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);

        $allowedMimes = [
            'image/jpeg' => 'jpg',
            'image/png'  => 'png',
            'image/webp' => 'webp',
        ];

        if (!isset($allowedMimes[$mime])) {
            throw new RuntimeException('Format gambar tidak didukung. Harap unggah format JPG, PNG, atau WebP.');
        }

        // Buka gambar menggunakan GD
        $srcImage = match ($mime) {
            'image/jpeg' => @imagecreatefromjpeg($file['tmp_name']),
            'image/png'  => @imagecreatefrompng($file['tmp_name']),
            'image/webp' => @imagecreatefromwebp($file['tmp_name']),
            default      => false,
        };

        if (!$srcImage) {
            throw new RuntimeException('Berkas gambar rusak atau tidak dapat dibaca.');
        }

        $origW = imagesx($srcImage);
        $origH = imagesy($srcImage);

        // Buat nama unik acak
        $hash = bin2hex(random_bytes(16));
        $largeName = "prod_{$hash}.webp";
        $thumbName = "thumb_{$hash}.webp";

        $largeFullPath = $this->uploadDir . '/' . $largeName;
        $thumbFullPath = $this->uploadDir . '/' . $thumbName;

        try {
            // 1. Simpan versi Large (maks 1600px)
            $this->resizeAndSaveWebP($srcImage, $origW, $origH, 1600, $largeFullPath, 85);

            // 2. Simpan versi Thumbnail (maks 400px)
            $this->resizeAndSaveWebP($srcImage, $origW, $origH, 400, $thumbFullPath, 80);
        } finally {
            imagedestroy($srcImage);
        }

        return [
            'path'       => "/uploads/{$largeName}",
            'thumb_path' => "/uploads/{$thumbName}",
        ];
    }

    private function resizeAndSaveWebP(\GdImage $src, int $w, int $h, int $maxDim, string $destPath, int $quality): void
    {
        $ratio = min($maxDim / max($w, 1), $maxDim / max($h, 1), 1.0);
        $newW = (int)round($w * $ratio);
        $newH = (int)round($h * $ratio);

        $dst = imagecreatetruecolor($newW, $newH);
        
        // Preserve transparency jika ada
        imagealphablending($dst, false);
        imagesavealpha($dst, true);
        $transparent = imagecolorallocatealpha($dst, 255, 255, 255, 127);
        imagefilledrectangle($dst, 0, 0, $newW, $newH, $transparent);

        imagecopyresampled($dst, $src, 0, 0, 0, 0, $newW, $newH, $w, $h);

        imagewebp($dst, $destPath, $quality);
        imagedestroy($dst);
    }

    public function deleteFile(?string $relativePath): void
    {
        if (empty($relativePath)) return;
        $clean = ltrim(str_replace('/uploads/', '', $relativePath), '/');
        // Pastikan tidak path traversal
        $clean = basename($clean);
        $fullPath = $this->uploadDir . '/' . $clean;
        if (file_exists($fullPath) && is_file($fullPath) && !str_starts_with($clean, 'sample_')) {
            @unlink($fullPath);
        }
    }
}

