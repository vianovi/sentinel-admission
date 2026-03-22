<?php

namespace App\Http\Controllers\Candidate;

use App\Http\Controllers\Controller;
use App\Models\Guardian;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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
            ]
        );

        return Inertia::render('Dashboard/Candidate/DataWali', [
            'guardian'   => $guardian,
            'completion' => $guardian->completion_percentage,

            // Props untuk CandidateSidebar — sama persis dengan controller lain
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
                'admission_wave'      => $candidate->admissionWave
                    ? ['title' => $candidate->admissionWave->title]
                    : null,
                // Untuk fitur "salin alamat kandidat"
                'province'    => $candidate->province ?? null,
                'city'        => $candidate->city ?? null,
                'district'    => $candidate->district ?? null,
                'village'     => $candidate->village ?? null,
                'address'     => $candidate->address ?? null,
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
        $fatherAbsent = in_array($request->father_status, ['meninggal', 'tidak_diketahui']);
        $combined     = $request->income_type === 'combined';
        $shared       = $request->boolean('alamat_shared');

        return [
            // Shared
            'no_kk'        => ['nullable', 'digits:16'],
            'income_type'  => ['required', 'in:separate,combined'],
            'alamat_shared'=> ['boolean'],

            // ── Ayah ──────────────────────────────────────────────────────
            'father_status'         => ['required', 'in:hidup,meninggal,tidak_diketahui'],
            'father_name'           => [$fatherAbsent ? 'nullable' : 'nullable', 'string', 'max:100'],
            'father_nik'            => ['nullable', 'digits:16'],
            'father_place_of_birth' => ['nullable', 'string', 'max:100'],
            'father_date_of_birth'  => ['nullable', 'date', 'before:today'],
            'father_education'      => ['nullable', 'in:tidak_sekolah,sd_sederajat,smp_sederajat,sma_smk_sederajat,d1,d2,d3,d4_s1,s2,s3'],
            'father_job_ktp'        => ['nullable', 'string', 'max:100'],
            'father_job_actual'     => ['nullable', 'string', 'max:100'],
            'father_income_range'   => ['nullable', 'in:tidak_berpenghasilan,di_bawah_1jt,1jt_2_5jt,2_5jt_3_5jt,3_5jt_5jt,5jt_10jt,di_atas_10jt'],
            'father_phone'          => ['nullable', 'regex:/^08[0-9]{8,12}$/'],
            'father_province'       => ['nullable', 'string', 'max:100'],
            'father_city'           => ['nullable', 'string', 'max:100'],
            'father_district'       => ['nullable', 'string', 'max:100'],
            'father_village'        => ['nullable', 'string', 'max:100'],
            'father_address'        => ['nullable', 'string', 'max:500'],
            'father_postal_code'    => ['nullable', 'digits:5'],

            // ── Ibu ───────────────────────────────────────────────────────
            'mother_status'         => ['required', 'in:hidup,meninggal,tidak_diketahui'],
            'mother_name'           => ['required', 'string', 'max:100'],
            'mother_nik'            => ['nullable', 'digits:16'],
            'mother_place_of_birth' => ['nullable', 'string', 'max:100'],
            'mother_date_of_birth'  => ['nullable', 'date', 'before:today'],
            'mother_education'      => ['nullable', 'in:tidak_sekolah,sd_sederajat,smp_sederajat,sma_smk_sederajat,d1,d2,d3,d4_s1,s2,s3'],
            'mother_job_ktp'        => ['nullable', 'string', 'max:100'],
            'mother_job_actual'     => ['nullable', 'string', 'max:100'],
            'mother_income_range'   => [
                ($combined ? 'nullable' : 'nullable'),
                'in:tidak_berpenghasilan,di_bawah_1jt,1jt_2_5jt,2_5jt_3_5jt,3_5jt_5jt,5jt_10jt,di_atas_10jt'
            ],
            'mother_phone'          => ['nullable', 'regex:/^08[0-9]{8,12}$/'],
            'mother_province'       => [$shared ? 'nullable' : 'nullable', 'string', 'max:100'],
            'mother_city'           => ['nullable', 'string', 'max:100'],
            'mother_district'       => ['nullable', 'string', 'max:100'],
            'mother_village'        => ['nullable', 'string', 'max:100'],
            'mother_address'        => ['nullable', 'string', 'max:500'],
            'mother_postal_code'    => ['nullable', 'digits:5'],

            // ── Wali (semua nullable) ──────────────────────────────────────
            'guardian_status'         => ['nullable', 'in:hidup,meninggal,tidak_diketahui'],
            'guardian_name'           => ['nullable', 'string', 'max:100'],
            'guardian_relation'       => ['nullable', 'string', 'max:100'],
            'guardian_nik'            => ['nullable', 'digits:16'],
            'guardian_place_of_birth' => ['nullable', 'string', 'max:100'],
            'guardian_date_of_birth'  => ['nullable', 'date', 'before:today'],
            'guardian_education'      => ['nullable', 'in:tidak_sekolah,sd_sederajat,smp_sederajat,sma_smk_sederajat,d1,d2,d3,d4_s1,s2,s3'],
            'guardian_job_ktp'        => ['nullable', 'string', 'max:100'],
            'guardian_job_actual'     => ['nullable', 'string', 'max:100'],
            'guardian_income_range'   => ['nullable', 'in:tidak_berpenghasilan,di_bawah_1jt,1jt_2_5jt,2_5jt_3_5jt,3_5jt_5jt,5jt_10jt,di_atas_10jt'],
            'guardian_phone'          => ['nullable', 'regex:/^08[0-9]{8,12}$/'],
            'guardian_province'       => ['nullable', 'string', 'max:100'],
            'guardian_city'           => ['nullable', 'string', 'max:100'],
            'guardian_district'       => ['nullable', 'string', 'max:100'],
            'guardian_village'        => ['nullable', 'string', 'max:100'],
            'guardian_address'        => ['nullable', 'string', 'max:500'],
            'guardian_postal_code'    => ['nullable', 'digits:5'],

            // ── Profil Keluarga ────────────────────────────────────────────
            'family_email'      => ['nullable', 'email', 'regex:/@gmail\.com$/'],
            'marital_status'    => ['nullable', 'in:nikah_tercatat,cerai_hidup,cerai_mati'],
            'house_ownership'   => ['nullable', 'in:milik_sendiri,kontrak,menumpang,rumah_dinas'],
            'vehicle_ownership' => ['nullable', 'in:tidak_ada,motor,mobil,motor_dan_mobil'],
            'family_dependents' => ['nullable', 'integer', 'min:0', 'max:30'],
        ];
    }
}