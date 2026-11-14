<?php

namespace App\Http\Controllers\Dashboard\Admin\Exam;

use App\Http\Controllers\Controller;
use App\Http\Requests\Exam\AssignExamCandidatesRequest;
use App\Http\Requests\Exam\StoreExamSessionRequest;
use App\Models\AdmissionWave;
use App\Models\Candidate;
use App\Models\Exam\ExamPackage;
use App\Models\Exam\ExamSession;
use App\Models\Exam\ExamSessionCandidate;
use App\Services\Exam\ExamAuditLogger;
use App\Services\Exam\ExamSessionService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class SessionController extends Controller
{
    public function __construct(
        private readonly ExamAuditLogger $audit,
        private readonly ExamSessionService $sessionService
    ) {}

    public function index(): Response
    {
        return Inertia::render('Dashboard/Admin/Exam/Sessions', [
            'sessions' => ExamSession::with(['package:id,title', 'admissionWave:id,title,academic_year'])
                ->withCount(['candidates', 'attempts'])
                ->latest()
                ->get()
                ->map(fn (ExamSession $session) => $this->sessionRow($session)),
            'packages' => $this->packageOptions(),
            'waves' => $this->waveOptions(),
            'editing_session' => null,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Dashboard/Admin/Exam/Sessions', [
            'sessions' => ExamSession::with(['package:id,title', 'admissionWave:id,title,academic_year'])
                ->withCount(['candidates', 'attempts'])
                ->latest()
                ->get()
                ->map(fn (ExamSession $session) => $this->sessionRow($session)),
            'packages' => $this->packageOptions(),
            'waves' => $this->waveOptions(),
            'editing_session' => null,
            'mode' => 'create',
        ]);
    }

    public function store(StoreExamSessionRequest $request): RedirectResponse
    {
        $packageIds = $request->input('package_ids', []);
        $primaryPackageId = $packageIds[0] ?? $request->input('exam_package_id');

        $session = ExamSession::create([
            ...$request->safe()->except(['package_ids']),
            'exam_package_id' => $primaryPackageId,
            'created_by' => $request->user()?->id,
            'show_result_to_candidate' => $request->boolean('show_result_to_candidate'),
            'status' => $request->input('status', ExamSession::STATUS_DRAFT),
        ]);

        $this->syncPackages($session, $packageIds ?: [$primaryPackageId]);

        return redirect()
            ->route('admin.exams.sessions.show', $session)
            ->with('success', 'Sesi ujian berhasil dibuat.');
    }

    public function show(ExamSession $session): Response
    {
        $session->load([
            'packages:id,title,code,exam_subject_id,duration_minutes,passing_score,max_attempts',
            'packages.subject:id,name,code',
            'package:id,title,exam_subject_id',
            'package.subject:id,name,code',
            'admissionWave:id,title,academic_year',
            'candidates.candidate:id,candidate_code,full_name,nisn,status,program_choice,admission_wave_id',
        ]);

        $assignedCandidateIds = $session->candidates->pluck('candidate_id')->all();

        $sessionPackages = $session->packages->isNotEmpty()
            ? $session->packages
            : collect($session->package ? [$session->package] : []);

        return Inertia::render('Dashboard/Admin/Exam/SessionShow', [
            'session' => [
                ...$this->sessionRow($session),
                'description' => $session->description,
                'instructions' => $session->instructions,
                'package_subject' => $sessionPackages->first()?->subject?->name,
                'packages' => $sessionPackages->map(fn (ExamPackage $pkg) => [
                    'id' => $pkg->id,
                    'title' => $pkg->title,
                    'code' => $pkg->code ?? null,
                    'subject' => $pkg->subject?->name,
                    'duration_minutes' => $pkg->duration_minutes,
                    'passing_score' => (float) $pkg->passing_score,
                    'max_attempts' => $pkg->max_attempts,
                ])->values(),
            ],
            'assigned_candidates' => $session->candidates->map(fn (ExamSessionCandidate $assignment) => [
                'id' => $assignment->id,
                'status' => $assignment->status,
                'assigned_at' => $assignment->assigned_at?->format('d M Y H:i'),
                'candidate' => [
                    'id' => $assignment->candidate?->id,
                    'candidate_code' => $assignment->candidate?->candidate_code,
                    'full_name' => $assignment->candidate?->full_name,
                    'nisn' => $assignment->candidate?->nisn,
                    'status' => $assignment->candidate?->status,
                    'program_choice' => $assignment->candidate?->program_choice,
                ],
            ])->values(),
            'available_candidates' => Candidate::with('admissionWave:id,title')
                ->whereNotIn('id', $assignedCandidateIds)
                ->whereNotIn('status', ['draft', 'rejected'])
                ->latest()
                ->take(200)
                ->get()
                ->map(fn (Candidate $candidate) => [
                    'id' => $candidate->id,
                    'candidate_code' => $candidate->candidate_code,
                    'full_name' => $candidate->full_name,
                    'nisn' => $candidate->nisn,
                    'status' => $candidate->status,
                    'program_choice' => $candidate->program_choice,
                    'admission_wave' => $candidate->admissionWave?->title,
                ]),
        ]);
    }

    public function edit(ExamSession $session): Response
    {
        $session->load('packages:id');

        return Inertia::render('Dashboard/Admin/Exam/Sessions', [
            'sessions' => ExamSession::with(['package:id,title', 'admissionWave:id,title,academic_year'])
                ->withCount(['candidates', 'attempts'])
                ->latest()
                ->get()
                ->map(fn (ExamSession $item) => $this->sessionRow($item)),
            'packages' => $this->packageOptions(),
            'waves' => $this->waveOptions(),
            'editing_session' => [
                ...$this->sessionRow($session),
                'exam_package_id' => $session->exam_package_id,
                'package_ids' => $session->packages->pluck('id')->values()->all(),
                'admission_wave_id' => $session->admission_wave_id,
                'description' => $session->description,
                'instructions' => $session->instructions,
                'opens_at_input' => $session->opens_at?->format('Y-m-d\TH:i'),
                'closes_at_input' => $session->closes_at?->format('Y-m-d\TH:i'),
                'show_result_to_candidate' => $session->show_result_to_candidate,
                'package_order_type' => $session->package_order_type,
            ],
            'mode' => 'edit',
        ]);
    }

    public function update(StoreExamSessionRequest $request, ExamSession $session): RedirectResponse
    {
        if ($session->attempts()->exists()) {
            return back()->withErrors([
                'session' => 'Sesi yang sudah memiliki attempt tidak bisa diubah. Tutup sesi lalu buat sesi baru jika jadwal berubah.',
            ]);
        }

        $packageIds = $request->input('package_ids', []);
        $primaryPackageId = $packageIds[0] ?? $request->input('exam_package_id');

        $session->update([
            ...$request->safe()->except(['package_ids']),
            'exam_package_id' => $primaryPackageId,
            'show_result_to_candidate' => $request->boolean('show_result_to_candidate'),
        ]);

        $this->syncPackages($session, $packageIds ?: [$primaryPackageId]);

        return redirect()
            ->route('admin.exams.sessions.show', $session)
            ->with('success', 'Sesi ujian berhasil diperbarui.');
    }

    public function destroy(ExamSession $session): RedirectResponse
    {
        if ($session->attempts()->exists()) {
            return back()->withErrors([
                'session' => 'Sesi yang sudah memiliki attempt tidak bisa dihapus.',
            ]);
        }

        $session->delete();

        return redirect()
            ->route('admin.exams.sessions.index')
            ->with('success', 'Sesi ujian berhasil dihapus.');
    }

    public function assignCandidates(AssignExamCandidatesRequest $request, ExamSession $session): RedirectResponse
    {
        $validated = $request->validated();
        $created = $this->sessionService->assignCandidates(
            $session,
            $validated['candidate_ids'],
            $validated['note'] ?? null,
            $request
        );

        return back()->with('success', "{$created} kandidat berhasil ditugaskan ke sesi ujian.");
    }

    private function sessionRow(ExamSession $session): array
    {
        $packageTitles = $session->relationLoaded('packages') && $session->packages->isNotEmpty()
            ? $session->packages->pluck('title')->implode(', ')
            : $session->package?->title;

        return [
            'id' => $session->id,
            'exam_package_id' => $session->exam_package_id,
            'package_title' => $packageTitles,
            'packages_count' => $session->relationLoaded('packages') ? $session->packages->count() : 1,
            'admission_wave_id' => $session->admission_wave_id,
            'admission_wave' => $session->admissionWave
                ? "{$session->admissionWave->title} - {$session->admissionWave->academic_year}"
                : null,
            'title' => $session->title,
            'status' => $session->status,
            'opens_at' => $session->opens_at?->format('d M Y H:i'),
            'closes_at' => $session->closes_at?->format('d M Y H:i'),
            'duration_minutes' => $session->duration_minutes,
            'passing_score' => (float) $session->passing_score,
            'max_attempts' => $session->max_attempts,
            'show_result_to_candidate' => $session->show_result_to_candidate,
            'package_order_type' => $session->package_order_type,
            'candidates_count' => $session->candidates_count ?? $session->candidates()->count(),
            'attempts_count' => $session->attempts_count ?? $session->attempts()->count(),
        ];
    }

    private function packageOptions(): array
    {
        return ExamPackage::whereIn('status', ['draft', 'published'])
            ->orderBy('title')
            ->get(['id', 'title', 'code', 'duration_minutes', 'passing_score', 'max_attempts', 'show_result_to_candidate'])
            ->map(fn (ExamPackage $package) => [
                'id' => $package->id,
                'title' => $package->title,
                'code' => $package->code ?? null,
                'duration_minutes' => $package->duration_minutes,
                'passing_score' => (float) $package->passing_score,
                'max_attempts' => $package->max_attempts,
                'show_result_to_candidate' => $package->show_result_to_candidate,
            ])
            ->all();
    }

    private function waveOptions(): array
    {
        return AdmissionWave::orderByDesc('created_at')
            ->get(['id', 'title', 'academic_year'])
            ->map(fn (AdmissionWave $wave) => [
                'id' => $wave->id,
                'title' => "{$wave->title} - {$wave->academic_year}",
            ])
            ->all();
    }

    private function syncPackages(ExamSession $session, array $packageIds): void
    {
        $syncData = [];
        foreach (array_values(array_unique($packageIds)) as $index => $packageId) {
            $syncData[$packageId] = ['sort_order' => $index];
        }

        $session->packages()->sync($syncData);
    }
}
