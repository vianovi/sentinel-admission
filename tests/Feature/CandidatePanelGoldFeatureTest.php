<?php

use App\Models\AdmissionWave;
use App\Models\Candidate;
use App\Models\Guardian;
use App\Models\HealthRecord;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

function candidatePanelUser(): User
{
    return User::factory()->create([
        'role' => 'candidate',
        'email' => 'candidate-panel-'.uniqid().'@gmail.com',
    ]);
}

function candidatePanelWave(): AdmissionWave
{
    return AdmissionWave::create([
        'title' => 'Gelombang Candidate Panel',
        'academic_year' => '2026/2027',
        'start_date' => now()->subDay()->toDateString(),
        'end_date' => now()->addMonth()->toDateString(),
        'registration_fee' => 150000,
        'quota_target' => 100,
        'is_active' => true,
    ]);
}

function candidatePanelCandidate(User $user): Candidate
{
    $candidate = Candidate::create([
        'user_id' => $user->id,
        'admission_wave_id' => candidatePanelWave()->id,
        'candidate_code' => 'CDT-'.strtoupper(substr(uniqid(), -6)).'-26-G1',
        'nisn' => fake()->unique()->numerify('##########'),
        'nik' => fake()->unique()->numerify('################'),
        'full_name' => 'Kandidat Candidate Panel',
        'gender' => 'P',
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
    ]);

    Guardian::create([
        'candidate_id' => $candidate->id,
        'candidate_code' => $candidate->candidate_code,
        'mother_name' => 'Ibu Candidate Panel',
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

it('opens the real candidate panel pages from candidate routes', function () {
    $user = candidatePanelUser();
    candidatePanelCandidate($user);

    $this->actingAs($user)
        ->get('/dashboard/bantuan')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('Dashboard/Candidate/Bantuan'));

    $this->actingAs($user)
        ->get('/dashboard/pembayaran/riwayat')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('Dashboard/Candidate/PaymentHistory'));

    $this->actingAs($user)
        ->get('/dashboard/seleksi/status')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('Dashboard/Candidate/SelectionStatus'));

    $this->actingAs($user)
        ->get('/dashboard/seleksi/hasil')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('Dashboard/Candidate/SelectionResult'));
});

it('keeps payment history scoped and does not expose raw payment metadata', function () {
    $user = candidatePanelUser();
    $candidate = candidatePanelCandidate($user);

    Payment::create([
        'candidate_id' => $candidate->id,
        'admission_wave_id' => $candidate->admission_wave_id,
        'candidate_code' => $candidate->candidate_code,
        'order_id' => $candidate->candidate_code.'-'.uniqid(),
        'payment_channel' => Payment::CHANNEL_TRANSFER,
        'base_amount' => 150000,
        'fee_amount' => 0,
        'final_amount' => 150000,
        'metadata' => ['internal_secret' => 'RAW_PAYMENT_SECRET'],
        'status' => Payment::STATUS_PENDING,
        'manual_status' => Payment::MANUAL_REJECTED,
        'rejection_reason' => 'Bukti kurang jelas',
        'proof_attempt' => 1,
    ]);

    $this->actingAs($user)
        ->get('/dashboard/pembayaran/riwayat')
        ->assertOk()
        ->assertSee('Bukti kurang jelas')
        ->assertDontSee('RAW_PAYMENT_SECRET')
        ->assertDontSee('metadata')
        ->assertDontSee('snap_token')
        ->assertDontSee('midtrans_transaction_id');
});
