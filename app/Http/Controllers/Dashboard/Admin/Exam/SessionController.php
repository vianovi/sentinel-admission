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
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class SessionController extends Controller
{
    public function __construct(
        private readonly ExamAuditLogger $audit
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
        $session = ExamSession::create([
            ...$request->validated(),
            'created_by' => $request->user()?->id,
            'show_result_to_candidate' => $request->boolean('show_result_to_candidate'),
            'status' => $request->input('status', ExamSession::STATUS_DRAFT),
        ]);

        return redirect()
            ->route('admin.exams.sessions.show', $session)
            ->with('success', 'Sesi ujian berhasil dibuat.');
    }

    public function show(ExamSession $session): Response
    {
        $session->load([
            'package:id,title,exam_subject_id',
            'package.subject:id,name,code',
            'admissionWave:id,title,academic_year',
            'candidates.candidate:id,candidate_code,full_name,nisn,status,program_choice,admission_wave_id',
        ]);

        $assignedCandidateIds = $session->candidates->pluck('candidate_id')->all();

        return Inertia::render('Dashboard/Admin/Exam/SessionShow', [
            'session' => [
                ...$this->sessionRow($session),
                'description' => $session->description,
                'instructions' => $session->instructions,
                'package_subject' => $session->package?->subject?->name,
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
                'admission_wave_id' => $session->admission_wave_id,
                'description' => $session->description,
                'instructions' => $session->instructions,
                'opens_at_input' => $session->opens_at?->format('Y-m-d\TH:i'),
                'closes_at_input' => $session->closes_at?->format('Y-m-d\TH:i'),
                'show_result_to_candidate' => $session->show_result_to_candidate,
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

        $session->update([
            ...$request->validated(),
            'show_result_to_candidate' => $request->boolean('show_result_to_candidate'),
        ]);

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
        $created = 0;

        foreach ($validated['candidate_ids'] as $candidateId) {
            $assignment = ExamSessionCandidate::firstOrCreate(
                [
                    'exam_session_id' => $session->id,
                    'candidate_id' => $candidateId,
                ],
                [
                    'assigned_by' => $request->user()?->id,
                    'status' => ExamSessionCandidate::STATUS_ELIGIBLE,
                    'assigned_at' => now(),
                    'note' => $validated['note'] ?? null,
                ]
            );

            if ($assignment->wasRecentlyCreated) {
                $created++;
                $this->audit->log('candidate_assigned', [
                    'candidate_id' => $candidateId,
                    'exam_session_id' => $session->id,
                    'exam_package_id' => $session->exam_package_id,
                    'metadata' => ['assignment_id' => $assignment->id],
                ], $request);
            }
        }

        return back()->with('success', "{$created} kandidat berhasil ditugaskan ke sesi ujian.");
    }

    private function sessionRow(ExamSession $session): array
    {
        return [
            'id' => $session->id,
            'exam_package_id' => $session->exam_package_id,
            'package_title' => $session->package?->title,
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
            'candidates_count' => $session->candidates_count ?? $session->candidates()->count(),
            'attempts_count' => $session->attempts_count ?? $session->attempts()->count(),
        ];
    }

    private function packageOptions(): array
    {
        return ExamPackage::whereIn('status', ['draft', 'published'])
            ->orderBy('title')
            ->get(['id', 'title', 'duration_minutes', 'passing_score', 'max_attempts', 'show_result_to_candidate'])
            ->map(fn (ExamPackage $package) => [
                'id' => $package->id,
                'title' => $package->title,
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
}
