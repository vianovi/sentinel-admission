<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    // =============================================
    // GET /login
    // =============================================
    public function create(Request $request): Response
    {
        return Inertia::render('Auth/Login', [
            'status' => session('status'),
        ]);
    }

    // =============================================
    // POST /login
    // =============================================
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        // Single session: hapus semua session lain milik user ini
        // Sehingga login di device baru = logout otomatis di device lama
        Auth::logoutOtherDevices($request->password);

        $request->session()->regenerate();

        // Redirect berdasarkan role — mutlak terisolasi
        return match (Auth::user()->role) {
            'admin'     => redirect()->intended(route('admin.dashboard')),
            'staff'     => redirect()->intended(route('staff.dashboard')),
            default     => redirect()->intended(route('dashboard')),
        };
    }

    // =============================================
    // POST /logout
    // =============================================
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('home');
    }
}
