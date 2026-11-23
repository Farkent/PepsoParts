<?php

declare(strict_types=1);

namespace Pepso\Middleware;

use Pepso\Core\Request;
use Pepso\Core\Response;
use Pepso\Core\Session;

class CustomerAuthMiddleware
{
    public function handle(Request $request): void
    {
        Session::start();

        if (empty(Session::get('customer_id'))) {
            Response::error('Silakan masuk ke akun pelanggan untuk melanjutkan.', 'UNAUTHORIZED', 401);
        }
    }
}
