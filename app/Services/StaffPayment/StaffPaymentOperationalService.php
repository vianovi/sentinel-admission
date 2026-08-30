<?php

namespace App\Services\StaffPayment;

use App\Models\AdmissionWave;
use App\Models\Candidate;
use App\Models\Payment;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class StaffPaymentOperationalService
{
    public const ACTION_FILTERS = [
        'manual_review' => 'Bukti manual perlu review',
        'gateway_pending' => 'Gateway pending',
        'manual_waiting_proof' => 'Menunggu bukti manual',
        'failed_or_expired' => 'Gagal / expired',
        'paid' => 'Sudah lunas',
    ];

    public function baseQuery(): Builder
    {
        return Payment::query()->with([
            'candidate:id,user_id,admission_wave_id,candidate_code,full_name,nisn,status,program_choice,school_origin',
            'candidate.user:id,email',
            'admissionWave:id,title,academic_year,registration_fee',
            'verifiedBy:id,name',
        ]);
    }

    public function applyFilters(Builder $query, array $filters): Builder
    {
        $search = trim((string) ($filters['search'] ?? ''));
        $status = trim((string) ($filters['status'] ?? ''));
        $channel = trim((string) ($filters['channel'] ?? ''));
        $wave = trim((string) ($filters['wave'] ?? ''));
        $program = trim((string) ($filters['program'] ?? ''));
        $action = trim((string) ($filters['action'] ?? ''));

        return $query
            ->when($search, function (Builder $query) use ($search) {
                $query->where(function (Builder $nested) use ($search) {
                    $nested
                        ->where('order_id', 'like', "%{$search}%")
                        ->orWhere('candidate_code', 'like', "%{$search}%")
                        ->orWhere('midtrans_transaction_id', 'like', "%{$search}%")
                        ->orWhereHas('candidate', function (Builder $candidate) use ($search) {
                            $candidate
                                ->where('full_name', 'like', "%{$search}%")
                                ->orWhere('nisn', 'like', "%{$search}%");
                        });
                });
            })
            ->when($status, fn (Builder $query) => $query->where('status', $status))
            ->when($channel, fn (Builder $query) => $query->where('payment_channel', $channel))
            ->when($wave, fn (Builder $query) => $query->where('admission_wave_id', $wave))
            ->when($program, fn (Builder $query) => $query->whereHas(
                'candidate',
                fn (Builder $candidate) => $candidate->where('program_choice', $program)
            ))
            ->when($action, fn (Builder $query) => $this->applyActionFilter($query, $action));
    }

    public function applyActionFilter(Builder $query, ?string $action): Builder
    {
        return match ($action) {
            'manual_review' => $query
                ->whereIn('payment_channel', [Payment::CHANNEL_TRANSFER, Payment::CHANNEL_CASH])
                ->where('manual_status', Payment::MANUAL_PROOF_UPLOADED),
            'gateway_pending' => $query
                ->where('payment_channel', Payment::CHANNEL_GATEWAY)
                ->where('status', Payment::STATUS_PENDING),
            'manual_waiting_proof' => $query
                ->whereIn('payment_channel', [Payment::CHANNEL_TRANSFER, Payment::CHANNEL_CASH])
                ->where('status', Payment::STATUS_PENDING)
                ->where('manual_status', Payment::MANUAL_WAITING_PROOF),
            'failed_or_expired' => $query->where(function (Builder $nested) {
                $nested
                    ->whereIn('status', [
                        Payment::STATUS_FAILED,
                        Payment::STATUS_EXPIRED,
                        Payment::STATUS_CANCELLED,
                    ])
                    ->orWhere('manual_status', Payment::MANUAL_REJECTED);
            }),
            'paid' => $query->where('status', Payment::STATUS_PAID),
            default => $query,
        };
    }

    public function summary(): array
    {
        $base = Payment::query();
        $manualReview = Payment::query()
            ->whereIn('payment_channel', [Payment::CHANNEL_TRANSFER, Payment::CHANNEL_CASH])
            ->where('manual_status', Payment::MANUAL_PROOF_UPLOADED);
        $gatewayPending = Payment::query()
            ->where('payment_channel', Payment::CHANNEL_GATEWAY)
            ->where('status', Payment::STATUS_PENDING);
        $failedOrExpired = Payment::query()
            ->where(function (Builder $query) {
                $query
                    ->whereIn('status', [
                        Payment::STATUS_FAILED,
                        Payment::STATUS_EXPIRED,
                        Payment::STATUS_CANCELLED,
                    ])
                    ->orWhere('manual_status', Payment::MANUAL_REJECTED);
            });

        return [
            'total' => (clone $base)->count(),
            'paid' => (clone $base)->where('status', Payment::STATUS_PAID)->count(),
            'pending' => (clone $base)->where('status', Payment::STATUS_PENDING)->count(),
            'manual_review' => $manualReview->count(),
            'gateway_pending' => $gatewayPending->count(),
            'failed_or_expired' => $failedOrExpired->count(),
            'paid_amount' => (float) Payment::query()
                ->where('status', Payment::STATUS_PAID)
                ->sum('final_amount'),
        ];
    }

    public function formatPaginator(LengthAwarePaginator $payments, string $scope = 'staff'): LengthAwarePaginator
    {
        return $payments->through(fn (Payment $payment) => $this->formatRow($payment, $scope));
    }

    public function formatRow(Payment $payment, string $scope = 'staff'): array
    {
        $metadata = is_array($payment->metadata) ? $payment->metadata : [];
        $provider = $this->providerSnapshot($metadata);
        $candidate = $payment->candidate;
        $wave = $payment->admissionWave;
        $proofUrl = $payment->isManualChannel() && $payment->proof_path
            ? route("{$scope}.payments.proof", $payment)
            : null;

        return [
            'id' => $payment->id,
            'order_id' => $payment->order_id,
            'candidate_code' => $payment->candidate_code,
            'candidate' => $candidate ? [
                'id' => $candidate->id,
                'candidate_code' => $candidate->candidate_code,
                'full_name' => $candidate->full_name,
                'nisn' => $candidate->nisn,
                'status' => $candidate->status,
                'program_choice' => $candidate->program_choice,
                'school_origin' => $candidate->school_origin,
                'email' => $candidate->user?->email,
            ] : null,
            'admission_wave' => $wave ? [
                'id' => $wave->id,
                'title' => $wave->title,
                'academic_year' => $wave->academic_year,
                'registration_fee' => (float) $wave->registration_fee,
            ] : null,
            'payment_channel' => $payment->payment_channel,
            'channel_label' => $this->channelLabel($payment->payment_channel),
            'status' => $payment->status,
            'status_label' => $this->statusLabel($payment->status),
            'manual_status' => $payment->manual_status,
            'manual_status_label' => $payment->manual_status
                ? $this->manualStatusLabel($payment->manual_status)
                : null,
            'payment_method' => $payment->payment_method,
            'midtrans_transaction_id' => $payment->midtrans_transaction_id,
            'amounts' => [
                'base_amount' => (float) $payment->base_amount,
                'fee_amount' => (float) $payment->fee_amount,
                'final_amount' => (float) $payment->final_amount,
            ],
            'provider' => $provider,
            'proof' => [
                'original_filename' => $payment->proof_original_filename,
                'uploaded_at' => $this->formatDateTime($payment->proof_uploaded_at),
                'attempt' => $payment->proof_attempt,
                'url' => $proofUrl,
            ],
            'verification' => [
                'verified_by' => $payment->verifiedBy?->name,
                'verified_at' => $this->formatDateTime($payment->verified_at),
                'rejection_reason' => $payment->rejection_reason,
            ],
            'paid_at' => $this->formatDateTime($payment->paid_at),
            'expired_at' => $this->formatDateTime($payment->expired_at),
            'created_at' => $this->formatDateTime($payment->created_at),
            'updated_at' => $this->formatDateTime($payment->updated_at),
            'is_expired' => $payment->isExpired(),
            'can_verify' => $payment->isManualChannel() && $payment->isProofUploaded(),
            'action_state' => $this->actionState($payment),
        ];
    }

    public function waveOptions(): Collection
    {
        return AdmissionWave::query()
            ->select('id', 'title')
            ->latest()
            ->get()
            ->map(fn (AdmissionWave $wave) => [
                'value' => (string) $wave->id,
                'label' => $wave->title,
            ]);
    }

    public function actionOptions(): array
    {
        return collect(self::ACTION_FILTERS)
            ->map(fn (string $label, string $value) => compact('value', 'label'))
            ->values()
            ->all();
    }

    public function programOptions(): Collection
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
            ]);
    }

    private function actionState(Payment $payment): array
    {
        if ($payment->isManualChannel() && $payment->manual_status === Payment::MANUAL_PROOF_UPLOADED) {
            return [
                'key' => 'manual_review',
                'label' => 'Review bukti manual',
                'tone' => 'warning',
                'description' => 'Bukti transfer/cash sudah diunggah dan perlu diverifikasi staff.',
            ];
        }

        if ($payment->isGateway() && $payment->status === Payment::STATUS_PENDING) {
            return [
                'key' => 'gateway_pending',
                'label' => 'Menunggu gateway',
                'tone' => 'primary',
                'description' => 'Transaksi gateway menunggu callback/status provider.',
            ];
        }

        if ($payment->isManualChannel() && $payment->manual_status === Payment::MANUAL_WAITING_PROOF) {
            return [
                'key' => 'manual_waiting_proof',
                'label' => 'Menunggu bukti',
                'tone' => 'neutral',
                'description' => 'Kandidat belum mengunggah bukti pembayaran manual.',
            ];
        }

        if (
            $payment->manual_status === Payment::MANUAL_REJECTED
            || in_array($payment->status, [
                Payment::STATUS_FAILED,
                Payment::STATUS_EXPIRED,
                Payment::STATUS_CANCELLED,
            ], true)
        ) {
            return [
                'key' => 'failed_or_expired',
                'label' => 'Perlu follow-up',
                'tone' => 'danger',
                'description' => 'Transaksi gagal, expired, cancelled, atau bukti manual ditolak.',
            ];
        }

        if ($payment->status === Payment::STATUS_PAID) {
            return [
                'key' => 'paid',
                'label' => 'Lunas',
                'tone' => 'success',
                'description' => 'Pembayaran sudah tercatat lunas.',
            ];
        }

        return [
            'key' => 'monitor',
            'label' => 'Monitor',
            'tone' => 'neutral',
            'description' => 'Transaksi belum membutuhkan aksi staff langsung.',
        ];
    }

    /**
     * @param  array<string, mixed>  $metadata
     */
    private function providerSnapshot(array $metadata): array
    {
        return [
            'transaction_status' => $this->stringOrNull($metadata['transaction_status'] ?? null),
            'fraud_status' => $this->stringOrNull($metadata['fraud_status'] ?? null),
            'gross_amount' => isset($metadata['gross_amount']) ? (float) $metadata['gross_amount'] : null,
            'settlement_time' => $this->stringOrNull($metadata['settlement_time'] ?? null),
            'transaction_time' => $this->stringOrNull($metadata['transaction_time'] ?? null),
            'status_code' => $this->stringOrNull($metadata['status_code'] ?? null),
            'status_message' => $this->stringOrNull($metadata['status_message'] ?? null),
        ];
    }

    private function channelLabel(?string $channel): string
    {
        return match ($channel) {
            Payment::CHANNEL_GATEWAY => 'Payment Gateway',
            Payment::CHANNEL_TRANSFER => 'Transfer Bank',
            Payment::CHANNEL_CASH => 'Cash',
            default => $channel ?: '-',
        };
    }

    private function statusLabel(?string $status): string
    {
        return match ($status) {
            Payment::STATUS_PENDING => 'Pending',
            Payment::STATUS_PAID => 'Lunas',
            Payment::STATUS_FAILED => 'Gagal',
            Payment::STATUS_EXPIRED => 'Expired',
            Payment::STATUS_CANCELLED => 'Dibatalkan',
            default => $status ?: '-',
        };
    }

    private function manualStatusLabel(string $status): string
    {
        return match ($status) {
            Payment::MANUAL_WAITING_PROOF => 'Menunggu Bukti',
            Payment::MANUAL_PROOF_UPLOADED => 'Bukti Diunggah',
            Payment::MANUAL_VERIFIED => 'Terverifikasi',
            Payment::MANUAL_REJECTED => 'Ditolak',
            default => $status,
        };
    }

    private function formatDateTime(mixed $date): ?string
    {
        return $date ? $date->format('d M Y H:i') : null;
    }

    private function stringOrNull(mixed $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        return (string) $value;
    }
}
