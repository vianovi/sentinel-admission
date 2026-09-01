<?php

namespace App\Http\Controllers\Dashboard\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdmissionWave;
use App\Models\Candidate;
use App\Models\Payment;
use App\Services\StaffCandidate\StaffCandidateOperationalService;
use App\Services\StaffPayment\StaffPaymentOperationalService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    public function __construct(
        private readonly StaffCandidateOperationalService $staffCandidates,
        private readonly StaffPaymentOperationalService $staffPayments
    ) {}

    public function index(Request $request): Response
    {
        $candidateSummary = $this->candidateListSummary();
        $paymentSummary = $this->staffPayments->summary();
        $actionQueue = $this->staffCandidates->actionQueue('admin', null, 80);

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

        return Inertia::render('Dashboard/Admin/Reports', [
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

    private function candidateListSummary(): array
    {
        $baseQuery = $this->staffCandidates->baseOperationalQuery();
        $total = $baseQuery->count();

        $verifiedUnassigned = (clone $baseQuery)
            ->where('status', 'verified')
            ->whereDoesntHave('examSessionCandidates')
            ->count();

        return [
            'total' => $total,
            'verified_unassigned' => $verifiedUnassigned,
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
                    return 'pending_gateway';
                }

                return 'pending';
            });

        return collect([
            'paid' => ['Lunas (Selesai)', 'success'],
            'manual_review' => ['Menunggu Verifikasi (Transfer/Cash)', 'warning'],
            'pending_gateway' => ['Menunggu Pembayaran (Gateway)', 'primary'],
            'pending' => ['Draft / Belum Checkout', 'neutral'],
            'failed_or_expired' => ['Gagal / Expired / Ditolak', 'danger'],
        ])->map(fn (array $meta, string $key) => [
            'key' => $key,
            'label' => $meta[0],
            'count' => $counts->get($key, 0),
        ])->values()->all();
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
                        'verified' => $items->where('status', 'verified')->count(),
                        'accepted' => $items->where('status', 'accepted')->count(),
                        'rejected' => $items->where('status', 'rejected')->count(),
                    ];
                })
                    ->sortBy('priority')
                    ->values()
                    ->all();

                return [
                    'id' => $wave->id,
                    'title' => $wave->title,
                    'is_active' => $wave->is_active,
                    'total_candidates' => $candidates->count(),
                    'programs' => $programs,
                ];
            })->all();
    }
}
