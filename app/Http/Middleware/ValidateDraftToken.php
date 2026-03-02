<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user(),
            ],
            // ── Global app config — diambil dari .env ──────────────────────
            'app' => [
                'name'    => config('app.name'),
                'tagline' => env('APP_TAGLINE', 'Sistem SPMB'),
                'logo'    => env('APP_LOGO', null),  // path ke logo, null = pakai icon FA
            ],
        ];
    }
}
