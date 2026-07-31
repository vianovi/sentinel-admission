<?php

namespace App\Http\Controllers\Exam;

use App\Actions\Exam\SaveExamAnswer;
use App\Actions\Exam\SubmitExamAttempt;
use App\Exceptions\Exam\ExamAccessException;
use App\Http\Controllers\Controller;
use App\Models\Exam\ExamAttempt;
use App\Models\Exam\ExamQuestion;
use App\Models\Exam\ExamSessionToken;
use App\Services\Exam\ExamAttemptService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class PublicExamController extends Controller
{
    public function __construct(
        private readonly ExamAttemptService $attemptService,
        private readonly SaveExamAnswer $saveAnswerAction,
        private readonly SubmitExamAttempt $submitAttempt
    ) {}

    public function showLanding(Request $request, ?string $token = null): Response
    {
        $inputToken = $token ?? $request->query('token');
        $sessionToken = null;
        $sessionPayload = null;

        if ($inputToken) {
            $sessionToken = ExamSessionToken::query()
                ->with(['session.package.subject'])
                ->where('token', $inputToken)
                ->first();

            if ($sessionToken && $sessionToken->isValid() && $sessionToken->session?->is_public) {
                $session = $sessionToken->session;
                $package = $session->package;

                $sessionPayload = [
                    'title' => $session->title,
                    'description' => $session->description,
                    'instructions' => $session->instructions,
                    'subject_name' => $package?->subject?->name,
                    'duration_minutes' => $session->duration_minutes,
                    'opens_at' => $session->opens_at?->format('d M Y H:i'),
                    'closes_at' => $session->closes_at?->format('d M Y H:i'),
                    'token_label' => $sessionToken->label,
                    'is_open' => $session->isOpenForStart(),
                ];
            }
        }

        return Inertia::render('Public/Exam/Landing', [
            'token' => $inputToken,
            'token_valid' => $sessionToken?->isValid() ?? false,
            'session' => $sessionPayload,
            'server_time' => now()->toISOString(),
        ]);
    }

    public function start(Request $request, string $token): RedirectResponse
    {
        $sessionToken = ExamSessionToken::query()
            ->with(['session'])
            ->where('token', $token)
            ->first();

        if (! $sessionToken || ! $sessionToken->isValid()) {
            return back()->withErrors(['token' => 'Token akses ujian tidak valid atau sudah kedaluwarsa.']);
        }

        $validated = $request->validate([
            'guest_name' => ['required', 'string', 'max:255'],
            'guest_email' => ['nullable', 'email', 'max:255'],
            'guest_phone' => ['nullable', 'string', 'max:30'],
        ]);

        try {
            $attempt = $this->attemptService->startPublicAttempt(
                $sessionToken,
                $validated['guest_name'],
                $validated['guest_email'] ?? null,
                $validated['guest_phone'] ?? null,
                $request
            );
        } catch (ExamAccessException $exception) {
            return back()->withErrors(['token' => $exception->userMessage()]);
        }

        return redirect()
            ->route('exam.public.attempts.show', $attempt)
            ->withCookie(cookie('guest_exam_token', $attempt->guest_session_token, 300))
            ->with('success', 'Ujian publik berhasil dimulai.');
    }

    public function showAttempt(Request $request, ExamAttempt $attempt): Response
    {
        $this->authorizeGuestAccess($request, $attempt);

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

        return Inertia::render('Public/Exam/AttemptShow', [
            'participant' => [
                'name' => $attempt->participantName(),
                'email' => $attempt->participantEmail(),
                'is_guest' => true,
            ],
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
        $this->authorizeGuestAccess($request, $attempt);

        $attempt = $this->attemptService->syncExpired($attempt, $request);
        $attempt->loadMissing(['session', 'package']);

        return response()->json([
            'server_time' => now()->toISOString(),
            'attempt' => $this->attemptPayload($attempt, true),
        ]);
    }

    public function saveAnswer(Request $request, ExamAttempt $attempt): JsonResponse
    {
        $this->authorizeGuestAccess($request, $attempt);

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
        $this->authorizeGuestAccess($request, $attempt);

        try {
            $submitted = $this->submitAttempt->handle($attempt, false, $request);
        } catch (ExamAccessException $exception) {
            return back()->withErrors(['exam' => $exception->userMessage()]);
        }

        return redirect()
            ->route('exam.public.attempts.show', $attempt)
            ->with('success', $submitted->status === ExamAttempt::STATUS_AUTO_SUBMITTED
                ? 'Waktu ujian berakhir dan jawaban tersimpan berhasil dikumpulkan.'
                : 'Jawaban ujian publik berhasil dikumpulkan. Terima kasih!');
    }

    public function logViolation(Request $request, ExamAttempt $attempt): JsonResponse
    {
        $this->authorizeGuestAccess($request, $attempt);

        if (! $attempt->isInProgress()) {
            return response()->json(['violations_count' => $attempt->violations_count]);
        }

        $type = $request->input('type', 'exit_fullscreen');
        $attempt->increment('violations_count');

        $metadata = $attempt->metadata ?? [];
        $logs = $metadata['violations_log'] ?? [];
        $logs[] = [
            'type' => $type,
            'timestamp' => now()->toISOString(),
            'user_agent' => $request->userAgent(),
        ];
        $metadata['violations_log'] = array_slice($logs, -50);
        $attempt->metadata = $metadata;
        $attempt->save();

        return response()->json([
            'message' => 'Pelanggaran dicatat.',
            'violations_count' => $attempt->violations_count,
        ]);
    }

    private function authorizeGuestAccess(Request $request, ExamAttempt $attempt): void
    {
        $token = $request->cookie('guest_exam_token') ?? $request->header('X-Guest-Exam-Token');

        abort_unless(
            $attempt->isGuest() && $token && hash_equals((string) $attempt->guest_session_token, (string) $token),
            403,
            'Akses pengerjaan ujian umum tidak valid atau sesi berakhir.'
        );
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
            'violations_count' => $attempt->violations_count,
            'score_visible' => $showScore,
            'percentage_score' => $showScore && $attempt->percentage_score !== null ? (float) $attempt->percentage_score : null,
            'passing_score' => $showScore && $attempt->passing_score !== null ? (float) $attempt->passing_score : null,
            'passed' => $showScore ? $attempt->passed : null,
        ];
    }
}
