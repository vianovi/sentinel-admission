<?php

namespace App\Http\Controllers;

use App\Models\AdmissionWave;
use App\Models\RegistrationDraft;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cookie;
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

        return Inertia::render('FormWizard', [
            'activeWave' => $activeWave ? [
                'id'            => $activeWave->id,
                'title'         => $activeWave->title,
                'academic_year' => $activeWave->academic_year,
                'quota_target'  => $activeWave->quota_target,
            ] : null,
        ]);
    }

    // =============================================
    // POST /daftar/check-duplicate
    //
    // Cek NISN/NIK di dua tabel secara berurutan:
    //   1. candidates → status "registered" (sudah punya akun)
    //   2. registration_drafts → status "draft" (belum selesai)
    //
    // Data ditampilkan sebagian saja untuk keamanan:
    //   - Nama  : "Ahmad Z***"
    //   - NISN  : "001234***8"
    //   - NIK   : "330112******9001"
    //
    // Dipanggil dari frontend sebelum insert draft baru,
    // hanya jika draftId di localStorage BERBEDA dengan yang ditemukan.
    // =============================================
    public function checkDuplicate(Request $request)
    {
        $request->validate([
            'nisn'              => ['required', 'digits:10'],
            'nik'               => ['required', 'digits:16'],
            'current_draft_id'  => ['nullable', 'integer'],
        ]);

        $nisn           = $request->nisn;
        $nik            = $request->nik;
        $currentDraftId = $request->integer('current_draft_id', 0);

        // ── Helpers: samarkan data ────────────────────────────────────────────

        $maskName = function (string $name): string {
            $parts = explode(' ', trim($name));
            return collect($parts)->map(function ($word, $i) {
                if ($i === 0) {
                    // Kata pertama: tampilkan 5 char, sisanya *
                    return strlen($word) <= 5
                        ? $word
                        : substr($word, 0, 5) . str_repeat('*', strlen($word) - 5);
                }
                // Kata berikutnya: huruf pertama + ***
                return strlen($word) > 0 ? $word[0] . '***' : '';
            })->implode(' ');
        };

        $maskNisn = function (string $nisn): string {
            // "0012345678" → "001234***8"
            return substr($nisn, 0, 6) . '***' . substr($nisn, -1);
        };

        $maskNik = function (string $nik): string {
            // "3301123456789001" → "330112******9001"
            return substr($nik, 0, 6) . str_repeat('*', 6) . substr($nik, -4);
        };

        // ── 1. Cek di tabel candidates ────────────────────────────────────────
        $candidate = \App\Models\Candidate::where('nisn', $nisn)
            ->orWhere('nik', $nik)
            ->with('user:id,name,email')
            ->first();

        if ($candidate) {
            return response()->json([
                'found'  => true,
                'status' => 'registered',   // sudah punya akun
                'data'   => [
                    'name' => $maskName($candidate->user?->name ?? $candidate->full_name ?? ''),
                    'nisn' => $maskNisn($nisn),
                    'nik'  => $maskNik($nik),
                ],
            ]);
        }

        // ── 2. Cek di tabel registration_drafts ──────────────────────────────
        $draft = RegistrationDraft::findActive($nisn, $nik);

        if (!$draft) {
            return response()->json(['found' => false]);
        }

        // Kalau draft yang ditemukan adalah milik user yang sama
        // (draftId di localStorage cocok) → skip modal, bukan duplikat
        if ($currentDraftId && $draft->id === $currentDraftId) {
            return response()->json(['found' => false]);
        }

        return response()->json([
            'found'  => true,
            'status' => 'draft',            // belum selesai daftar
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
    // Insert draft baru dari step 1
    // =============================================
    public function storeStep1(Request $request)
    {
        $validated = $request->validate([
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

        // Cek apakah ada draft lama dengan NISN/NIK sama
        // Kalau ada dan request punya flag resume=true → hapus lama, buat baru
        $existing = RegistrationDraft::findActive($validated['nisn'], $validated['nik']);
        if ($existing && $request->boolean('force_new')) {
            $existing->delete();
        }

        $draft = RegistrationDraft::createFromStep1($validated, $activeWave?->id);

        return response()->json([
            'draft_id'     => $draft->id,
            'current_step' => 1,
        ]);
    }

    // =============================================
    // POST /daftar/resume
    // Load draft lama ke localStorage
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
                'phone_number'    => $draft->phone_number,
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
    // Update draft dengan kontak & alamat
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
    // PUT /daftar/step3/{draft}
    // Finalisasi draft — generate kode & token
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

        $draft->finalizeStep3($validated);

        // Set HttpOnly Cookie dengan secret_token
        $cookie = Cookie::make(
            name: 'draft_token',
            value: $draft->secret_token,
            minutes: 60 * 24 * 3,
            path: '/',
            secure: app()->isProduction(),
            httpOnly: true,
            sameSite: 'Lax',
        );

        return response()->json([
            'registration_code' => $draft->registration_code,
        ])->withCookie($cookie);
    }
}
