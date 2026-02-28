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
    // GET /daftar → Tampilkan form wizard
    // =============================================
    public function show(): Response
    {
        $activeWave = AdmissionWave::where('is_active', true)
            ->withCount('candidates')
            ->first();

        return Inertia::render('FormWizard', [
            'activeWave' => $activeWave ? [
                'id'               => $activeWave->id,
                'title'            => $activeWave->title,
                'academic_year'    => $activeWave->academic_year,
                'quota_target'     => $activeWave->quota_target,
                'candidates_count' => $activeWave->candidates_count,
            ] : null,
        ]);
    }

    // =============================================
    // POST /daftar/save-draft
    // Dipanggil otomatis saat user tiba di step 3
    // Simpan draft → return registration_code
    // =============================================
    public function saveDraft(Request $request)
    {
        $validated = $request->validate([
            // Step 1
            'full_name'      => ['required', 'string', 'max:255'],
            'nisn'           => ['required', 'digits:10'],
            'gender'         => ['required', 'in:L,P'],
            'place_of_birth' => ['required', 'string', 'max:100'],
            'date_of_birth'  => ['required', 'date', 'before:today'],

            // Step 2
            'mother_name'     => ['required', 'string', 'max:255'],
            'whatsapp_number' => ['required', 'string', 'min:10', 'max:14'],
            'email'           => ['required', 'email', 'unique:users,email'],
            'phone_number'    => ['nullable', 'string', 'max:20'],

            // Alamat
            'addr_jalan' => ['required', 'string', 'max:255'],
            'addr_rt'    => ['required', 'string', 'max:3'],
            'addr_rw'    => ['required', 'string', 'max:3'],
            'addr_desa'  => ['required', 'string', 'max:100'],
            'addr_kec'   => ['required', 'string', 'max:100'],
            'addr_kab'   => ['required', 'string', 'max:100'],
            'addr_prov'  => ['required', 'string', 'max:100'],

            // Step 3
            'school_origin' => ['nullable', 'string', 'max:255'],
        ], [
            'full_name.required'       => 'Nama lengkap wajib diisi.',
            'nisn.required'            => 'NISN wajib diisi.',
            'nisn.digits'              => 'NISN harus 10 digit angka.',
            'gender.required'          => 'Jenis kelamin wajib dipilih.',
            'place_of_birth.required'  => 'Tempat lahir wajib diisi.',
            'date_of_birth.required'   => 'Tanggal lahir wajib diisi.',
            'date_of_birth.before'     => 'Tanggal lahir tidak valid.',
            'mother_name.required'     => 'Nama ibu kandung wajib diisi.',
            'whatsapp_number.required' => 'Nomor WhatsApp wajib diisi.',
            'email.required'           => 'Email wajib diisi.',
            'email.email'              => 'Format email tidak valid.',
            'email.unique'             => 'Email sudah terdaftar. Gunakan email lain atau langsung login.',
            'addr_jalan.required'      => 'Alamat jalan wajib diisi.',
            'addr_rt.required'         => 'RT wajib diisi.',
            'addr_rw.required'         => 'RW wajib diisi.',
            'addr_desa.required'       => 'Kelurahan/Desa wajib diisi.',
            'addr_kec.required'        => 'Kecamatan wajib diisi.',
            'addr_kab.required'        => 'Kabupaten/Kota wajib diisi.',
            'addr_prov.required'       => 'Provinsi wajib diisi.',
            'school_origin.required'   => 'Asal sekolah wajib diisi.',
        ]);

        $activeWave = AdmissionWave::where('is_active', true)->first();

        $draft = RegistrationDraft::createFromWizard($validated, $activeWave?->id);

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

    // =============================================
    // POST /daftar/submit → redirect ke /register
    // Dipanggil saat user klik "Lanjut Buat Akun"
    // =============================================
    public function submitDraft(Request $request)
    {
        return redirect()->route('register');
    }
}
