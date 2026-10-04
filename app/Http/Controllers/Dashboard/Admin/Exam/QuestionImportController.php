<?php

namespace App\Http\Controllers\Dashboard\Admin\Exam;

use App\Http\Controllers\Controller;
use App\Http\Requests\Exam\ImportExamQuestionsRequest;
use App\Models\Exam\ExamAttempt;
use App\Models\Exam\ExamImportBatch;
use App\Models\Exam\ExamPackage;
use App\Services\Exam\ExamAuditLogger;
use App\Services\Exam\ExamQuestionImportService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class QuestionImportController extends Controller
{
    public function __construct(
        private readonly ExamQuestionImportService $importService,
        private readonly ExamAuditLogger $audit
    ) {}

    public function index(ExamPackage $package): Response
    {
        $package->load('subject:id,name,code');

        return Inertia::render('Dashboard/Admin/Exam/PackageShow', [
            'package' => [
                'id' => $package->id,
                'title' => $package->title,
                'code' => $package->code,
                'subject_name' => $package->subject?->name,
                'status' => $package->status,
                'duration_minutes' => $package->duration_minutes,
                'passing_score' => (float) $package->passing_score,
                'max_attempts' => $package->max_attempts,
                'questions_count' => $package->questions()->count(),
                'sessions_count' => $package->sessions()->count(),
            ],
            'questions' => [],
            'sessions' => [],
            'imports' => $package->importBatches()
                ->withCount('questions')
                ->latest()
                ->get()
                ->map(fn (ExamImportBatch $batch) => [
                    'id' => $batch->id,
                    'original_filename' => $batch->original_filename,
                    'status' => $batch->status,
                    'total_rows' => $batch->total_rows,
                    'imported_rows' => $batch->imported_rows,
                    'failed_rows' => $batch->failed_rows,
                    'active_questions_count' => $batch->questions_count,
                    'created_at' => $batch->created_at?->format('d M Y H:i'),
                ]),
            'required_columns' => ExamQuestionImportService::requiredColumns(),
            'max_rows' => ExamQuestionImportService::maxRows(),
        ]);
    }

    public function store(ImportExamQuestionsRequest $request, ExamPackage $package): RedirectResponse
    {
        $batch = $this->importService->import($package, $request->file('file'), $request);

        $message = $batch->status === ExamImportBatch::STATUS_FAILED
            ? 'Import gagal. Periksa laporan kegagalan.'
            : "Import selesai: {$batch->imported_rows} berhasil, {$batch->failed_rows} gagal.";

        return redirect()
            ->route('admin.exams.imports.show', $batch)
            ->with($batch->status === ExamImportBatch::STATUS_FAILED ? 'error' : 'success', $message);
    }

    public function show(ExamImportBatch $batch): Response
    {
        $batch->load(['package:id,title', 'subject:id,name', 'uploader:id,name']);
        $batch->loadCount('questions');

        return Inertia::render('Dashboard/Admin/Exam/ImportBatchShow', [
            'batch' => [
                'id' => $batch->id,
                'package_id' => $batch->exam_package_id,
                'package_title' => $batch->package?->title,
                'subject_name' => $batch->subject?->name,
                'uploaded_by' => $batch->uploader?->name,
                'original_filename' => $batch->original_filename,
                'status' => $batch->status,
                'total_rows' => $batch->total_rows,
                'imported_rows' => $batch->imported_rows,
                'failed_rows' => $batch->failed_rows,
                'active_questions_count' => $batch->questions_count,
                'missing_columns' => $batch->missing_columns ?? [],
                'failure_report' => $batch->failure_report ?? [],
                'started_at' => $batch->started_at?->format('d M Y H:i'),
                'finished_at' => $batch->finished_at?->format('d M Y H:i'),
            ],
        ]);
    }

    public function destroyQuestions(ExamImportBatch $batch, Request $request): RedirectResponse
    {
        $hasActiveAttempts = ExamAttempt::query()
            ->where('exam_package_id', $batch->exam_package_id)
            ->where('status', ExamAttempt::STATUS_IN_PROGRESS)
            ->exists();

        if ($hasActiveAttempts) {
            return back()->withErrors([
                'batch' => 'Tidak dapat menghapus soal batch karena saat ini terdapat sesi ujian aktif yang sedang dikerjakan peserta.',
            ]);
        }

        $count = $batch->questions()->count();

        if ($count === 0) {
            return back()->with('info', 'Tidak ada soal aktif dari batch import ini yang dapat dihapus.');
        }

        $batch->questions()->delete();

        $package = $batch->package;
        if ($package && $package->status === ExamPackage::STATUS_PUBLISHED && ! $package->questions()->where('is_active', true)->exists()) {
            $package->update(['status' => ExamPackage::STATUS_DRAFT]);
        }

        $this->audit->log('exam_import_batch_questions_deleted', [
            'exam_package_id' => $batch->exam_package_id,
            'metadata' => [
                'batch_id' => $batch->id,
                'original_filename' => $batch->original_filename,
                'questions_deleted' => $count,
            ],
        ], $request);

        return back()->with('success', "Soal dari batch import '{$batch->original_filename}' ({$count} butir) berhasil dihapus dari bank soal. Riwayat import tetap tersimpan.");
    }
}
