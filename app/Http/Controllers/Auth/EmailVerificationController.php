<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Auth\Events\Verified;
use Illuminate\Foundation\Auth\EmailVerificationRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

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
            'error' => session('error'),
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

        try {
            $request->user()->sendEmailVerificationNotification();
        } catch (Throwable $exception) {
            Log::error('Email verification delivery failed.', [
                'user_id' => $request->user()->id,
                'exception' => $exception,
            ]);

            return back()->with('error', 'Email verifikasi belum dapat dikirim. Silakan coba lagi beberapa saat.');
        }

        return back()->with('status', 'verification-link-sent');
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
