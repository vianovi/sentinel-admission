<?php

use App\Models\AdmissionWave;
use App\Models\Candidate;
use App\Models\CandidateDocument;
use App\Models\Guardian;
use App\Models\HealthRecord;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

function statusCenterWave(): AdmissionWave
{
    return AdmissionWave::create([
        'title' => 'Gelombang Status Center',
        'academic_year' => '2026/2027',
        'start_date' => now()->subDay()->toDateString(),
        'end_date' => now()->addMonth()->toDateString(),
        'registration_fee' => 150000,
        'quota_target' => 100,
        'is_active' => true,
    ]);
}

function statusCenterUser(string $role = 'candidate', bool $verified = true): User
{
    $factory = User::factory();

    if (! $verified) {
        $factory = $factory->unverified();
    }

    return $factory->create([
        'role' => $role,
        'email' => 'status-center-'.uniqid().'@gmail.com',
    ]);
}

function statusCenterCandidate(?User $user = null, array $overrides = []): Candidate
{
    $user ??= statusCenterUser();

    return Candidate::create(array_merge([
        'user_id' => $user->id,
        'admission_wave_id' => statusCenterWave()->id,
        'candidate_code' => 'CDT-'.strtoupper(substr(uniqid(), -6)).'-26-G1',
        'nisn' => fake()->unique()->numerify('##########'),
        'nik' => fake()->unique()->numerify('################'),
        'full_name' => 'Kandidat Status Center',
        'gender' => 'L',
        'place_of_birth' => 'Bandung',
        'date_of_birth' => '2010-01-01',
        'school_origin' => 'SMP Test',
        'phone_number' => '081234567890',
        'religion' => 'Islam',
        'family_card_number' => fake()->unique()->numerify('################'),
        'postal_code' => '12345',
        'school_npsn' => '12345678',
        'program_choice' => 'Reguler',
        'status' => 'draft',
    ], $overrides));
}

function statusCenterCompleteCore(Candidate $candidate): Candidate
{
    Guardian::create([
        'candidate_id' => $candidate->id,
        'candidate_code' => $candidate->candidate_code,
        'mother_name' => 'Ibu Status',
        'income_type' => 'separate',
        'father_status' => 'hidup',
        'mother_status' => 'hidup',
        'no_kk' => $candidate->family_card_number,
        'marital_status' => 'nikah_tercatat',
    ]);

    HealthRecord::create([
        'candidate_id' => $candidate->id,
        'candidate_code' => $candidate->candidate_code,
        'blood_type' => 'A',
        'rhesus' => 'positive',
        'height_cm' => 160,
        'weight_kg' => 50,
        'general_health_condition' => 'Sehat',
        'eye_right_type' => 'normal',
        'eye_left_type' => 'normal',
        'major_illnesses' => 'Tidak ada',
        'last_illness' => 'Flu ringan',
        'allergy_food' => 'Tidak ada',
        'allergy_medicine' => 'Tidak ada',
        'allergy_condition' => 'Tidak ada',
        'physical_disabilities' => 'Tidak ada',
    ]);

    return $candidate->fresh();
}

function statusCenterRejectedDocument(Candidate $candidate, string $reason = 'Foto tidak terbaca'): CandidateDocument
{
    return CandidateDocument::create([
        'candidate_id' => $candidate->id,
        'candidate_code' => $candidate->candidate_code,
        'doc_type' => 'photo_formal',
        'doc_group' => 'identity',
        'original_filename' => 'photo.pdf',
        'stored_filename' => 'photo.pdf',
        'file_path' => "sentinel/candidates/{$candidate->candidate_code}/documents/photo.pdf",
        'mime_type' => 'application/pdf',
        'file_size_kb' => 1,
        'status' => 'rejected',
        'rejection_reason' => $reason,
    ]);
}

it('allows a candidate to view their own Status Pendaftaran page', function () {
    $user = statusCenterUser();
    $candidate = statusCenterCandidate($user);
    statusCenterCompleteCore($candidate);

    $this->actingAs($user)
        ->get('/dashboard/status-pendaftaran')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Dashboard/Candidate/StatusPendaftaran/Index')
            ->where('status_summary.identity.candidate_code', $candidate->candidate_code)
        );
});

it('prevents a candidate from opening internal candidate status routes', function () {
    $candidateUser = statusCenterUser();
    $otherCandidate = statusCenterCandidate();

    $this->actingAs($candidateUser)
        ->get("/dashboard/staff/candidates/{$otherCandidate->id}/status-pendaftaran")
        ->assertForbidden();
});

it('allows staff and admin to view a candidate Status Pendaftaran overview', function () {
    $candidate = statusCenterCompleteCore(statusCenterCandidate());
    $staff = statusCenterUser('staff');
    $admin = statusCenterUser('admin');

    $this->actingAs($staff)
        ->get("/dashboard/staff/candidates/{$candidate->id}/status-pendaftaran")
        ->assertOk()
        ->assertSee('Kandidat Status Center');

    $this->actingAs($admin)
        ->get("/dashboard/admin/candidates/{$candidate->id}/status-pendaftaran")
        ->assertOk()
        ->assertSee('Kandidat Status Center');
});

it('does not expose raw internal metadata on the candidate status page', function () {
    $user = statusCenterUser();
    $candidate = statusCenterCompleteCore(statusCenterCandidate($user));
    statusCenterRejectedDocument($candidate, 'Foto tidak terbaca');

    Payment::create([
        'candidate_id' => $candidate->id,
        'admission_wave_id' => $candidate->admission_wave_id,
        'candidate_code' => $candidate->candidate_code,
        'order_id' => $candidate->candidate_code.'-'.uniqid(),
        'payment_channel' => Payment::CHANNEL_TRANSFER,
        'base_amount' => 150000,
        'fee_amount' => 0,
        'final_amount' => 150000,
        'metadata' => ['internal_secret' => 'RAW_INTERNAL_SECRET'],
        'status' => Payment::STATUS_PENDING,
        'manual_status' => Payment::MANUAL_REJECTED,
        'rejection_reason' => 'Nominal tidak sesuai',
        'proof_attempt' => 1,
    ]);

    $this->actingAs($user)
        ->get('/dashboard/status-pendaftaran')
        ->assertOk()
        ->assertSee('Foto tidak terbaca')
        ->assertSee('Nominal tidak sesuai')
        ->assertDontSee('RAW_INTERNAL_SECRET')
        ->assertDontSee('metadata')
        ->assertDontSee('verified_by');
});

it('uses backend gate reasons for locked checklist items', function () {
    $user = statusCenterUser();
    statusCenterCandidate($user, ['program_choice' => null]);

    $this->actingAs($user)
        ->get('/dashboard/status-pendaftaran')
        ->assertOk()
        ->assertSee('Lengkapi Data Diri, Data Wali, dan Data Kesehatan terlebih dahulu.');
});
