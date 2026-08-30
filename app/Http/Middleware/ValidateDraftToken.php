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

        if (! $token) {
            return redirect()->route('daftar')
                ->with('error', 'Sesi pendaftaran tidak ditemukan. Silakan mulai dari awal.');
        }

        $draft = RegistrationDraft::where('secret_token', $token)->first();

        if (! $draft) {
            Cookie::queue(Cookie::forget('draft_token'));

            return redirect()->route('daftar')
                ->with('error', 'Sesi pendaftaran tidak dapat dilanjutkan. Silakan mulai kembali.');
        }

        if (! $draft->isValid()) {
            if (! $draft->trashed()) {
                $draft->delete();
            }

            Cookie::queue(Cookie::forget('draft_token'));

            return redirect()->route('daftar')
                ->with('error', 'Sesi pendaftaran tidak dapat dilanjutkan. Silakan mulai kembali.');
        }

        $request->merge(['_draft' => $draft]);

        return $next($request);
    }
}
