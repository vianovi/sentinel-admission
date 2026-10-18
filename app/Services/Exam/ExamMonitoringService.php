<?php

namespace App\Services\Exam;

use App\Models\Exam\ExamAttempt;
use App\Models\Exam\ExamSession;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;

class ExamMonitoringService
{
    /**
     * @return array<string, mixed>
     */
    public function snapshot(): array
    {
        if (app()->environment('testing')) {
            return $this->buildSnapshot();
        }

        return Cache::remember('exam_monitoring_snapshot', 3, fn () => $this->buildSnapshot());
    }

    /**
     * Build the raw monitoring snapshot data array.
     *
     * @return array<string, mixed>
     */
    private function buildSnapshot(): array
    {
        $sessionIds = $this->monitoredSessionIds();
        $sessions = $this->sessions($sessionIds);
        $attempts = $this->attempts($sessionIds);

        return [
            'generated_at' => now()->format('d M Y H:i:s'),
            'summary' => [
                'sessions' => count($sessions),
                'assigned_candidates' => collect($sessions)->sum('assigned_candidates'),
                'in_progress' => collect($sessions)->sum('in_progress_attempts'),
                'submitted' => collect($sessions)->sum('submitted_attempts'),
                'expired' => collect($sessions)->sum('expired_attempts'),
                'idle' => collect($attempts)->where('activity_state', 'idle')->count(),
                'stale' => collect($attempts)->where('activity_state', 'stale')->count(),
            ],
            'sessions' => $sessions,
            'attempts' => $attempts,
        ];
    }

    /**
     * @return array<int, int>
     */
    private function monitoredSessionIds(): array
    {
        return ExamSession::query()
            ->where(function ($query) {
                $query
                    ->where('status', ExamSession::STATUS_PUBLISHED)
                    ->where('opens_at', '<=', now()->addMinutes(15))
                    ->where('closes_at', '>=', now()->subMinutes(30));
            })
            ->orWhereHas('attempts', fn ($query) => $query->where('status', ExamAttempt::STATUS_IN_PROGRESS))
            ->pluck('id')
            ->all();
    }

    /**
     * @param  array<int, int>  $sessionIds
     * @return array<int, array<string, mixed>>
     */
    private function sessions(array $sessionIds): array
    {
        if ($sessionIds === []) {
            return [];
        }

        return ExamSession::query()
            ->with(['package:id,title,exam_subject_id', 'package.subject:id,name,code', 'admissionWave:id,title,academic_year'])
            ->withCount([
                'candidates as assigned_candidates',
                'attempts as in_progress_attempts' => fn ($query) => $query->where('status', ExamAttempt::STATUS_IN_PROGRESS),
                'attempts as submitted_attempts' => fn ($query) => $query->whereIn('status', [ExamAttempt::STATUS_SUBMITTED, ExamAttempt::STATUS_AUTO_SUBMITTED]),
                'attempts as expired_attempts' => fn ($query) => $query->where('status', ExamAttempt::STATUS_EXPIRED),
            ])
            ->whereIn('id', $sessionIds)
            ->orderBy('opens_at')
            ->get()
            ->map(fn (ExamSession $session) => [
                'id' => $session->id,
                'title' => $session->title,
                'status' => $session->status,
                'package_title' => $session->package?->title,
                'subject_name' => $session->package?->subject?->name,
                'wave_title' => $session->admissionWave?->title,
                'opens_at' => $session->opens_at?->format('d M Y H:i'),
                'closes_at' => $session->closes_at?->format('d M Y H:i'),
                'duration_minutes' => $session->duration_minutes,
                'assigned_candidates' => $session->assigned_candidates,
                'in_progress_attempts' => $session->in_progress_attempts,
                'submitted_attempts' => $session->submitted_attempts,
                'expired_attempts' => $session->expired_attempts,
                'is_open_now' => $session->isOpenForStart(),
            ])
            ->all();
    }

    /**
     * @param  array<int, int>  $sessionIds
     * @return array<int, array<string, mixed>>
     */
    private function attempts(array $sessionIds): array
    {
        if ($sessionIds === []) {
            return [];
        }

        return ExamAttempt::query()
            ->with([
                'candidate:id,candidate_code,full_name,nisn,program_choice,status',
                'session:id,title,opens_at,closes_at,status',
                'package:id,title,exam_subject_id',
                'package.subject:id,name,code',
            ])
            ->whereIn('exam_session_id', $sessionIds)
            ->whereIn('status', [
                ExamAttempt::STATUS_IN_PROGRESS,
                ExamAttempt::STATUS_SUBMITTED,
                ExamAttempt::STATUS_AUTO_SUBMITTED,
                ExamAttempt::STATUS_EXPIRED,
                ExamAttempt::STATUS_CANCELLED,
                ExamAttempt::STATUS_INVALIDATED,
            ])
            ->latest('last_activity_at')
            ->limit(300)
            ->get()
            ->map(fn (ExamAttempt $attempt) => $this->attemptRow($attempt))
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    private function attemptRow(ExamAttempt $attempt): array
    {
        $totalQuestions = max(1, $attempt->total_questions);
        $answered = min($attempt->answered_questions, $totalQuestions);
        $activityState = $this->activityState($attempt->last_activity_at, $attempt->status);

        return [
            'id' => $attempt->id,
            'candidate_id' => $attempt->candidate_id,
            'candidate_code' => $attempt->candidate?->candidate_code,
            'candidate_name' => $attempt->candidate?->full_name,
            'nisn' => $attempt->candidate?->nisn,
            'program_choice' => $attempt->candidate?->program_choice,
            'candidate_status' => $attempt->candidate?->status,
            'session_id' => $attempt->exam_session_id,
            'session_title' => $attempt->session?->title,
            'package_title' => $attempt->package?->title,
            'subject_name' => $attempt->package?->subject?->name,
            'attempt_number' => $attempt->attempt_number,
            'status' => $attempt->status,
            'started_at' => $attempt->started_at?->format('d M Y H:i:s'),
            'expires_at' => $attempt->expires_at?->format('d M Y H:i:s'),
            'submitted_at' => $attempt->submitted_at?->format('d M Y H:i:s'),
            'last_activity_at' => $attempt->last_activity_at?->format('d M Y H:i:s'),
            'last_activity_human' => $attempt->last_activity_at?->diffForHumans(),
            'activity_state' => $activityState,
            'remaining_seconds' => $attempt->remainingSeconds(),
            'answered_questions' => $attempt->answered_questions,
            'blank_questions' => $attempt->blank_questions,
            'total_questions' => $attempt->total_questions,
            'progress_percentage' => (int) round(($answered / $totalQuestions) * 100),
            'score' => $attempt->percentage_score !== null ? (float) $attempt->percentage_score : null,
            'passed' => $attempt->passed,
        ];
    }

    private function activityState(?Carbon $lastActivityAt, string $status): string
    {
        if ($status !== ExamAttempt::STATUS_IN_PROGRESS) {
            return 'finished';
        }

        if (! $lastActivityAt) {
            return 'stale';
        }

        if ($lastActivityAt->gte(now()->subMinutes(2))) {
            return 'active';
        }

        if ($lastActivityAt->gte(now()->subMinutes(10))) {
            return 'idle';
        }

        return 'stale';
    }
}
