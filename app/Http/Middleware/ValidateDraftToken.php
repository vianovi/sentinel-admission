<?php

namespace App\Http\Middleware;

use App\Models\RegistrationDraft;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cookie;
use Symfony\Component\HttpFoundation\Response;

class ValidateDraftToken
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->cookie('draft_token');

        if (!$token) {
            return redirect()->route('daftar')
                ->with('error', 'Sesi pendaftaran tidak ditemukan. Silakan mulai dari awal.');
        }

        $draft = RegistrationDraft::where('secret_token', $token)
            ->whereNull('deleted_at')
            ->first();

        if (!$draft) {
            // Token tidak dikenal → hapus cookie
            Cookie::queue(Cookie::forget('draft_token'));
            return redirect()->route('daftar')
                ->with('error', 'Token tidak valid. Silakan mulai dari awal.');
        }

        if ($draft->expires_at && $draft->expires_at->isPast()) {
            // Expired → hapus PERMANEN semua data draft + cookie
            $draft->forceDelete();
            Cookie::queue(Cookie::forget('draft_token'));
            return redirect()->route('daftar')
                ->with('error', 'Sesi pendaftaran telah kadaluarsa. Semua data telah dihapus. Silakan isi formulir kembali.');
        }

        $request->merge(['_draft' => $draft]);

        return $next($request);
    }
}
