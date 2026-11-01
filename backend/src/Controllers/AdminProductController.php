<?php

declare(strict_types=1);

namespace Pepso\Controllers;

use Pepso\Core\Database;
use Pepso\Core\Request;
use Pepso\Core\Response;
use Pepso\Repositories\CategoryRepository;
use Pepso\Repositories\ProductRepository;
use Pepso\Services\ImageService;
use Pepso\Services\ProductCodeService;
use RuntimeException;
use Throwable;

class AdminProductController
{
    private ProductRepository $repo;
    private CategoryRepository $catRepo;
    private ImageService $imageService;

    public function __construct()
    {
        $this->repo = new ProductRepository();
        $this->catRepo = new CategoryRepository();
        $this->imageService = new ImageService();
    }

    public function index(Request $request): void
    {
        $params = $request->getQueryParams();
        $params['per_page'] = min(50, max(1, (int)($params['per_page'] ?? 15)));
        $result = $this->repo->search($params);

        Response::json(
            $result['data'],
            200,
            [
                'page' => $result['page'],
                'per_page' => $result['per_page'],
                'total' => $result['total'],
                'pages' => (int)ceil($result['total'] / $result['per_page']),
            ]
        );
    }

    public function show(Request $request, array $params): void
    {
        $id = (int)($params['id'] ?? 0);
        $product = $this->repo->findById($id, true);
        if (!$product) {
            Response::error('Produk tidak ditemukan.', 'PRODUCT_NOT_FOUND', 404);
        }
        Response::json($product);
    }

    public function nextCode(Request $request): void
    {
        $categoryId = (int)$request->getQuery('category_id', 0);
        if ($categoryId <= 0) {
            Response::error('category_id diperlukan.', 'VALIDATION_ERROR', 400);
        }

        $cat = $this->catRepo->findById($categoryId);
        if (!$cat) {
            Response::error('Kategori tidak ditemukan.', 'CATEGORY_NOT_FOUND', 404);
        }

        $codeService = new ProductCodeService();
        $code = $codeService->generate($cat['code']);

        Response::json(['code' => $code, 'category_code' => $cat['code']]);
    }

    public function create(Request $request): void
    {
        $body = $request->getBody();
        $name = trim((string)($body['name'] ?? ''));
        $code = strtoupper(trim((string)($body['code'] ?? '')));
        $categoryId = (int)($body['category_id'] ?? 0);
        $price = (int)($body['price'] ?? 0);
        $stock = max(0, (int)($body['stock'] ?? 1));

        $errors = [];
        if ($name === '') $errors['name'] = 'Nama produk wajib diisi.';
        if ($code === '') $errors['code'] = 'Kode produk wajib diisi.';
        if ($categoryId <= 0) $errors['category_id'] = 'Kategori wajib dipilih.';
        if ($price <= 0) $errors['price'] = 'Harga produk harus lebih dari 0.';

        if (!empty($errors)) {
            Response::error('Mohon lengkapi formulir dengan benar.', 'VALIDATION_ERROR', 422, $errors);
        }

        if ($this->repo->isCodeTaken($code)) {
            Response::error("Kode produk '{$code}' sudah digunakan oleh produk lain.", 'CODE_DUPLICATE', 409, [
                'code' => 'Kode sudah digunakan.',
            ]);
        }

        $slug = ProductCodeService::ensureUniqueSlug($this->repo, $name);

        $grade = in_array($body['condition_grade'] ?? '', ['excellent', 'good', 'fair', 'poor'], true)
            ? $body['condition_grade']
            : 'good';

        $status = $stock > 0 ? ($body['status'] ?? 'available') : 'sold';

        Database::beginTransaction();
        try {
            $productId = $this->repo->create([
                'name' => $name,
                'code' => $code,
                'slug' => $slug,
                'category_id' => $categoryId,
                'price' => $price,
                'stock' => $stock,
                'status' => $status,
                'condition_grade' => $grade,
                'condition_percent' => !empty($body['condition_percent']) ? (int)$body['condition_percent'] : null,
                'condition_note' => $body['condition_note'] ?? null,
                'description' => $body['description'] ?? null,
                'compat_notes' => $body['compat_notes'] ?? null,
            ]);

            // Sync motor types
            $motorIds = is_array($body['motor_type_ids'] ?? null) ? $body['motor_type_ids'] : [];
            $primaryMotorId = (int)($body['primary_motor_id'] ?? ($motorIds[0] ?? 0));
            $this->repo->syncMotorTypes($productId, $motorIds, $primaryMotorId);

            Database::commit();

            $created = $this->repo->findById($productId, true);
            Response::json($created, 201);
        } catch (Throwable $e) {
            Database::rollBack();
            Response::error('Gagal menambahkan produk: ' . $e->getMessage(), 'DATABASE_ERROR', 500);
        }
    }

    public function update(Request $request, array $params): void
    {
        $id = (int)($params['id'] ?? 0);
        $existing = $this->repo->findById($id);
        if (!$existing) {
            Response::error('Produk tidak ditemukan.', 'PRODUCT_NOT_FOUND', 404);
        }

        $body = $request->getBody();
        $name = trim((string)($body['name'] ?? $existing['name']));
        $code = strtoupper(trim((string)($body['code'] ?? $existing['code'])));
        $categoryId = (int)($body['category_id'] ?? $existing['category_id']);
        $price = (int)($body['price'] ?? $existing['price']);
        $stock = max(0, (int)($body['stock'] ?? $existing['stock']));

        if ($code !== $existing['code'] && $this->repo->isCodeTaken($code, $id)) {
            Response::error("Kode produk '{$code}' sudah digunakan oleh produk lain.", 'CODE_DUPLICATE', 409, [
                'code' => 'Kode sudah digunakan.',
            ]);
        }

        $grade = in_array($body['condition_grade'] ?? '', ['excellent', 'good', 'fair', 'poor'], true)
            ? $body['condition_grade']
            : $existing['condition_grade'];

        $status = $stock > 0 ? ($body['status'] ?? $existing['status']) : 'sold';

        Database::beginTransaction();
        try {
            $this->repo->update($id, [
                'name' => $name,
                'code' => $code,
                'category_id' => $categoryId,
                'price' => $price,
                'stock' => $stock,
                'status' => $status,
                'condition_grade' => $grade,
                'condition_percent' => isset($body['condition_percent']) && $body['condition_percent'] !== '' ? (int)$body['condition_percent'] : null,
                'condition_note' => $body['condition_note'] ?? null,
                'description' => $body['description'] ?? null,
                'compat_notes' => $body['compat_notes'] ?? null,
            ]);

            if (isset($body['motor_type_ids']) && is_array($body['motor_type_ids'])) {
                $motorIds = $body['motor_type_ids'];
                $primaryMotorId = (int)($body['primary_motor_id'] ?? ($motorIds[0] ?? 0));
                $this->repo->syncMotorTypes($id, $motorIds, $primaryMotorId);
            }

            Database::commit();

            $updated = $this->repo->findById($id, true);
            Response::json($updated);
        } catch (Throwable $e) {
            Database::rollBack();
            Response::error('Gagal memperbarui produk: ' . $e->getMessage(), 'DATABASE_ERROR', 500);
        }
    }

    public function delete(Request $request, array $params): void
    {
        $id = (int)($params['id'] ?? 0);
        try {
            $this->repo->softDelete($id);
            Response::json(['message' => 'Produk berhasil dihapus (soft delete).']);
        } catch (RuntimeException $e) {
            Response::error($e->getMessage(), 'CONFLICT', 409);
        }
    }

    public function patchStock(Request $request, array $params): void
    {
        $id = (int)($params['id'] ?? 0);
        $body = $request->getBody();

        if (!isset($body['stock'])) {
            Response::error('Parameter stock diperlukan.', 'VALIDATION_ERROR', 400);
        }

        $newStock = max(0, (int)$body['stock']);

        try {
            $res = $this->repo->updateStock($id, $newStock);
            Response::json([
                'id' => $id,
                'stock' => $res['stock'],
                'status' => $res['status'],
                'message' => 'Stok produk berhasil diperbarui.',
            ]);
        } catch (RuntimeException $e) {
            Response::error($e->getMessage(), 'ERROR', 400);
        }
    }

    public function patchStatus(Request $request, array $params): void
    {
        $id = (int)($params['id'] ?? 0);
        $action = (string)$request->get('action', '');

        try {
            $updated = $this->repo->updateStatus($id, $action);
            Response::json([
                'product' => $updated,
                'message' => "Status produk berhasil diperbarui ({$action}).",
            ]);
        } catch (RuntimeException $e) {
            Response::error($e->getMessage(), 'STATUS_ERROR', 400);
        }
    }

    public function uploadImages(Request $request, array $params): void
    {
        $id = (int)($params['id'] ?? 0);
        $product = $this->repo->findById($id);
        if (!$product) {
            Response::error('Produk tidak ditemukan.', 'PRODUCT_NOT_FOUND', 404);
        }

        $files = $request->getFiles();
        if (empty($files) || (!isset($files['images']) && !isset($files['image']))) {
            Response::error('Tidak ada file gambar yang diunggah.', 'NO_FILE', 400);
        }

        $uploadedImages = [];
        $rawFiles = $files['images'] ?? $files['image'];

        // Normalisasi struktur $_FILES baik multi maupun single
        $fileList = [];
        if (is_array($rawFiles['name'])) {
            $count = count($rawFiles['name']);
            for ($i = 0; $i < $count; $i++) {
                if ($rawFiles['error'][$i] === UPLOAD_ERR_OK) {
                    $fileList[] = [
                        'name' => $rawFiles['name'][$i],
                        'type' => $rawFiles['type'][$i],
                        'tmp_name' => $rawFiles['tmp_name'][$i],
                        'error' => $rawFiles['error'][$i],
                        'size' => $rawFiles['size'][$i],
                    ];
                }
            }
        } else {
            if ($rawFiles['error'] === UPLOAD_ERR_OK) {
                $fileList[] = $rawFiles;
            }
        }

        if (empty($fileList)) {
            Response::error('File gambar tidak valid atau terjadi kegagalan upload.', 'UPLOAD_FAILED', 400);
        }

        $db = Database::getConnection();
        $existingImages = $this->repo->getImages($id);
        $hasPrimary = count(array_filter($existingImages, fn($img) => (int)$img['is_primary'] === 1)) > 0;
        $currentSort = count($existingImages);

        foreach ($fileList as $f) {
            try {
                $processed = $this->imageService->processUpload($f);
                $isPrimary = (!$hasPrimary && empty($uploadedImages)) ? 1 : 0;
                $currentSort++;

                $stmt = $db->prepare(
                    'INSERT INTO product_images (product_id, path, thumb_path, sort_order, is_primary, created_at)
                     VALUES (:pid, :path, :thumb, :sort, :primary, NOW())'
                );
                $stmt->execute([
                    'pid' => $id,
                    'path' => $processed['path'],
                    'thumb' => $processed['thumb_path'],
                    'sort' => $currentSort,
                    'primary' => $isPrimary,
                ]);

                $uploadedImages[] = [
                    'id' => (int)$db->lastInsertId(),
                    'path' => $processed['path'],
                    'thumb_path' => $processed['thumb_path'],
                    'is_primary' => $isPrimary,
                ];
            } catch (Throwable $e) {
                Response::error('Gagal memproses gambar: ' . $e->getMessage(), 'IMAGE_PROCESS_ERROR', 400);
            }
        }

        $allImages = $this->repo->getImages($id);
        Response::json(['images' => $allImages, 'uploaded' => $uploadedImages], 201);
    }

    public function patchImage(Request $request, array $params): void
    {
        $id = (int)($params['id'] ?? 0);
        $imageId = (int)($params['imageId'] ?? 0);
        $body = $request->getBody();

        $db = Database::getConnection();

        if (isset($body['is_primary']) && (bool)$body['is_primary'] === true) {
            // Reset primary lain untuk produk ini
            $db->prepare('UPDATE product_images SET is_primary = 0 WHERE product_id = :pid')->execute(['pid' => $id]);
            $db->prepare('UPDATE product_images SET is_primary = 1 WHERE id = :id AND product_id = :pid')
               ->execute(['id' => $imageId, 'pid' => $id]);
        }

        if (isset($body['sort_order'])) {
            $db->prepare('UPDATE product_images SET sort_order = :sort WHERE id = :id AND product_id = :pid')
               ->execute(['sort' => (int)$body['sort_order'], 'id' => $imageId, 'pid' => $id]);
        }

        Response::json(['images' => $this->repo->getImages($id)]);
    }

    public function deleteImage(Request $request, array $params): void
    {
        $id = (int)($params['id'] ?? 0);
        $imageId = (int)($params['imageId'] ?? 0);

        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT path, thumb_path, is_primary FROM product_images WHERE id = :id AND product_id = :pid');
        $stmt->execute(['id' => $imageId, 'pid' => $id]);
        $img = $stmt->fetch();

        if (!$img) {
            Response::error('Gambar tidak ditemukan.', 'NOT_FOUND', 404);
        }

        // Hapus file fisik
        $this->imageService->deleteFile($img['path']);
        $this->imageService->deleteFile($img['thumb_path']);

        // Hapus dari database
        $db->prepare('DELETE FROM product_images WHERE id = :id')->execute(['id' => $imageId]);

        // Jika foto yang dihapus adalah primary, jadikan foto pertama yang tersisa sebagai primary
        if ((int)$img['is_primary'] === 1) {
            $db->prepare('UPDATE product_images SET is_primary = 1 WHERE product_id = :pid ORDER BY sort_order ASC LIMIT 1')
               ->execute(['pid' => $id]);
        }

        Response::json(['images' => $this->repo->getImages($id), 'message' => 'Gambar berhasil dihapus.']);
    }
}
