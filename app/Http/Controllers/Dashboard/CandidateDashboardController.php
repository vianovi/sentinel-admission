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

        return Inertia::render('Dashboard/Candidate/Profile', [
            'user' => [
                'id'                => $user->id,
                'name'              => $user->name,
                'email'             => $user->email,
                'avatar_url'        => $user->avatar_url,
                'initials'          => $user->initials,
                'whatsapp_number'   => $user->whatsapp_number,
                'has_pending_email' => $user->hasPendingEmailRequest(),
                'pending_email'     => $user->pending_email,
                'email_verified'    => $user->hasVerifiedEmail(),
            ],
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
    // =========================================================================

    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name'             => ['required', 'string', 'max:255'],
            'current_password' => ['nullable', 'string'],
            'new_password'     => ['nullable', 'confirmed', Password::min(8)],
        ]);

        if ($request->filled('new_password')) {
            if (! Hash::check($request->current_password, $user->password)) {
                return back()->withErrors(['current_password' => 'Password saat ini tidak sesuai.']);
            }
            $user->password = $validated['new_password'];
        }

        $user->name = $validated['name'];
        $user->save();

        return back()->with('success', 'Profil berhasil diperbarui.');
    }

    // =========================================================================
    // REQUEST GANTI EMAIL — POST /dashboard/profile/email
    // =========================================================================

    public function requestEmailChange(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'new_email' => [
                'required', 'email', 'max:255',
                Rule::unique('users', 'email')->ignore($user->id),
                Rule::unique('users', 'pending_email')->ignore($user->id),
            ],
        ]);

        $user->update([
            'pending_email'              => $request->new_email,
            'pending_email_token'        => Str::random(64),
            'pending_email_requested_at' => now(),
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

    private const AVATAR_SIGNATURES = [
        "\xFF\xD8\xFF"      => ['mime' => 'image/jpeg', 'ext' => 'jpg'],
        "\x89PNG\r\n\x1A\n" => ['mime' => 'image/png',  'ext' => 'png'],
        "RIFF"              => ['mime' => 'image/webp',  'ext' => 'webp'],
    ];

    public function updateAvatar(Request $request)
    {
        $request->validate([
            'avatar' => ['required', 'file', 'mimes:jpg,jpeg,png,webp', 'mimetypes:image/jpeg,image/png,image/webp', 'max:1024'],
        ]);

        $file   = $request->file('avatar');
        $handle = fopen($file->getRealPath(), 'rb');
        $header = fread($handle, 12);
        fclose($handle);

        $detected = null;
        foreach (self::AVATAR_SIGNATURES as $signature => $meta) {
            if (str_starts_with($header, $signature)) {
                if ($signature === 'RIFF' && substr($header, 8, 4) !== 'WEBP') continue;
                $detected = $meta;
                break;
            }
        }

        if (! $detected) {
            return back()->withErrors(['avatar' => 'File tidak valid. Hanya JPG, PNG, dan WebP yang diizinkan.']);
        }

        $content   = file_get_contents($file->getRealPath());
        $forbidden = ['<?php', '<?=', '<script', '<%', 'eval(', 'base64_decode(', 'system(', 'exec(', 'passthru(', 'shell_exec('];
        foreach ($forbidden as $pattern) {
            if (stripos($content, $pattern) !== false) {
                return back()->withErrors(['avatar' => 'File tidak valid. Hanya JPG, PNG, dan WebP yang diizinkan.']);
            }
        }

        $user = $request->user();

        if ($user->avatar && Storage::disk('private')->exists($user->avatar)) {
            Storage::disk('private')->delete($user->avatar);
        }

        $path = 'avatars/' . $user->id . '/' . Str::uuid() . '.' . $detected['ext'];
        Storage::disk('private')->put($path, file_get_contents($file->getRealPath()));
        $user->update(['avatar' => $path]);

        return back()->with('success', 'Avatar berhasil diperbarui.');
    }

    // =========================================================================
    // SERVE AVATAR — GET /dashboard/profile/avatar
    // =========================================================================

    public function serveAvatar(Request $request)
    {
        $user = $request->user();

        if (! $user->avatar || ! Storage::disk('private')->exists($user->avatar)) {
            abort(404);
        }

        return Storage::disk('private')->response($user->avatar);
    }

    // =========================================================================
    // DATA DIRI — GET /dashboard/data-diri
    // =========================================================================

    public function showDataDiri(Request $request): Response
    {
        $user      = $request->user();
        $candidate = $user->candidate()->with(['admissionWave'])->first();

        return Inertia::render('Dashboard/Candidate/DataDiri', [
            'user' => [
                'name'       => $user->name,
                'avatar_url' => $user->avatar_url,
                'initials'   => $user->initials,
            ],
            'candidate' => $candidate ? [
                // ── Data kunci (read-only) ────────────────────────────────
                'id'                  => $candidate->id,
                'full_name'           => $candidate->full_name,
                'nisn'                => $candidate->nisn,
                'nik'                 => $candidate->nik,
                'gender'              => $candidate->gender,
                'gender_label'        => $candidate->genderLabel(),
                'place_of_birth'      => $candidate->place_of_birth,
                'date_of_birth'       => $candidate->date_of_birth?->format('Y-m-d'),
                'date_of_birth_label' => $candidate->date_of_birth?->format('d F Y'),
                'address_full'        => $candidate->address_full,
                'address_detail'      => $candidate->address_detail,
                'school_origin'       => $candidate->school_origin,
                // ── Data tambahan (bisa diedit) ───────────────────────────
                'email'                      => $candidate->email,
                'phone_number'               => $candidate->phone_number,
                'religion'                   => $candidate->religion,
                'child_order'                => $candidate->child_order,
                'siblings_count'             => $candidate->siblings_count,
                'hobbies'                    => $candidate->hobbies,
                'ambitions'                  => $candidate->ambitions,
                'habits'                     => $candidate->habits,
                'extracurricular_interests'  => $candidate->extracurricular_interests ?? [],
                'postal_code'                => $candidate->postal_code,
                'school_npsn'                => $candidate->school_npsn,
                'certificate_number'         => $candidate->certificate_number,
                'birth_certificate_number'   => $candidate->birth_certificate_number,
                'family_card_number'         => $candidate->family_card_number,
                'program_choice'             => $candidate->program_choice,
                'major_choice'               => $candidate->major_choice,
                // ── Status & change request ───────────────────────────────
                'status'              => $candidate->status,
                'has_pending_change'  => $candidate->hasPendingChangeRequest(),
                'data_change_request' => $candidate->data_change_request,
                // ── Admission wave ────────────────────────────────────────
                'admission_wave' => $candidate->admissionWave ? [
                    'title'              => $candidate->admissionWave->title,
                    'academic_year'      => $candidate->admissionWave->academic_year,
                    'available_programs' => $candidate->admissionWave->available_programs ?? [],
                    'available_majors'   => $candidate->admissionWave->available_majors ?? [],
                    'majors_enabled'     => $candidate->admissionWave->majors_enabled,
                ] : null,
            ] : null,
        ]);
    }

    // =========================================================================
    // UPDATE DATA DIRI — PUT /dashboard/data-diri
    // =========================================================================

    public function updateDataDiri(Request $request)
    {
        $user      = $request->user();
        $candidate = $user->candidate()->with('admissionWave')->firstOrFail();

        $validated = $request->validate([
            'email'                     => ['nullable', 'email', 'max:255', 'regex:/^[^\s@]+@gmail\.com$/i'],
            'phone_number'              => ['nullable', 'string', 'regex:/^08[0-9]{8,12}$/'],
            'religion'                  => ['nullable', 'string', 'max:50'],
            'child_order'               => ['nullable', 'integer', 'min:1', 'max:20'],
            'siblings_count'            => ['nullable', 'integer', 'min:0', 'max:20'],
            'hobbies'                   => ['nullable', 'string', 'max:500'],
            'ambitions'                 => ['nullable', 'string', 'max:500'],
            'habits'                    => ['nullable', 'string', 'max:1000'],
            'extracurricular_interests' => ['nullable', 'array'],
            'extracurricular_interests.*' => ['string', 'max:100'],
            'postal_code'               => ['nullable', 'digits:5'],
            'school_npsn'               => ['nullable', 'digits:8'],
            'certificate_number'        => ['nullable', 'string', 'max:100'],
            'birth_certificate_number'  => ['nullable', 'string', 'max:100'],
            'family_card_number'        => ['nullable', 'digits:16'],
            'program_choice'            => ['nullable', 'string', 'max:100'],
            'major_choice'              => ['nullable', 'string', 'max:100'],
        ], [
            'email.regex'               => 'Email harus berupa Gmail. Contoh: nama@gmail.com',
            'phone_number.regex'        => 'Nomor HP harus diawali 08 dan terdiri dari 10-14 digit.',
            'postal_code.digits'        => 'Kode pos harus 5 digit angka.',
            'school_npsn.digits'        => 'NPSN harus 8 digit angka.',
            'family_card_number.digits' => 'Nomor KK harus 16 digit angka.',
        ]);

        // Validasi program_choice harus dari available_programs gelombang
        if ($request->filled('program_choice') && $candidate->admissionWave) {
            $available = $candidate->admissionWave->available_programs ?? [];
            if (! in_array($request->program_choice, $available)) {
                return back()->withErrors(['program_choice' => 'Program tidak valid.']);
            }
        }

        // Validasi major_choice hanya kalau majors_enabled = true
        if ($request->filled('major_choice') && $candidate->admissionWave) {
            if (! $candidate->admissionWave->majors_enabled) {
                return back()->withErrors(['major_choice' => 'Pemilihan jurusan tidak aktif.']);
            }
            $available = $candidate->admissionWave->available_majors ?? [];
            if (! in_array($request->major_choice, $available)) {
                return back()->withErrors(['major_choice' => 'Jurusan tidak valid.']);
            }
        }

        $candidate->update($validated);

        return back()->with('success', 'Data diri berhasil diperbarui.');
    }

    // =========================================================================
    // REQUEST PERUBAHAN DATA KUNCI — POST /dashboard/data-diri/change-request
    // =========================================================================

    public function requestDataChange(Request $request)
    {
        $user      = $request->user();
        $candidate = $user->candidate()->firstOrFail();

        if ($candidate->hasPendingChangeRequest()) {
            return back()->withErrors(['change_request' => 'Masih ada pengajuan perubahan yang sedang diproses.']);
        }

        $validated = $request->validate([
            'field'     => ['required', 'string', 'in:full_name,nisn,nik,gender,place_of_birth,date_of_birth,address_detail,school_origin'],
            'new_value' => ['required', 'string', 'max:500'],
            'reason'    => ['required', 'string', 'min:10', 'max:500'],
        ]);

        $candidate->update([
            'data_change_request' => [
                'field'        => $validated['field'],
                'old_value'    => (string) $candidate->{$validated['field']},
                'new_value'    => $validated['new_value'],
                'reason'       => $validated['reason'],
                'status'       => 'pending',
                'requested_at' => now()->toIso8601String(),
            ],
        ]);

        return back()->with('success', 'Pengajuan perubahan data telah dikirim. Menunggu persetujuan staff.');
    }

    // =========================================================================
    // CANCEL REQUEST PERUBAHAN DATA — DELETE /dashboard/data-diri/change-request
    // =========================================================================

    public function cancelDataChange(Request $request)
    {
        $user      = $request->user();
        $candidate = $user->candidate()->firstOrFail();

        $candidate->update(['data_change_request' => null]);

        return back()->with('success', 'Pengajuan perubahan data dibatalkan.');
    }
}