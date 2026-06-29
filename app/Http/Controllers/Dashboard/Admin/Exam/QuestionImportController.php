<?php

namespace App\Http\Controllers\Dashboard\Admin\Exam;

use App\Http\Controllers\Controller;
use App\Http\Requests\Exam\ImportExamQuestionsRequest;
use App\Models\Exam\ExamImportBatch;
use App\Models\Exam\ExamPackage;
use App\Services\Exam\ExamQuestionImportService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class QuestionImportController extends Controller
{
    public function __construct(
        private readonly ExamQuestionImportService $importService
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
                ->latest()
                ->get()
                ->map(fn (ExamImportBatch $batch) => [
                    'id' => $batch->id,
                    'original_filename' => $batch->original_filename,
                    'status' => $batch->status,
                    'total_rows' => $batch->total_rows,
                    'imported_rows' => $batch->imported_rows,
                    'failed_rows' => $batch->failed_rows,
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
                'missing_columns' => $batch->missing_columns ?? [],
                'failure_report' => $batch->failure_report ?? [],
                'started_at' => $batch->started_at?->format('d M Y H:i'),
                'finished_at' => $batch->finished_at?->format('d M Y H:i'),
            ],
        ]);
    }
}
