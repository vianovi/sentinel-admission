<?php

namespace App\Http\Controllers\Dashboard\Candidate\Exam;

use App\Actions\Exam\SaveExamAnswer;
use App\Actions\Exam\StartExamAttempt;
use App\Actions\Exam\SubmitExamAttempt;
use App\Exceptions\Exam\ExamAccessException;
use App\Http\Controllers\Controller;
use App\Models\Candidate;
use App\Models\Exam\ExamAttempt;
use App\Models\Exam\ExamQuestion;
use App\Models\Exam\ExamSession;
use App\Models\Exam\ExamSessionCandidate;
use App\Services\CandidateStatus\CandidateGateService;
use App\Services\CandidateStatus\CandidateStatusService;
use App\Services\Exam\ExamAttemptService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AttemptController extends Controller
{
    public function __construct(
        private readonly StartExamAttempt $startAttempt,
        private readonly SaveExamAnswer $saveAnswerAction,
        private readonly SubmitExamAttempt $submitAttempt,
        private readonly ExamAttemptService $attemptService,
        private readonly CandidateGateService $gateService,
        private readonly CandidateStatusService $statusService
    ) {}

    public function start(Request $request, ExamSession $session): RedirectResponse
    {
        $candidate = $this->candidateOrFail($request);
        $gate = $this->examGate($candidate, $request);

        if (! $gate['allowed']) {
            return back()->withErrors(['exam' => $gate['reason'] ?? 'Ujian seleksi masih terkunci.']);
        }

        $assignment = ExamSessionCandidate::query()
            ->where('exam_session_id', $session->id)
            ->where('candidate_id', $candidate->id)
            ->first();

        if (! $assignment) {
            return back()->withErrors(['exam' => 'Kamu belum memiliki akses untuk sesi ujian ini.']);
        }

        try {
            $attempt = $this->startAttempt->handle($assignment, $candidate, $request);
        } catch (ExamAccessException $exception) {
            return back()->withErrors(['exam' => $exception->userMessage()]);
        }

        return redirect()
            ->route('dashboard.exam.attempts.show', $attempt)
            ->with('success', 'Ujian dimulai. Timer mengikuti waktu server.');
    }

    public function show(Request $request, ExamAttempt $attempt): Response
    {
        $candidate = $this->candidateOrFail($request);
        $gate = $this->examGate($candidate, $request);
        abort_if(! $gate['allowed'], 403, $gate['reason'] ?? 'Ujian seleksi masih terkunci.');

        $attempt = $this->ownedAttempt($attempt, $candidate);
        $attempt = $this->attemptService->syncExpired($attempt, $request);
        $attempt->loadMissing(['session.package.subject', 'package', 'answers']);

        $questionIds = collect($attempt->question_order ?? [])
            ->filter(fn ($id) => is_numeric($id))
            ->map(fn ($id) => (int) $id)
            ->values();

        $questions = collect();

        if ($attempt->isInProgress() && $questionIds->isNotEmpty()) {
            $questions = ExamQuestion::query()
                ->whereIn('id', $questionIds)
                ->where('exam_package_id', $attempt->exam_package_id)
                ->get()
                ->sortBy(fn (ExamQuestion $question) => $questionIds->search($question->id))
                ->values()
                ->map(fn (ExamQuestion $question) => $question->candidatePayload());
        }

        $answers = $attempt->answers
            ->whereIn('exam_question_id', $questionIds->all())
            ->mapWithKeys(fn ($answer) => [
                $answer->exam_question_id => [
                    'question_id' => $answer->exam_question_id,
                    'selected_option' => $answer->selected_option,
                    'is_marked_for_review' => $answer->is_marked_for_review,
                    'saved_at' => $answer->saved_at?->toISOString(),
                ],
            ]);

        return Inertia::render('Dashboard/Candidate/Exam/AttemptShow', [
            'candidate' => $this->candidatePayload($candidate),
            'exam' => [
                'session_id' => $attempt->exam_session_id,
                'session_title' => $attempt->session?->title,
                'package_title' => $attempt->package?->title,
                'subject_name' => $attempt->session?->package?->subject?->name,
                'duration_minutes' => $attempt->session?->duration_minutes,
                'passing_score' => $attempt->passing_score !== null ? (float) $attempt->passing_score : null,
                'show_result_to_candidate' => (bool) ($attempt->session?->show_result_to_candidate || $attempt->package?->show_result_to_candidate),
            ],
            'attempt' => $this->attemptPayload($attempt, true),
            'questions' => $questions,
            'answers' => $answers,
            'server_time' => now()->toISOString(),
        ]);
    }

    public function sync(Request $request, ExamAttempt $attempt): JsonResponse
    {
        $candidate = $this->candidateOrFail($request);
        $gate = $this->examGate($candidate, $request);

        if (! $gate['allowed']) {
            return response()->json(['message' => $gate['reason'] ?? 'Ujian seleksi masih terkunci.'], 403);
        }

        $attempt = $this->ownedAttempt($attempt, $candidate);
        $attempt = $this->attemptService->syncExpired($attempt, $request);
        $attempt->loadMissing(['session', 'package']);

        return response()->json([
            'server_time' => now()->toISOString(),
            'attempt' => $this->attemptPayload($attempt, true),
        ]);
    }

    public function saveAnswer(Request $request, ExamAttempt $attempt): JsonResponse
    {
        $candidate = $this->candidateOrFail($request);
        $gate = $this->examGate($candidate, $request);

        if (! $gate['allowed']) {
            return response()->json(['message' => $gate['reason'] ?? 'Ujian seleksi masih terkunci.'], 403);
        }

        $attempt = $this->ownedAttempt($attempt, $candidate);

        $validated = $request->validate([
            'question_id' => ['required', 'integer'],
            'selected_option' => ['nullable', Rule::in(['A', 'B', 'C', 'D', 'E'])],
            'is_marked_for_review' => ['sometimes', 'boolean'],
        ]);

        try {
            $answer = $this->saveAnswerAction->handle(
                $attempt,
                (int) $validated['question_id'],
                $validated['selected_option'] ?? null,
                $request->boolean('is_marked_for_review'),
                $request
            );
        } catch (ExamAccessException $exception) {
            $attempt = $this->attemptService->syncExpired($attempt, $request);

            return response()->json([
                'message' => $exception->userMessage(),
                'server_time' => now()->toISOString(),
                'attempt' => $this->attemptPayload($attempt->fresh(['session', 'package']) ?? $attempt, true),
            ], in_array($exception->reason(), ['ATTEMPT_EXPIRED', 'ATTEMPT_LOCKED'], true) ? 423 : 422);
        }

        $freshAttempt = $attempt->fresh(['session', 'package']) ?? $attempt;

        return response()->json([
            'message' => 'Jawaban tersimpan.',
            'server_time' => now()->toISOString(),
            'attempt' => $this->attemptPayload($freshAttempt, false),
            'answer' => [
                'question_id' => $answer->exam_question_id,
                'selected_option' => $answer->selected_option,
                'is_marked_for_review' => $answer->is_marked_for_review,
                'saved_at' => $answer->saved_at?->toISOString(),
            ],
        ]);
    }

    public function submit(Request $request, ExamAttempt $attempt): RedirectResponse
    {
        $candidate = $this->candidateOrFail($request);
        $gate = $this->examGate($candidate, $request);

        if (! $gate['allowed']) {
            return back()->withErrors(['exam' => $gate['reason'] ?? 'Ujian seleksi masih terkunci.']);
        }

        $attempt = $this->ownedAttempt($attempt, $candidate);

        try {
            $submitted = $this->submitAttempt->handle($attempt, false, $request);
        } catch (ExamAccessException $exception) {
            return back()->withErrors(['exam' => $exception->userMessage()]);
        }

        return redirect()
            ->route('dashboard.exam.sessions.show', $submitted->exam_session_id)
            ->with('success', $submitted->status === ExamAttempt::STATUS_AUTO_SUBMITTED
                ? 'Waktu ujian berakhir dan jawaban tersimpan sudah dikumpulkan.'
                : 'Jawaban ujian berhasil dikumpulkan.');
    }

    private function candidateOrFail(Request $request): Candidate
    {
        $candidate = $request->user()
            ?->candidate()
            ->with('admissionWave:id,title,academic_year')
            ->first();

        abort_unless($candidate, 403, 'Data kandidat tidak tersedia.');

        return $candidate;
    }

    private function ownedAttempt(ExamAttempt $attempt, Candidate $candidate): ExamAttempt
    {
        abort_unless($attempt->candidate_id === $candidate->id, 403, 'Percobaan ujian tidak tersedia.');

        return $attempt;
    }

    private function examGate(Candidate $candidate, Request $request): array
    {
        $this->statusService->syncAfterEvent($candidate, 'exam.route');
        $candidate->refresh();

        return $this->gateService->exam($candidate, $request->user());
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
            'started_at_iso' => $attempt->started_at?->toISOString(),
            'expires_at' => $attempt->expires_at?->format('d M Y H:i'),
            'expires_at_iso' => $attempt->expires_at?->toISOString(),
            'submitted_at' => $attempt->submitted_at?->format('d M Y H:i'),
            'remaining_seconds' => $attempt->remainingSeconds(),
            'is_locked' => $attempt->isLocked(),
            'total_questions' => $attempt->total_questions,
            'answered_questions' => $attempt->answered_questions,
            'blank_questions' => $attempt->blank_questions,
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
