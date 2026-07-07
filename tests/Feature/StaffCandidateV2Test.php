<?php

use App\Models\AdmissionWave;
use App\Models\Candidate;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

function staffCandidateV2Wave(): AdmissionWave
{
    return AdmissionWave::create([
        'title' => 'Gelombang Staff V2',
        'academic_year' => '2026/2027',
        'start_date' => now()->subDay()->toDateString(),
        'end_date' => now()->addMonth()->toDateString(),
        'registration_fee' => 150000,
        'quota_target' => 100,
        'is_active' => true,
    ]);
}

function staffCandidateV2Candidate(AdmissionWave $wave, array $overrides = []): Candidate
{
    $user = User::factory()->create(['role' => 'candidate']);
    $status = $overrides['status'] ?? 'draft';
    unset($overrides['status']);

    $candidate = Candidate::create(array_merge([
        'user_id' => $user->id,
        'admission_wave_id' => $wave->id,
        'candidate_code' => 'CDT-'.strtoupper(substr(uniqid(), -6)).'-26-G1',
        'nisn' => fake()->unique()->numerify('##########'),
        'nik' => fake()->unique()->numerify('################'),
        'full_name' => 'Kandidat Staff V2',
        'gender' => 'L',
        'place_of_birth' => 'Bandung',
        'date_of_birth' => '2010-01-01',
        'school_origin' => 'SMP Staff V2',
        'program_choice' => 'Reguler',
        'status' => 'draft',
    ], $overrides));

    $candidate->updateQuietly(['status' => $status]);

    return $candidate->fresh();
}

it('keeps staff candidate search grouped when status filters are active', function () {
    $wave = staffCandidateV2Wave();
    $staff = User::factory()->staff()->create();

    staffCandidateV2Candidate($wave, [
        'full_name' => 'Alpha Draft Match',
        'candidate_code' => 'CDT-ALPHA-DRAFT',
        'nisn' => '1111111111',
        'nik' => '1111111111111111',
        'status' => 'draft',
    ]);

    staffCandidateV2Candidate($wave, [
        'full_name' => 'Alpha Submitted Match',
        'candidate_code' => 'CDT-ALPHA-SUB',
        'nisn' => '2222222222',
        'nik' => '2222222222222222',
        'status' => 'submitted',
    ]);

    staffCandidateV2Candidate($wave, [
        'full_name' => 'Beta Submitted',
        'candidate_code' => 'CDT-BETA-SUB',
        'nisn' => '3333333333',
        'nik' => '3333333333333333',
        'status' => 'submitted',
    ]);

    $this->actingAs($staff)
        ->get('/dashboard/staff/candidates?search=Alpha&status=submitted')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Dashboard/Staff/Candidates')
            ->where('filters.search', 'Alpha')
            ->where('filters.status', 'submitted')
            ->has('candidates.data', 1)
            ->where('candidates.data.0.full_name', 'Alpha Submitted Match')
            ->where('candidates.data.0.operational.action_needed.key', 'core-data')
        );
});

it('provides an operational overview on the staff candidate detail page', function () {
    $wave = staffCandidateV2Wave();
    $staff = User::factory()->staff()->create();
    $candidate = staffCandidateV2Candidate($wave, [
        'full_name' => 'Detail Overview Candidate',
        'candidate_code' => 'CDT-DETAIL-V2',
        'nisn' => '4444444444',
        'nik' => '4444444444444444',
        'program_choice' => 'Boarding',
        'status' => 'draft',
    ]);

    $this->actingAs($staff)
        ->get("/dashboard/staff/candidates/{$candidate->id}")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Dashboard/Staff/Show')
            ->where('overview.identity.full_name', 'Detail Overview Candidate')
            ->where('overview.identity.program_choice', 'Boarding')
            ->where('overview.primary_blocker.key', 'core-data')
            ->has('overview.readiness', 6)
            ->has('overview.quick_links')
        );
});
