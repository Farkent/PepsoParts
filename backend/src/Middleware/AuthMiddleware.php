<?php

declare(strict_types=1);

namespace Pepso\Middleware;

use Pepso\Core\Request;
use Pepso\Core\Response;
use Pepso\Core\Session;

class AuthMiddleware
{
    public function handle(Request $request): void
    {
        Session::start();
        $adminId = Session::get('admin_id');

        if (empty($adminId)) {
            Response::error('Sesi telah berakhir atau Anda belum login sebagai admin.', 'UNAUTHORIZED', 401);
        }
    }
}

