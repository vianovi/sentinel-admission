<?php

use App\Models\AdmissionWave;
use App\Models\Candidate;
use App\Models\Exam\ExamAttempt;
use App\Models\Exam\ExamAttemptAnswer;
use App\Models\Exam\ExamPackage;
use App\Models\Exam\ExamQuestion;
use App\Models\Exam\ExamSession;
use App\Models\Exam\ExamSessionCandidate;
use App\Models\Exam\ExamSubject;
use App\Models\User;
use App\Services\Exam\ExamScoringService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function examSecurityWave(): AdmissionWave
{
    return AdmissionWave::create([
        'title' => 'Gelombang Ujian',
        'academic_year' => '2026/2027',
        'start_date' => now()->subDay()->toDateString(),
        'end_date' => now()->addMonth()->toDateString(),
        'registration_fee' => 150000,
        'quota_target' => 100,
        'is_active' => true,
    ]);
}

function examSecurityCandidate(?User $user = null, array $overrides = []): Candidate
{
    $user ??= User::factory()->create([
        'role' => 'candidate',
        'email' => 'exam-candidate-'.uniqid().'@gmail.com',
    ]);

    return Candidate::create(array_merge([
        'user_id' => $user->id,
        'admission_wave_id' => examSecurityWave()->id,
        'candidate_code' => 'CDT-'.strtoupper(substr(uniqid(), -6)),
        'nisn' => fake()->unique()->numerify('##########'),
        'nik' => fake()->unique()->numerify('################'),
        'full_name' => 'Kandidat Ujian',
        'gender' => 'L',
        'place_of_birth' => 'Bandung',
        'date_of_birth' => '2010-01-01',
        'school_origin' => 'SMP Test',
        'program_choice' => 'Reguler',
        'status' => 'verified',
    ], $overrides));
}

function examSecurityPackage(): ExamPackage
{
    $admin = User::factory()->admin()->create([
        'email' => 'exam-admin-'.uniqid().'@example.test',
    ]);

    $subject = ExamSubject::create([
        'name' => 'Akademik',
        'code' => 'AKD-'.strtoupper(substr(uniqid(), -4)),
        'is_active' => true,
    ]);

    return ExamPackage::create([
        'exam_subject_id' => $subject->id,
        'created_by' => $admin->id,
        'title' => 'Paket Ujian',
        'code' => 'PKG-'.strtoupper(substr(uniqid(), -4)),
        'duration_minutes' => 60,
        'passing_score' => 50,
        'max_attempts' => 1,
        'status' => ExamPackage::STATUS_PUBLISHED,
        'published_at' => now(),
    ]);
}

function examSecuritySession(ExamPackage $package, array $overrides = []): ExamSession
{
    return ExamSession::create(array_merge([
        'exam_package_id' => $package->id,
        'title' => 'Sesi Ujian',
        'opens_at' => now()->subMinute(),
        'closes_at' => now()->addHour(),
        'duration_minutes' => 60,
        'passing_score' => 50,
        'max_attempts' => 1,
        'status' => ExamSession::STATUS_PUBLISHED,
    ], $overrides));
}

function examSecurityQuestion(ExamPackage $package, array $overrides = []): ExamQuestion
{
    return ExamQuestion::create(array_merge([
        'exam_subject_id' => $package->exam_subject_id,
        'exam_package_id' => $package->id,
        'question_text' => 'Berapa hasil 2 + 2?',
        'options' => [
            'A' => '3',
            'B' => '4',
            'C' => '5',
            'D' => '6',
            'E' => null,
        ],
        'correct_answer' => 'B',
        'point' => 1,
        'difficulty' => 'easy',
        'explanation' => 'Rahasia kunci jawaban.',
        'is_active' => true,
        'sort_order' => 1,
        'question_hash' => hash('sha256', uniqid('question', true)),
    ], $overrides));
}

function examSecurityAssignment(ExamSession $session, Candidate $candidate): ExamSessionCandidate
{
    return ExamSessionCandidate::create([
        'exam_session_id' => $session->id,
        'candidate_id' => $candidate->id,
        'status' => ExamSessionCandidate::STATUS_ELIGIBLE,
        'assigned_at' => now(),
    ]);
}

function examSecurityAttempt(ExamSession $session, ExamPackage $package, ExamSessionCandidate $assignment, Candidate $candidate, array $questionIds, array $overrides = []): ExamAttempt
{
    return ExamAttempt::create(array_merge([
        'exam_session_id' => $session->id,
        'exam_session_candidate_id' => $assignment->id,
        'exam_package_id' => $package->id,
        'candidate_id' => $candidate->id,
        'attempt_number' => 1,
        'status' => ExamAttempt::STATUS_IN_PROGRESS,
        'started_at' => now()->subMinute(),
        'expires_at' => now()->addHour(),
        'last_activity_at' => now(),
        'question_order' => $questionIds,
        'total_questions' => count($questionIds),
        'blank_questions' => count($questionIds),
        'max_score' => count($questionIds),
        'passing_score' => $session->passing_score,
    ], $overrides));
}

it('prevents a candidate from opening another candidates attempt', function () {
    $ownerUser = User::factory()->create(['role' => 'candidate']);
    $otherUser = User::factory()->create(['role' => 'candidate']);
    $owner = examSecurityCandidate($ownerUser);
    examSecurityCandidate($otherUser);
    $package = examSecurityPackage();
    $session = examSecuritySession($package);
    $question = examSecurityQuestion($package);
    $assignment = examSecurityAssignment($session, $owner);
    $attempt = examSecurityAttempt($session, $package, $assignment, $owner, [$question->id]);

    $this->actingAs($otherUser)
        ->get("/dashboard/seleksi/attempts/{$attempt->id}")
        ->assertForbidden();
});

it('does not expose answer keys or explanations to the candidate attempt page', function () {
    $user = User::factory()->create(['role' => 'candidate']);
    $candidate = examSecurityCandidate($user);
    $package = examSecurityPackage();
    $session = examSecuritySession($package);
    $question = examSecurityQuestion($package);
    $assignment = examSecurityAssignment($session, $candidate);
    $attempt = examSecurityAttempt($session, $package, $assignment, $candidate, [$question->id]);

    $response = $this->actingAs($user)
        ->get("/dashboard/seleksi/attempts/{$attempt->id}");

    $response->assertOk();
    $response->assertDontSee('correct_answer');
    $response->assertDontSee('Rahasia kunci jawaban');
});

it('rejects autosave after the attempt has expired and auto submits saved answers', function () {
    $user = User::factory()->create(['role' => 'candidate']);
    $candidate = examSecurityCandidate($user);
    $package = examSecurityPackage();
    $session = examSecuritySession($package);
    $question = examSecurityQuestion($package);
    $assignment = examSecurityAssignment($session, $candidate);
    $attempt = examSecurityAttempt($session, $package, $assignment, $candidate, [$question->id], [
        'expires_at' => now()->subSecond(),
    ]);

    $this->actingAs($user)
        ->postJson("/dashboard/seleksi/attempts/{$attempt->id}/answers", [
            'question_id' => $question->id,
            'selected_option' => 'B',
            'is_marked_for_review' => false,
        ])
        ->assertStatus(423);

    expect($attempt->fresh()->status)->toBe(ExamAttempt::STATUS_AUTO_SUBMITTED);
});

it('calculates scores from server-side answer keys only', function () {
    $candidate = examSecurityCandidate();
    $package = examSecurityPackage();
    $session = examSecuritySession($package);
    $first = examSecurityQuestion($package, [
        'question_text' => 'Pertanyaan benar',
        'correct_answer' => 'A',
        'options' => ['A' => 'Benar', 'B' => 'Salah', 'C' => 'Salah', 'D' => 'Salah', 'E' => null],
        'question_hash' => hash('sha256', 'first'.uniqid()),
    ]);
    $second = examSecurityQuestion($package, [
        'question_text' => 'Pertanyaan salah',
        'correct_answer' => 'D',
        'options' => ['A' => 'Salah', 'B' => 'Salah', 'C' => 'Salah', 'D' => 'Benar', 'E' => null],
        'question_hash' => hash('sha256', 'second'.uniqid()),
    ]);
    $assignment = examSecurityAssignment($session, $candidate);
    $attempt = examSecurityAttempt($session, $package, $assignment, $candidate, [$first->id, $second->id], [
        'max_score' => 2,
    ]);

    ExamAttemptAnswer::create([
        'exam_attempt_id' => $attempt->id,
        'exam_question_id' => $first->id,
        'selected_option' => 'A',
        'answered_at' => now(),
        'saved_at' => now(),
    ]);
    ExamAttemptAnswer::create([
        'exam_attempt_id' => $attempt->id,
        'exam_question_id' => $second->id,
        'selected_option' => 'A',
        'answered_at' => now(),
        'saved_at' => now(),
    ]);

    $scored = app(ExamScoringService::class)->score($attempt);

    expect((float) $scored->raw_score)->toBe(1.0)
        ->and((float) $scored->max_score)->toBe(2.0)
        ->and((float) $scored->percentage_score)->toBe(50.0)
        ->and($scored->correct_answers)->toBe(1)
        ->and($scored->wrong_answers)->toBe(1)
        ->and($scored->passed)->toBeTrue();
});
