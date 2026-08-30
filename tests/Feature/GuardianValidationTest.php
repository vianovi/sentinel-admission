<?php

use App\Models\AdmissionWave;
use App\Models\User;
use App\Models\Candidate;
use App\Models\Guardian;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function guardianTestWave(): AdmissionWave
{
    return AdmissionWave::create([
        'title' => 'Gelombang Test',
        'academic_year' => '2026/2027',
        'start_date' => now()->subDay()->toDateString(),
        'end_date' => now()->addMonth()->toDateString(),
        'registration_fee' => 150000,
        'quota_target' => 100,
        'is_active' => true,
    ]);
}

function guardianTestUser(): User
{
    return User::factory()->create([
        'role' => 'candidate',
        'email' => 'guardian-'.uniqid().'@gmail.com',
    ]);
}

function guardianTestCandidate(User $user): Candidate
{
    return Candidate::create([
        'user_id' => $user->id,
        'admission_wave_id' => guardianTestWave()->id,
        'candidate_code' => 'CDT-'.strtoupper(substr(uniqid(), -6)).'-26-G1',
        'nisn' => fake()->unique()->numerify('##########'),
        'nik' => fake()->unique()->numerify('################'),
        'full_name' => 'Kandidat Guardian Test',
        'gender' => 'P',
        'place_of_birth' => 'Semarang',
        'date_of_birth' => '2010-01-01',
        'school_origin' => 'SMP N 1',
        'phone_number' => '081234567890',
        'family_card_number' => '1234567890123456',
        'status' => 'draft',
    ]);
}

beforeEach(function () {
    $this->user = guardianTestUser();
    $this->candidate = guardianTestCandidate($this->user);
});

test('candidate can view data wali index', function () {
    $response = $this->actingAs($this->user)->get(route('dashboard.data-wali'));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('Dashboard/Candidate/DataWali')
        ->has('guardian')
    );
});

test('saving subtab ibu validates only ibu fields', function () {
    // Submit invalid mother NIK & phone on tab 'ibu'
    $response = $this->actingAs($this->user)->put(route('dashboard.data-wali.update'), [
        'tab' => 'ibu',
        'income_type' => 'separate',
        'mother_status' => 'hidup',
        'mother_name' => 'Ibu Test',
        'mother_nik' => '12345', // invalid digits length (not 16)
        'mother_phone' => '0812', // invalid phone length
    ]);

    $response->assertSessionHasErrors(['mother_nik', 'mother_phone']);
    // Should NOT have errors for father or profil keluarga fields
    $response->assertSessionDoesntHaveErrors(['father_status', 'no_kk', 'marital_status']);
});

test('saving subtab ibu with valid data succeeds without requiring other subtabs', function () {
    $response = $this->actingAs($this->user)->put(route('dashboard.data-wali.update'), [
        'tab' => 'ibu',
        'income_type' => 'separate',
        'alamat_shared' => true,
        'mother_status' => 'hidup',
        'mother_name' => 'Ibu Susanti',
        'mother_nik' => '3301123456789012',
        'mother_place_of_birth' => 'Semarang',
        'mother_date_of_birth' => '1985-05-15',
        'mother_education' => 'd4_s1',
        'mother_job_ktp' => 'PNS',
        'mother_job_actual' => 'Guru',
        'mother_income_range' => '3_5jt_5jt',
        'mother_phone' => '081234567890',
        'mother_province' => 'Jawa Tengah',
        'mother_city' => 'Kota Semarang',
        'mother_district' => 'Banyumanik',
        'mother_village' => 'Pudakpayung',
        'mother_address' => 'Jl. Mawar No. 12',
        'mother_postal_code' => '50265',
    ]);

    $response->assertSessionHasNoErrors();
    $response->assertRedirect();

    $this->assertDatabaseHas('guardians', [
        'candidate_id' => $this->candidate->id,
        'mother_name' => 'Ibu Susanti',
        'mother_nik' => '3301123456789012',
    ]);
});

test('saving subtab ayah validates only ayah fields', function () {
    $response = $this->actingAs($this->user)->put(route('dashboard.data-wali.update'), [
        'tab' => 'ayah',
        'father_status' => 'hidup',
        'father_name' => 'Ayah Test',
        'father_nik' => '123', // Invalid NIK
    ]);

    $response->assertSessionHasErrors(['father_nik']);
    $response->assertSessionDoesntHaveErrors(['mother_status', 'no_kk']);
});

test('saving subtab profil keluarga validates no_kk 16 digits and dependents max 30', function () {
    $response = $this->actingAs($this->user)->put(route('dashboard.data-wali.update'), [
        'tab' => 'profil-keluarga',
        'no_kk' => '12345', // Short KK
        'marital_status' => 'nikah_tercatat',
        'family_dependents' => 50, // Exceeds max 30
    ]);

    $response->assertSessionHasErrors(['no_kk', 'family_dependents']);
});

test('submitting from rangkuman tab validates all required fields across all tabs', function () {
    $response = $this->actingAs($this->user)->put(route('dashboard.data-wali.update'), [
        'tab' => 'rangkuman',
        'mother_status' => 'hidup',
        // Missing father_status, no_kk, marital_status etc.
    ]);

    $response->assertSessionHasErrors(['father_status', 'no_kk', 'marital_status']);
});
