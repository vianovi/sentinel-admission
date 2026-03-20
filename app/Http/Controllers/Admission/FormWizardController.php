<?php

namespace App\Http\Controllers\Admission;

use App\Http\Controllers\Controller;
use App\Models\AdmissionWave;
use App\Models\RegistrationDraft;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class FormWizardController extends Controller
{
    // =============================================
    // GET /daftar
    // =============================================
    public function show(): Response
    {
        $activeWave = AdmissionWave::where('is_active', true)
            ->withCount('candidates')
            ->first();

        return Inertia::render('Admission/FormWizard', [
            'activeWave' => $activeWave ? [
                'id'            => $activeWave->id,
                'title'         => $activeWave->title,
                'academic_year' => $activeWave->academic_year,
                'quota_target'  => $activeWave->quota_target,
            ] : null,
        ]);
    }

    // =============================================
    // POST /daftar/check-draft
    // Dipanggil saat FormWizard mount
    // Cek apakah draft_id di localStorage masih valid di DB
    // =============================================
    public function checkDraft(Request $request)
    {
        $request->validate([
            'draft_id' => ['required', 'integer'],
        ]);

        $draft = RegistrationDraft::whereNull('deleted_at')
            ->find($request->draft_id);

        if (!$draft) {
            return response()->json(['valid' => false]);
        }

        if ($draft->expires_at && $draft->expires_at->isPast()) {
            return response()->json(['valid' => false]);
        }

        return response()->json(['valid' => true]);
    }

    // =============================================
    // POST /daftar/check-duplicate
    // =============================================
    public function checkDuplicate(Request $request)
    {
        $request->validate([
            'nisn'             => ['required', 'digits:10'],
            'nik'              => ['required', 'digits:16'],
            'current_draft_id' => ['nullable', 'integer'],
        ]);

        $nisn           = $request->nisn;
        $nik            = $request->nik;
        $currentDraftId = $request->integer('current_draft_id', 0);

        $maskName = function (string $name): string {
            $parts = explode(' ', trim($name));
            return collect($parts)->map(function ($word, $i) {
                if ($i === 0) {
                    return strlen($word) <= 5
                        ? $word
                        : substr($word, 0, 5) . str_repeat('*', strlen($word) - 5);
                }
                return strlen($word) > 0 ? $word[0] . '***' : '';
            })->implode(' ');
        };

        $maskNisn = fn(string $nisn) => substr($nisn, 0, 6) . '***' . substr($nisn, -1);
        $maskNik  = fn(string $nik)  => substr($nik, 0, 6) . str_repeat('*', 6) . substr($nik, -4);

        $candidate = \App\Models\Candidate::where('nisn', $nisn)
            ->orWhere('nik', $nik)
            ->with('user:id,name,email')
            ->first();

        if ($candidate) {
            return response()->json([
                'found'  => true,
                'status' => 'registered',
                'data'   => [
                    'name' => $maskName($candidate->user?->name ?? $candidate->full_name ?? ''),
                    'nisn' => $maskNisn($nisn),
                    'nik'  => $maskNik($nik),
                ],
            ]);
        }

        $draft = RegistrationDraft::findActive($nisn, $nik);

        if (!$draft) {
            return response()->json(['found' => false]);
        }

        if ($currentDraftId && $draft->id === $currentDraftId) {
            return response()->json(['found' => false]);
        }

        return response()->json([
            'found'  => true,
            'status' => 'draft',
            'data'   => [
                'name'       => $maskName($draft->full_name ?? ''),
                'nisn'       => $maskNisn($nisn),
                'nik'        => $maskNik($nik),
                'draft_id'   => $draft->id,
                'updated_at' => $draft->updated_at->diffForHumans(),
            ],
        ]);
    }

    // =============================================
    // POST /daftar/step1
    // =============================================
    public function storeStep1(Request $request)
    {
        $validated = $request->validate([
            'draft_id'       => ['nullable', 'integer'],
            'full_name'      => ['required', 'string', 'max:255'],
            'nisn'           => ['required', 'digits:10'],
            'nik'            => ['required', 'digits:16'],
            'gender'         => ['required', 'in:L,P'],
            'place_of_birth' => ['required', 'string', 'max:100'],
            'date_of_birth'  => ['required', 'date', 'before:today'],
        ], [
            'full_name.required'      => 'Nama lengkap wajib diisi.',
            'nisn.required'           => 'NISN wajib diisi.',
            'nisn.digits'             => 'NISN harus 10 digit angka.',
            'nik.required'            => 'NIK wajib diisi.',
            'nik.digits'              => 'NIK harus 16 digit angka.',
            'gender.required'         => 'Jenis kelamin wajib dipilih.',
            'place_of_birth.required' => 'Tempat lahir wajib diisi.',
            'date_of_birth.required'  => 'Tanggal lahir wajib diisi.',
            'date_of_birth.before'    => 'Tanggal lahir tidak valid.',
        ]);

        $activeWave = AdmissionWave::where('is_active', true)->first();

        if (!empty($validated['draft_id'])) {
            $existing = RegistrationDraft::whereNull('deleted_at')
                ->find($validated['draft_id']);

            if ($existing && $existing->isValid()) {
                $existing->update([
                    'nisn'           => $validated['nisn'],
                    'nik'            => $validated['nik'],
                    'full_name'      => $validated['full_name'],
                    'gender'         => $validated['gender'],
                    'place_of_birth' => $validated['place_of_birth'],
                    'date_of_birth'  => $validated['date_of_birth'],
                ]);

                return response()->json([
                    'draft_id'     => $existing->id,
                    'current_step' => $existing->current_step,
                ]);
            }
        }

        $draft = RegistrationDraft::createFromStep1($validated, $activeWave?->id);

        return response()->json([
            'draft_id'     => $draft->id,
            'current_step' => 1,
        ]);
    }

    // =============================================
    // POST /daftar/resume
    // =============================================
    public function resume(Request $request)
    {
        $request->validate([
            'nisn' => ['required', 'digits:10'],
            'nik'  => ['required', 'digits:16'],
        ]);

        $draft = RegistrationDraft::findActive($request->nisn, $request->nik);

        if (!$draft) {
            return response()->json(['error' => 'Draft tidak ditemukan.'], 404);
        }

        return response()->json([
            'draft_id'     => $draft->id,
            'current_step' => $draft->current_step,
            'step1' => [
                'full_name'      => $draft->full_name,
                'nisn'           => $draft->nisn,
                'nik'            => $draft->nik,
                'gender'         => $draft->gender,
                'place_of_birth' => $draft->place_of_birth,
                'date_of_birth'  => $draft->date_of_birth?->format('Y-m-d'),
            ],
            'step2' => $draft->current_step >= 2 ? [
                'mother_name'     => $draft->mother_name,
                'whatsapp_number' => $draft->whatsapp_number,
                'email'           => $draft->email,
                'addr_jalan'      => $draft->address_detail['jalan']     ?? '',
                'addr_rt'         => $draft->address_detail['rt']        ?? '',
                'addr_rw'         => $draft->address_detail['rw']        ?? '',
                'addr_desa'       => $draft->address_detail['kelurahan'] ?? '',
                'addr_kec'        => $draft->address_detail['kecamatan'] ?? '',
                'addr_kab'        => $draft->address_detail['kabupaten'] ?? '',
                'addr_prov'       => $draft->address_detail['provinsi']  ?? '',
            ] : null,
            'step3' => $draft->current_step >= 3 ? [
                'school_origin'     => $draft->school_origin,
                'registration_code' => $draft->registration_code,
            ] : null,
        ]);
    }

    // =============================================
    // PUT /daftar/step2/{draft}
    // =============================================
    public function updateStep2(Request $request, RegistrationDraft $draft)
    {
        $validated = $request->validate([
            'mother_name'     => ['required', 'string', 'max:255'],
            'whatsapp_number' => ['required', 'string', 'min:10', 'max:14'],
            'email'           => ['required', 'email', 'unique:users,email'],
            'phone_number'    => ['nullable', 'string', 'max:20'],
            'addr_jalan'      => ['required', 'string', 'max:255'],
            'addr_rt'         => ['required', 'string', 'max:3'],
            'addr_rw'         => ['required', 'string', 'max:3'],
            'addr_desa'       => ['required', 'string', 'max:100'],
            'addr_kec'        => ['required', 'string', 'max:100'],
            'addr_kab'        => ['required', 'string', 'max:100'],
            'addr_prov'       => ['required', 'string', 'max:100'],
        ], [
            'mother_name.required'     => 'Nama ibu kandung wajib diisi.',
            'whatsapp_number.required' => 'Nomor WhatsApp wajib diisi.',
            'email.required'           => 'Email wajib diisi.',
            'email.email'              => 'Format email tidak valid.',
            'email.unique'             => 'Email sudah terdaftar. Gunakan email lain.',
            'addr_jalan.required'      => 'Alamat jalan wajib diisi.',
            'addr_rt.required'         => 'RT wajib diisi.',
            'addr_rw.required'         => 'RW wajib diisi.',
            'addr_desa.required'       => 'Kelurahan/Desa wajib diisi.',
            'addr_kec.required'        => 'Kecamatan wajib diisi.',
            'addr_kab.required'        => 'Kabupaten/Kota wajib diisi.',
            'addr_prov.required'       => 'Provinsi wajib diisi.',
        ]);

        $draft->updateFromStep2($validated);

        return response()->json([
            'draft_id'     => $draft->id,
            'current_step' => 2,
        ]);
    }

    // =============================================
    // PUT /daftar/step3/init/{draft}
    // Dipanggil otomatis saat step 3 mount
    // Generate registration_code + secret_token (1x, skip kalau sudah ada)
    // Set cookie draft_token (durasi = sisa waktu expires_at)
    // =============================================
    public function initStep3(Request $request, int $draft)
    {
        $draft = RegistrationDraft::withTrashed()->find($draft);

        if (!$draft || !$draft->isValid()) {
            return response()->json(['error' => 'Draft tidak valid atau sudah kadaluarsa.'], 422);
        }

        if (empty($draft->registration_code)) {
            $draft->update([
                'registration_code' => RegistrationDraft::generateCode($draft->admission_wave_id),
            ]);
        }

        if (empty($draft->secret_token)) {
            $draft->update([
                'secret_token' => Str::uuid()->toString(),
            ]);
        }

        $draft->refresh();

        $minutesLeft = max((int) now()->diffInMinutes($draft->expires_at, false), 1);

        $cookie = Cookie::make(
            name:     'draft_token',
            value:    $draft->secret_token,
            minutes:  $minutesLeft,
            path:     '/',
            secure:   app()->isProduction(),
            httpOnly: true,
            sameSite: 'Lax',
        );

        return response()->json([
            'registration_code' => $draft->registration_code,
        ])->withCookie($cookie);
    }

    // =============================================
    // PUT /daftar/step3/{draft}
    // Hanya simpan school_origin + validasi agreement
    // =============================================
    public function updateStep3(Request $request, RegistrationDraft $draft)
    {
        $validated = $request->validate([
            'school_origin' => ['required', 'string', 'max:255'],
            'agreement'     => ['accepted'],
        ], [
            'school_origin.required' => 'Asal sekolah wajib diisi.',
            'agreement.accepted'     => 'Kamu harus menyetujui pernyataan data benar.',
        ]);

        $draft->update([
            'current_step'  => 3,
            'school_origin' => $validated['school_origin'],
        ]);

        return response()->json(['success' => true]);
    }
}