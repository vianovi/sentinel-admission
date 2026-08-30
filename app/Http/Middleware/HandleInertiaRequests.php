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
        $user = $request->user();

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'is_active' => $user->is_active,
                    'whatsapp_number' => $user->whatsapp_number,
                    'avatar_url' => $user->avatar_url,
                    'initials' => $user->initials,
                ] : null,
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
            // ── Global app config ──────────────────────────────────────────
            'app' => [
                'name' => config('app.name'),
                'tagline' => env('APP_TAGLINE', 'Sistem SPMB'),
                'logo' => env('APP_LOGO', '/assets/icons/brand/logo.webp'),
            ],
        ];
    }
}
