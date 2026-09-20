<?php

namespace App\Services\Exam;

use App\Exceptions\Exam\ExamAccessException;
use App\Models\Candidate;
use App\Models\Exam\ExamAttempt;
use App\Models\Exam\ExamAttemptAnswer;
use App\Models\Exam\ExamQuestion;
use App\Models\Exam\ExamSessionCandidate;
use App\Models\Exam\ExamSessionToken;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ExamAttemptService
{
    public function __construct(
        private readonly ExamScoringService $scoring,
        private readonly ExamAuditLogger $audit
    ) {}

    public function startPublicAttempt(
        ExamSessionToken $token,
        string $guestName,
        string $guestSchool,
        ?string $guestEmail = null,
        ?string $guestPhone = null,
        ?Request $request = null
    ): ExamAttempt {
        return DB::transaction(function () use ($token, $guestName, $guestSchool, $guestEmail, $guestPhone, $request) {
            $token = ExamSessionToken::query()
                ->with(['session.package.activeQuestions'])
                ->whereKey($token->id)
                ->lockForUpdate()
                ->firstOrFail();

            if (! $token->isValid()) {
                throw new ExamAccessException('NOT_ELIGIBLE');
            }

            $session = $token->session;

            if (! $session || ! $session->is_public) {
                throw new ExamAccessException('NOT_ELIGIBLE');
            }

            if (! $session->isOpenForStart()) {
                throw new ExamAccessException('NOT_OPEN');
            }

            $package = $session->package;

            if (! $package || ! $package->isPublished()) {
                throw new ExamAccessException('PACKAGE_NOT_READY');
            }

            $questions = $package->activeQuestions()->get(['id', 'point']);

            if ($questions->isEmpty()) {
                throw new ExamAccessException('NO_QUESTIONS');
            }

            // AUTO-RESUME: Check if guest already has an in-progress attempt for this session
            $existingAttempt = ExamAttempt::query()
                ->where('exam_session_id', $session->id)
                ->where('guest_name', $guestName)
                ->where('guest_school', $guestSchool)
                ->where('status', ExamAttempt::STATUS_IN_PROGRESS)
                ->latest('id')
                ->first();

            if ($existingAttempt) {
                $freshAttempt = $this->syncExpired($existingAttempt, $request);

                if ($freshAttempt->isInProgress()) {
                    if ($guestEmail || $guestPhone) {
                        $freshAttempt->update([
                            'guest_email' => $guestEmail ?? $freshAttempt->guest_email,
                            'guest_phone' => $guestPhone ?? $freshAttempt->guest_phone,
                            'last_activity_at' => now(),
                        ]);
                    }

                    return $freshAttempt->fresh(['session', 'package']);
                }
            }

            $questionIds = $questions->pluck('id')->values();

            if ($package->randomize_questions) {
                $questionIds = $questionIds->shuffle()->values();
            }

            $startedAt = now();
            $durationExpiry = $startedAt->copy()->addMinutes($session->duration_minutes);
            $expiresAt = $durationExpiry->lt($session->closes_at) ? $durationExpiry : $session->closes_at;
            $guestSessionToken = Str::random(40);

            $attempt = ExamAttempt::create([
                'exam_session_id' => $session->id,
                'exam_session_candidate_id' => null,
                'exam_package_id' => $package->id,
                'candidate_id' => null,
                'exam_session_token_id' => $token->id,
                'guest_name' => $guestName,
                'guest_school' => $guestSchool,
                'guest_email' => $guestEmail,
                'guest_phone' => $guestPhone,
                'guest_session_token' => $guestSessionToken,
                'attempt_number' => 1,
                'status' => ExamAttempt::STATUS_IN_PROGRESS,
                'started_at' => $startedAt,
                'expires_at' => $expiresAt,
                'last_activity_at' => $startedAt,
                'question_order' => $questionIds->all(),
                'total_questions' => $questions->count(),
                'blank_questions' => $questions->count(),
                'max_score' => (float) $questions->sum(fn (ExamQuestion $question) => (float) $question->point),
                'passing_score' => (float) $session->passing_score,
            ]);

            $token->increment('used_count');

            $this->audit->log('public_attempt_started', [
                'candidate_id' => null,
                'exam_session_id' => $session->id,
                'exam_package_id' => $package->id,
                'exam_attempt_id' => $attempt->id,
                'metadata' => [
                    'token' => $token->token,
                    'guest_name' => $guestName,
                    'expires_at' => $attempt->expires_at?->toISOString(),
                ],
            ], $request);

            return $attempt->fresh(['session', 'package']);
        });
    }

    public function start(ExamSessionCandidate $assignment, Candidate $candidate, ?Request $request = null): ExamAttempt
    {
        return DB::transaction(function () use ($assignment, $candidate, $request) {
            $assignment = ExamSessionCandidate::query()
                ->with(['session.package.activeQuestions', 'attempts'])
                ->whereKey($assignment->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($assignment->candidate_id !== $candidate->id) {
                throw new ExamAccessException('NOT_ELIGIBLE');
            }

            if ($assignment->status === ExamSessionCandidate::STATUS_BLOCKED) {
                throw new ExamAccessException('BLOCKED');
            }

            if (! $assignment->isEligible()) {
                throw new ExamAccessException('NOT_ELIGIBLE');
            }

            $session = $assignment->session;
            $package = $session->package;

            if (! $session->isOpenForStart()) {
                throw new ExamAccessException('NOT_OPEN');
            }

            if (! $package || ! $package->isPublished()) {
                throw new ExamAccessException('PACKAGE_NOT_READY');
            }

            $existingAttempt = $assignment->attempts
                ->where('status', ExamAttempt::STATUS_IN_PROGRESS)
                ->sortByDesc('id')
                ->first();

            if ($existingAttempt) {
                $freshAttempt = $this->syncExpired($existingAttempt, $request);

                if ($freshAttempt->isInProgress()) {
                    return $freshAttempt;
                }
            }

            $countedAttempts = ExamAttempt::query()
                ->where('exam_session_candidate_id', $assignment->id)
                ->whereNotIn('status', [
                    ExamAttempt::STATUS_CANCELLED,
                    ExamAttempt::STATUS_INVALIDATED,
                ])
                ->count();

            if ($countedAttempts >= $session->max_attempts) {
                throw new ExamAccessException('MAX_ATTEMPTS');
            }

            $questions = $package->activeQuestions()->get(['id', 'point']);

            if ($questions->isEmpty()) {
                throw new ExamAccessException('NO_QUESTIONS');
            }

            $questionIds = $questions->pluck('id')->values();

            if ($package->randomize_questions) {
                $questionIds = $questionIds->shuffle()->values();
            }

            $startedAt = now();
            $durationExpiry = $startedAt->copy()->addMinutes($session->duration_minutes);
            $expiresAt = $durationExpiry->lt($session->closes_at) ? $durationExpiry : $session->closes_at;

            $attempt = ExamAttempt::create([
                'exam_session_id' => $session->id,
                'exam_session_candidate_id' => $assignment->id,
                'exam_package_id' => $package->id,
                'candidate_id' => $candidate->id,
                'attempt_number' => $countedAttempts + 1,
                'status' => ExamAttempt::STATUS_IN_PROGRESS,
                'started_at' => $startedAt,
                'expires_at' => $expiresAt,
                'last_activity_at' => $startedAt,
                'question_order' => $questionIds->all(),
                'total_questions' => $questions->count(),
                'blank_questions' => $questions->count(),
                'max_score' => (float) $questions->sum(fn (ExamQuestion $question) => (float) $question->point),
                'passing_score' => (float) $session->passing_score,
            ]);

            $this->audit->log('attempt_started', [
                'candidate_id' => $candidate->id,
                'exam_session_id' => $session->id,
                'exam_package_id' => $package->id,
                'exam_attempt_id' => $attempt->id,
                'metadata' => [
                    'attempt_number' => $attempt->attempt_number,
                    'expires_at' => $attempt->expires_at?->toISOString(),
                ],
            ], $request);

            return $attempt->fresh(['session', 'package']);
        });
    }

    public function syncExpired(ExamAttempt $attempt, ?Request $request = null): ExamAttempt
    {
        $attempt = $attempt->fresh(['session', 'package']) ?? $attempt;

        if ($attempt->isInProgress() && $attempt->isExpiredByTime()) {
            return $this->submit($attempt, true, $request);
        }

        return $attempt;
    }

    public function saveAnswer(
        ExamAttempt $attempt,
        int $questionId,
        ?string $selectedOption,
        bool $markedForReview,
        ?Request $request = null
    ): ExamAttemptAnswer {
        $freshAttempt = $attempt->fresh();

        if ($freshAttempt?->isInProgress() && $freshAttempt->isExpiredByTime()) {
            $this->submit($freshAttempt, true, $request);
            throw new ExamAccessException('ATTEMPT_EXPIRED');
        }

        return DB::transaction(function () use ($attempt, $questionId, $selectedOption, $markedForReview, $request) {
            $attempt = ExamAttempt::query()
                ->whereKey($attempt->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($attempt->isExpiredByTime()) {
                throw new ExamAccessException('ATTEMPT_EXPIRED');
            }

            if (! $attempt->isInProgress()) {
                throw new ExamAccessException('ATTEMPT_LOCKED');
            }

            $questionIds = collect($attempt->question_order ?? [])->map(fn ($id) => (int) $id);

            if (! $questionIds->contains($questionId)) {
                throw new ExamAccessException('QUESTION_NOT_FOUND');
            }

            $question = ExamQuestion::query()
                ->whereKey($questionId)
                ->where('exam_package_id', $attempt->exam_package_id)
                ->where('is_active', true)
                ->first();

            if (! $question) {
                throw new ExamAccessException('QUESTION_NOT_FOUND');
            }

            $selectedOption = $selectedOption ? strtoupper($selectedOption) : null;

            if ($selectedOption !== null) {
                $options = collect($question->options ?? []);

                if (! in_array($selectedOption, ['A', 'B', 'C', 'D', 'E'], true)
                    || blank($options->get($selectedOption))) {
                    throw new ExamAccessException('INVALID_OPTION');
                }
            }

            $answer = ExamAttemptAnswer::updateOrCreate(
                [
                    'exam_attempt_id' => $attempt->id,
                    'exam_question_id' => $question->id,
                ],
                [
                    'selected_option' => $selectedOption,
                    'is_marked_for_review' => $markedForReview,
                    'answered_at' => $selectedOption ? now() : null,
                    'saved_at' => now(),
                ]
            );

            $attempt->update([
                'last_activity_at' => now(),
            ]);

            $this->audit->log('answer_saved', [
                'candidate_id' => $attempt->candidate_id,
                'exam_session_id' => $attempt->exam_session_id,
                'exam_package_id' => $attempt->exam_package_id,
                'exam_attempt_id' => $attempt->id,
                'metadata' => [
                    'question_id' => $question->id,
                    'has_answer' => $selectedOption !== null,
                    'marked_for_review' => $markedForReview,
                ],
            ], $request);

            return $answer->fresh(['question']);
        });
    }

    public function submit(ExamAttempt $attempt, bool $auto = false, ?Request $request = null): ExamAttempt
    {
        return DB::transaction(function () use ($attempt, $auto, $request) {
            $attempt = ExamAttempt::query()
                ->with(['sessionCandidate', 'session'])
                ->whereKey($attempt->id)
                ->lockForUpdate()
                ->firstOrFail();

            if (! $attempt->isInProgress()) {
                throw new ExamAccessException('ATTEMPT_LOCKED');
            }

            $status = $auto || $attempt->isExpiredByTime()
                ? ExamAttempt::STATUS_AUTO_SUBMITTED
                : ExamAttempt::STATUS_SUBMITTED;

            $attempt->update([
                'status' => $status,
                'submitted_at' => now(),
                'last_activity_at' => now(),
            ]);

            $scored = $this->scoring->score($attempt);

            $countedAttempts = ExamAttempt::query()
                ->where('exam_session_candidate_id', $attempt->exam_session_candidate_id)
                ->whereNotIn('status', [
                    ExamAttempt::STATUS_CANCELLED,
                    ExamAttempt::STATUS_INVALIDATED,
                ])
                ->count();

            if ($scored->passed || $countedAttempts >= $attempt->session->max_attempts) {
                $attempt->sessionCandidate?->update([
                    'status' => ExamSessionCandidate::STATUS_COMPLETED,
                ]);
            }

            $this->audit->log($status === ExamAttempt::STATUS_AUTO_SUBMITTED ? 'attempt_auto_submitted' : 'attempt_submitted', [
                'candidate_id' => $attempt->candidate_id,
                'exam_session_id' => $attempt->exam_session_id,
                'exam_package_id' => $attempt->exam_package_id,
                'exam_attempt_id' => $attempt->id,
                'metadata' => [
                    'percentage_score' => $scored->percentage_score,
                    'passed' => $scored->passed,
                ],
            ], $request);

            return $scored->fresh(['session', 'package', 'answers']);
        });
    }
}
