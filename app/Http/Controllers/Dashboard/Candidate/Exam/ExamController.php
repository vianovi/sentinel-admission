<?php

namespace App\Http\Controllers\Dashboard\Candidate\Exam;

use App\Http\Controllers\Controller;
use App\Models\Candidate;
use App\Models\Exam\ExamAttempt;
use App\Models\Exam\ExamSession;
use App\Models\Exam\ExamSessionCandidate;
use App\Services\CandidateStatus\CandidateGateService;
use App\Services\CandidateStatus\CandidateStatusService;
use App\Services\Exam\ExamAttemptService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ExamController extends Controller
{
    public function __construct(
        private readonly ExamAttemptService $attemptService,
        private readonly CandidateGateService $gateService,
        private readonly CandidateStatusService $statusService
    ) {}

    public function index(Request $request): Response
    {
        $candidate = $this->candidate($request);
        $gate = null;

        if ($candidate) {
            $this->statusService->syncAfterEvent($candidate, 'exam.index');
            $candidate->refresh()->load('admissionWave:id,title,academic_year');
            $gate = $this->gateService->exam($candidate, $request->user());
        }

        $assignments = $candidate && ($gate['allowed'] ?? false)
            ? ExamSessionCandidate::query()
                ->with([
                    'session.package.subject:id,name,code',
                    'attempts' => fn ($query) => $query->latest(),
                ])
                ->where('candidate_id', $candidate->id)
                ->latest()
                ->get()
            : collect();

        $sessions = $assignments->map(function (ExamSessionCandidate $assignment) use ($request) {
            $assignment->setRelation('attempts', $assignment->attempts->map(
                fn (ExamAttempt $attempt) => $this->attemptService->syncExpired($attempt, $request)
            ));

            return $this->assignmentPayload($assignment);
        })->values();

        $checklist = null;
        if ($candidate) {
            $hasSession = $candidate->examSessionCandidates()->exists();
            $hasPaidPayment = $candidate->payments()->where('status', \App\Models\Payment::STATUS_PAID)->exists();
            $isSubmitted = in_array($candidate->status, ['submitted', 'verified', 'accepted']);
            $checklist = [
                'form_completed' => $isSubmitted,
                'documents_completed' => $isSubmitted && app(\App\Services\CandidateStatus\CandidateVerificationEvaluator::class)->hasUploadedMandatoryDocuments($candidate),
                'payment_completed' => $hasPaidPayment,
                'session_assigned' => $hasSession,
            ];
        }

        return Inertia::render('Dashboard/Candidate/Exam/Index', [
            'candidate' => $candidate ? $this->candidatePayload($candidate) : null,
            'sessions' => $sessions,
            'gate' => $gate,
            'checklist' => $checklist,
            'server_time' => now()->toISOString(),
        ]);
    }

    public function show(Request $request, ExamSession $session): Response
    {
        $candidate = $this->candidateOrFail($request);
        $gate = $this->examGate($candidate, $request);

        abort_if(! $gate['allowed'], 403, $gate['reason'] ?? 'Ujian seleksi masih terkunci.');

        $assignment = ExamSessionCandidate::query()
            ->with([
                'session.package.subject:id,name,code',
                'attempts' => fn ($query) => $query->latest(),
            ])
            ->where('exam_session_id', $session->id)
            ->where('candidate_id', $candidate->id)
            ->firstOrFail();

        $assignment->setRelation('attempts', $assignment->attempts->map(
            fn (ExamAttempt $attempt) => $this->attemptService->syncExpired($attempt, $request)
        ));

        return Inertia::render('Dashboard/Candidate/Exam/SessionShow', [
            'candidate' => $this->candidatePayload($candidate),
            'assignment' => $this->assignmentPayload($assignment),
            'attempts' => $assignment->attempts->map(fn (ExamAttempt $attempt) => $this->attemptPayload($attempt, true))->values(),
            'server_time' => now()->toISOString(),
        ]);
    }

    private function candidate(Request $request): ?Candidate
    {
        return $request->user()
            ?->candidate()
            ->with('admissionWave:id,title,academic_year')
            ->first();
    }

    private function candidateOrFail(Request $request): Candidate
    {
        $candidate = $this->candidate($request);

        abort_unless($candidate, 403, 'Data kandidat tidak tersedia.');

        return $candidate;
    }

    private function examGate(Candidate $candidate, Request $request): array
    {
        $this->statusService->syncAfterEvent($candidate, 'exam.route');
        $candidate->refresh();

        return $this->gateService->exam($candidate, $request->user());
    }

    private function assignmentPayload(ExamSessionCandidate $assignment): array
    {
        $session = $assignment->session;
        $attempts = $assignment->attempts;
        $scheduleState = $this->scheduleState($session);

        $packages = [];
        $isSequential = $session?->package_order_type === 'sequential';
        $previousCompleted = true; // For sequential logic

        foreach ($session?->packages ?? [] as $package) {
            $packageAttempts = $attempts->where('exam_package_id', $package->id);
            $latestAttempt = $packageAttempts->sortByDesc('id')->first();
            $inProgressAttempt = $packageAttempts->first(fn ($a) => $a->isInProgress());

            $countedAttempts = $packageAttempts
                ->whereNotIn('status', [ExamAttempt::STATUS_CANCELLED, ExamAttempt::STATUS_INVALIDATED])
                ->count();

            $attemptsRemaining = max(0, (int) ($package->max_attempts ?? 1) - $countedAttempts);
            $isCompleted = $packageAttempts->contains(fn ($a) => in_array($a->status, [ExamAttempt::STATUS_SUBMITTED, ExamAttempt::STATUS_AUTO_SUBMITTED]));

            $blockReason = $this->blockReason(
                $assignment,
                $scheduleState,
                $package->isPublished(),
                $attemptsRemaining,
                (bool) $inProgressAttempt
            );

            // Sequential lock
            if ($isSequential && ! $previousCompleted && ! $inProgressAttempt && ! $isCompleted) {
                $canStart = false;
                $blockReason = 'Harus menyelesaikan paket sebelumnya terlebih dahulu.';
            } else {
                $canStart = $assignment->isEligible()
                    && $scheduleState === 'open'
                    && $package->isPublished()
                    && $attemptsRemaining > 0
                    && ! $inProgressAttempt
                    && $blockReason === null;
            }

            if (! $isCompleted) {
                $previousCompleted = false;
            }

            $packages[] = [
                'id' => $package->id,
                'title' => $package->title,
                'subject_name' => $package->subject?->name,
                'duration_minutes' => $package->duration_minutes,
                'passing_score' => $package->passing_score !== null ? (float) $package->passing_score : null,
                'max_attempts' => $package->max_attempts,
                'status' => $package->status,
                'can_start' => $canStart,
                'block_reason' => $blockReason,
                'attempts_remaining' => $attemptsRemaining,
                'latest_attempt' => $latestAttempt ? $this->attemptPayload($latestAttempt, false) : null,
                'active_attempt_url' => $inProgressAttempt ? route('dashboard.exam.attempts.show', $inProgressAttempt) : null,
            ];
        }

        $globalInProgress = $attempts->first(fn ($a) => $a->isInProgress());

        return [
            'id' => $assignment->id,
            'status' => $assignment->status,
            'has_active_attempt' => (bool) $globalInProgress,
            'session' => [
                'id' => $session?->id,
                'title' => $session?->title,
                'description' => $session?->description,
                'instructions' => $session?->instructions,
                'status' => $session?->status,
                'schedule_state' => $scheduleState,
                'opens_at' => $session?->opens_at?->format('d M Y H:i'),
                'closes_at' => $session?->closes_at?->format('d M Y H:i'),
                'package_order_type' => $session?->package_order_type,
            ],
            'packages' => $packages,
        ];
    }

    private function scheduleState(?ExamSession $session): string
    {
        if (! $session || $session->status !== ExamSession::STATUS_PUBLISHED) {
            return 'not_published';
        }

        if ($session->opens_at?->gt(now())) {
            return 'not_open';
        }

        if ($session->closes_at?->lte(now())) {
            return 'closed';
        }

        return 'open';
    }

    private function blockReason(
        ExamSessionCandidate $assignment,
        string $scheduleState,
        bool $packagePublished,
        int $attemptsRemaining,
        bool $hasInProgress
    ): ?string {
        if ($hasInProgress) {
            return 'Masih ada pengerjaan yang berlangsung.';
        }

        if ($assignment->status === ExamSessionCandidate::STATUS_BLOCKED) {
            return 'Akses ujian sedang dibatasi.';
        }

        if (! $assignment->isEligible()) {
            return 'Sesi ini sudah selesai atau tidak lagi tersedia untuk akunmu.';
        }

        if (! $packagePublished) {
            return 'Paket ujian belum dipublish.';
        }

        if ($scheduleState === 'not_published') {
            return 'Sesi belum dipublish.';
        }

        if ($scheduleState === 'not_open') {
            return 'Sesi belum dibuka.';
        }

        if ($scheduleState === 'closed') {
            return 'Sesi sudah ditutup.';
        }

        if ($attemptsRemaining < 1) {
            return 'Batas percobaan sudah tercapai.';
        }

        return null;
    }

    private function attemptPayload(ExamAttempt $attempt, bool $includeScore): array
    {
        $attempt->loadMissing(['session', 'package']);

        $showScore = $includeScore
            && ! $attempt->isInProgress()
            && (bool) ($attempt->session?->show_result_to_candidate || $attempt->package?->show_result_to_candidate);

        return [
            'id' => $attempt->id,
            'status' => $attempt->status,
            'attempt_number' => $attempt->attempt_number,
            'started_at' => $attempt->started_at?->format('d M Y H:i'),
            'expires_at' => $attempt->expires_at?->format('d M Y H:i'),
            'submitted_at' => $attempt->submitted_at?->format('d M Y H:i'),
            'remaining_seconds' => $attempt->remainingSeconds(),
            'total_questions' => $attempt->total_questions,
            'answered_questions' => $attempt->answered_questions,
            'score_visible' => $showScore,
            'percentage_score' => $showScore && $attempt->percentage_score !== null ? (float) $attempt->percentage_score : null,
            'passing_score' => $showScore && $attempt->passing_score !== null ? (float) $attempt->passing_score : null,
            'passed' => $showScore ? $attempt->passed : null,
        ];
    }

    private function candidatePayload(Candidate $candidate): array
    {
        return [
            'id' => $candidate->id,
            'candidate_code' => $candidate->candidate_code,
            'full_name' => $candidate->full_name,
            'nisn' => $candidate->nisn,
            'program_choice' => $candidate->program_choice,
            'status' => $candidate->status,
            'admission_wave' => $candidate->admissionWave
                ? [
                    'title' => $candidate->admissionWave->title,
                    'academic_year' => $candidate->admissionWave->academic_year,
                ]
                : null,
        ];
    }
}
