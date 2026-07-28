<?php

namespace App\Http\Controllers\Admission;

use App\Http\Controllers\Controller;
use App\Models\Candidate;
use App\Models\Guardian;
use App\Models\RegistrationDraft;
use App\Models\User;
use App\Support\EmailDomainVerifier;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

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
                'full_name' => $draft->full_name,
                'nisn' => $draft->nisn,
                'whatsapp_number' => $draft->whatsapp_number,
                'email' => $draft->email,
                'registration_code' => $draft->registration_code,
                'school_origin' => $draft->school_origin,
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
            'password.required' => 'Password wajib diisi.',
            'password.confirmed' => 'Konfirmasi password tidak cocok.',
            'password.min' => 'Password minimal 8 karakter.',
        ]);

        $validatedDraft = Validator::make([
            'email' => $draft->email,
        ], [
            'email' => ['required', 'email:rfc', 'max:255', Rule::unique('users', 'email')],
        ], [
            'email.required' => 'Email pendaftaran wajib diisi.',
            'email.email' => 'Format email pendaftaran tidak valid.',
            'email.unique' => 'Email sudah terdaftar. Gunakan email lain.',
        ])->validate();

        $validatedDraft['email'] = strtolower(trim($validatedDraft['email']));

        if (! EmailDomainVerifier::canReceive($validatedDraft['email'])) {
            return back()
                ->withErrors(['email' => 'Domain email tidak ditemukan atau tidak memiliki server penerima email. Periksa kembali penulisannya.'])
                ->withInput();
        }

        // 1. Buat user
        $user = User::create([
            'name' => $draft->full_name,
            'email' => $validatedDraft['email'],
            'password' => Hash::make($request->password),
            'role' => 'candidate',
            'whatsapp_number' => $draft->whatsapp_number,
            'is_active' => true,
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
        $emailDispatched = true;

        try {
            event(new Registered($user));
        } catch (Throwable $exception) {
            $emailDispatched = false;

            Log::error('Registration verification email delivery failed.', [
                'user_id' => $user->id,
                'exception' => $exception,
            ]);
        }

        // 7. Login otomatis
        Auth::login($user);

        // 8. Redirect ke dashboard
        $response = redirect()->route('dashboard.index')
            ->withCookie($expiredCookie);

        if (! $emailDispatched) {
            return $response->with(
                'error',
                'Akun berhasil dibuat, tetapi email verifikasi belum dapat dikirim. Gunakan menu Verifikasi Email untuk mencoba lagi.'
            );
        }

        return $response->with(
            'success',
            'Akun berhasil dibuat. Email verifikasi telah dikirim. Silakan periksa kotak masuk dan folder spam.'
        );
    }
}
