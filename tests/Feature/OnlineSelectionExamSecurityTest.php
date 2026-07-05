<?php

use App\Models\AdmissionWave;
use App\Models\Candidate;
use App\Models\CandidateDocument;
use App\Models\Exam\ExamAttempt;
use App\Models\Exam\ExamAttemptAnswer;
use App\Models\Exam\ExamPackage;
use App\Models\Exam\ExamQuestion;
use App\Models\Exam\ExamSession;
use App\Models\Exam\ExamSessionCandidate;
use App\Models\Exam\ExamSubject;
use App\Models\Guardian;
use App\Models\HealthRecord;
use App\Models\Payment;
use App\Models\User;
use App\Services\CandidateStatus\CandidateStatusService;
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

    $candidate = Candidate::create(array_merge([
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
        'phone_number' => '081234567890',
        'religion' => 'Islam',
        'family_card_number' => fake()->unique()->numerify('################'),
        'postal_code' => '12345',
        'school_npsn' => '12345678',
        'program_choice' => 'Reguler',
        'status' => 'draft',
    ], $overrides));

    Guardian::create([
        'candidate_id' => $candidate->id,
        'candidate_code' => $candidate->candidate_code,
        'mother_name' => 'Ibu Kandidat',
        'income_type' => 'separate',
        'father_status' => 'hidup',
        'father_name' => 'Ayah Kandidat',
        'father_nik' => '3201010101010301',
        'father_place_of_birth' => 'Bandung',
        'father_date_of_birth' => '1980-01-01',
        'father_education' => 'sma_smk_sederajat',
        'father_job_ktp' => 'Wiraswasta',
        'father_job_actual' => 'Wiraswasta',
        'father_income_range' => 'tidak_ingin_memberitahu',
        'father_phone' => '081234567892',
        'mother_status' => 'hidup',
        'mother_nik' => '3201010101010302',
        'mother_place_of_birth' => 'Bandung',
        'mother_date_of_birth' => '1982-01-01',
        'mother_education' => 'sma_smk_sederajat',
        'mother_job_ktp' => 'Ibu Rumah Tangga',
        'mother_job_actual' => 'Ibu Rumah Tangga',
        'mother_income_range' => 'tidak_ingin_memberitahu',
        'mother_phone' => '081234567891',
        'mother_province' => 'Jawa Barat',
        'mother_city' => 'Bandung',
        'mother_district' => 'Coblong',
        'mother_village' => 'Dago',
        'mother_address' => 'Jl. Ujian',
        'mother_postal_code' => '12345',
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
        'bpjs_card_path' => "sentinel/candidates/{$candidate->candidate_code}/health/bpjs-card/bpjs.pdf",
    ]);

    foreach ([
        'photo_formal',
        'birth_certificate',
        'family_card',
        'parent_id_card',
        'graduation_certificate',
        'report_card',
        'parent_statement',
    ] as $type) {
        CandidateDocument::create([
            'candidate_id' => $candidate->id,
            'candidate_code' => $candidate->candidate_code,
            'doc_type' => $type,
            'doc_group' => CandidateDocument::getGroupForDocType($type) ?? 'identity',
            'original_filename' => "{$type}.pdf",
            'stored_filename' => "{$type}.pdf",
            'file_path' => "sentinel/candidates/{$candidate->candidate_code}/documents/{$type}.pdf",
            'mime_type' => 'application/pdf',
            'file_size_kb' => 1,
            'status' => 'verified',
        ]);
    }

    Payment::create([
        'candidate_id' => $candidate->id,
        'admission_wave_id' => $candidate->admission_wave_id,
        'candidate_code' => $candidate->candidate_code,
        'order_id' => $candidate->candidate_code.'-'.uniqid(),
        'payment_channel' => Payment::CHANNEL_TRANSFER,
        'base_amount' => 150000,
        'fee_amount' => 0,
        'final_amount' => 150000,
        'status' => Payment::STATUS_PAID,
        'manual_status' => Payment::MANUAL_VERIFIED,
        'proof_uploaded_at' => now(),
        'proof_attempt' => 1,
        'paid_at' => now(),
        'verified_at' => now(),
    ]);

    app(CandidateStatusService::class)->syncAfterEvent($candidate, 'test.exam_security_fixture');

    return $candidate->fresh();
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
