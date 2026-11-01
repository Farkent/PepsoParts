<?php

declare(strict_types=1);

namespace Pepso\Controllers;

use Pepso\Core\Request;
use Pepso\Core\Response;
use Pepso\Repositories\SettingsRepository;

class AdminSettingsController
{
    private SettingsRepository $repo;

    public function __construct()
    {
        $this->repo = new SettingsRepository();
    }

    public function getSettings(Request $request): void
    {
        Response::json($this->repo->getAll());
    }

    public function updateSettings(Request $request): void
    {
        $body = $request->getBody();
        $allowed = [
            'store_name', 'whatsapp_number', 'about_text',
            'address', 'opening_hours', 'facebook_url', 'shopee_url',
        ];

        $updates = [];
        foreach ($allowed as $key) {
            if (array_key_exists($key, $body)) {
                $updates[$key] = trim((string)$body[$key]);
            }
        }

        $this->repo->setMany($updates);
        Response::json($this->repo->getAll());
    }
}

