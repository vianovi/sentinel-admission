<?php

use App\Models\Exam\ExamAttempt;
use App\Models\Exam\ExamPackage;
use App\Models\Exam\ExamQuestion;
use App\Models\Exam\ExamSession;
use App\Models\Exam\ExamSessionToken;
use App\Models\Exam\ExamSubject;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('public exam token validation and guest attempt execution flow', function () {
    // 1. Setup Subject, Session and Questions
    $subject = ExamSubject::create([
        'code' => 'UMUM01',
        'name' => 'Pengetahuan Umum',
    ]);

    $package = ExamPackage::create([
        'exam_subject_id' => $subject->id,
        'title' => 'Paket Ujian Umum Test',
        'duration_minutes' => 60,
        'passing_score' => 70,
        'max_attempts' => 1,
        'status' => 'published',
    ]);

    $question = ExamQuestion::create([
        'exam_subject_id' => $subject->id,
        'exam_package_id' => $package->id,
        'question_text' => 'Berapa hasil 1 + 1?',
        'options' => ['A' => '1', 'B' => '2', 'C' => '3', 'D' => '4'],
        'correct_answer' => 'B',
        'point' => 10,
        'difficulty' => 'easy',
    ]);

    $session = ExamSession::create([
        'title' => 'Sesi Ujian Publik 2026',
        'status' => 'published',
        'opens_at' => now()->subHour(),
        'closes_at' => now()->addHours(2),
        'duration_minutes' => 60,
        'passing_score' => 70,
        'max_attempts' => 1,
        'is_public' => true,
        'public_access_type' => 'token_required',
    ]);
    $session->packages()->attach($package->id);

    // 2. Generate Access Token
    $token = ExamSessionToken::create([
        'exam_session_id' => $session->id,
        'token' => 'TESTOK',
        'type' => 'single_use',
        'max_uses' => 1,
        'used_count' => 0,
    ]);

    // 3. Verify Public Landing Page with Token
    $this->get(route('exam.public.landing', ['token' => 'TESTOK']))
        ->assertStatus(200)
        ->assertInertia(fn ($page) => $page
            ->component('Public/Exam/Landing')
            ->where('token', 'TESTOK')
            ->where('token_valid', true)
        );

    // 4. Start Guest Attempt
    $response = $this->post(route('exam.public.start', ['token' => 'TESTOK']), [
        'guest_name' => 'John Guest',
        'guest_school' => 'SMA N 1 Jakarta',
        'guest_email' => 'guest@example.com',
        'guest_phone' => '08123456789',
        'package_id' => $package->id,
    ]);

    $response->assertRedirect();
    $attempt = ExamAttempt::where('guest_name', 'John Guest')->first();
    expect($attempt)->not->toBeNull();
    expect($attempt->candidate_id)->toBeNull();
    expect($attempt->guest_email)->toBe('guest@example.com');
    expect($token->fresh()->used_count)->toBe(1);

    // 5. Access Attempt Page with Header
    $headers = ['X-Guest-Exam-Token' => $attempt->guest_session_token];
    $this->withHeaders($headers)
        ->get(route('exam.public.attempts.show', ['attempt' => $attempt->id]))
        ->assertStatus(200)
        ->assertInertia(fn ($page) => $page
            ->component('Public/Exam/AttemptShow')
            ->where('participant.name', 'John Guest')
        );

    // 6. Save Answer
    $this->withHeaders($headers)
        ->postJson(route('exam.public.attempts.save-answer', ['attempt' => $attempt->id]), [
            'question_id' => $question->id,
            'selected_option' => 'B',
            'is_marked_for_review' => false,
        ])
        ->assertStatus(200)
        ->assertJsonPath('answer.selected_option', 'B');

    // 6b. Log Security Violation (Fullscreen Exit)
    $this->withHeaders($headers)
        ->postJson(route('exam.public.attempts.violation', ['attempt' => $attempt->id]), [
            'type' => 'exit_fullscreen',
        ])
        ->assertStatus(200)
        ->assertJsonPath('violations_count', 1);

    // 7. Submit Exam
    $this->withHeaders($headers)
        ->post(route('exam.public.attempts.submit', ['attempt' => $attempt->id]))
        ->assertRedirect(route('exam.public.attempts.show', ['attempt' => $attempt->id]));

    $attempt->refresh();
    expect($attempt->status)->toBe('submitted');
    expect((float) $attempt->percentage_score)->toBe(100.0);
    expect($attempt->passed)->toBeTrue();
});

test('guest auto resume flow for active in progress session', function () {
    $subject = ExamSubject::create([
        'code' => 'UMUM02',
        'name' => 'Matematika Dasar',
    ]);

    $package = ExamPackage::create([
        'exam_subject_id' => $subject->id,
        'title' => 'Paket Ujian Resumption',
        'duration_minutes' => 60,
        'passing_score' => 70,
        'max_attempts' => 1,
        'status' => 'published',
    ]);

    ExamQuestion::create([
        'exam_subject_id' => $subject->id,
        'exam_package_id' => $package->id,
        'question_text' => 'Berapa hasil 2 + 2?',
        'options' => ['A' => '2', 'B' => '4', 'C' => '6'],
        'correct_answer' => 'B',
        'point' => 10,
        'difficulty' => 'easy',
    ]);

    $session = ExamSession::create([
        'title' => 'Sesi Ujian Auto Resume 2026',
        'status' => 'published',
        'opens_at' => now()->subHour(),
        'closes_at' => now()->addHours(2),
        'duration_minutes' => 60,
        'passing_score' => 70,
        'max_attempts' => 1,
        'is_public' => true,
        'public_access_type' => 'token_required',
    ]);
    $session->packages()->attach($package->id);

    $token = ExamSessionToken::create([
        'exam_session_id' => $session->id,
        'token' => 'RESUME1',
        'type' => 'single_use',
        'max_uses' => 1,
        'used_count' => 0,
    ]);

    // 1. Start initial attempt
    $this->post(route('exam.public.start', ['token' => 'RESUME1']), [
        'guest_name' => 'Budi Santoso',
        'guest_school' => 'SMP Negeri 1 Surabaya',
        'package_id' => $package->id,
    ]);

    $attempt = ExamAttempt::where('guest_name', 'Budi Santoso')->first();
    expect($attempt)->not->toBeNull();
    expect($attempt->status)->toBe('in_progress');

    // 2. Resume active attempt via identity matching
    $response = $this->post(route('exam.public.attempts.resume', ['attempt' => $attempt->id]), [
        'guest_name' => 'Budi Santoso',
        'guest_school' => 'SMP Negeri 1 Surabaya',
    ]);

    $response->assertRedirect(route('exam.public.attempts.show', ['attempt' => $attempt->id]));
    $response->assertCookie('guest_exam_token');

    // 3. Reject if identity mismatch
    $badResponse = $this->post(route('exam.public.attempts.resume', ['attempt' => $attempt->id]), [
        'guest_name' => 'Budi Mismatch',
        'guest_school' => 'SMP Lain',
    ]);

    $badResponse->assertSessionHasErrors(['token']);
});

test('public exam prevents multiple submissions with same guest name', function () {
    $subject = ExamSubject::create([
        'code' => 'UMUM02',
        'name' => 'Pengetahuan Umum 2',
    ]);

    $package = ExamPackage::create([
        'exam_subject_id' => $subject->id,
        'title' => 'Paket Ujian Anti Cheat',
        'duration_minutes' => 60,
        'passing_score' => 70,
        'max_attempts' => 1,
        'status' => 'published',
    ]);

    ExamQuestion::create([
        'exam_subject_id' => $subject->id,
        'exam_package_id' => $package->id,
        'question_text' => 'Berapa 2 + 2?',
        'options' => ['A' => '2', 'B' => '4'],
        'correct_answer' => 'B',
        'point' => 10,
        'difficulty' => 'easy',
    ]);

    $session = ExamSession::create([
        'title' => 'Sesi Ujian Anti Cheat Multi Use',
        'status' => 'published',
        'opens_at' => now()->subHour(),
        'closes_at' => now()->addHours(2),
        'duration_minutes' => 60,
        'passing_score' => 70,
        'max_attempts' => 1,
        'is_public' => true,
        'public_access_type' => 'token_required',
    ]);
    $session->packages()->attach($package->id);

    // Multi-use token for a whole exam room
    $token = ExamSessionToken::create([
        'exam_session_id' => $session->id,
        'token' => 'ROOM101',
        'type' => 'multi_use',
        'max_uses' => 50,
        'used_count' => 0,
    ]);

    // 1. First attempt starts and completes/submits
    $this->post(route('exam.public.start', ['token' => 'ROOM101']), [
        'guest_name' => 'Ahmad Fauzi',
        'guest_school' => 'SMP Muhammadiyah 1',
        'package_id' => $package->id,
    ])->assertRedirect();

    $attempt = ExamAttempt::where('guest_name', 'Ahmad Fauzi')->first();
    expect($attempt)->not->toBeNull();

    // Mark as submitted
    $attempt->update([
        'status' => ExamAttempt::STATUS_SUBMITTED,
        'submitted_at' => now(),
    ]);

    // 2. Candidate tries to start a second attempt with exact same name -> MUST BE REJECTED
    $secondTry = $this->post(route('exam.public.start', ['token' => 'ROOM101']), [
        'guest_name' => 'Ahmad Fauzi',
        'guest_school' => 'SMP Muhammadiyah 1',
        'package_id' => $package->id,
    ]);

    $secondTry->assertSessionHasErrors(['guest_name']);

    // 3. Candidate tries to bypass by using lowercase and irregular spacing -> MUST BE REJECTED
    $thirdTry = $this->post(route('exam.public.start', ['token' => 'ROOM101']), [
        'guest_name' => '  ahmad   fauzi  ',
        'guest_school' => 'smp muhammadiyah 1',
        'package_id' => $package->id,
    ]);

    $thirdTry->assertSessionHasErrors(['guest_name']);

    // 4. Other student with different name can start successfully
    $otherStudent = $this->post(route('exam.public.start', ['token' => 'ROOM101']), [
        'guest_name' => 'Fatimah Az-Zahra',
        'guest_school' => 'MTs Negeri 1',
        'package_id' => $package->id,
    ]);

    $otherStudent->assertRedirect();
    expect(ExamAttempt::where('guest_name', 'Fatimah Az-Zahra')->exists())->toBeTrue();
});
