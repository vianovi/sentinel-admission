<?php

use App\Models\AdmissionWave;
use App\Models\Candidate;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

beforeEach(function () {
    Storage::fake('private');

    // Create fixture sample files in storage
    $fixturesDir = storage_path('app/demo-fixtures');
    if (! file_exists($fixturesDir)) {
        mkdir($fixturesDir, 0755, true);
    }
    file_put_contents($fixturesDir.'/sample.pdf', "%PDF-1.4\n%Test PDF\n%%EOF");
    file_put_contents($fixturesDir.'/sample.jpg', "\xFF\xD8\xFF\xE0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00\xFF\xDB");
});

test('it simulates candidates with draft status', function () {
    $wave = AdmissionWave::create([
        'title' => 'Gelombang Uji Coba',
        'academic_year' => '2026/2027',
        'start_date' => now()->subDay()->toDateString(),
        'end_date' => now()->addMonth()->toDateString(),
        'registration_fee' => 200000,
        'quota_target' => 50,
        'is_active' => true,
    ]);

    $this->artisan('demo:simulate-traffic', [
        '--count' => 3,
        '--mode' => 'burst',
        '--status' => 'draft',
    ])->assertSuccessful();

    $candidates = Candidate::with('user')->where('admission_wave_id', $wave->id)->get();
    expect($candidates)->toHaveCount(3);
    foreach ($candidates as $candidate) {
        expect($candidate->status)->toBe('draft');
        expect($candidate->user->email)->toContain('@demo.spmb.com');
    }
});

test('it simulates candidates with submitted status and uploads documents', function () {
    AdmissionWave::create([
        'title' => 'Gelombang Uji Coba Dokumen',
        'academic_year' => '2026/2027',
        'start_date' => now()->subDay()->toDateString(),
        'end_date' => now()->addMonth()->toDateString(),
        'registration_fee' => 200000,
        'quota_target' => 50,
        'is_active' => true,
    ]);

    $this->artisan('demo:simulate-traffic', [
        '--count' => 2,
        '--mode' => 'burst',
        '--status' => 'submitted',
    ])->assertSuccessful();

    $candidates = Candidate::all();
    expect($candidates)->toHaveCount(2);

    foreach ($candidates as $candidate) {
        expect($candidate->status)->toBe('submitted');
        expect($candidate->documents()->count())->toBe(7);
    }
});

test('it simulates candidates with paid status', function () {
    AdmissionWave::create([
        'title' => 'Gelombang Uji Coba Bayar',
        'academic_year' => '2026/2027',
        'start_date' => now()->subDay()->toDateString(),
        'end_date' => now()->addMonth()->toDateString(),
        'registration_fee' => 250000,
        'quota_target' => 50,
        'is_active' => true,
    ]);

    $this->artisan('demo:simulate-traffic', [
        '--count' => 2,
        '--mode' => 'burst',
        '--status' => 'paid',
    ])->assertSuccessful();

    $candidates = Candidate::all();
    expect($candidates)->toHaveCount(2);

    foreach ($candidates as $candidate) {
        expect($candidate->status)->toBe('verified');
        expect($candidate->payments()->where('status', Payment::STATUS_PAID)->count())->toBe(1);
    }
});

test('it supports benchmark mode with performance metrics', function () {
    AdmissionWave::create([
        'title' => 'Gelombang Benchmark',
        'academic_year' => '2026/2027',
        'start_date' => now()->subDay()->toDateString(),
        'end_date' => now()->addMonth()->toDateString(),
        'registration_fee' => 250000,
        'quota_target' => 50,
        'is_active' => true,
    ]);

    $this->artisan('demo:simulate-traffic', [
        '--count' => 2,
        '--mode' => 'benchmark',
        '--status' => 'draft',
    ])
        ->expectsOutputToContain('METRIK PERFORMA DATABASE (BENCHMARK)')
        ->assertSuccessful();
});

test('it auto-creates demo wave when no active wave exists', function () {
    expect(AdmissionWave::count())->toBe(0);

    $this->artisan('demo:simulate-traffic', [
        '--count' => 1,
        '--mode' => 'burst',
        '--status' => 'draft',
        '--auto-create-wave' => true,
    ])->assertSuccessful();

    expect(AdmissionWave::where('is_active', true)->count())->toBe(1);
    expect(Candidate::count())->toBe(1);
});

test('demo:wipe cleans up all demo data safely without affecting real users', function () {
    $realUser = User::factory()->create([
        'name' => 'Real Staff',
        'email' => 'staff@sentinel.id',
        'role' => 'staff',
    ]);

    AdmissionWave::create([
        'title' => 'Gelombang Uji',
        'academic_year' => '2026/2027',
        'start_date' => now()->subDay()->toDateString(),
        'end_date' => now()->addMonth()->toDateString(),
        'registration_fee' => 200000,
        'quota_target' => 50,
        'is_active' => true,
    ]);

    $this->artisan('demo:simulate-traffic', [
        '--count' => 3,
        '--mode' => 'burst',
        '--status' => 'submitted',
    ])->assertSuccessful();

    expect(User::where('email', 'like', '%@demo.spmb.com')->count())->toBe(3);
    expect(Candidate::count())->toBe(3);

    // Run wipe command with --force
    $this->artisan('demo:wipe', ['--force' => true])
        ->assertSuccessful();

    expect(User::where('email', 'like', '%@demo.spmb.com')->count())->toBe(0);
    expect(Candidate::count())->toBe(0);
    expect(User::find($realUser->id))->not->toBeNull();
});

test('it supports random status with backlog preset', function () {
    AdmissionWave::create([
        'title' => 'Gelombang Backlog',
        'academic_year' => '2026/2027',
        'start_date' => now()->subDay()->toDateString(),
        'end_date' => now()->addMonth()->toDateString(),
        'registration_fee' => 250000,
        'quota_target' => 50,
        'is_active' => true,
    ]);

    $this->artisan('demo:simulate-traffic', [
        '--count' => 5,
        '--mode' => 'burst',
        '--status' => 'random',
        '--preset' => 'backlog',
    ])->assertSuccessful();

    expect(Candidate::count())->toBe(5);
});
