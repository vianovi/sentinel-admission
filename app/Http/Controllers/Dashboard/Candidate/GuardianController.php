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
        $user      = Auth::user();
        $candidate = $user->candidate()->with('admissionWave')->first();

        if (! $candidate) {
            return redirect()->route('dashboard.index');
        }

        $guardian = Guardian::firstOrCreate(
            ['candidate_id' => $candidate->id],
            [
                'candidate_code' => $candidate->candidate_code,
                'mother_name'    => $candidate->mother_name ?? '',
                'no_kk'          => $candidate->family_card_number,
            ]
        );
        $addressDetail = is_array($candidate->address_detail) ? $candidate->address_detail : [];

        if (empty($guardian->no_kk) && ! empty($candidate->family_card_number)) {
            $guardian->updateQuietly(['no_kk' => $candidate->family_card_number]);
        }

        return Inertia::render('Dashboard/Candidate/DataWali', [
            'guardian'   => $guardian,
            'completion' => $guardian->completion_percentage,
            'user' => [
                'name'       => $user->name,
                'avatar_url' => $user->avatar_url,
                'initials'   => $user->initials,
            ],
            'candidate' => [
                'full_name'           => $candidate->full_name,
                'nisn'                => $candidate->nisn,
                'nik'                 => $candidate->nik,
                'gender_label'        => $candidate->genderLabel(),
                'date_of_birth_label' => $candidate->date_of_birth?->format('d F Y'),
                'school_origin'       => $candidate->school_origin,
                'status'              => $candidate->status,
                'program_choice'      => $candidate->program_choice,
                'phone_number'        => $candidate->phone_number,
                'family_card_number'  => $candidate->family_card_number,
                'admission_wave'      => $candidate->admissionWave
                    ? ['title' => $candidate->admissionWave->title]
                    : null,
                'province'    => $addressDetail['provinsi'] ?? null,
                'city'        => $addressDetail['kabupaten'] ?? null,
                'district'    => $addressDetail['kecamatan'] ?? null,
                'village'     => $addressDetail['kelurahan'] ?? null,
                'address'     => $addressDetail['jalan'] ?? $candidate->address_full,
                'postal_code' => $candidate->postal_code ?? null,
            ],
        ]);
    }

    public function update(Request $request): \Illuminate\Http\RedirectResponse
    {
        $candidate = Auth::user()->candidate;
        $guardian  = Guardian::where('candidate_id', $candidate->id)->firstOrFail();

        $validated = $request->validate($this->rules($request));

        $guardian->update($validated);

        return back()->with('success', 'Data wali berhasil disimpan.');
    }

    // ─── Validation Rules ─────────────────────────────────────────────────

    private function rules(Request $request): array
    {
        $fatherAlive = $request->father_status === 'hidup';
        $motherAlive = $request->mother_status === 'hidup';
        $combined    = $request->income_type === 'combined';
        $shared      = $request->boolean('alamat_shared');
        $guardianRequired = $request->marital_status && $request->marital_status !== 'nikah_tercatat';
        $educationRule = 'in:tidak_sekolah,sd_sederajat,smp_sederajat,sma_smk_sederajat,d1,d2,d3,d4_s1,s2,s3';
        $incomeRule = 'in:tidak_berpenghasilan,tidak_ingin_memberitahu,di_bawah_1jt,1jt_2_5jt,2_5jt_3_5jt,3_5jt_5jt,5jt_10jt,di_atas_10jt';
        $phoneRule = 'regex:/^08[0-9]{8,12}$/';
        $fatherRequired = Rule::requiredIf($fatherAlive);
        $fatherIncomeRequired = Rule::requiredIf($fatherAlive && ! $combined);
        $fatherAddressRequired = Rule::requiredIf($fatherAlive && ! $shared);
        $motherRequired = Rule::requiredIf($motherAlive);
        $guardianRule = Rule::requiredIf($guardianRequired);

        return [
            'no_kk'         => ['required', 'digits:16'],
            'income_type'   => ['required', 'in:separate,combined'],
            'alamat_shared' => ['boolean'],

            // ── Ayah ──────────────────────────────────────────────────────
            'father_status'         => ['required', 'in:hidup,meninggal,tidak_diketahui'],
            'father_name'           => [$fatherRequired, 'nullable', 'string', 'max:100'],
            'father_nik'            => [$fatherRequired, 'nullable', 'digits:16'],
            'father_place_of_birth' => [$fatherRequired, 'nullable', 'string', 'max:100'],
            'father_date_of_birth'  => [$fatherRequired, 'nullable', 'date', 'before:today'],
            'father_education'      => [$fatherRequired, 'nullable', $educationRule],
            'father_job_ktp'        => [$fatherRequired, 'nullable', 'string', 'max:100'],
            'father_job_actual'     => [$fatherRequired, 'nullable', 'string', 'max:100'],
            'father_income_range'   => [$fatherIncomeRequired, 'nullable', $incomeRule],
            'father_phone'          => [$fatherRequired, 'nullable', $phoneRule],
            'father_province'       => [$fatherAddressRequired, 'nullable', 'string', 'max:100'],
            'father_city'           => [$fatherAddressRequired, 'nullable', 'string', 'max:100'],
            'father_district'       => [$fatherAddressRequired, 'nullable', 'string', 'max:100'],
            'father_village'        => [$fatherAddressRequired, 'nullable', 'string', 'max:100'],
            'father_address'        => [$fatherAddressRequired, 'nullable', 'string', 'max:500'],
            'father_postal_code'    => [$fatherAddressRequired, 'nullable', 'digits:5'],

            // ── Ibu ───────────────────────────────────────────────────────
            'mother_status'         => ['required', 'in:hidup,meninggal,tidak_diketahui'],
            'mother_name'           => [$motherRequired, 'nullable', 'string', 'max:100'],
            'mother_nik'            => [$motherRequired, 'nullable', 'digits:16'],
            'mother_place_of_birth' => [$motherRequired, 'nullable', 'string', 'max:100'],
            'mother_date_of_birth'  => [$motherRequired, 'nullable', 'date', 'before:today'],
            'mother_education'      => [$motherRequired, 'nullable', $educationRule],
            'mother_job_ktp'        => [$motherRequired, 'nullable', 'string', 'max:100'],
            'mother_job_actual'     => [$motherRequired, 'nullable', 'string', 'max:100'],
            'mother_income_range'   => [$motherRequired, 'nullable', $incomeRule],
            'mother_phone'          => [$motherRequired, 'nullable', $phoneRule],
            'mother_province'       => [$motherRequired, 'nullable', 'string', 'max:100'],
            'mother_city'           => [$motherRequired, 'nullable', 'string', 'max:100'],
            'mother_district'       => [$motherRequired, 'nullable', 'string', 'max:100'],
            'mother_village'        => [$motherRequired, 'nullable', 'string', 'max:100'],
            'mother_address'        => [$motherRequired, 'nullable', 'string', 'max:500'],
            'mother_postal_code'    => [$motherRequired, 'nullable', 'digits:5'],

            // ── Wali (semua nullable) ──────────────────────────────────────
            'guardian_status'         => [$guardianRule, 'nullable', 'in:hidup,meninggal,tidak_diketahui'],
            'guardian_name'           => [$guardianRule, 'nullable', 'string', 'max:100'],
            'guardian_relation'       => [$guardianRule, 'nullable', 'string', 'max:100'],
            'guardian_nik'            => [$guardianRule, 'nullable', 'digits:16'],
            'guardian_place_of_birth' => [$guardianRule, 'nullable', 'string', 'max:100'],
            'guardian_date_of_birth'  => [$guardianRule, 'nullable', 'date', 'before:today'],
            'guardian_education'      => [$guardianRule, 'nullable', $educationRule],
            'guardian_job_ktp'        => [$guardianRule, 'nullable', 'string', 'max:100'],
            'guardian_job_actual'     => [$guardianRule, 'nullable', 'string', 'max:100'],
            'guardian_income_range'   => [$guardianRule, 'nullable', $incomeRule],
            'guardian_phone'          => [$guardianRule, 'nullable', $phoneRule],
            'guardian_province'       => [$guardianRule, 'nullable', 'string', 'max:100'],
            'guardian_city'           => [$guardianRule, 'nullable', 'string', 'max:100'],
            'guardian_district'       => [$guardianRule, 'nullable', 'string', 'max:100'],
            'guardian_village'        => [$guardianRule, 'nullable', 'string', 'max:100'],
            'guardian_address'        => [$guardianRule, 'nullable', 'string', 'max:500'],
            'guardian_postal_code'    => [$guardianRule, 'nullable', 'digits:5'],

            // ── Profil Keluarga ────────────────────────────────────────────
            'family_email'      => ['nullable', 'email', 'regex:/@gmail\.com$/'],
            'marital_status'    => ['required', 'in:nikah_tercatat,cerai_hidup,cerai_mati'],
            'house_ownership'   => ['nullable', 'in:milik_sendiri,kontrak,menumpang,rumah_dinas'],
            'vehicle_ownership' => ['nullable', 'in:tidak_ada,motor,mobil,motor_dan_mobil'],
            'family_dependents' => ['nullable', 'integer', 'min:0', 'max:30'],
        ];
    }
}
