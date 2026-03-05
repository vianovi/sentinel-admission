<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class CandidateDashboardController extends Controller
{
    // =========================================================================
    // DASHBOARD INDEX
    // =========================================================================

    public function index(Request $request): Response
    {
        $user      = $request->user();
        $candidate = $user->candidate()
            ->with(['admissionWave', 'documents', 'payments'])
            ->first();

        if (! $candidate) {
            return Inertia::render('Dashboard/Index', [
                'candidate'      => null,
                'documents'      => [],
                'payment'        => null,
                'email_verified' => $user->hasVerifiedEmail(),
            ]);
        }

        $payment = $candidate->payments->sortByDesc('created_at')->first();

        return Inertia::render('Dashboard/Index', [
            'candidate' => [
                'id'             => $candidate->id,
                'full_name'      => $candidate->full_name,
                'nisn'           => $candidate->nisn,
                'nik'            => $candidate->nik,
                'gender'         => $candidate->gender,
                'gender_label'   => $candidate->genderLabel(),
                'place_of_birth' => $candidate->place_of_birth,
                'date_of_birth'  => $candidate->date_of_birth?->format('d F Y'),
                'school_origin'  => $candidate->school_origin,
                'address_full'   => $candidate->address_full,
                'status'         => $candidate->status,
                'admission_wave' => $candidate->admissionWave ? [
                    'title'         => $candidate->admissionWave->title,
                    'academic_year' => $candidate->admissionWave->academic_year,
                    'end_date'      => $candidate->admissionWave->end_date?->format('d F Y'),
                ] : null,
            ],
            'documents' => $candidate->documents->map(fn ($d) => [
                'id'             => $d->id,
                'document_type'  => $d->document_type,
                'document_owner' => $d->document_owner,
                'status'         => $d->status,
                'admin_note'     => $d->admin_note,
                'file_path'      => $d->file_path,
                'created_at'     => $d->created_at->diffForHumans(),
            ])->values(),
            'payment'        => $payment ? [
                'id'               => $payment->id,
                'transaction_code' => $payment->transaction_code,
                'payment_method'   => $payment->payment_method,
                'expected_amount'  => $payment->expected_amount,
                'amount'           => $payment->amount,
                'status'           => $payment->status,
                'verified_at'      => $payment->verified_at?->format('d F Y'),
                'admin_note'       => $payment->admin_note,
            ] : null,
            'email_verified' => $user->hasVerifiedEmail(),
        ]);
    }

    // =========================================================================
    // PROFILE — GET /dashboard/profile
    // =========================================================================

    public function showProfile(Request $request): Response
    {
        $user      = $request->user();
        $candidate = $user->candidate()->with('admissionWave')->first();

        return Inertia::render('Dashboard/Profile', [
            // ── Data akun (bisa diedit) ───────────────────────────────────
            'user' => [
                'id'                   => $user->id,
                'name'                 => $user->name,
                'email'                => $user->email,
                'avatar_url'           => $user->avatar_url,
                'initials'             => $user->initials,
                'whatsapp_number'      => $user->whatsapp_number,
                'has_pending_email'    => $user->hasPendingEmailRequest(),
                'pending_email'        => $user->pending_email,
                'email_verified'       => $user->hasVerifiedEmail(),
            ],
            // ── Data kandidat read-only ───────────────────────────────────
            'candidate' => $candidate ? [
                'full_name'      => $candidate->full_name,
                'nisn'           => $candidate->nisn,
                'nik'            => $candidate->nik,
                'status'         => $candidate->status,
                'address_full'   => $candidate->address_full,
                'admission_wave' => $candidate->admissionWave ? [
                    'title'         => $candidate->admissionWave->title,
                    'academic_year' => $candidate->admissionWave->academic_year,
                ] : null,
            ] : null,
        ]);
    }

    // =========================================================================
    // UPDATE PROFILE — PUT /dashboard/profile
    // Update nama & password. Email butuh approval staff/admin dulu.
    // =========================================================================

    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name'                  => ['required', 'string', 'max:255'],
            'current_password'      => ['nullable', 'string'],
            'new_password'          => ['nullable', 'confirmed', Password::min(8)],
        ]);

        // ── Ganti password — validasi current password dulu ──────────────
        if ($request->filled('new_password')) {
            if (! Hash::check($request->current_password, $user->password)) {
                return back()->withErrors([
                    'current_password' => 'Password saat ini tidak sesuai.',
                ]);
            }
            $user->password = $validated['new_password'];
        }

        $user->name = $validated['name'];
        $user->save();

        return back()->with('success', 'Profil berhasil diperbarui.');
    }

    // =========================================================================
    // REQUEST GANTI EMAIL — POST /dashboard/profile/email
    // Simpan pending_email, tunggu approval staff/admin.
    // =========================================================================

    public function requestEmailChange(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'new_email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($user->id),
                Rule::unique('users', 'pending_email')->ignore($user->id),
            ],
        ]);

        // Simpan pending email + generate token untuk verifikasi nanti
        $user->update([
            'pending_email'                => $request->new_email,
            'pending_email_token'          => Str::random(64),
            'pending_email_requested_at'   => now(),
        ]);

        return back()->with('success', 'Permintaan ganti email telah dikirim. Menunggu persetujuan staff.');
    }

    // =========================================================================
    // CANCEL REQUEST GANTI EMAIL — DELETE /dashboard/profile/email
    // =========================================================================

    public function cancelEmailChange(Request $request)
    {
        $request->user()->update([
            'pending_email'              => null,
            'pending_email_token'        => null,
            'pending_email_requested_at' => null,
        ]);

        return back()->with('success', 'Permintaan ganti email dibatalkan.');
    }

    // =========================================================================
    // UPDATE AVATAR — POST /dashboard/profile/avatar
    //
    // Security layers:
    // 1. mimes       — Laravel cek extension whitelist
    // 2. mimetypes   — Laravel cek MIME type via magic bytes (Symfony)
    // 3. Magic bytes — kita cek sendiri header file secara manual
    // 4. UUID rename — nama file asli dari client dibuang total
    // 5. Ext dari magic bytes — bukan dari nama file client
    // =========================================================================

    // Map magic bytes → [mime, ext]
    private const AVATAR_SIGNATURES = [
        "\xFF\xD8\xFF"      => ['mime' => 'image/jpeg', 'ext' => 'jpg'],
        "\x89PNG\r\n\x1A\n" => ['mime' => 'image/png',  'ext' => 'png'],
        "RIFF"              => ['mime' => 'image/webp',  'ext' => 'webp'], // RIFF????WEBP
    ];

    public function updateAvatar(Request $request)
    {
        // Layer 1 & 2 — Laravel validation (extension + MIME via Symfony)
        $request->validate([
            'avatar' => [
                'required',
                'file',
                'mimes:jpg,jpeg,png,webp',
                'mimetypes:image/jpeg,image/png,image/webp',
                'max:1024', // 1MB
            ],
        ]);

        $file = $request->file('avatar');

        // Layer 3 — Magic bytes check manual
        $handle    = fopen($file->getRealPath(), 'rb');
        $header    = fread($handle, 12);
        fclose($handle);

        $detected = null;
        foreach (self::AVATAR_SIGNATURES as $signature => $meta) {
            if (str_starts_with($header, $signature)) {
                // Extra check untuk WebP: header harus "RIFF????WEBP"
                if ($signature === 'RIFF' && substr($header, 8, 4) !== 'WEBP') {
                    continue;
                }
                $detected = $meta;
                break;
            }
        }

        if (! $detected) {
            return back()->withErrors([
                'avatar' => 'File tidak valid. Hanya JPG, PNG, dan WebP yang diizinkan.',
            ]);
        }

        // Layer 3b — Scan isi file untuk PHP/script injection (polyglot attack)
        // Attacker bisa sisipkan <?php di belakang magic bytes yang valid
        $content  = file_get_contents($file->getRealPath());
        $forbidden = ['<?php', '<?=', '<script', '<%', 'eval(', 'base64_decode(', 'system(', 'exec(', 'passthru(', 'shell_exec('];
        foreach ($forbidden as $pattern) {
            if (stripos($content, $pattern) !== false) {
                return back()->withErrors([
                    'avatar' => 'File tidak valid. Hanya JPG, PNG, dan WebP yang diizinkan.',
                ]);
            }
        }

        $user = $request->user();

        // Hapus avatar lama kalau ada
        if ($user->avatar && Storage::disk('private')->exists($user->avatar)) {
            Storage::disk('private')->delete($user->avatar);
        }

        // Layer 4 & 5 — UUID rename + ext dari magic bytes (bukan dari client)
        $path = 'avatars/' . $user->id . '/' . Str::uuid() . '.' . $detected['ext'];

        Storage::disk('private')->put(
            $path,
            file_get_contents($file->getRealPath())
        );

        $user->update(['avatar' => $path]);

        return back()->with('success', 'Avatar berhasil diperbarui.');
    }

    // =========================================================================
    // SERVE AVATAR — GET /dashboard/profile/avatar
    // Stream avatar dari private storage dengan auth check.
    // =========================================================================

    public function serveAvatar(Request $request)
    {
        $user = $request->user();

        if (! $user->avatar || ! Storage::disk('private')->exists($user->avatar)) {
            abort(404);
        }

        return Storage::disk('private')->response($user->avatar);
    }
}