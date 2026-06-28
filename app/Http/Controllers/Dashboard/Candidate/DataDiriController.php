<?php

namespace App\Http\Controllers\Dashboard\Candidate;

use App\Http\Controllers\Controller;
use App\Support\CandidateRequestPresenter;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DataDiriController extends Controller
{
    // =========================================================================
    // SHOW DATA DIRI — GET /dashboard/data-diri
    // =========================================================================

    public function show(Request $request): Response
    {
        $user      = $request->user();
        $candidate = $user->candidate()->with(['admissionWave.programs'])->first();
        $dataChangeResult = CandidateRequestPresenter::formatDataChangeResult($candidate?->data_change_request);

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
                'is_transfer'                => (bool) $candidate->is_transfer,
                // ── Status & change request ───────────────────────────────
                'status'              => $candidate->status,
                'has_pending_change'  => $candidate->hasPendingChangeRequest(),
                'data_change_request' => $candidate->data_change_request,
                // ── Admission wave ────────────────────────────────────────
                'admission_wave' => $candidate->admissionWave ? [
                    'title'            => $candidate->admissionWave->title,
                    'academic_year'    => $candidate->admissionWave->academic_year,
                    'majors_enabled'   => $candidate->admissionWave->majors_enabled,
                    'available_majors' => $candidate->admissionWave->available_majors ?? [],
                    'programs' => $candidate->admissionWave->programs
                        ->where('is_active', true)
                        ->sortBy('priority')
                        ->values()
                        ->map(fn ($p) => [
                            'name'          => $p->name,
                            'quota_zone'    => $p->quotaZone(),
                            'warning'       => $p->warningMessage('candidate'),
                            'is_open_quota' => $p->is_open_quota,
                        ])->all(),
                    ] : null,
            ] : null,
            'data_change_request_result' => $dataChangeResult,
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
            ],
        ]);
    }

    // =========================================================================
    // UPDATE DATA DIRI — PUT /dashboard/data-diri
    // =========================================================================

    public function update(Request $request)
    {
        $user      = $request->user();
        $candidate = $user->candidate()->with(['admissionWave.programs'])->firstOrFail();

        $validated = $request->validate([
            'email'                       => ['nullable', 'email', 'max:255', 'regex:/^[^\s@]+@gmail\.com$/i'],
            'phone_number'                => ['nullable', 'string', 'regex:/^08[0-9]{8,12}$/'],
            'religion'                    => ['nullable', 'string', 'max:50', 'in:Islam,Kristen,Katolik,Hindu,Buddha,Konghucu'],
            'child_order'                 => ['nullable', 'integer', 'min:1', 'max:20'],
            'siblings_count'              => ['nullable', 'integer', 'min:0', 'max:20'],
            'hobbies'                     => ['nullable', 'string', 'max:500'],
            'ambitions'                   => ['nullable', 'string', 'max:500'],
            'habits'                      => ['nullable', 'string', 'max:1000'],
            'extracurricular_interests'   => ['nullable', 'array'],
            'extracurricular_interests.*' => ['string', 'max:100'],
            'postal_code'                 => ['nullable', 'digits:5'],
            'school_npsn'                 => ['nullable', 'digits:8'],
            'certificate_number'          => ['nullable', 'string', 'max:100'],
            'birth_certificate_number'    => ['nullable', 'string', 'max:100'],
            'family_card_number'          => ['nullable', 'digits:16'],
            'program_choice'              => ['nullable', 'string', 'max:100'],
            'major_choice'                => ['nullable', 'string', 'max:100'],
            'is_transfer'                 => ['nullable', 'boolean'],
        ], [
            'email.regex'               => 'Email harus berupa Gmail. Contoh: nama@gmail.com',
            'phone_number.regex'        => 'Nomor HP harus diawali 08 dan terdiri dari 10-14 digit.',
            'postal_code.digits'        => 'Kode pos harus 5 digit angka.',
            'school_npsn.digits'        => 'NPSN harus 8 digit angka.',
            'family_card_number.digits' => 'Nomor KK harus 16 digit angka.',
        ]);

        // Validasi program_choice harus dari programs aktif di gelombang
        if ($request->filled('program_choice') && $candidate->admissionWave) {
            $wave            = $candidate->admissionWave;
            $waveTotalFilled = $wave->totalFilled();

            $program = $wave->programs
                ->where('is_active', true)
                ->where('name', $request->program_choice)
                ->first();

            if (! $program) {
                return back()->withErrors(['program_choice' => 'Program tidak valid.']);
            }

            if (! $program->isAccepting($waveTotalFilled)) {
                return back()->withErrors(['program_choice' => 'Program ini sudah tidak menerima pendaftar baru.']);
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
        $candidate = $request->user()->candidate()->firstOrFail();

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
                'old_value'    => $this->formatChangeRequestOldValue($candidate, $validated['field']),
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
        $candidate = $request->user()->candidate()->firstOrFail();

        if (! $candidate->hasPendingChangeRequest()) {
            return back()->with('error', 'Pengajuan perubahan data ini sudah ditinjau dan tidak dapat dibatalkan.');
        }

        $candidate->update(['data_change_request' => null]);

        return back()->with('success', 'Pengajuan perubahan data dibatalkan.');
    }

    private function formatChangeRequestOldValue($candidate, string $field): string
    {
        if ($field !== 'address_detail') {
            return (string) $candidate->{$field};
        }

        if ($candidate->address_full) {
            return $candidate->address_full;
        }

        $detail = is_array($candidate->address_detail) ? $candidate->address_detail : [];
        $rtRw = trim(implode('/', array_filter([
            $detail['rt'] ?? '',
            $detail['rw'] ?? '',
        ])));

        return implode(', ', array_filter([
            $detail['jalan'] ?? '',
            $rtRw ? 'RT/RW ' . $rtRw : null,
            $detail['kelurahan'] ?? '',
            ($detail['kecamatan'] ?? '') ? 'Kec. ' . $detail['kecamatan'] : null,
            $detail['kabupaten'] ?? '',
            $detail['provinsi'] ?? '',
        ]));
    }
}
