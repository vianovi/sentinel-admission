<?php

use App\Models\AdmissionWave;
use App\Models\Exam\ExamPackage;
use App\Models\Exam\ExamSession;
use App\Models\Exam\ExamSessionToken;
use App\Models\Exam\ExamSubject;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->admin = User::factory()->create(['role' => 'admin']);
    $this->subject = ExamSubject::create(['code' => 'SBJ01', 'name' => 'Matematika Dasar']);
    $this->package = ExamPackage::create([
        'exam_subject_id' => $this->subject->id,
        'title' => 'Paket Tryout SPMB 2026',
        'code' => 'PKG2026',
        'duration_minutes' => 90,
        'passing_score' => 75,
        'status' => 'published',
    ]);
    $this->wave = AdmissionWave::create([
        'title' => 'Gelombang 1 2026',
        'academic_year' => '2026/2027',
        'start_date' => now()->toDateString(),
        'end_date' => now()->addMonth()->toDateString(),
        'is_active' => true,
    ]);
});

test('admin can view public sessions index', function () {
    $this->actingAs($this->admin)
        ->get(route('admin.exams.public-sessions.index'))
        ->assertStatus(200)
        ->assertInertia(fn ($page) => $page->component('Dashboard/Admin/Exam/PublicSessions'));
});

test('admin can create a public exam session with valid enum and token', function () {
    $response = $this->actingAs($this->admin)
        ->post(route('admin.exams.public-sessions.store'), [
            'exam_package_id' => $this->package->id,
            'admission_wave_id' => $this->wave->id,
            'title' => 'Sesi Tryout Publik 2026',
            'description' => 'Keterangan Ujian',
            'instructions' => 'Petunjuk Ujian',
            'opens_at' => now()->toIso8601String(),
            'closes_at' => now()->addHours(3)->toIso8601String(),
            'duration_minutes' => 90,
            'passing_score' => 75,
            'max_attempts' => 1,
            'show_result_to_candidate' => false,
            'status' => 'published',
        ]);

    $response->assertRedirect();

    $session = ExamSession::where('title', 'Sesi Tryout Publik 2026')->first();
    expect($session)->not->toBeNull();
    expect($session->is_public)->toBeTrue();
    expect($session->public_access_type)->toBe('token_required');
    expect($session->duration_minutes)->toBe(90);

    // Initial proctor token automatically created
    $token = ExamSessionToken::where('exam_session_id', $session->id)->first();
    expect($token)->not->toBeNull();
    expect(strlen($token->token))->toBe(6);
});

test('admin can update a public exam session', function () {
    $session = ExamSession::create([
        'exam_package_id' => $this->package->id,
        'title' => 'Judul Lama',
        'status' => 'published',
        'opens_at' => now(),
        'closes_at' => now()->addHour(),
        'duration_minutes' => 60,
        'passing_score' => 70,
        'is_public' => true,
        'public_access_type' => 'token_required',
    ]);

    $this->actingAs($this->admin)
        ->put(route('admin.exams.public-sessions.update', $session), [
            'exam_package_id' => $this->package->id,
            'title' => 'Judul Baru Diperbarui',
            'opens_at' => now()->toIso8601String(),
            'closes_at' => now()->addHours(4)->toIso8601String(),
            'duration_minutes' => 120,
            'passing_score' => 80,
            'max_attempts' => 2,
            'status' => 'published',
        ])
        ->assertRedirect();

    $session->refresh();
    expect($session->title)->toBe('Judul Baru Diperbarui');
    expect($session->duration_minutes)->toBe(120);
    expect((float) $session->passing_score)->toBe(80.0);
});

test('admin can toggle result visibility, rotate token, and delete public session', function () {
    $session = ExamSession::create([
        'exam_package_id' => $this->package->id,
        'title' => 'Sesi Publik Test',
        'status' => 'published',
        'opens_at' => now(),
        'closes_at' => now()->addHour(),
        'duration_minutes' => 60,
        'passing_score' => 70,
        'is_public' => true,
        'public_access_type' => 'token_required',
        'show_result_to_candidate' => false,
    ]);

    $token = ExamSessionToken::create([
        'exam_session_id' => $session->id,
        'token' => 'OLDTOK',
        'type' => 'multi_use',
        'max_uses' => 0,
    ]);

    // 1. Toggle results
    $this->actingAs($this->admin)
        ->post(route('admin.exams.public-sessions.toggle-results', $session))
        ->assertRedirect();
    expect($session->fresh()->show_result_to_candidate)->toBeTrue();

    // 2. Rotate token
    $this->actingAs($this->admin)
        ->post(route('admin.exams.public-sessions.tokens.rotate', $token))
        ->assertRedirect();
    expect($token->fresh()->isExpired())->toBeTrue();

    $newToken = ExamSessionToken::where('exam_session_id', $session->id)->latest('id')->first();
    expect($newToken->id)->not->toBe($token->id);

    // 3. Delete session
    $this->actingAs($this->admin)
        ->delete(route('admin.exams.public-sessions.destroy', $session))
        ->assertRedirect();
    expect(ExamSession::find($session->id))->toBeNull();
});

test('rotate-tokens command auto rotates tokens for active public sessions', function () {
    $session = ExamSession::create([
        'exam_package_id' => $this->package->id,
        'title' => 'Sesi Auto Rotate',
        'status' => 'published',
        'opens_at' => now()->subMinutes(10),
        'closes_at' => now()->addHours(2),
        'duration_minutes' => 60,
        'passing_score' => 70,
        'is_public' => true,
        'public_access_type' => 'token_required',
    ]);

    $oldToken = ExamSessionToken::create([
        'exam_session_id' => $session->id,
        'token' => 'OLD123',
        'type' => 'multi_use',
        'created_at' => now()->subMinutes(20),
    ]);

    $this->artisan('exam:rotate-tokens', ['--force' => true])
        ->assertExitCode(0);

    expect($oldToken->fresh()->isExpired())->toBeTrue();
    $latestToken = ExamSessionToken::where('exam_session_id', $session->id)->latest('id')->first();
    expect($latestToken->id)->not->toBe($oldToken->id);
    expect(strlen($latestToken->token))->toBe(6);
});

test('sync-expired command auto submits candidate attempts whose time limit expired', function () {
    $session = ExamSession::create([
        'exam_package_id' => $this->package->id,
        'title' => 'Sesi Auto Sync',
        'status' => 'published',
        'opens_at' => now()->subHour(),
        'closes_at' => now()->addHour(),
        'duration_minutes' => 30,
        'passing_score' => 70,
        'is_public' => true,
        'public_access_type' => 'token_required',
    ]);

    $attempt = \App\Models\Exam\ExamAttempt::create([
        'exam_session_id' => $session->id,
        'exam_package_id' => $this->package->id,
        'guest_name' => 'Budi Santoso',
        'guest_school' => 'SD Negeri 1',
        'status' => \App\Models\Exam\ExamAttempt::STATUS_IN_PROGRESS,
        'started_at' => now()->subMinutes(40),
        'expires_at' => now()->subMinutes(10),
        'last_activity_at' => now()->subMinutes(15),
        'total_questions' => 5,
        'blank_questions' => 5,
        'max_score' => 100,
        'passing_score' => 70,
    ]);

    $this->artisan('exam:sync-expired')
        ->assertExitCode(0);

    $attempt->refresh();
    expect($attempt->status)->toBe(\App\Models\Exam\ExamAttempt::STATUS_AUTO_SUBMITTED);
});

test('proctor can force submit attempt and reset violations', function () {
    $session = ExamSession::create([
        'exam_package_id' => $this->package->id,
        'title' => 'Sesi Control Proktor',
        'status' => 'published',
        'opens_at' => now()->subMinutes(10),
        'closes_at' => now()->addHour(),
        'duration_minutes' => 60,
        'passing_score' => 70,
        'is_public' => true,
        'public_access_type' => 'token_required',
    ]);

    $attempt = \App\Models\Exam\ExamAttempt::create([
        'exam_session_id' => $session->id,
        'exam_package_id' => $this->package->id,
        'guest_name' => 'Ahmad Proktor',
        'status' => \App\Models\Exam\ExamAttempt::STATUS_IN_PROGRESS,
        'started_at' => now()->subMinutes(10),
        'expires_at' => now()->addMinutes(50),
        'violations_count' => 3,
        'total_questions' => 5,
        'blank_questions' => 5,
        'max_score' => 100,
        'passing_score' => 70,
    ]);

    // 1. Reset violations
    $this->actingAs($this->admin)
        ->post(route('admin.exams.public-sessions.attempts.reset-violations', $attempt))
        ->assertRedirect();
    expect($attempt->fresh()->violations_count)->toBe(0);

    // 2. Force submit
    $this->actingAs($this->admin)
        ->post(route('admin.exams.public-sessions.attempts.force-submit', $attempt))
        ->assertRedirect();
    expect($attempt->fresh()->status)->toBe(\App\Models\Exam\ExamAttempt::STATUS_AUTO_SUBMITTED);
});
