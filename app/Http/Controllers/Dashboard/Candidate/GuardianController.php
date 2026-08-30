<?php

namespace App\Http\Controllers\Dashboard\Candidate;

use App\Http\Controllers\Controller;
use App\Models\Guardian;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class GuardianController extends Controller
{
    public function index(): Response
    {
        $user = Auth::user();
        $candidate = $user->candidate()->with('admissionWave')->first();

        if (! $candidate) {
            return redirect()->route('dashboard.index');
        }

        $guardian = Guardian::firstOrCreate(
            ['candidate_id' => $candidate->id],
            [
                'candidate_code' => $candidate->candidate_code,
                'mother_name' => $candidate->mother_name ?? '',
                'no_kk' => $candidate->family_card_number,
            ]
        );
        $addressDetail = is_array($candidate->address_detail) ? $candidate->address_detail : [];

        if (empty($guardian->no_kk) && ! empty($candidate->family_card_number)) {
            $guardian->updateQuietly(['no_kk' => $candidate->family_card_number]);
        }

        return Inertia::render('Dashboard/Candidate/DataWali', [
            'guardian' => $guardian,
            'completion' => $guardian->completion_percentage,
            'user' => [
                'name' => $user->name,
                'avatar_url' => $user->avatar_url,
                'initials' => $user->initials,
            ],
            'candidate' => [
                'full_name' => $candidate->full_name,
                'nisn' => $candidate->nisn,
                'nik' => $candidate->nik,
                'gender_label' => $candidate->genderLabel(),
                'date_of_birth_label' => $candidate->date_of_birth?->format('d F Y'),
                'school_origin' => $candidate->school_origin,
                'status' => $candidate->status,
                'program_choice' => $candidate->program_choice,
                'phone_number' => $candidate->phone_number,
                'family_card_number' => $candidate->family_card_number,
                'admission_wave' => $candidate->admissionWave
                    ? ['title' => $candidate->admissionWave->title]
                    : null,
                'province' => $addressDetail['provinsi'] ?? null,
                'city' => $addressDetail['kabupaten'] ?? null,
                'district' => $addressDetail['kecamatan'] ?? null,
                'village' => $addressDetail['kelurahan'] ?? null,
                'address' => $addressDetail['jalan'] ?? $candidate->address_full,
                'postal_code' => $candidate->postal_code ?? null,
            ],
        ]);
    }

    public function update(Request $request): \Illuminate\Http\RedirectResponse
    {
        $candidate = Auth::user()->candidate;
        $guardian = Guardian::firstOrCreate(
            ['candidate_id' => $candidate->id],
            [
                'candidate_code' => $candidate->candidate_code,
                'mother_name' => $candidate->mother_name ?? '',
                'no_kk' => $candidate->family_card_number,
            ]
        );

        $tab = $request->input('tab');
        $validated = $request->validate(
            $this->rules($request, $tab),
            $this->validationMessages()
        );

        $guardian->update($validated);

        return back()->with('success', 'Data wali berhasil disimpan.');
    }

    // ─── Validation Rules ─────────────────────────────────────────────────

    private function rules(Request $request, ?string $tab = null): array
    {
        $fatherAlive = $request->father_status === 'hidup';
        $motherAlive = $request->mother_status === 'hidup';
        $combined = $request->income_type === 'combined';
        $shared = $request->boolean('alamat_shared');
        $guardianRequired = $request->marital_status && $request->marital_status !== 'nikah_tercatat';
        $educationRule = 'in:tidak_sekolah,sd_sederajat,smp_sederajat,sma_smk_sederajat,d1,d2,d3,d4_s1,s2,s3';
        $incomeRule = 'in:tidak_berpenghasilan,tidak_ingin_memberitahu,di_bawah_1jt,1jt_2_5jt,2_5jt_3_5jt,3_5jt_5jt,5jt_10jt,di_atas_10jt';
        $phoneRule = 'regex:/^08[0-9]{8,12}$/';
        $fatherRequired = Rule::requiredIf($fatherAlive);
        $fatherIncomeRequired = Rule::requiredIf($fatherAlive && ! $combined);
        $fatherAddressRequired = Rule::requiredIf($fatherAlive && ! $shared);
        $motherRequired = Rule::requiredIf($motherAlive);
        $guardianRule = Rule::requiredIf($guardianRequired);

        $ibuRules = [
            'income_type' => ['required', 'in:separate,combined'],
            'alamat_shared' => ['boolean'],
            'mother_status' => ['required', 'in:hidup,meninggal,tidak_diketahui'],
            'mother_name' => [$motherRequired, 'nullable', 'string', 'max:100'],
            'mother_nik' => [$motherRequired, 'nullable', 'digits:16'],
            'mother_place_of_birth' => [$motherRequired, 'nullable', 'string', 'max:100'],
            'mother_date_of_birth' => [$motherRequired, 'nullable', 'date', 'before:today'],
            'mother_education' => [$motherRequired, 'nullable', $educationRule],
            'mother_job_ktp' => [$motherRequired, 'nullable', 'string', 'max:100'],
            'mother_job_actual' => [$motherRequired, 'nullable', 'string', 'max:100'],
            'mother_income_range' => [$motherRequired, 'nullable', $incomeRule],
            'mother_phone' => [$motherRequired, 'nullable', $phoneRule],
            'mother_province' => [$motherRequired, 'nullable', 'string', 'max:100'],
            'mother_city' => [$motherRequired, 'nullable', 'string', 'max:100'],
            'mother_district' => [$motherRequired, 'nullable', 'string', 'max:100'],
            'mother_village' => [$motherRequired, 'nullable', 'string', 'max:100'],
            'mother_address' => [$motherRequired, 'nullable', 'string', 'max:500'],
            'mother_postal_code' => [$motherRequired, 'nullable', 'digits:5'],
        ];

        $ayahRules = [
            'father_status' => ['required', 'in:hidup,meninggal,tidak_diketahui'],
            'father_name' => [$fatherRequired, 'nullable', 'string', 'max:100'],
            'father_nik' => [$fatherRequired, 'nullable', 'digits:16'],
            'father_place_of_birth' => [$fatherRequired, 'nullable', 'string', 'max:100'],
            'father_date_of_birth' => [$fatherRequired, 'nullable', 'date', 'before:today'],
            'father_education' => [$fatherRequired, 'nullable', $educationRule],
            'father_job_ktp' => [$fatherRequired, 'nullable', 'string', 'max:100'],
            'father_job_actual' => [$fatherRequired, 'nullable', 'string', 'max:100'],
            'father_income_range' => [$fatherIncomeRequired, 'nullable', $incomeRule],
            'father_phone' => [$fatherRequired, 'nullable', $phoneRule],
            'father_province' => [$fatherAddressRequired, 'nullable', 'string', 'max:100'],
            'father_city' => [$fatherAddressRequired, 'nullable', 'string', 'max:100'],
            'father_district' => [$fatherAddressRequired, 'nullable', 'string', 'max:100'],
            'father_village' => [$fatherAddressRequired, 'nullable', 'string', 'max:100'],
            'father_address' => [$fatherAddressRequired, 'nullable', 'string', 'max:500'],
            'father_postal_code' => [$fatherAddressRequired, 'nullable', 'digits:5'],
        ];

        $waliRules = [
            'guardian_status' => [$guardianRule, 'nullable', 'in:hidup,meninggal,tidak_diketahui'],
            'guardian_name' => [$guardianRule, 'nullable', 'string', 'max:100'],
            'guardian_relation' => [$guardianRule, 'nullable', 'string', 'max:100'],
            'guardian_nik' => [$guardianRule, 'nullable', 'digits:16'],
            'guardian_place_of_birth' => [$guardianRule, 'nullable', 'string', 'max:100'],
            'guardian_date_of_birth' => [$guardianRule, 'nullable', 'date', 'before:today'],
            'guardian_education' => [$guardianRule, 'nullable', $educationRule],
            'guardian_job_ktp' => [$guardianRule, 'nullable', 'string', 'max:100'],
            'guardian_job_actual' => [$guardianRule, 'nullable', 'string', 'max:100'],
            'guardian_income_range' => [$guardianRule, 'nullable', $incomeRule],
            'guardian_phone' => [$guardianRule, 'nullable', $phoneRule],
            'guardian_province' => [$guardianRule, 'nullable', 'string', 'max:100'],
            'guardian_city' => [$guardianRule, 'nullable', 'string', 'max:100'],
            'guardian_district' => [$guardianRule, 'nullable', 'string', 'max:100'],
            'guardian_village' => [$guardianRule, 'nullable', 'string', 'max:100'],
            'guardian_address' => [$guardianRule, 'nullable', 'string', 'max:500'],
            'guardian_postal_code' => [$guardianRule, 'nullable', 'digits:5'],
        ];

        $profilKeluargaRules = [
            'no_kk' => ['required', 'digits:16'],
            'family_email' => ['nullable', 'email', 'max:100', 'regex:/@gmail\.com$/'],
            'marital_status' => ['required', 'in:nikah_tercatat,cerai_hidup,cerai_mati'],
            'house_ownership' => ['nullable', 'in:milik_sendiri,kontrak,menumpang,rumah_dinas'],
            'vehicle_ownership' => ['nullable', 'in:tidak_ada,motor,mobil,motor_dan_mobil'],
            'family_dependents' => ['nullable', 'integer', 'min:0', 'max:30'],
        ];

        return match ($tab) {
            'ibu' => $ibuRules,
            'ayah' => $ayahRules,
            'wali' => $waliRules,
            'profil-keluarga' => $profilKeluargaRules,
            default => array_merge($ibuRules, $ayahRules, $waliRules, $profilKeluargaRules),
        };
    }

    private function validationMessages(): array
    {
        return [
            'no_kk.required' => 'Nomor Kartu Keluarga (KK) wajib diisi.',
            'no_kk.digits' => 'Nomor Kartu Keluarga (KK) harus tepat 16 digit angka.',
            'marital_status.required' => 'Status pernikahan orang tua wajib dipilih.',
            'income_type.required' => 'Tipe penghasilan keluarga wajib dipilih.',

            // Ibu
            'mother_status.required' => 'Status Ibu wajib dipilih.',
            'mother_name.required' => 'Nama Ibu wajib diisi.',
            'mother_name.max' => 'Nama Ibu maksimal 100 karakter.',
            'mother_nik.required' => 'NIK Ibu wajib diisi.',
            'mother_nik.digits' => 'NIK Ibu harus tepat 16 digit angka.',
            'mother_place_of_birth.required' => 'Tempat lahir Ibu wajib diisi.',
            'mother_place_of_birth.max' => 'Tempat lahir Ibu maksimal 100 karakter.',
            'mother_date_of_birth.required' => 'Tanggal lahir Ibu wajib diisi.',
            'mother_date_of_birth.before' => 'Tanggal lahir Ibu harus sebelum hari ini.',
            'mother_education.required' => 'Pendidikan Ibu wajib dipilih.',
            'mother_job_ktp.required' => 'Pekerjaan KTP Ibu wajib diisi.',
            'mother_job_actual.required' => 'Pekerjaan aktual Ibu wajib diisi.',
            'mother_income_range.required' => 'Penghasilan Ibu wajib dipilih.',
            'mother_phone.required' => 'Nomor HP Ibu wajib diisi.',
            'mother_phone.regex' => 'Nomor HP Ibu harus diawali 08 (10-14 digit angka).',
            'mother_province.required' => 'Provinsi Ibu wajib diisi.',
            'mother_city.required' => 'Kota/Kabupaten Ibu wajib diisi.',
            'mother_district.required' => 'Kecamatan Ibu wajib diisi.',
            'mother_village.required' => 'Kelurahan/Desa Ibu wajib diisi.',
            'mother_address.required' => 'Alamat lengkap Ibu wajib diisi.',
            'mother_address.max' => 'Alamat Ibu maksimal 500 karakter.',
            'mother_postal_code.required' => 'Kode pos Ibu wajib diisi.',
            'mother_postal_code.digits' => 'Kode pos Ibu harus tepat 5 digit angka.',

            // Ayah
            'father_status.required' => 'Status Ayah wajib dipilih.',
            'father_name.required' => 'Nama Ayah wajib diisi.',
            'father_name.max' => 'Nama Ayah maksimal 100 karakter.',
            'father_nik.required' => 'NIK Ayah wajib diisi.',
            'father_nik.digits' => 'NIK Ayah harus tepat 16 digit angka.',
            'father_place_of_birth.required' => 'Tempat lahir Ayah wajib diisi.',
            'father_place_of_birth.max' => 'Tempat lahir Ayah maksimal 100 karakter.',
            'father_date_of_birth.required' => 'Tanggal lahir Ayah wajib diisi.',
            'father_date_of_birth.before' => 'Tanggal lahir Ayah harus sebelum hari ini.',
            'father_education.required' => 'Pendidikan Ayah wajib dipilih.',
            'father_job_ktp.required' => 'Pekerjaan KTP Ayah wajib diisi.',
            'father_job_actual.required' => 'Pekerjaan aktual Ayah wajib diisi.',
            'father_income_range.required' => 'Penghasilan Ayah wajib dipilih.',
            'father_phone.required' => 'Nomor HP Ayah wajib diisi.',
            'father_phone.regex' => 'Nomor HP Ayah harus diawali 08 (10-14 digit angka).',
            'father_province.required' => 'Provinsi Ayah wajib diisi.',
            'father_city.required' => 'Kota/Kabupaten Ayah wajib diisi.',
            'father_district.required' => 'Kecamatan Ayah wajib diisi.',
            'father_village.required' => 'Kelurahan/Desa Ayah wajib diisi.',
            'father_address.required' => 'Alamat lengkap Ayah wajib diisi.',
            'father_address.max' => 'Alamat Ayah maksimal 500 karakter.',
            'father_postal_code.required' => 'Kode pos Ayah wajib diisi.',
            'father_postal_code.digits' => 'Kode pos Ayah harus tepat 5 digit angka.',

            // Wali
            'guardian_status.required' => 'Status Wali wajib dipilih.',
            'guardian_name.required' => 'Nama Wali wajib diisi.',
            'guardian_name.max' => 'Nama Wali maksimal 100 karakter.',
            'guardian_relation.required' => 'Hubungan Wali dengan anak wajib diisi.',
            'guardian_nik.required' => 'NIK Wali wajib diisi.',
            'guardian_nik.digits' => 'NIK Wali harus tepat 16 digit angka.',
            'guardian_place_of_birth.required' => 'Tempat lahir Wali wajib diisi.',
            'guardian_date_of_birth.required' => 'Tanggal lahir Wali wajib diisi.',
            'guardian_date_of_birth.before' => 'Tanggal lahir Wali harus sebelum hari ini.',
            'guardian_education.required' => 'Pendidikan Wali wajib dipilih.',
            'guardian_job_ktp.required' => 'Pekerjaan KTP Wali wajib diisi.',
            'guardian_job_actual.required' => 'Pekerjaan aktual Wali wajib diisi.',
            'guardian_income_range.required' => 'Penghasilan Wali wajib dipilih.',
            'guardian_phone.required' => 'Nomor HP Wali wajib diisi.',
            'guardian_phone.regex' => 'Nomor HP Wali harus diawali 08 (10-14 digit angka).',
            'guardian_province.required' => 'Provinsi Wali wajib diisi.',
            'guardian_city.required' => 'Kota/Kabupaten Wali wajib diisi.',
            'guardian_district.required' => 'Kecamatan Wali wajib diisi.',
            'guardian_village.required' => 'Kelurahan/Desa Wali wajib diisi.',
            'guardian_address.required' => 'Alamat lengkap Wali wajib diisi.',
            'guardian_address.max' => 'Alamat Wali maksimal 500 karakter.',
            'guardian_postal_code.required' => 'Kode pos Wali wajib diisi.',
            'guardian_postal_code.digits' => 'Kode pos Wali harus tepat 5 digit angka.',

            // Profil Keluarga
            'family_email.email' => 'Format email keluarga tidak valid.',
            'family_email.max' => 'Email keluarga maksimal 100 karakter.',
            'family_email.regex' => 'Hanya email @gmail.com yang diterima.',
            'family_dependents.min' => 'Jumlah tanggungan minimal 0.',
            'family_dependents.max' => 'Jumlah tanggungan maksimal 30.',
        ];
    }
}
