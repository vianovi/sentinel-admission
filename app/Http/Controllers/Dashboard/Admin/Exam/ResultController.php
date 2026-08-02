<?php

namespace App\Http\Controllers\Dashboard\Admin\Exam;

use App\Http\Controllers\Controller;
use App\Models\Exam\ExamAttempt;
use App\Services\Exam\ExamAuditLogger;
use App\Services\Exam\ExamResultPresenter;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ResultController extends Controller
{
    public function __construct(
        private readonly ExamAuditLogger $audit,
        private readonly ExamResultPresenter $presenter
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
                        ->where('guest_name', 'like', "%{$search}%")
                        ->orWhere('guest_email', 'like', "%{$search}%")
                        ->orWhereHas('candidate', function ($candidateQuery) use ($search) {
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
            ->through(fn (ExamAttempt $attempt) => $this->presenter->attemptRow($attempt));

        return Inertia::render('Dashboard/Admin/Exam/Results', [
            'attempts' => $attempts,
            'filters' => [
                'status' => $status,
                'passed' => $passed,
                'search' => $search,
                'session' => $sessionId,
            ],
            'sessions' => $this->presenter->sessionOptions(),
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
            'attempt' => $this->presenter->attemptDetail($attempt),
        ]);
    }
}
