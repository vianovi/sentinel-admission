<?php

namespace App\Http\Controllers\Dashboard\Admin\Exam;

use App\Http\Controllers\Controller;
use App\Models\Exam\ExamAttempt;
use App\Models\Exam\ExamSessionCandidate;
use App\Services\Exam\ExamAttemptService;
use App\Services\Exam\ExamAuditLogger;
use App\Services\Exam\ExamResultPresenter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ResultController extends Controller
{
    public function __construct(
        private readonly ExamAuditLogger $audit,
        private readonly ExamAttemptService $attempts,
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
            'summary' => [
                'total' => ExamAttempt::query()->count(),
                'active' => ExamAttempt::query()->where('status', ExamAttempt::STATUS_IN_PROGRESS)->count(),
                'flagged' => ExamAttempt::query()->where('violations_count', '>', 0)->count(),
                'completed' => ExamAttempt::query()
                    ->whereIn('status', [ExamAttempt::STATUS_SUBMITTED, ExamAttempt::STATUS_AUTO_SUBMITTED])
                    ->count(),
            ],
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

    public function forceStop(Request $request, ExamAttempt $attempt): RedirectResponse
    {
        abort_unless($attempt->isInProgress(), 422, 'Attempt ini sudah berhenti.');

        $this->attempts->submit($attempt, true, $request);

        return back()->with('success', 'Ujian peserta dihentikan paksa dan jawaban tersimpan sudah dinilai.');
    }

    public function destroyHistory(Request $request, ExamAttempt $attempt): RedirectResponse
    {
        DB::transaction(function () use ($attempt, $request): void {
            $attempt = ExamAttempt::query()
                ->whereKey($attempt->id)
                ->lockForUpdate()
                ->firstOrFail();

            abort_if($attempt->isInProgress(), 422, 'Hentikan paksa ujian yang masih berlangsung sebelum menghapus riwayatnya.');

            $assignment = ExamSessionCandidate::query()
                ->whereKey($attempt->exam_session_candidate_id)
                ->lockForUpdate()
                ->firstOrFail();

            $history = ExamAttempt::query()
                ->where('exam_session_candidate_id', $assignment->id)
                ->lockForUpdate()
                ->get();

            abort_if($history->contains(fn (ExamAttempt $item): bool => $item->isInProgress()), 422, 'Hentikan paksa semua ujian aktif peserta sebelum menghapus riwayatnya.');

            $attemptIds = $history->pluck('id')->all();

            ExamAttempt::query()->whereKey($attemptIds)->delete();
            $assignment->update(['status' => ExamSessionCandidate::STATUS_ELIGIBLE]);

            $this->audit->log('attempt_history_deleted', [
                'candidate_id' => $attempt->candidate_id,
                'exam_session_id' => $attempt->exam_session_id,
                'exam_package_id' => $attempt->exam_package_id,
                'metadata' => ['deleted_attempt_ids' => $attemptIds],
            ], $request);
        });

        return back()
            ->with('success', 'Riwayat ujian peserta berhasil dihapus dan akses ujian dibuka kembali.');
    }
}
