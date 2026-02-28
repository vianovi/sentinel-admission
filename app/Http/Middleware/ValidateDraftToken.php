<?php

namespace App\Http\Middleware;

use App\Models\RegistrationDraft;
use Closure;
use Illuminate\Http\Request;
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
            return redirect()->route('daftar')
                ->with('error', 'Token tidak valid. Silakan mulai dari awal.');
        }

        if ($draft->expires_at->isPast()) {
            $draft->delete(); // soft delete expired draft
            return redirect()->route('daftar')
                ->with('error', 'Sesi pendaftaran telah kadaluarsa. Silakan isi formulir kembali.');
        }

        // Inject draft ke request supaya bisa diakses di controller
        $request->merge(['_draft' => $draft]);

        return $next($request);
    }
}
