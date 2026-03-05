<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Auth\Events\Verified;
use Illuminate\Foundation\Auth\EmailVerificationRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EmailVerificationController extends Controller
{
    // =============================================
    // GET /email/verify
    // Tampilkan notifikasi "cek email kamu"
    // Hanya muncul kalau user belum verified
    // =============================================
    public function notice(Request $request): RedirectResponse|Response
    {
        if ($request->user()->hasVerifiedEmail()) {
            return redirect()->intended($this->redirectTo($request));
        }

        return Inertia::render('Auth/VerifyEmail', [
            'status' => session('status'),
        ]);
    }

    // =============================================
    // GET /email/verify/{id}/{hash}
    // Proses verifikasi dari link di email
    // =============================================
    public function verify(EmailVerificationRequest $request): RedirectResponse
    {
        if ($request->user()->hasVerifiedEmail()) {
            return redirect()->intended($this->redirectTo($request))
                ->with('status', 'Email sudah terverifikasi.');
        }

        $request->fulfill();

        event(new Verified($request->user()));

        return redirect()->intended($this->redirectTo($request))
            ->with('status', 'Email berhasil diverifikasi!');
    }

    // =============================================
    // POST /email/verification-notification
    // Kirim ulang email verifikasi
    // =============================================
    public function send(Request $request): RedirectResponse
    {
        if ($request->user()->hasVerifiedEmail()) {
            return redirect()->intended($this->redirectTo($request));
        }

        $request->user()->sendEmailVerificationNotification();

        return back()->with('status', 'Link verifikasi telah dikirim ulang ke email kamu.');
    }

    // =============================================
    // Redirect setelah verified — berdasarkan role
    // =============================================
    private function redirectTo(Request $request): string
    {
        return match ($request->user()->role) {
            'admin' => route('admin.dashboard'),
            'staff' => route('staff.dashboard'),
            default => route('dashboard.index'),
        };
    }
}
