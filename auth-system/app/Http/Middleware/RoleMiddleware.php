<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     *
     * Cara pakai di routes:
     *   ->middleware('role:admin')
     *   ->middleware('role:staff')
     *   ->middleware('role:candidate')
     *
     * Setiap role MUTLAK terisolasi — tidak ada overlap.
     * Admin tidak bisa masuk route staff, begitu pula sebaliknya.
     */
    public function handle(Request $request, Closure $next, string $role): Response
    {
        // Harus login dulu
        if (! $request->user()) {
            return redirect()->route('login');
        }

        // Akun non-aktif → logout paksa
        if (! $request->user()->is_active) {
            auth()->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()->route('login')
                ->withErrors(['email' => 'Akun kamu telah dinonaktifkan. Hubungi administrator.']);
        }

        // Cek role — mutlak sesuai parameter
        if ($request->user()->role !== $role) {
            abort(403, 'Kamu tidak memiliki akses ke halaman ini.');
        }

        return $next($request);
    }
}
