<?php

namespace App\Http\Controllers\Admission;

use App\Http\Controllers\Controller;
use App\Models\Candidate;
use App\Models\Guardian;
use App\Models\RegistrationDraft;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class RegisterController extends Controller
{
    // =============================================
    // GET /register
    // =============================================
    public function show(Request $request): Response
    {
        /** @var RegistrationDraft $draft */
        $draft = $request->get('_draft');

        return Inertia::render('Admission/Register', [
            'draft' => [
                'full_name'         => $draft->full_name,
                'nisn'              => $draft->nisn,
                'whatsapp_number'   => $draft->whatsapp_number,
                'email'             => $draft->email,
                'registration_code' => $draft->registration_code,
                'school_origin'     => $draft->school_origin,
            ],
        ]);
    }

    // =============================================
    // POST /register
    // =============================================
    public function store(Request $request)
    {
        /** @var RegistrationDraft $draft */
        $draft = $request->get('_draft');

        $request->validate([
            'password' => ['required', 'confirmed', Password::min(8)],
        ], [
            'password.required'  => 'Password wajib diisi.',
            'password.confirmed' => 'Konfirmasi password tidak cocok.',
            'password.min'       => 'Password minimal 8 karakter.',
        ]);

        // 1. Buat user
        $user = User::create([
            'name'            => $draft->full_name,
            'email'           => $draft->email,
            'password'        => Hash::make($request->password),
            'role'            => 'candidate',
            'whatsapp_number' => $draft->whatsapp_number,
            'is_active'       => true,
        ]);

        // 2. Konversi draft → candidate
        $candidate = Candidate::createFromDraft($draft, $user->id);

        // 3. Buat guardian dari draft
        Guardian::createFromDraft($draft, $candidate->id);

        // 4. Soft delete draft
        $draft->delete();

        // 5. Hapus cookie draft_token
        $expiredCookie = Cookie::forget('draft_token');

        // 6. Fire Registered event → email verifikasi
        event(new Registered($user));

        // 7. Login otomatis
        Auth::login($user);

        // 8. Redirect ke dashboard
        return redirect()->route('dashboard.index')
            ->withCookie($expiredCookie);
    }
}