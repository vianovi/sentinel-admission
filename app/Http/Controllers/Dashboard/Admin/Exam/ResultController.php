<?php

namespace App\Http\Controllers\Dashboard\Admin\Exam;

use App\Http\Controllers\Controller;
use App\Models\Exam\ExamAttempt;
use App\Models\Exam\ExamSession;
use App\Services\Exam\ExamAuditLogger;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ResultController extends Controller
{
    public function __construct(
        private readonly ExamAuditLogger $audit
    ) {}

    public function index(Request $request): Response
    {
        $status = $request->input('status');
        $passed = $request->input('passed');
        $search = trim((string) $request->input('search', ''));
        $sessionId = $request->input('session');

        $attempts = ExamAttempt::with(['candidate:id,candidate_code,full_name,nisn,program_choice,status', 'session:id,title', 'package:id,title'])
            ->when($status, fn ($query) => $query->where('status', $status))
            ->when($passed !== null && $passed !== '', fn ($query) => $query->where('passed', $passed === '1'))
            ->when($sessionId, fn ($query) => $query->where('exam_session_id', $sessionId))
            ->when($search, function ($query) use ($search) {
                $query->where(function ($nested) use ($search) {
                    $nested
                        ->whereHas('candidate', function ($candidateQuery) use ($search) {
                            $candidateQuery
                                ->where('full_name', 'like', "%{$search}%")
                                ->orWhere('candidate_code', 'like', "%{$search}%")
                                ->orWhere('nisn', 'like', "%{$search}%");
                        })
                        ->orWhereHas('session', fn ($sessionQuery) => $sessionQuery->where('title', 'like', "%{$search}%"))
                        ->orWhereHas('package', fn ($packageQuery) => $packageQuery->where('title', 'like', "%{$search}%"));
                });
            })
            ->latest()
            ->paginate(20)
            ->withQueryString()
            ->through(fn (ExamAttempt $attempt) => $this->attemptRow($attempt));

        return Inertia::render('Dashboard/Admin/Exam/Results', [
            'attempts' => $attempts,
            'filters' => [
                'status' => $status,
                'passed' => $passed,
                'search' => $search,
                'session' => $sessionId,
            ],
            'sessions' => $this->sessionOptions(),
        ]);
    }

    public function show(Request $request, ExamAttempt $attempt): Response
    {
        $attempt->load([
            'candidate:id,candidate_code,full_name,nisn,program_choice,status',
            'session:id,title,passing_score,show_result_to_candidate',
            'package:id,title',
            'answers.question:id,question_text,options,correct_answer,point,explanation',
        ]);

        $this->audit->log('result_reviewed', [
            'candidate_id' => $attempt->candidate_id,
            'exam_session_id' => $attempt->exam_session_id,
            'exam_package_id' => $attempt->exam_package_id,
            'exam_attempt_id' => $attempt->id,
            'metadata' => ['scope' => 'admin'],
        ], $request);

        return Inertia::render('Dashboard/Admin/Exam/ResultShow', [
            'attempt' => [
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
            ],
        ]);
    }

    private function attemptRow(ExamAttempt $attempt): array
    {
        return [
            'id' => $attempt->id,
            'candidate' => [
                'id' => $attempt->candidate?->id,
                'candidate_code' => $attempt->candidate?->candidate_code,
                'full_name' => $attempt->candidate?->full_name,
                'nisn' => $attempt->candidate?->nisn,
                'program_choice' => $attempt->candidate?->program_choice,
                'status' => $attempt->candidate?->status,
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
            'submitted_at' => $attempt->submitted_at?->format('d M Y H:i'),
            'created_at' => $attempt->created_at?->format('d M Y H:i'),
        ];
    }

    private function sessionOptions(): array
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
