<?php

namespace App\Http\Controllers\Dashboard\Admin\Exam;

use App\Http\Controllers\Controller;
use App\Http\Requests\Exam\StoreExamPackageRequest;
use App\Models\Exam\ExamPackage;
use App\Models\Exam\ExamSubject;
use App\Services\Exam\ExamAuditLogger;
use App\Services\Exam\ExamPackageTemplateService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Inertia\Inertia;
use Inertia\Response;

class PackageController extends Controller
{
    public function __construct(
        private readonly ExamAuditLogger $audit,
        private readonly ExamPackageTemplateService $templateService
    ) {}

    public function index(): Response
    {
        return Inertia::render('Dashboard/Admin/Exam/Packages', [
            'packages' => ExamPackage::with(['subject:id,name,code'])
                ->withCount(['questions', 'sessions'])
                ->latest()
                ->get()
                ->map(fn (ExamPackage $package) => $this->packageRow($package)),
            'subjects' => $this->subjectOptions(),
            'editing_package' => null,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Dashboard/Admin/Exam/Packages', [
            'packages' => ExamPackage::with(['subject:id,name,code'])
                ->withCount(['questions', 'sessions'])
                ->latest()
                ->get()
                ->map(fn (ExamPackage $package) => $this->packageRow($package)),
            'subjects' => $this->subjectOptions(),
            'editing_package' => null,
            'mode' => 'create',
        ]);
    }

    public function store(StoreExamPackageRequest $request): RedirectResponse
    {
        $package = ExamPackage::create([
            ...$request->validated(),
            'created_by' => $request->user()?->id,
            'randomize_questions' => $request->boolean('randomize_questions'),
            'randomize_options' => $request->boolean('randomize_options'),
            'show_result_to_candidate' => $request->boolean('show_result_to_candidate'),
            'status' => $request->input('status', ExamPackage::STATUS_DRAFT),
        ]);

        $this->audit->log('exam_package_created', [
            'exam_package_id' => $package->id,
            'metadata' => ['title' => $package->title],
        ], $request);

        return redirect()
            ->route('admin.exams.packages.show', $package)
            ->with('success', 'Paket ujian berhasil dibuat.');
    }

    public function show(ExamPackage $package): Response
    {
        $package->load(['subject:id,name,code', 'questions' => fn ($query) => $query->latest()->take(20), 'sessions' => fn ($query) => $query->latest()->take(10), 'importBatches' => fn ($query) => $query->latest()->take(10)]);

        return Inertia::render('Dashboard/Admin/Exam/PackageShow', [
            'package' => [
                ...$this->packageRow($package),
                'description' => $package->description,
                'randomize_questions' => $package->randomize_questions,
                'randomize_options' => $package->randomize_options,
                'show_result_to_candidate' => $package->show_result_to_candidate,
            ],
            'questions' => $package->questions->map(fn ($question) => [
                'id' => $question->id,
                'question_text' => $question->question_text,
                'options' => $question->options,
                'correct_answer' => $question->correct_answer,
                'point' => (float) $question->point,
                'difficulty' => $question->difficulty,
                'is_active' => $question->is_active,
            ]),
            'sessions' => $package->sessions->map(fn ($session) => [
                'id' => $session->id,
                'title' => $session->title,
                'status' => $session->status,
                'opens_at' => $session->opens_at?->format('d M Y H:i'),
                'closes_at' => $session->closes_at?->format('d M Y H:i'),
                'duration_minutes' => $session->duration_minutes,
            ]),
            'imports' => $package->importBatches->map(fn ($batch) => [
                'id' => $batch->id,
                'original_filename' => $batch->original_filename,
                'status' => $batch->status,
                'total_rows' => $batch->total_rows,
                'imported_rows' => $batch->imported_rows,
                'failed_rows' => $batch->failed_rows,
                'created_at' => $batch->created_at?->format('d M Y H:i'),
            ]),
            'required_columns' => \App\Services\Exam\ExamQuestionImportService::requiredColumns(),
            'max_rows' => \App\Services\Exam\ExamQuestionImportService::maxRows(),
        ]);
    }

    public function downloadTemplate(ExamPackage $package): BinaryFileResponse|HttpResponse
    {
        try {
            $template = $this->templateService->generate($package);
        } catch (\Throwable $exception) {
            Log::error('Exam package template download failed', [
                'package_id' => $package->id,
                'error_code' => $exception->getMessage(),
                'exception' => $exception::class,
            ]);

            return response('Template soal belum dapat dibuat. Periksa dukungan XLSX/ZIP di server lalu coba lagi.', 503, [
                'Content-Type' => 'text/plain; charset=UTF-8',
                'X-Content-Type-Options' => 'nosniff',
            ]);
        }

        return response()
            ->download($template['path'], $template['filename'], [
                'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ])
            ->deleteFileAfterSend(true);
    }

    public function edit(ExamPackage $package): Response
    {
        $package->load('subject:id,name,code');

        return Inertia::render('Dashboard/Admin/Exam/Packages', [
            'packages' => ExamPackage::with(['subject:id,name,code'])
                ->withCount(['questions', 'sessions'])
                ->latest()
                ->get()
                ->map(fn (ExamPackage $item) => $this->packageRow($item)),
            'subjects' => $this->subjectOptions(),
            'editing_package' => [
                ...$this->packageRow($package),
                'exam_subject_id' => $package->exam_subject_id,
                'description' => $package->description,
                'randomize_questions' => $package->randomize_questions,
                'randomize_options' => $package->randomize_options,
                'show_result_to_candidate' => $package->show_result_to_candidate,
            ],
            'mode' => 'edit',
        ]);
    }

    public function update(StoreExamPackageRequest $request, ExamPackage $package): RedirectResponse
    {
        $package->update([
            ...$request->validated(),
            'randomize_questions' => $request->boolean('randomize_questions'),
            'randomize_options' => $request->boolean('randomize_options'),
            'show_result_to_candidate' => $request->boolean('show_result_to_candidate'),
        ]);

        return redirect()
            ->route('admin.exams.packages.show', $package)
            ->with('success', 'Paket ujian berhasil diperbarui.');
    }

    public function destroy(ExamPackage $package): RedirectResponse
    {
        if ($package->questions()->exists() || $package->sessions()->exists()) {
            return back()->withErrors([
                'package' => 'Paket tidak bisa dihapus karena masih memiliki soal atau sesi.',
            ]);
        }

        $package->delete();

        return redirect()
            ->route('admin.exams.packages.index')
            ->with('success', 'Paket ujian berhasil dihapus.');
    }

    public function publish(ExamPackage $package, \Illuminate\Http\Request $request): RedirectResponse
    {
        if (! $package->questions()->where('is_active', true)->exists()) {
            return back()->withErrors([
                'package' => 'Paket belum bisa dipublish karena belum memiliki soal aktif.',
            ]);
        }

        $package->update([
            'status' => ExamPackage::STATUS_PUBLISHED,
            'published_at' => now(),
        ]);

        $this->audit->log('exam_package_published', [
            'exam_package_id' => $package->id,
            'metadata' => ['title' => $package->title],
        ], $request);

        return back()->with('success', 'Paket ujian berhasil dipublish.');
    }

    public function close(ExamPackage $package): RedirectResponse
    {
        $package->update(['status' => ExamPackage::STATUS_CLOSED]);

        return back()->with('success', 'Paket ujian berhasil ditutup.');
    }

    private function packageRow(ExamPackage $package): array
    {
        return [
            'id' => $package->id,
            'exam_subject_id' => $package->exam_subject_id,
            'subject_name' => $package->subject?->name,
            'title' => $package->title,
            'code' => $package->code,
            'duration_minutes' => $package->duration_minutes,
            'passing_score' => (float) $package->passing_score,
            'max_attempts' => $package->max_attempts,
            'status' => $package->status,
            'questions_count' => $package->questions_count ?? $package->questions()->count(),
            'sessions_count' => $package->sessions_count ?? $package->sessions()->count(),
            'created_at' => $package->created_at?->format('d M Y'),
        ];
    }

    private function subjectOptions(): array
    {
        return ExamSubject::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'code'])
            ->map(fn (ExamSubject $subject) => [
                'id' => $subject->id,
                'name' => $subject->name,
                'code' => $subject->code,
            ])
            ->all();
    }
}
