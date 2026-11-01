<?php

declare(strict_types=1);

namespace Pepso\Controllers;

use Pepso\Core\Request;
use Pepso\Core\Response;
use Pepso\Repositories\CategoryRepository;
use Pepso\Repositories\MotorTypeRepository;
use Pepso\Services\ProductCodeService;
use RuntimeException;

class AdminMasterController
{
    private CategoryRepository $catRepo;
    private MotorTypeRepository $motorRepo;

    public function __construct()
    {
        $this->catRepo = new CategoryRepository();
        $this->motorRepo = new MotorTypeRepository();
    }

    // ── Kategori ──────────────────────────────────────────────
    public function listCategories(Request $request): void
    {
        Response::json($this->catRepo->getAll(false));
    }

    public function createCategory(Request $request): void
    {
        $name = trim((string)$request->get('name', ''));
        $code = strtoupper(trim((string)$request->get('code', '')));
        $sortOrder = (int)$request->get('sort_order', 0);
        $isActive = (int)$request->get('is_active', 1);

        if ($name === '' || strlen($code) !== 3) {
            Response::error('Nama kategori dan kode 3 huruf wajib diisi.', 'VALIDATION_ERROR', 422, [
                'name' => $name === '' ? 'Nama wajib diisi' : null,
                'code' => strlen($code) !== 3 ? 'Kode harus 3 huruf (contoh: MSN)' : null,
            ]);
        }

        if ($this->catRepo->isCodeTaken($code)) {
            Response::error("Kode kategori '{$code}' sudah digunakan.", 'DUPLICATE_CODE', 409);
        }

        $slug = ProductCodeService::generateSlug($name);
        if ($this->catRepo->isSlugTaken($slug)) {
            $slug .= '-' . rand(10, 99);
        }

        $id = $this->catRepo->create([
            'name' => $name,
            'slug' => $slug,
            'code' => $code,
            'sort_order' => $sortOrder,
            'is_active' => $isActive,
        ]);

        Response::json($this->catRepo->findById($id), 201);
    }

    public function updateCategory(Request $request, array $params): void
    {
        $id = (int)($params['id'] ?? 0);
        $cat = $this->catRepo->findById($id);
        if (!$cat) {
            Response::error('Kategori tidak ditemukan.', 'NOT_FOUND', 404);
        }

        $name = trim((string)$request->get('name', $cat['name']));
        $code = strtoupper(trim((string)$request->get('code', $cat['code'])));
        $sortOrder = (int)$request->get('sort_order', $cat['sort_order']);
        $isActive = (int)$request->get('is_active', $cat['is_active']);

        if (strlen($code) !== 3) {
            Response::error('Kode harus 3 huruf.', 'VALIDATION_ERROR', 422);
        }

        if ($code !== $cat['code'] && $this->catRepo->isCodeTaken($code, $id)) {
            Response::error("Kode '{$code}' sudah digunakan kategori lain.", 'DUPLICATE_CODE', 409);
        }

        $slug = ProductCodeService::generateSlug($name);
        if ($this->catRepo->isSlugTaken($slug, $id)) {
            $slug .= '-' . $id;
        }

        $this->catRepo->update($id, [
            'name' => $name,
            'slug' => $slug,
            'code' => $code,
            'sort_order' => $sortOrder,
            'is_active' => $isActive,
        ]);

        Response::json($this->catRepo->findById($id));
    }

    public function deleteCategory(Request $request, array $params): void
    {
        $id = (int)($params['id'] ?? 0);
        try {
            $this->catRepo->delete($id);
            Response::json(['message' => 'Kategori berhasil dihapus.']);
        } catch (RuntimeException $e) {
            Response::error($e->getMessage(), 'CONFLICT', 409);
        }
    }

    // ── Tipe Motor ────────────────────────────────────────────
    public function listMotorTypes(Request $request): void
    {
        Response::json($this->motorRepo->getAll(false));
    }

    public function createMotorType(Request $request): void
    {
        $name = trim((string)$request->get('name', ''));
        $yearFrom = $request->get('year_from') ? (int)$request->get('year_from') : null;
        $yearTo = $request->get('year_to') ? (int)$request->get('year_to') : null;
        $notes = $request->get('notes');
        $isActive = (int)$request->get('is_active', 1);

        if ($name === '') {
            Response::error('Nama tipe motor wajib diisi.', 'VALIDATION_ERROR', 422);
        }

        $slug = ProductCodeService::generateSlug($name);
        if ($this->motorRepo->isSlugTaken($slug)) {
            $slug .= '-' . rand(10, 99);
        }

        $id = $this->motorRepo->create([
            'name' => $name,
            'slug' => $slug,
            'year_from' => $yearFrom,
            'year_to' => $yearTo,
            'notes' => $notes,
            'is_active' => $isActive,
        ]);

        Response::json($this->motorRepo->findById($id), 201);
    }

    public function updateMotorType(Request $request, array $params): void
    {
        $id = (int)($params['id'] ?? 0);
        $motor = $this->motorRepo->findById($id);
        if (!$motor) {
            Response::error('Tipe motor tidak ditemukan.', 'NOT_FOUND', 404);
        }

        $name = trim((string)$request->get('name', $motor['name']));
        $yearFrom = $request->get('year_from') !== null ? (int)$request->get('year_from') : $motor['year_from'];
        $yearTo = $request->get('year_to') !== null ? (int)$request->get('year_to') : $motor['year_to'];
        $notes = $request->get('notes', $motor['notes']);
        $isActive = (int)$request->get('is_active', $motor['is_active']);

        $slug = ProductCodeService::generateSlug($name);
        if ($this->motorRepo->isSlugTaken($slug, $id)) {
            $slug .= '-' . $id;
        }

        $this->motorRepo->update($id, [
            'name' => $name,
            'slug' => $slug,
            'year_from' => $yearFrom,
            'year_to' => $yearTo,
            'notes' => $notes,
            'is_active' => $isActive,
        ]);

        Response::json($this->motorRepo->findById($id));
    }

    public function deleteMotorType(Request $request, array $params): void
    {
        $id = (int)($params['id'] ?? 0);
        try {
            $this->motorRepo->delete($id);
            Response::json(['message' => 'Tipe motor berhasil dihapus.']);
        } catch (RuntimeException $e) {
            Response::error($e->getMessage(), 'CONFLICT', 409);
        }
    }
}
