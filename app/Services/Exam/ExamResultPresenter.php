<?php

namespace App\Services\Exam;

use App\Models\Exam\ExamAttempt;
use App\Models\Exam\ExamSession;

class ExamResultPresenter
{
    /**
     * Map a single attempt model to a standard summary row array.
     */
    public function attemptRow(ExamAttempt $attempt): array
    {
        return [
            'id' => $attempt->id,
            'is_guest' => $attempt->isGuest(),
            'participant_name' => $attempt->participantName(),
            'participant_email' => $attempt->participantEmail(),
            'candidate' => [
                'id' => $attempt->candidate?->id,
                'candidate_code' => $attempt->candidate?->candidate_code ?? ($attempt->isGuest() ? 'TAMU' : null),
                'full_name' => $attempt->participantName(),
                'nisn' => $attempt->candidate?->nisn,
                'program_choice' => $attempt->candidate?->program_choice ?? 'Peserta Umum',
                'status' => $attempt->candidate?->status ?? 'guest',
            ],
            'session_title' => $attempt->session?->title,
            'package_title' => $attempt->package?->title,
            'status' => $attempt->status,
            'attempt_number' => $attempt->attempt_number,
            'answered_questions' => $attempt->answered_questions,
            'total_questions' => $attempt->total_questions,
            'correct_answers' => $attempt->correct_answers,
            'wrong_answers' => $attempt->wrong_answers,
            'raw_score' => (float) $attempt->raw_score,
            'max_score' => (float) $attempt->max_score,
            'percentage_score' => $attempt->percentage_score !== null ? (float) $attempt->percentage_score : null,
            'passing_score' => $attempt->passing_score !== null ? (float) $attempt->passing_score : null,
            'passed' => $attempt->passed,
            'violations_count' => $attempt->violations_count,
            'violations_log' => $attempt->metadata['violations_log'] ?? [],
            'submitted_at' => $attempt->submitted_at?->format('d M Y H:i'),
            'created_at' => $attempt->created_at?->format('d M Y H:i'),
        ];
    }

    /**
     * Map full attempt detail with loaded answers for result inspection.
     */
    public function attemptDetail(ExamAttempt $attempt): array
    {
        return [
            ...$this->attemptRow($attempt),
            'started_at' => $attempt->started_at?->format('d M Y H:i'),
            'submitted_at' => $attempt->submitted_at?->format('d M Y H:i'),
            'finalized_at' => $attempt->finalized_at?->format('d M Y H:i'),
            'answers' => $attempt->answers->map(fn ($answer) => [
                'id' => $answer->id,
                'question_text' => $answer->question?->question_text,
                'options' => $answer->question?->options,
                'selected_option' => $answer->selected_option,
                'correct_answer' => $answer->question?->correct_answer,
                'is_correct' => $answer->is_correct,
                'point_awarded' => (float) $answer->point_awarded,
                'point' => (float) ($answer->question?->point ?? 0),
                'explanation' => $answer->question?->explanation,
            ]),
        ];
    }

    /**
     * Get list of exam sessions for filter dropdowns.
     */
    public function sessionOptions(): array
    {
        return ExamSession::query()
            ->latest()
            ->get(['id', 'title'])
            ->map(fn (ExamSession $session) => [
                'id' => $session->id,
                'title' => $session->title,
            ])
            ->all();
    }
}
