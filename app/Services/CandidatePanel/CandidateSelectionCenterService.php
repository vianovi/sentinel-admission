<?php

namespace App\Services\CandidatePanel;

use App\Models\Candidate;
use App\Models\Exam\ExamAttempt;
use App\Models\Exam\ExamSession;
use App\Models\Exam\ExamSessionCandidate;
use App\Models\User;
use App\Services\CandidateStatus\CandidateGateService;
use Illuminate\Support\Collection;

class CandidateSelectionCenterService
{
    public function __construct(
        private readonly CandidateGateService $gateService
    ) {}

    public function status(Candidate $candidate, User $user): array
    {
        $gate = $this->gateService->exam($candidate, $user);
        $assignments = $this->assignments($candidate);
        $attempts = $assignments
            ->flatMap(fn (ExamSessionCandidate $assignment) => $assignment->attempts)
            ->sortByDesc('created_at')
            ->values();

        return [
            'candidate' => $this->candidate($candidate),
            'gate' => $gate,
            'summary' => [
                'assignments_total' => $assignments->count(),
                'open_sessions' => $assignments->filter(fn (ExamSessionCandidate $assignment) => $this->scheduleState($assignment->session) === 'open')->count(),
                'completed_attempts' => $attempts->whereIn('status', [
                    ExamAttempt::STATUS_SUBMITTED,
                    ExamAttempt::STATUS_AUTO_SUBMITTED,
                ])->count(),
                'in_progress_attempts' => $attempts->where('status', ExamAttempt::STATUS_IN_PROGRESS)->count(),
                'status_label' => $this->selectionStatusLabel($gate, $assignments, $attempts),
                'next_action' => $this->nextAction($gate, $assignments, $attempts),
            ],
            'sessions' => $assignments
                ->map(fn (ExamSessionCandidate $assignment) => $this->assignment($assignment, includeResult: false))
                ->values()
                ->all(),
        ];
    }

    public function result(Candidate $candidate, User $user): array
    {
        $gate = $this->gateService->exam($candidate, $user);
        $assignments = $this->assignments($candidate);
        $attempts = $assignments
            ->flatMap(fn (ExamSessionCandidate $assignment) => $assignment->attempts)
            ->sortByDesc('submitted_at')
            ->values();
        $resultAttempts = $attempts
            ->filter(fn (ExamAttempt $attempt) => ! $attempt->isInProgress())
            ->values();

        return [
            'candidate' => $this->candidate($candidate),
            'gate' => $gate,
            'final_status' => [
                'status' => $candidate->status,
                'label' => $this->candidateStatusLabel($candidate->status),
                'is_final' => in_array($candidate->status, ['accepted', 'rejected'], true),
                'description' => $this->candidateStatusDescription($candidate->status),
            ],
            'summary' => [
                'attempts_total' => $resultAttempts->count(),
                'visible_results' => $resultAttempts->filter(fn (ExamAttempt $attempt) => $this->scoreVisible($attempt))->count(),
                'passed_visible' => $resultAttempts->filter(fn (ExamAttempt $attempt) => $this->scoreVisible($attempt) && $attempt->passed === true)->count(),
                'waiting_results' => $resultAttempts->filter(fn (ExamAttempt $attempt) => ! $this->scoreVisible($attempt))->count(),
            ],
            'results' => $resultAttempts
                ->map(fn (ExamAttempt $attempt) => $this->attempt($attempt, includeResult: true))
                ->values()
                ->all(),
        ];
    }

    private function assignments(Candidate $candidate): Collection
    {
        return ExamSessionCandidate::query()
            ->where('candidate_id', $candidate->id)
            ->select([
                'id',
                'exam_session_id',
                'candidate_id',
                'status',
                'assigned_at',
                'note',
                'updated_at',
            ])
            ->with([
                'session:id,exam_package_id,title,description,opens_at,closes_at,duration_minutes,passing_score,max_attempts,show_result_to_candidate,status',
                'session.package:id,exam_subject_id,title,duration_minutes,passing_score,max_attempts,show_result_to_candidate,status',
                'session.package.subject:id,name,code',
                'attempts' => fn ($query) => $query
                    ->select([
                        'id',
                        'exam_session_id',
                        'exam_session_candidate_id',
                        'exam_package_id',
                        'candidate_id',
                        'attempt_number',
                        'status',
                        'started_at',
                        'expires_at',
                        'submitted_at',
                        'finalized_at',
                        'total_questions',
                        'answered_questions',
                        'percentage_score',
                        'passing_score',
                        'passed',
                        'created_at',
                        'updated_at',
                    ])
                    ->with([
                        'session:id,title,show_result_to_candidate',
                        'package:id,title,show_result_to_candidate',
                    ])
                    ->latest(),
            ])
            ->latest('assigned_at')
            ->get();
    }

    private function candidate(Candidate $candidate): array
    {
        return [
            'id' => $candidate->id,
            'candidate_code' => $candidate->candidate_code,
            'full_name' => $candidate->full_name,
            'nisn' => $candidate->nisn,
            'program_choice' => $candidate->program_choice,
            'status' => $candidate->status,
        ];
    }

    private function assignment(ExamSessionCandidate $assignment, bool $includeResult): array
    {
        $session = $assignment->session;
        $attempts = $assignment->attempts->sortByDesc('created_at')->values();
        $latestAttempt = $attempts->first();
        $inProgress = $attempts->first(fn (ExamAttempt $attempt) => $attempt->isInProgress());
        $countedAttempts = $attempts
            ->whereNotIn('status', [ExamAttempt::STATUS_CANCELLED, ExamAttempt::STATUS_INVALIDATED])
            ->count();
        $maxAttempts = (int) ($session?->max_attempts ?? $session?->package?->max_attempts ?? 0);
        $remaining = max(0, $maxAttempts - $countedAttempts);
        $scheduleState = $this->scheduleState($session);

        return [
            'id' => $assignment->id,
            'status' => $assignment->status,
            'status_label' => $this->assignmentStatusLabel($assignment->status),
            'assigned_at' => $assignment->assigned_at?->format('d M Y · H:i'),
            'schedule_state' => $scheduleState,
            'schedule_label' => $this->scheduleLabel($scheduleState),
            'attempts_count' => $attempts->count(),
            'attempts_remaining' => $remaining,
            'can_start' => $this->canStart($assignment, $scheduleState, $remaining, (bool) $inProgress),
            'start_url' => $session ? route('dashboard.exam.sessions.show', $session) : null,
            'active_attempt_url' => $inProgress ? route('dashboard.exam.attempts.show', $inProgress) : null,
            'block_reason' => $this->blockReason($assignment, $scheduleState, $remaining, (bool) $inProgress),
            'session' => [
                'id' => $session?->id,
                'title' => $session?->title,
                'description' => $session?->description,
                'opens_at' => $session?->opens_at?->format('d M Y · H:i'),
                'closes_at' => $session?->closes_at?->format('d M Y · H:i'),
                'duration_minutes' => $session?->duration_minutes,
                'passing_score' => $session?->passing_score !== null ? (float) $session->passing_score : null,
                'show_result_to_candidate' => (bool) ($session?->show_result_to_candidate || $session?->package?->show_result_to_candidate),
            ],
            'package' => [
                'title' => $session?->package?->title,
                'subject_name' => $session?->package?->subject?->name,
                'subject_code' => $session?->package?->subject?->code,
                'status' => $session?->package?->status,
            ],
            'latest_attempt' => $latestAttempt ? $this->attempt($latestAttempt, $includeResult) : null,
        ];
    }

    private function attempt(ExamAttempt $attempt, bool $includeResult): array
    {
        $visible = $includeResult && $this->scoreVisible($attempt);

        return [
            'id' => $attempt->id,
            'attempt_number' => $attempt->attempt_number,
            'status' => $attempt->status,
            'status_label' => $this->attemptStatusLabel($attempt->status),
            'started_at' => $attempt->started_at?->format('d M Y · H:i'),
            'submitted_at' => $attempt->submitted_at?->format('d M Y · H:i'),
            'finalized_at' => $attempt->finalized_at?->format('d M Y · H:i'),
            'total_questions' => $attempt->total_questions,
            'answered_questions' => $attempt->answered_questions,
            'score_visible' => $visible,
            'percentage_score' => $visible && $attempt->percentage_score !== null ? (float) $attempt->percentage_score : null,
            'passing_score' => $visible && $attempt->passing_score !== null ? (float) $attempt->passing_score : null,
            'passed' => $visible ? $attempt->passed : null,
            'session_title' => $attempt->session?->title,
            'package_title' => $attempt->package?->title,
        ];
    }

    private function selectionStatusLabel(array $gate, Collection $assignments, Collection $attempts): string
    {
        if ($gate['locked'] ?? false) {
            return 'Terkunci';
        }

        if ($attempts->where('status', ExamAttempt::STATUS_IN_PROGRESS)->isNotEmpty()) {
            return 'Sedang Dikerjakan';
        }

        if ($attempts->whereIn('status', [ExamAttempt::STATUS_SUBMITTED, ExamAttempt::STATUS_AUTO_SUBMITTED])->isNotEmpty()) {
            return 'Sudah Mengumpulkan';
        }

        if ($assignments->isNotEmpty()) {
            return 'Sesi Tersedia';
        }

        return 'Belum Ada Sesi';
    }

    private function nextAction(array $gate, Collection $assignments, Collection $attempts): array
    {
        if ($gate['locked'] ?? false) {
            return [
                'label' => 'Buka Status Pendaftaran',
                'description' => $gate['reason'] ?? 'Selesaikan syarat pendaftaran terlebih dahulu.',
                'href' => route('dashboard.status-pendaftaran'),
            ];
        }

        $inProgress = $attempts->first(fn (ExamAttempt $attempt) => $attempt->isInProgress());
        if ($inProgress) {
            return [
                'label' => 'Lanjutkan Ujian',
                'description' => 'Masih ada pengerjaan ujian yang berlangsung.',
                'href' => route('dashboard.exam.attempts.show', $inProgress),
            ];
        }

        $openAssignment = $assignments->first(fn (ExamSessionCandidate $assignment) => $this->scheduleState($assignment->session) === 'open');
        if ($openAssignment?->session) {
            return [
                'label' => 'Buka Sesi Ujian',
                'description' => 'Ada sesi ujian yang sedang dibuka untuk akunmu.',
                'href' => route('dashboard.exam.sessions.show', $openAssignment->session),
            ];
        }

        return [
            'label' => 'Pantau Sesi Seleksi',
            'description' => 'Belum ada aksi ujian yang perlu dilakukan saat ini.',
            'href' => route('dashboard.exam.index'),
        ];
    }

    private function canStart(ExamSessionCandidate $assignment, string $scheduleState, int $attemptsRemaining, bool $hasInProgress): bool
    {
        return $assignment->isEligible()
            && $scheduleState === 'open'
            && (bool) $assignment->session?->package?->isPublished()
            && $attemptsRemaining > 0
            && ! $hasInProgress;
    }

    private function blockReason(ExamSessionCandidate $assignment, string $scheduleState, int $attemptsRemaining, bool $hasInProgress): ?string
    {
        if ($hasInProgress) {
            return 'Masih ada pengerjaan yang berlangsung.';
        }
        if ($assignment->status === ExamSessionCandidate::STATUS_BLOCKED) {
            return 'Akses sesi sedang dibatasi.';
        }
        if (! $assignment->isEligible()) {
            return 'Sesi ini sudah selesai atau tidak tersedia.';
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

    private function scoreVisible(ExamAttempt $attempt): bool
    {
        $attempt->loadMissing(['session', 'package']);

        return ! $attempt->isInProgress()
            && (bool) ($attempt->session?->show_result_to_candidate || $attempt->package?->show_result_to_candidate);
    }

    private function scheduleLabel(string $state): string
    {
        return match ($state) {
            'open' => 'Dibuka',
            'not_open' => 'Belum Dibuka',
            'closed' => 'Ditutup',
            default => 'Belum Dipublish',
        };
    }

    private function assignmentStatusLabel(string $status): string
    {
        return match ($status) {
            ExamSessionCandidate::STATUS_ELIGIBLE => 'Eligible',
            ExamSessionCandidate::STATUS_BLOCKED => 'Dibatasi',
            ExamSessionCandidate::STATUS_COMPLETED => 'Selesai',
            default => ucfirst($status),
        };
    }

    private function attemptStatusLabel(string $status): string
    {
        return match ($status) {
            ExamAttempt::STATUS_IN_PROGRESS => 'Sedang Dikerjakan',
            ExamAttempt::STATUS_SUBMITTED => 'Terkumpul',
            ExamAttempt::STATUS_AUTO_SUBMITTED => 'Terkumpul Otomatis',
            ExamAttempt::STATUS_EXPIRED => 'Kedaluwarsa',
            ExamAttempt::STATUS_CANCELLED => 'Dibatalkan',
            ExamAttempt::STATUS_INVALIDATED => 'Dibatalkan Panitia',
            default => ucfirst($status),
        };
    }

    private function candidateStatusLabel(string $status): string
    {
        return match ($status) {
            'draft' => 'Draft',
            'submitted' => 'Menunggu Verifikasi',
            'verified' => 'Terverifikasi',
            'accepted' => 'Diterima',
            'rejected' => 'Ditolak',
            default => 'Belum diketahui',
        };
    }

    private function candidateStatusDescription(string $status): string
    {
        return match ($status) {
            'accepted' => 'Status akhir sudah tercatat diterima oleh panitia.',
            'rejected' => 'Status akhir sudah tercatat tidak diterima oleh panitia.',
            'verified' => 'Pendaftaran sudah verified. Keputusan akhir tetap menunggu panitia.',
            'submitted' => 'Pendaftaran menunggu verifikasi dokumen dan pembayaran.',
            'draft' => 'Lengkapi data utama sebelum masuk tahap seleksi.',
            default => 'Status akhir belum tersedia.',
        };
    }
}
