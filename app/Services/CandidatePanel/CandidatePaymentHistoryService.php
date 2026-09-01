<?php

namespace App\Services\CandidatePanel;

use App\Models\Candidate;
use App\Models\Payment;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class CandidatePaymentHistoryService
{
    public function summary(Candidate $candidate): array
    {
        $base = Payment::query()->where('candidate_id', $candidate->id);

        $latest = (clone $base)
            ->latest()
            ->first();

        return [
            'total_transactions' => (clone $base)->count(),
            'paid_transactions' => (clone $base)->where('status', Payment::STATUS_PAID)->count(),
            'pending_transactions' => (clone $base)->where('status', Payment::STATUS_PENDING)->count(),
            'rejected_transactions' => (clone $base)->where('manual_status', Payment::MANUAL_REJECTED)->count(),
            'paid_amount' => (float) ((clone $base)->where('status', Payment::STATUS_PAID)->sum('final_amount') ?? 0),
            'latest' => $latest ? $this->format($latest) : null,
        ];
    }

    public function paginated(Candidate $candidate, int $perPage = 10): LengthAwarePaginator
    {
        return Payment::query()
            ->where('candidate_id', $candidate->id)
            ->select([
                'id',
                'order_id',
                'payment_channel',
                'payment_method',
                'base_amount',
                'fee_amount',
                'final_amount',
                'status',
                'manual_status',
                'proof_original_filename',
                'proof_uploaded_at',
                'proof_attempt',
                'bank_name',
                'account_name',
                'transfer_date',
                'verified_at',
                'rejection_reason',
                'paid_at',
                'expired_at',
                'created_at',
                'updated_at',
            ])
            ->latest()
            ->paginate($perPage)
            ->withQueryString()
            ->through(fn (Payment $payment) => $this->format($payment));
    }

    private function format(Payment $payment): array
    {
        return [
            'id' => $payment->id,
            'order_id' => $payment->order_id,
            'payment_channel' => $payment->payment_channel,
            'payment_channel_label' => $this->channelLabel($payment->payment_channel),
            'payment_method' => $payment->payment_method,
            'base_amount' => $payment->base_amount !== null ? (float) $payment->base_amount : null,
            'fee_amount' => $payment->fee_amount !== null ? (float) $payment->fee_amount : null,
            'final_amount' => $payment->final_amount !== null ? (float) $payment->final_amount : null,
            'status' => $payment->status,
            'status_label' => $this->statusLabel($payment->status),
            'manual_status' => $payment->manual_status,
            'manual_status_label' => $payment->manual_status ? $this->manualStatusLabel($payment->manual_status) : null,
            'proof_original_filename' => $payment->proof_original_filename,
            'proof_uploaded_at' => $payment->proof_uploaded_at?->format('d M Y · H:i'),
            'proof_attempt' => $payment->proof_attempt,
            'bank_name' => $payment->bank_name,
            'account_name' => $payment->account_name,
            'transfer_date' => $payment->transfer_date?->format('d M Y'),
            'verified_at' => $payment->verified_at?->format('d M Y · H:i'),
            'rejection_reason' => $payment->rejection_reason,
            'paid_at' => $payment->paid_at?->format('d M Y · H:i'),
            'expired_at' => $payment->expired_at?->format('d M Y · H:i'),
            'created_at' => $payment->created_at?->format('d M Y · H:i'),
            'updated_at' => $payment->updated_at?->format('d M Y · H:i'),
            'tone' => $this->tone($payment),
        ];
    }

    private function channelLabel(?string $channel): string
    {
        return match ($channel) {
            Payment::CHANNEL_GATEWAY => 'Payment Gateway',
            Payment::CHANNEL_TRANSFER => 'Transfer Bank',
            Payment::CHANNEL_CASH => 'Tunai',
            default => 'Belum diketahui',
        };
    }

    private function statusLabel(?string $status): string
    {
        return match ($status) {
            Payment::STATUS_PENDING => 'Menunggu Pembayaran',
            Payment::STATUS_PAID => 'Lunas',
            Payment::STATUS_FAILED => 'Gagal',
            Payment::STATUS_EXPIRED => 'Kedaluwarsa',
            Payment::STATUS_CANCELLED => 'Dibatalkan',
            default => 'Belum diketahui',
        };
    }

    private function manualStatusLabel(string $status): string
    {
        return match ($status) {
            Payment::MANUAL_WAITING_PROOF => 'Menunggu Bukti',
            Payment::MANUAL_PROOF_UPLOADED => 'Menunggu Review',
            Payment::MANUAL_VERIFIED => 'Terverifikasi',
            Payment::MANUAL_REJECTED => 'Ditolak',
            default => ucfirst($status),
        };
    }

    private function tone(Payment $payment): string
    {
        if ($payment->status === Payment::STATUS_PAID || $payment->manual_status === Payment::MANUAL_VERIFIED) {
            return 'success';
        }

        if ($payment->manual_status === Payment::MANUAL_REJECTED || in_array($payment->status, [
            Payment::STATUS_FAILED,
            Payment::STATUS_EXPIRED,
            Payment::STATUS_CANCELLED,
        ], true)) {
            return 'danger';
        }

        if ($payment->manual_status === Payment::MANUAL_PROOF_UPLOADED) {
            return 'warning';
        }

        return 'neutral';
    }
}
