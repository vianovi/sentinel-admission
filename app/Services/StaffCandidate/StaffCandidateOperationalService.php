<?php

namespace App\Services\StaffCandidate;

use App\Models\Candidate;
use App\Services\StatusPendaftaranService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class StaffCandidateOperationalService
{
    public const ACTION_FILTERS = [
        'data_incomplete' => 'Data belum lengkap',
        'document_review' => 'Dokumen menunggu review',
        'payment_review' => 'Pembayaran menunggu review',
        'change_requests' => 'Permintaan perubahan',
        'rejected_followup' => 'Follow-up ditolak',
        'exam_unassigned' => 'Belum ada sesi ujian',
    ];

    private const READINESS_KEYS = [
        'data-diri' => 'Data Diri',
        'data-wali' => 'Wali',
        'data-kesehatan' => 'Kesehatan',
        'dokumen' => 'Dokumen',
        'pembayaran' => 'Pembayaran',
        'ujian-seleksi' => 'Seleksi',
    ];

    public function __construct(
        private readonly StatusPendaftaranService $statusPendaftaran
    ) {}

    public function listRow(Candidate $candidate, string $scope = 'staff'): array
    {
        $summary = $this->statusPendaftaran->forInternal($candidate, $scope);

        return [
            'readiness' => $this->readiness($summary),
            'action_needed' => $this->primaryActionNeeded($summary),
            'waiting_side' => $summary['lifecycle']['waiting_side'] ?? null,
            'waiting_side_label' => $summary['lifecycle']['waiting_side_label'] ?? null,
            'completion_percentage' => $summary['progress']['completion_percentage'] ?? 0,
            'verification_percentage' => $summary['progress']['verification_percentage'] ?? 0,
            'selection' => $summary['selection_summary'],
        ];
    }

    public function detailOverview(Candidate $candidate, string $scope = 'staff'): array
    {
        $summary = $this->statusPendaftaran->forInternal($candidate, $scope);

        return [
            'identity' => $summary['identity'],
            'lifecycle' => $summary['lifecycle'],
            'lifecycle_steps' => $summary['lifecycle_steps'],
            'progress' => $summary['progress'],
            'readiness' => $this->readiness($summary),
            'primary_blocker' => $this->primaryActionNeeded($summary),
            'review_blockers' => $summary['review_blockers'],
            'quick_links' => $summary['quick_links'],
            'timeline' => array_slice($summary['timeline'], 0, 6),
            'selection' => $summary['selection_summary'],
        ];
    }

    public function actionQueue(string $scope = 'staff', ?string $bucket = null, int $limit = 120): array
    {
        $allItems = $this->baseOperationalQuery()
            ->latest()
            ->limit($limit)
            ->get()
            ->flatMap(fn (Candidate $candidate) => $this->queueItemsForCandidate($candidate, $scope))
            ->values();
        $items = $bucket
            ? $allItems->where('bucket', $bucket)->values()
            : $allItems;

        return [
            'items' => $items->all(),
            'stats' => $this->queueStats($allItems),
            'buckets' => $this->actionOptions(),
            'active_bucket' => $bucket,
        ];
    }

    public function actionOptions(): array
    {
        return collect(self::ACTION_FILTERS)
            ->map(fn (string $label, string $value) => compact('value', 'label'))
            ->values()
            ->all();
    }

    public function applyActionFilter(Builder $query, ?string $action): Builder
    {
        return match ($action) {
            'data_incomplete' => $query->where('status', 'draft'),
            'document_review' => $query->whereHas('documents', fn (Builder $documents) => $documents->where('status', 'pending')),
            'payment_review' => $query->whereHas('payments', fn (Builder $payments) => $payments->where('manual_status', 'proof_uploaded')),
            'change_requests' => $query->where(function (Builder $nested) {
                $nested
                    ->where('data_change_request->status', 'pending')
                    ->orWhereHas('user', fn (Builder $user) => $user
                        ->whereNotNull('pending_email')
                        ->where(function (Builder $pending) {
                            $pending
                                ->whereNull('pending_email_status')
                                ->orWhere('pending_email_status', 'pending');
                        }));
            }),
            'rejected_followup' => $query->where(function (Builder $nested) {
                $nested
                    ->whereHas('documents', fn (Builder $documents) => $documents->where('status', 'rejected'))
                    ->orWhereHas('payments', fn (Builder $payments) => $payments
                        ->where('manual_status', 'rejected')
                        ->orWhereIn('status', ['failed', 'expired', 'cancelled']));
            }),
            'exam_unassigned' => $query
                ->where('status', 'verified')
                ->whereDoesntHave('examSessionCandidates'),
            default => $query,
        };
    }

    public function baseOperationalQuery(): Builder
    {
        return Candidate::query()->with([
            'user.pendingEmailReviewer',
            'admissionWave:id,title,academic_year,start_date,end_date,registration_fee,announcement_info',
            'registrationDraft:id,registration_code,created_at',
            'guardian',
            'healthRecord',
            'documents.verifiedBy',
            'payments.verifiedBy',
            'examSessionCandidates.session.package.subject',
            'examSessionCandidates.attempts.session',
            'examSessionCandidates.attempts.package',
            'examAttempts.session',
            'examAttempts.package',
        ]);
    }

    private function readiness(array $summary): array
    {
        $checklist = collect($summary['completion_checklist'])->keyBy('key');

        return collect(self::READINESS_KEYS)
            ->map(function (string $label, string $key) use ($checklist) {
                $item = $checklist->get($key);

                return [
                    'key' => $key,
                    'label' => $label,
                    'status' => $item['status'] ?? 'unavailable',
                    'status_label' => $item['status_label'] ?? 'Belum Tersedia',
                    'tone' => $item['tone'] ?? 'muted',
                    'description' => $item['description'] ?? null,
                    'href' => $item['href'] ?? null,
                    'last_updated_at' => $item['last_updated_at'] ?? null,
                ];
            })
            ->values()
            ->all();
    }

    private function primaryActionNeeded(array $summary): array
    {
        $blocker = collect($summary['review_blockers'])
            ->first(fn (array $item) => ($item['key'] ?? null) !== 'clear');

        if (! $blocker) {
            return [
                'key' => 'clear',
                'label' => 'Tidak ada aksi',
                'description' => 'Tidak ada blocker operasional utama.',
                'tone' => 'success',
                'href' => null,
            ];
        }

        return [
            'key' => $blocker['key'],
            'label' => $blocker['title'],
            'description' => $blocker['description'],
            'tone' => $blocker['tone'],
            'href' => $blocker['href'],
        ];
    }

    private function queueItemsForCandidate(Candidate $candidate, string $scope): Collection
    {
        $summary = $this->statusPendaftaran->forInternal($candidate, $scope);

        return collect($summary['review_blockers'])
            ->reject(fn (array $blocker) => ($blocker['key'] ?? null) === 'clear')
            ->map(function (array $blocker) use ($summary, $candidate) {
                return [
                    'id' => "{$candidate->id}:{$blocker['key']}",
                    'bucket' => $this->bucketForBlocker((string) $blocker['key']),
                    'bucket_label' => self::ACTION_FILTERS[$this->bucketForBlocker((string) $blocker['key'])] ?? 'Perlu tindakan',
                    'candidate' => [
                        'id' => $candidate->id,
                        'candidate_code' => $candidate->candidate_code,
                        'full_name' => $candidate->full_name,
                        'nisn' => $candidate->nisn,
                        'status' => $candidate->status,
                        'admission_wave' => $candidate->admissionWave?->title,
                        'program_choice' => $candidate->program_choice,
                    ],
                    'title' => $blocker['title'],
                    'description' => $blocker['description'],
                    'tone' => $blocker['tone'],
                    'href' => $blocker['href'],
                    'waiting_side_label' => $summary['lifecycle']['waiting_side_label'] ?? null,
                    'updated_at' => $summary['lifecycle']['updated_at'] ?? null,
                ];
            })
            ->values();
    }

    private function bucketForBlocker(string $key): string
    {
        return match ($key) {
            'core-data' => 'data_incomplete',
            'documents-pending' => 'document_review',
            'payment-review' => 'payment_review',
            'data-change-pending', 'email-change-pending' => 'change_requests',
            'documents-rejected', 'payment-rejected' => 'rejected_followup',
            'exam-unassigned' => 'exam_unassigned',
            default => 'data_incomplete',
        };
    }

    private function queueStats(Collection $items): array
    {
        return collect(self::ACTION_FILTERS)
            ->map(fn (string $label, string $bucket) => [
                'bucket' => $bucket,
                'label' => $label,
                'count' => $items->where('bucket', $bucket)->count(),
            ])
            ->values()
            ->all();
    }
}
