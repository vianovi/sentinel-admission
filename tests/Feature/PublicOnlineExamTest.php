<?php

use App\Models\Exam\ExamAttempt;
use App\Models\Exam\ExamPackage;
use App\Models\Exam\ExamQuestion;
use App\Models\Exam\ExamSession;
use App\Models\Exam\ExamSessionToken;
use App\Models\Exam\ExamSubject;
use App\Models\User;
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
        'exam_package_id' => $package->id,
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

    // 2. Generate Access Token
    $token = ExamSessionToken::create([
        'exam_session_id' => $session->id,
        'token' => 'TESTOK',
        'type' => 'single_use',
        'max_uses' => 1,
        'used_count' => 0,
        'is_active' => true,
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
        'guest_email' => 'guest@example.com',
        'guest_phone' => '08123456789',
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
