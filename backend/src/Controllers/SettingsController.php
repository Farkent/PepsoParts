<?php

declare(strict_types=1);

namespace Pepso\Controllers;

use Pepso\Core\Request;
use Pepso\Core\Response;
use Pepso\Repositories\SettingsRepository;

class SettingsController
{
    private SettingsRepository $repo;

    public function __construct()
    {
        $this->repo = new SettingsRepository();
    }

    /** GET /api/settings/public */
    public function getPublic(Request $request): void
    {
        Response::json($this->repo->getPublic());
    }
}

