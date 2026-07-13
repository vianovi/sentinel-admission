<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class PasswordResetLinkController extends Controller
{
    private const RESET_LINK_SENT_MESSAGE = 'Permintaan reset telah diproses. Jika email terdaftar, silakan periksa kotak masuk dan folder spam.';

    // =============================================
    // GET /forgot-password
    // =============================================
    public function create(Request $request): Response
    {
        return Inertia::render('Auth/ForgotPassword', [
            'status' => session('status'),
        ]);
    }

    // =============================================
    // POST /forgot-password
    // =============================================
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'email' => ['required', 'email:rfc', 'max:255'],
        ], [
            'email.required' => 'Email wajib diisi.',
            'email.email' => 'Format email tidak valid.',
        ]);

        try {
            $status = Password::sendResetLink(
                $request->only('email')
            );
        } catch (Throwable $exception) {
            Log::error('Password reset email delivery failed.', [
                'exception' => $exception,
            ]);

            return back()->with('status', self::RESET_LINK_SENT_MESSAGE);
        }

        if (in_array($status, [
            Password::ResetLinkSent,
            Password::InvalidUser,
            Password::ResetThrottled,
        ], true)) {
            return back()->with('status', self::RESET_LINK_SENT_MESSAGE);
        }

        Log::warning('Password reset email was not dispatched.', [
            'status' => $status,
        ]);

        return back()->withErrors([
            'email' => 'Email belum dapat dikirim. Silakan coba lagi beberapa saat.',
        ]);
    }
}
