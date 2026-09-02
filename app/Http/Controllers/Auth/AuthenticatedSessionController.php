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
    // GET /login  — Candidate Portal
    // =============================================
    public function create(Request $request): Response
    {
        return Inertia::render('Auth/Login', [
            'status' => session('status'),
        ]);
    }

    // =============================================
    // POST /login  — Candidate Portal
    // =============================================
    public function store(LoginRequest $request): Response|RedirectResponse
    {
        $request->authenticate();

        // Single session: hapus semua session lain milik user ini
        // PERF BUG: Auth::logoutOtherDevices($request->password) menyebabkan re-hash password setiap login.
        // Fitur ini juga membutuhkan middleware AuthenticateSession untuk bekerja.
        // Auth::logoutOtherDevices($request->password);

        $request->session()->regenerate();

        $role = Auth::user()->role;

        // Staff / admin nyasar ke portal kandidat → logout paksa, tampil WrongPortal
        if (in_array($role, ['staff', 'admin'])) {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return Inertia::render('Errors/WrongPortal', [
                'from' => 'candidate',
                'correctRoute' => route('staff.login'),
            ]);
        }

        return redirect()->intended(route('dashboard.index'));
    }

    // =============================================
    // GET /staff/login  — Staff & Admin Portal
    // =============================================
    public function createStaff(Request $request): Response
    {
        return Inertia::render('Auth/StaffLogin', [
            'status' => session('status'),
        ]);
    }

    // =============================================
    // POST /staff/login  — Staff & Admin Portal
    // =============================================
    public function storeStaff(LoginRequest $request): Response|RedirectResponse
    {
        $request->authenticate();

        // Single session: hapus semua session lain milik user ini
        // PERF BUG: Auth::logoutOtherDevices($request->password) menyebabkan re-hash password setiap login.
        // Fitur ini juga membutuhkan middleware AuthenticateSession untuk bekerja.
        // Auth::logoutOtherDevices($request->password);

        $request->session()->regenerate();

        $role = Auth::user()->role;

        // Candidate nyasar ke portal staff → logout paksa, tampil WrongPortal
        if ($role === 'candidate') {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return Inertia::render('Errors/WrongPortal', [
                'from' => 'staff',
                'correctRoute' => route('login'),
            ]);
        }

        // Redirect berdasarkan role — mutlak terisolasi (tanpa intended agar selalu deterministic)
        return match ($role) {
            'admin' => redirect()->route('admin.dashboard'),
            'staff' => redirect()->route('staff.dashboard'),
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
