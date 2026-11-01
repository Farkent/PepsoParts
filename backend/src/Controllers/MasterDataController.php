<?php

declare(strict_types=1);

namespace Pepso\Controllers;

use Pepso\Core\Request;
use Pepso\Core\Response;
use Pepso\Repositories\CategoryRepository;
use Pepso\Repositories\MotorTypeRepository;

class MasterDataController
{
    private CategoryRepository $catRepo;
    private MotorTypeRepository $motorRepo;

    public function __construct()
    {
        $this->catRepo   = new CategoryRepository();
        $this->motorRepo = new MotorTypeRepository();
    }

    // ── Kategori ──────────────────────────────────────────────
    public function listCategories(Request $request): void
    {
        $categories = $this->catRepo->getAll(true);
        Response::json($categories);
    }

    // ── Tipe Motor ────────────────────────────────────────────
    public function listMotorTypes(Request $request): void
    {
        $motors = $this->motorRepo->getAll(true);
        Response::json($motors);
    }
}

