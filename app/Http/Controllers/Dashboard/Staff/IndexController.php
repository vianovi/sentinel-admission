<?php

namespace App\Http\Controllers\Dashboard\Staff;

use App\Http\Controllers\Controller;
use App\Models\AdmissionWave;
use App\Models\Candidate;
use App\Models\CandidateDocument;
use App\Models\Payment;
use App\Services\CandidateStatus\CandidateStatusService;
use App\Services\PaymentService;
use App\Services\StaffCandidate\StaffCandidateOperationalService;
use App\Services\StaffPayment\StaffPaymentOperationalService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class IndexController extends Controller
{
    private const STAFF_SECTIONS = ['data-diri', 'data-kesehatan', 'data-wali', 'dokumen', 'pembayaran'];

    private const HEALTH_DOC_FIELDS = [
        'chronic-disease' => [
            'column' => 'chronic_disease_doc_path',
            'label' => 'Dokumen Hasil Lab / CT Scan / USG',
            'icon' => 'fa-solid fa-file-waveform',
        ],
        'surat-sehat' => [
            'column' => 'surat_sehat_path',
            'label' => 'Surat Keterangan Sehat',
            'icon' => 'fa-solid fa-file-medical',
        ],
        'bpjs-card' => [
            'column' => 'bpjs_card_path',
            'label' => 'Kartu BPJS / JKN',
            'icon' => 'fa-solid fa-id-card',
        ],
        'vaccine-card' => [
            'column' => 'vaccine_card_path',
            'label' => 'Kartu Vaksin / Imunisasi',
            'icon' => 'fa-solid fa-syringe',
        ],
    ];

    public function __construct(
        private readonly PaymentService $paymentService,
        private readonly CandidateStatusService $statusService,
        private readonly StaffCandidateOperationalService $staffCandidates,
        private readonly StaffPaymentOperationalService $staffPayments
    ) {}

    // =============================================
    // GET /dashboard/staff
    // =============================================

    public function index(): Response
    {
        // ── Stats per status ─────────────────────────────────────────────────
        $statusCounts = Candidate::select('status', \Illuminate\Support\Facades\DB::raw('count(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status');

        $stats = [
            'total' => $statusCounts->sum(),
            'draft' => $statusCounts->get('draft', 0),
            'submitted' => $statusCounts->get('submitted', 0),
            'verified' => $statusCounts->get('verified', 0),
            'accepted' => $statusCounts->get('accepted', 0),
            'rejected' => $statusCounts->get('rejected', 0),
        ];

        // ── Submission trend 7 hari terakhir ─────────────────────────────────
        $submissionTrend = Candidate::where('status', '!=', 'draft')
            ->whereBetween('created_at', [now()->subDays(6)->startOfDay(), now()])
            ->select(DB::raw('DATE(created_at) as date'), DB::raw('COUNT(*) as count'))
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(fn ($item) => [
                'date' => \Carbon\Carbon::parse($item->date)->format('d M'),
                'count' => $item->count,
            ]);

        // Fill missing days dengan 0
        $trendFilled = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i);
            $formatted = $date->format('d M');
            $existing = $submissionTrend->firstWhere('date', $formatted);
            $trendFilled[] = [
                'date' => $formatted,
                'count' => $existing ? $existing['count'] : 0,
            ];
        }

        // ── Recent submissions ───────────────────────────────────────────────
        $recentSubmissions = Candidate::with('admissionWave')
            ->where('status', 'submitted')
            ->latest()
            ->take(5)
            ->get()
            ->map(fn ($c) => [
                'id' => $c->id,
                'candidate_code' => $c->candidate_code,
                'full_name' => $c->full_name,
                'school_origin' => $c->school_origin,
                'admission_wave' => $c->admissionWave?->title,
                'created_at' => $c->created_at->format('d M Y'),
            ]);

        return Inertia::render('Dashboard/Staff/Index', [
            'stats' => $stats,
            'submission_trend' => $trendFilled,
            'recent_submissions' => $recentSubmissions,
        ]);
    }

    // =============================================
    // GET /dashboard/staff/candidates
    // =============================================

    public function candidates(Request $request): Response
    {
        $search = trim((string) $request->input('search', ''));
        $status = trim((string) $request->input('status', ''));
        $wave = trim((string) $request->input('wave', ''));
        $program = trim((string) $request->input('program', ''));
        $action = trim((string) $request->input('action', ''));

        $query = $this->staffCandidates->baseOperationalQuery()
            ->when($search, fn ($q) => $q->where(function ($nested) use ($search) {
                $nested
                    ->where('full_name', 'like', "%{$search}%")
                    ->orWhere('nisn', 'like', "%{$search}%")
                    ->orWhere('candidate_code', 'like', "%{$search}%");
            }))
            ->when($status, fn ($q) => $q->where('status', $status))
            ->when($wave, fn ($q) => $q->where('admission_wave_id', $wave))
            ->when($program, fn ($q) => $q->where('program_choice', $program))
            ->when($action, fn ($q) => $this->staffCandidates->applyActionFilter($q, $action))
            ->latest();

        return Inertia::render('Dashboard/Staff/Candidates', [
            'candidates' => $query->paginate(20)->withQueryString()->through(fn ($c) => [
                'id' => $c->id,
                'candidate_code' => $c->candidate_code,
                'full_name' => $c->full_name,
                'nisn' => $c->nisn,
                'gender_label' => $c->genderLabel(),
                'school_origin' => $c->school_origin,
                'program_choice' => $c->program_choice,
                'status' => $c->status,
                'admission_wave' => $c->admissionWave?->title,
                'doc_count' => $c->documents->count(),
                'doc_pending' => $c->documents->where('status', 'pending')->count(),
                'created_at' => $c->created_at->format('d M Y'),
                'updated_at' => $c->updated_at->format('d M Y H:i'),
                'operational' => $this->staffCandidates->listRow($c),
            ]),
            'summary' => $this->candidateListSummary(),
            'waves' => AdmissionWave::select('id', 'title')->latest()->get(),
            'programs' => $this->programOptions(),
            'action_options' => $this->staffCandidates->actionOptions(),
            'filters' => [
                'search' => $search,
                'status' => $status,
                'wave' => $wave,
                'program' => $program,
                'action' => $action,
            ],
        ]);
    }

    // =============================================
    // GET /dashboard/staff/candidate-status
    // =============================================

    public function candidateStatus(Request $request): Response
    {
        $search = trim((string) $request->input('search', ''));
        $status = trim((string) $request->input('status', ''));
        $wave = trim((string) $request->input('wave', ''));
        $program = trim((string) $request->input('program', ''));
        $waiting = trim((string) $request->input('waiting', ''));

        $baseQuery = $this->staffCandidates->baseOperationalQuery();

        $query = (clone $baseQuery)
            ->when($search, fn ($q) => $q->where(function ($nested) use ($search) {
                $nested
                    ->where('full_name', 'like', "%{$search}%")
                    ->orWhere('nisn', 'like', "%{$search}%")
                    ->orWhere('candidate_code', 'like', "%{$search}%");
            }))
            ->when($status, fn ($q) => $q->where('status', $status))
            ->when($wave, fn ($q) => $q->where('admission_wave_id', $wave))
            ->when($program, fn ($q) => $q->where('program_choice', $program))
            ->latest();

        $rows = $query
            ->limit(90)
            ->get()
            ->map(fn (Candidate $candidate) => $this->candidateStatusRow($candidate))
            ->when($waiting, fn ($collection) => $collection
                ->filter(fn (array $row) => ($row['waiting_side'] ?? '') === $waiting)
                ->values());

        $allRows = $this->staffCandidates->baseOperationalQuery()
            ->latest()
            ->limit(180)
            ->get()
            ->map(fn (Candidate $candidate) => $this->candidateStatusRow($candidate));

        return Inertia::render('Dashboard/Staff/CandidateStatus', [
            'rows' => $rows->values(),
            'summary' => $this->candidateStatusSummary($allRows),
            'waves' => AdmissionWave::select('id', 'title')->latest()->get(),
            'programs' => $this->programOptions(),
            'filters' => [
                'search' => $search,
                'status' => $status,
                'wave' => $wave,
                'program' => $program,
                'waiting' => $waiting,
            ],
        ]);
    }

    // =============================================
    // GET /dashboard/staff/payment-operations
    // =============================================

    public function paymentOperations(Request $request): Response
    {
        $filters = [
            'search' => trim((string) $request->input('search', '')),
            'status' => trim((string) $request->input('status', '')),
            'channel' => trim((string) $request->input('channel', '')),
            'wave' => trim((string) $request->input('wave', '')),
            'program' => trim((string) $request->input('program', '')),
            'action' => trim((string) $request->input('action', '')),
        ];

        $query = $this->staffPayments
            ->applyFilters($this->staffPayments->baseQuery(), $filters)
            ->latest();

        return Inertia::render('Dashboard/Staff/PaymentOperations', [
            'payments' => $this->staffPayments->formatPaginator(
                $query->paginate(20)->withQueryString()
            ),
            'summary' => $this->staffPayments->summary(),
            'waves' => $this->staffPayments->waveOptions()->values(),
            'programs' => $this->staffPayments->programOptions()->values(),
            'action_options' => $this->staffPayments->actionOptions(),
            'filters' => $filters,
        ]);
    }

    // =============================================
    // GET /dashboard/staff/reports
    // =============================================

    public function reports(): Response
    {
        $candidateSummary = $this->candidateListSummary();
        $paymentSummary = $this->staffPayments->summary();
        $actionQueue = $this->staffCandidates->actionQueue('staff', null, 80);

        $statusBreakdown = Candidate::query()
            ->select('status', DB::raw('COUNT(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');

        $recentCandidates = $this->staffCandidates->baseOperationalQuery()
            ->latest()
            ->limit(6)
            ->get()
            ->map(fn (Candidate $candidate) => [
                'id' => $candidate->id,
                'candidate_code' => $candidate->candidate_code,
                'full_name' => $candidate->full_name,
                'status' => $candidate->status,
                'admission_wave' => $candidate->admissionWave?->title,
                'program_choice' => $candidate->program_choice,
                'updated_at' => $candidate->updated_at?->format('d M Y H:i'),
                'operational' => $this->staffCandidates->listRow($candidate),
            ]);

        return Inertia::render('Dashboard/Staff/Reports', [
            'summary' => [
                'candidates' => $candidateSummary + [
                    'draft' => (int) ($statusBreakdown['draft'] ?? 0),
                    'verified' => (int) ($statusBreakdown['verified'] ?? 0),
                    'accepted' => (int) ($statusBreakdown['accepted'] ?? 0),
                    'rejected' => (int) ($statusBreakdown['rejected'] ?? 0),
                ],
                'payments' => $paymentSummary,
                'actions' => [
                    'total' => count($actionQueue['items']),
                    'buckets' => $actionQueue['stats'],
                ],
                'selection' => [
                    'verified_unassigned' => $candidateSummary['verified_unassigned'],
                    'verified_ready' => Candidate::where('status', 'verified')
                        ->whereHas('examSessionCandidates')
                        ->count(),
                ],
            ],
            'charts' => [
                'trend' => $this->reportTrend(),
                'payment_channels' => $this->paymentChannelBreakdown(),
                'payment_statuses' => $this->paymentStatusBreakdown(),
            ],
            'wave_reports' => $this->waveProgramReports(),
            'recent_candidates' => $recentCandidates,
            'generated_at' => now()->format('d M Y H:i'),
        ]);
    }

    // =============================================
    // GET /dashboard/staff/reports/export-settings
    // =============================================

    public function reportExportSettings(): Response
    {
        return Inertia::render('Dashboard/Staff/ReportsExportSettings', [
            'export_groups' => [
                [
                    'key' => 'payment_only',
                    'label' => 'Payment Only',
                    'scope_label' => 'Transaksi pembayaran',
                    'description' => 'Disiapkan untuk rekonsiliasi pembayaran, channel, status, dan nominal snapshot.',
                    'sensitivity' => 'Operasional pembayaran',
                    'status' => 'placeholder',
                    'columns_preview' => [
                        'Order ID',
                        'Kode kandidat',
                        'Nama kandidat',
                        'Gelombang',
                        'Channel',
                        'Status payment',
                        'Base amount',
                        'Fee amount',
                        'Final amount',
                        'Paid at',
                    ],
                ],
                [
                    'key' => 'quick_rekap',
                    'label' => 'Quick Rekap',
                    'scope_label' => 'Ringkasan non-sensitive',
                    'description' => 'Disiapkan untuk rekap cepat tanpa data sensitif kandidat.',
                    'sensitivity' => 'Non-sensitive',
                    'status' => 'placeholder',
                    'columns_preview' => [
                        'Gelombang',
                        'Program',
                        'Total kandidat',
                        'Submitted',
                        'Verified',
                        'Paid',
                        'Manual review',
                        'Blocker aktif',
                        'Verified tanpa sesi',
                    ],
                ],
                [
                    'key' => 'full_data',
                    'label' => 'Full Data',
                    'scope_label' => 'Data lengkap',
                    'description' => 'Disiapkan untuk export lengkap termasuk field sensitif setelah format final dikunci.',
                    'sensitivity' => 'Sensitive',
                    'status' => 'placeholder',
                    'columns_preview' => [
                        'Identitas kandidat',
                        'Kontak',
                        'Alamat',
                        'Data wali',
                        'Kesehatan',
                        'Dokumen',
                        'Payment',
                        'Seleksi',
                        'Lifecycle status',
                    ],
                ],
            ],
            'export_state' => [
                'download_enabled' => false,
                'generator_status' => 'placeholder',
                'download_url' => null,
                'default_group' => 'quick_rekap',
            ],
            'generated_at' => now()->format('d M Y H:i'),
        ]);
    }

    // =============================================
    // GET /dashboard/staff/candidates/{candidate}
    // =============================================

    public function show(Request $request, Candidate $candidate, string $section = 'data-diri'): Response
    {
        abort_unless(in_array($section, self::STAFF_SECTIONS, true), 404);

        $scope = $this->resolveOperationalScope($request);

        $candidate->load([
            'user',
            'admissionWave.programs',
            'documents.verifiedBy',
            'guardian',
            'healthRecord',
        ]);

        $payment = $candidate->payments()
            ->with('verifiedBy')
            ->latest()
            ->first();

        return Inertia::render('Dashboard/Staff/Show', [
            'scope' => $scope,
            'base_path' => "/dashboard/{$scope}",
            'active_section' => $section,
            'candidate' => $this->formatCandidate($candidate),
            'overview' => $this->staffCandidates->detailOverview($candidate, $scope),
            'documents' => $candidate->documents->map(fn ($d) => [
                'id' => $d->id,
                'doc_type' => $d->doc_type,
                'doc_group' => $d->doc_group,
                'original_filename' => $d->original_filename,
                'status' => $d->status,
                'rejection_reason' => $d->rejection_reason,
                'verified_by' => $d->verifiedBy?->name,
                'verified_at' => $d->verified_at?->format('d M Y H:i'),
                'preview_url' => route("{$scope}.documents.preview", $d),
            ])->values(),
            'guardian' => $this->formatGuardian($candidate),
            'health_record' => $this->formatHealthRecord($candidate, $scope),
            'payment' => $this->formatPayment($payment, $scope),
        ]);
    }

    // =============================================
    // POST /dashboard/staff/documents/{document}/verify
    // =============================================

    public function verifyDocument(Request $request, CandidateDocument $document): RedirectResponse
    {
        $request->validate([
            'status' => ['required', 'in:verified,rejected'],
            'rejection_reason' => ['nullable', 'required_if:status,rejected', 'string', 'max:500'],
        ]);

        $document->update([
            'status' => $request->status,
            'rejection_reason' => $request->status === 'rejected' ? $request->rejection_reason : null,
            'verified_by' => Auth::id(),
            'verified_at' => now(),
        ]);

        $this->statusService->syncAfterEvent($document->candidate, 'document.reviewed');

        return back()->with('success', 'Dokumen berhasil diverifikasi.');
    }

    // =============================================
    // POST /dashboard/staff/payments/{payment}/verify
    // =============================================

    public function verifyPayment(Request $request, Payment $payment): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'in:verified,rejected'],
            'rejection_reason' => ['nullable', 'required_if:status,rejected', 'string', 'max:500'],
        ]);

        try {
            if ($validated['status'] === 'verified') {
                $payment = $this->paymentService->verifyProof($payment, Auth::id());
            } else {
                $payment = $this->paymentService->rejectProof(
                    $payment,
                    Auth::id(),
                    $validated['rejection_reason'] ?? ''
                );
            }

            return back()->with('success', 'Status pembayaran berhasil diperbarui.');
        } catch (\Throwable $e) {
            Log::error('Staff payment verification failed', [
                'staff_id' => Auth::id(),
                'payment_id' => $payment->id,
                'error' => $e->getMessage(),
            ]);

            return back()->withErrors([
                'payment' => 'Pembayaran belum bisa diverifikasi. Pastikan bukti sudah diunggah.',
            ]);
        }
    }

    // =============================================
    // POST /dashboard/staff/candidates/{candidate}/status
    // =============================================

    public function updateStatus(Request $request, Candidate $candidate): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'in:accepted,rejected'],
            'reason' => ['nullable', 'required_if:status,rejected', 'string', 'max:500'],
        ]);

        if ($candidate->status !== 'verified') {
            return back()->withErrors([
                'status' => 'Status kandidat hanya bisa diubah setelah kandidat berstatus terverifikasi.',
            ]);
        }

        $candidate->update(['status' => $validated['status']]);

        return back()->with('success', 'Status kandidat berhasil diperbarui.');
    }

    private function formatCandidate(Candidate $candidate): array
    {
        return [
            'id' => $candidate->id,
            'candidate_code' => $candidate->candidate_code,
            'full_name' => $candidate->full_name,
            'nisn' => $candidate->nisn,
            'nik' => $candidate->nik,
            'gender' => $candidate->gender,
            'gender_label' => $candidate->genderLabel(),
            'place_of_birth' => $candidate->place_of_birth,
            'date_of_birth' => $candidate->date_of_birth?->format('Y-m-d'),
            'date_of_birth_label' => $candidate->date_of_birth?->format('d F Y'),
            'address_full' => $candidate->address_full,
            'address_detail' => $candidate->address_detail,
            'school_origin' => $candidate->school_origin,
            'email' => $candidate->email ?? $candidate->user?->email,
            'account_email' => $candidate->user?->email,
            'phone_number' => $candidate->phone_number,
            'religion' => $candidate->religion,
            'child_order' => $candidate->child_order,
            'siblings_count' => $candidate->siblings_count,
            'hobbies' => $candidate->hobbies,
            'ambitions' => $candidate->ambitions,
            'habits' => $candidate->habits,
            'extracurricular_interests' => $candidate->extracurricular_interests ?? [],
            'postal_code' => $candidate->postal_code,
            'school_npsn' => $candidate->school_npsn,
            'certificate_number' => $candidate->certificate_number,
            'birth_certificate_number' => $candidate->birth_certificate_number,
            'family_card_number' => $candidate->family_card_number,
            'program_choice' => $candidate->program_choice,
            'major_choice' => $candidate->major_choice,
            'is_transfer' => (bool) $candidate->is_transfer,
            'status' => $candidate->status,
            'has_pending_change' => $candidate->hasPendingChangeRequest(),
            'data_change_request' => $candidate->data_change_request,
            'admission_wave' => $candidate->admissionWave ? [
                'title' => $candidate->admissionWave->title,
                'academic_year' => $candidate->admissionWave->academic_year,
                'majors_enabled' => $candidate->admissionWave->majors_enabled,
                'available_majors' => $candidate->admissionWave->available_majors ?? [],
                'programs' => $candidate->admissionWave->programs
                    ->where('is_active', true)
                    ->sortBy('priority')
                    ->values()
                    ->map(fn ($p) => [
                        'name' => $p->name,
                        'quota_zone' => $p->quotaZone(),
                        'warning' => $p->warningMessage('staff'),
                        'is_open_quota' => $p->is_open_quota,
                    ])
                    ->all(),
            ] : null,
        ];
    }

    private function formatGuardian(Candidate $candidate): ?array
    {
        $guardian = $candidate->guardian;

        if (! $guardian) {
            return null;
        }

        $data = $guardian->toArray();
        $data['completion_percentage'] = $guardian->completion_percentage;
        $data['father_date_of_birth'] = $guardian->father_date_of_birth?->format('Y-m-d');
        $data['mother_date_of_birth'] = $guardian->mother_date_of_birth?->format('Y-m-d');
        $data['guardian_date_of_birth'] = $guardian->guardian_date_of_birth?->format('Y-m-d');

        return $data;
    }

    private function formatHealthRecord(Candidate $candidate, string $scope): ?array
    {
        $record = $candidate->healthRecord;

        if (! $record) {
            return null;
        }

        $documents = collect(self::HEALTH_DOC_FIELDS)
            ->map(fn ($config, $docType) => [
                'key' => $docType,
                'label' => $config['label'],
                'icon' => $config['icon'],
                'is_required' => $docType === 'bpjs-card',
                'has_file' => ! empty($record->{$config['column']}),
                'preview_url' => ! empty($record->{$config['column']})
                    ? route("{$scope}.health-documents.preview", [$candidate, $docType])
                    : null,
            ])
            ->values();

        return [
            'blood_type' => $record->blood_type,
            'blood_type_label' => $record->blood_type_label,
            'rhesus' => $record->rhesus,
            'rhesus_label' => $record->rhesus_label,
            'height_cm' => $record->height_cm,
            'weight_kg' => $record->weight_kg,
            'bmi' => $record->bmi,
            'bmi_category' => $record->bmi_category,
            'general_health_condition' => $record->general_health_condition,
            'mental_health_notes' => $record->mental_health_notes,
            'eye_right_type' => $record->eye_right_type,
            'eye_right_value' => $record->eye_right_value,
            'eye_right_label' => $record->eye_right_label,
            'eye_left_type' => $record->eye_left_type,
            'eye_left_value' => $record->eye_left_value,
            'eye_left_label' => $record->eye_left_label,
            'eye_condition_since' => $record->eye_condition_since,
            'major_illnesses' => $record->major_illnesses,
            'last_illness' => $record->last_illness,
            'allergy_food' => $record->allergy_food,
            'allergy_medicine' => $record->allergy_medicine,
            'allergy_condition' => $record->allergy_condition,
            'physical_disabilities' => $record->physical_disabilities,
            'special_notes' => $record->special_notes,
            'parent_concern_notes' => $record->parent_concern_notes,
            'completion_percentage' => $record->completionPercentage(),
            'documents' => $documents,
        ];
    }

    private function formatPayment(?Payment $payment, string $scope): ?array
    {
        if (! $payment) {
            return null;
        }

        return [
            'id' => $payment->id,
            'order_id' => $payment->order_id,
            'payment_channel' => $payment->payment_channel,
            'base_amount' => (float) $payment->base_amount,
            'fee_amount' => (float) $payment->fee_amount,
            'final_amount' => (float) $payment->final_amount,
            'payment_method' => $payment->payment_method,
            'status' => $payment->status,
            'manual_status' => $payment->manual_status,
            'proof_original_filename' => $payment->proof_original_filename,
            'proof_uploaded_at' => $payment->proof_uploaded_at?->format('d M Y H:i'),
            'proof_attempt' => $payment->proof_attempt,
            'proof_url' => $payment->proof_path ? route("{$scope}.payments.proof", $payment) : null,
            'rejection_reason' => $payment->rejection_reason,
            'verified_by' => $payment->verifiedBy?->name,
            'verified_at' => $payment->verified_at?->format('d M Y H:i'),
            'paid_at' => $payment->paid_at?->format('d M Y H:i'),
            'expired_at' => $payment->expired_at?->format('d M Y H:i'),
            'is_expired' => $payment->isExpired(),
            'can_verify' => $payment->isManualChannel() && $payment->isProofUploaded(),
        ];
    }

    private function resolveOperationalScope(Request $request): string
    {
        return str_starts_with((string) $request->route()?->getName(), 'admin.')
            ? 'admin'
            : 'staff';
    }

    private function candidateListSummary(): array
    {
        return [
            'total' => Candidate::count(),
            'submitted' => Candidate::where('status', 'submitted')->count(),
            'document_review' => Candidate::whereHas('documents', fn ($documents) => $documents->where('status', 'pending'))->count(),
            'payment_review' => Candidate::whereHas('payments', fn ($payments) => $payments->where('manual_status', 'proof_uploaded'))->count(),
            'change_requests' => Candidate::where(function ($query) {
                $query
                    ->where('data_change_request->status', 'pending')
                    ->orWhereHas('user', fn ($user) => $user
                        ->whereNotNull('pending_email')
                        ->where(function ($pending) {
                            $pending
                                ->whereNull('pending_email_status')
                                ->orWhere('pending_email_status', 'pending');
                        }));
            })->count(),
            'verified_unassigned' => Candidate::where('status', 'verified')
                ->whereDoesntHave('examSessionCandidates')
                ->count(),
        ];
    }

    private function programOptions(): array
    {
        return Candidate::query()
            ->whereNotNull('program_choice')
            ->where('program_choice', '!=', '')
            ->distinct()
            ->orderBy('program_choice')
            ->pluck('program_choice')
            ->map(fn (string $program) => [
                'value' => $program,
                'label' => $program,
            ])
            ->values()
            ->all();
    }

    private function candidateStatusRow(Candidate $candidate): array
    {
        $overview = $this->staffCandidates->detailOverview($candidate, 'staff');
        $lifecycle = $overview['lifecycle'];
        $primaryBlocker = $overview['primary_blocker'];

        return [
            'id' => $candidate->id,
            'candidate_code' => $candidate->candidate_code,
            'full_name' => $candidate->full_name,
            'nisn' => $candidate->nisn,
            'status' => $candidate->status,
            'program_choice' => $candidate->program_choice,
            'admission_wave' => $candidate->admissionWave?->title,
            'school_origin' => $candidate->school_origin,
            'updated_at' => $candidate->updated_at?->format('d M Y H:i'),
            'waiting_side' => $lifecycle['waiting_side'] ?? null,
            'waiting_side_label' => $lifecycle['waiting_side_label'] ?? null,
            'lifecycle' => $lifecycle,
            'lifecycle_steps' => $overview['lifecycle_steps'],
            'progress' => $overview['progress'],
            'readiness' => $overview['readiness'],
            'primary_blocker' => $primaryBlocker,
            'review_blockers' => $overview['review_blockers'],
            'selection' => $overview['selection'],
            'timeline' => $overview['timeline'],
            'links' => [
                'profile' => route('staff.candidates.show', $candidate),
                'status_detail' => route('staff.candidates.status-pendaftaran', $candidate),
                'primary_action' => ($primaryBlocker['key'] ?? 'clear') !== 'clear'
                    ? $primaryBlocker['href']
                    : route('staff.candidates.show', $candidate),
            ],
        ];
    }

    private function candidateStatusSummary(Collection $rows): array
    {
        $pipelineLabels = [
            'draft' => 'Draft',
            'submitted' => 'Submitted',
            'verified' => 'Verified',
            'accepted' => 'Diterima',
            'rejected' => 'Ditolak',
        ];

        $readinessKeys = [
            'data-diri' => 'Data Diri',
            'data-wali' => 'Wali',
            'data-kesehatan' => 'Kesehatan',
            'dokumen' => 'Dokumen',
            'pembayaran' => 'Pembayaran',
            'ujian-seleksi' => 'Seleksi',
        ];

        return [
            'total' => $rows->count(),
            'pipeline' => collect($pipelineLabels)
                ->map(fn (string $label, string $status) => [
                    'key' => $status,
                    'label' => $label,
                    'count' => $rows->where('status', $status)->count(),
                ])
                ->values(),
            'waiting_sides' => $rows
                ->groupBy(fn (array $row) => $row['waiting_side'] ?: 'unknown')
                ->map(fn ($items, string $key) => [
                    'key' => $key,
                    'label' => $items->first()['waiting_side_label'] ?? 'Belum diketahui',
                    'count' => $items->count(),
                ])
                ->sortByDesc('count')
                ->values(),
            'readiness' => collect($readinessKeys)
                ->map(function (string $label, string $key) use ($rows) {
                    $items = $rows->map(fn (array $row) => collect($row['readiness'])->firstWhere('key', $key));

                    return [
                        'key' => $key,
                        'label' => $label,
                        'complete' => $items->where('status', 'complete')->count(),
                        'pending_review' => $items->where('status', 'pending_review')->count(),
                        'rejected' => $items->where('status', 'rejected')->count(),
                        'incomplete' => $items->whereIn('status', ['incomplete', 'locked', 'unavailable'])->count(),
                    ];
                })
                ->values(),
            'blockers' => $rows
                ->pluck('primary_blocker')
                ->filter(fn (?array $blocker) => $blocker && ($blocker['key'] ?? 'clear') !== 'clear')
                ->groupBy(fn (array $blocker) => $blocker['key'])
                ->map(fn ($items) => [
                    'key' => $items->first()['key'],
                    'label' => $items->first()['label'],
                    'tone' => $items->first()['tone'],
                    'count' => $items->count(),
                ])
                ->sortByDesc('count')
                ->values(),
        ];
    }

    private function reportTrend(): array
    {
        $start = now()->subDays(13)->startOfDay();
        $end = now()->endOfDay();

        $submissions = Candidate::query()
            ->where('status', '!=', 'draft')
            ->whereBetween('created_at', [$start, $end])
            ->select(DB::raw('DATE(created_at) as date'), DB::raw('COUNT(*) as total'))
            ->groupBy('date')
            ->pluck('total', 'date');

        $paidPayments = Payment::query()
            ->where('status', Payment::STATUS_PAID)
            ->whereBetween('paid_at', [$start, $end])
            ->select(DB::raw('DATE(paid_at) as date'), DB::raw('COUNT(*) as total'))
            ->groupBy('date')
            ->pluck('total', 'date');

        $trend = [];

        for ($i = 13; $i >= 0; $i--) {
            $date = now()->subDays($i);
            $key = $date->toDateString();

            $trend[] = [
                'date' => $date->format('d M'),
                'submitted' => (int) ($submissions[$key] ?? 0),
                'paid' => (int) ($paidPayments[$key] ?? 0),
            ];
        }

        return $trend;
    }

    private function paymentChannelBreakdown(): array
    {
        $counts = Payment::query()
            ->select('payment_channel', DB::raw('COUNT(*) as total'))
            ->groupBy('payment_channel')
            ->pluck('total', 'payment_channel');

        return collect([
            Payment::CHANNEL_GATEWAY => 'Gateway',
            Payment::CHANNEL_TRANSFER => 'Transfer',
            Payment::CHANNEL_CASH => 'Cash',
        ])
            ->map(fn (string $label, string $channel) => [
                'channel' => $channel,
                'label' => $label,
                'count' => (int) ($counts[$channel] ?? 0),
            ])
            ->values()
            ->all();
    }

    private function paymentStatusBreakdown(): array
    {
        $counts = Payment::query()
            ->get(['status', 'payment_channel', 'manual_status'])
            ->countBy(function (Payment $payment) {
                if ($payment->status === Payment::STATUS_PAID) {
                    return 'paid';
                }

                if ($payment->isManualChannel() && $payment->manual_status === Payment::MANUAL_PROOF_UPLOADED) {
                    return 'manual_review';
                }

                if (
                    $payment->manual_status === Payment::MANUAL_REJECTED
                    || in_array($payment->status, [
                        Payment::STATUS_FAILED,
                        Payment::STATUS_EXPIRED,
                        Payment::STATUS_CANCELLED,
                    ], true)
                ) {
                    return 'failed_or_expired';
                }

                if ($payment->isGateway() && $payment->status === Payment::STATUS_PENDING) {
                    return 'gateway_pending';
                }

                if ($payment->isManualChannel() && $payment->status === Payment::STATUS_PENDING) {
                    return 'manual_waiting';
                }

                return 'other';
            });

        return collect([
            'paid' => 'Lunas',
            'gateway_pending' => 'Gateway pending',
            'manual_review' => 'Manual review',
            'manual_waiting' => 'Menunggu bukti',
            'failed_or_expired' => 'Gagal / expired',
            'other' => 'Status lain',
        ])
            ->map(fn (string $label, string $key) => [
                'key' => $key,
                'label' => $label,
                'count' => (int) ($counts[$key] ?? 0),
            ])
            ->values()
            ->all();
    }

    private function waveProgramReports(): array
    {
        return AdmissionWave::query()
            ->with([
                'programs:id,admission_wave_id,name,priority,quota_ideal,quota_max,is_open_quota,is_active',
                'candidates:id,user_id,admission_wave_id,program_choice,status,data_change_request',
                'candidates.documents:id,candidate_id,status',
                'candidates.payments:id,candidate_id,status,manual_status,payment_channel,created_at',
                'candidates.examSessionCandidates:id,candidate_id',
                'candidates.user:id,pending_email,pending_email_status',
            ])
            ->orderByDesc('is_active')
            ->orderByDesc('start_date')
            ->get()
            ->map(function (AdmissionWave $wave) {
                $candidates = $wave->candidates;
                $programNames = $wave->programs
                    ->pluck('name')
                    ->merge($candidates->pluck('program_choice')->filter())
                    ->unique()
                    ->values();

                if ($candidates->contains(fn (Candidate $candidate) => blank($candidate->program_choice))) {
                    $programNames->push('Belum memilih program');
                }

                $programs = $programNames->map(function (string $programName) use ($wave, $candidates) {
                    $config = $wave->programs->firstWhere('name', $programName);
                    $items = $programName === 'Belum memilih program'
                        ? $candidates->filter(fn (Candidate $candidate) => blank($candidate->program_choice))
                        : $candidates->where('program_choice', $programName);

                    return [
                        'id' => sprintf('%s:%s', $wave->id, $programName),
                        'name' => $programName,
                        'priority' => $config?->priority,
                        'quota_ideal' => $config?->quota_ideal,
                        'quota_max' => $config?->quota_max,
                        'is_open_quota' => $config?->is_open_quota ?? false,
                        'is_active' => $config?->is_active ?? false,
                        'total' => $items->count(),
                        'quota_filled' => $items->where('status', '!=', 'draft')->count(),
                        'submitted' => $items->where('status', 'submitted')->count(),
                        'verified' => $items->where('status', 'verified')->count(),
                        'accepted' => $items->where('status', 'accepted')->count(),
                        'paid' => $items->filter(fn (Candidate $candidate) => $candidate->payments->contains('status', Payment::STATUS_PAID))->count(),
                        'blockers' => $items->filter(fn (Candidate $candidate) => $this->hasReportBlocker($candidate))->count(),
                    ];
                })->values();

                return [
                    'id' => (string) $wave->id,
                    'wave' => $wave->title,
                    'academic_year' => $wave->academic_year,
                    'start_date' => $wave->start_date?->toDateString(),
                    'end_date' => $wave->end_date?->toDateString(),
                    'registration_fee' => (float) $wave->registration_fee,
                    'quota_target' => (int) $wave->quota_target,
                    'is_active' => (bool) $wave->is_active,
                    'total' => $candidates->count(),
                    'quota_filled' => $candidates->where('status', '!=', 'draft')->count(),
                    'submitted' => $candidates->where('status', 'submitted')->count(),
                    'verified' => $candidates->where('status', 'verified')->count(),
                    'accepted' => $candidates->where('status', 'accepted')->count(),
                    'paid' => $candidates->filter(fn (Candidate $candidate) => $candidate->payments->contains('status', Payment::STATUS_PAID))->count(),
                    'manual_review' => $candidates->filter(fn (Candidate $candidate) => $candidate->payments->contains('manual_status', Payment::MANUAL_PROOF_UPLOADED))->count(),
                    'blockers' => $candidates->filter(fn (Candidate $candidate) => $this->hasReportBlocker($candidate))->count(),
                    'verified_unassigned' => $candidates
                        ->filter(fn (Candidate $candidate) => $candidate->status === 'verified' && $candidate->examSessionCandidates->isEmpty())
                        ->count(),
                    'programs' => $programs->all(),
                ];
            })
            ->values()
            ->all();
    }

    private function hasReportBlocker(Candidate $candidate): bool
    {
        $hasPendingEmail = $candidate->user?->pending_email
            && in_array($candidate->user?->pending_email_status, [null, 'pending'], true);

        return $candidate->documents->contains('status', 'pending')
            || $candidate->payments->contains('manual_status', Payment::MANUAL_PROOF_UPLOADED)
            || (($candidate->data_change_request['status'] ?? null) === 'pending')
            || $hasPendingEmail
            || ($candidate->status === 'verified' && $candidate->examSessionCandidates->isEmpty());
    }
}
