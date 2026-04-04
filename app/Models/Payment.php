<?php
// =============================================================================
// LOKASI FILE: app/Models/Payment.php
// =============================================================================


namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    protected $fillable = [
        'candidate_id',
        'admission_wave_id',
        'candidate_code',
        'order_id',
        'payment_channel',
        'base_amount',
        'fee_amount',
        'final_amount',
        'snap_token',
        'payment_method',
        'midtrans_transaction_id',
        'metadata',
        'status',
        'manual_status',
        'proof_path',
        'proof_original_filename',
        'proof_uploaded_at',
        'proof_attempt',
        'bank_name',
        'account_name',
        'transfer_date',
        'verified_by',
        'verified_at',
        'rejection_reason',
        'paid_at',
        'expired_at',
    ];

    protected $casts = [
        'base_amount'       => 'decimal:2',
        'fee_amount'        => 'decimal:2',
        'final_amount'      => 'decimal:2',
        'metadata'          => 'array',
        'paid_at'           => 'datetime',
        'expired_at'        => 'datetime',
        'verified_at'       => 'datetime',
        'proof_uploaded_at' => 'datetime',
        'transfer_date'     => 'date',
        'proof_attempt'     => 'integer',
    ];

    // ─────────────────────────────────────────────
    // Constants
    // ─────────────────────────────────────────────

    const CHANNEL_GATEWAY  = 'gateway';
    const CHANNEL_TRANSFER = 'transfer';
    const CHANNEL_CASH     = 'cash';

    const STATUS_PENDING   = 'pending';
    const STATUS_PAID      = 'paid';
    const STATUS_FAILED    = 'failed';
    const STATUS_EXPIRED   = 'expired';
    const STATUS_CANCELLED = 'cancelled';

    const MANUAL_WAITING_PROOF  = 'waiting_proof';
    const MANUAL_PROOF_UPLOADED = 'proof_uploaded';
    const MANUAL_VERIFIED       = 'verified';
    const MANUAL_REJECTED       = 'rejected';

    // ─────────────────────────────────────────────
    // Relations
    // ─────────────────────────────────────────────

    public function candidate(): BelongsTo
    {
        return $this->belongsTo(Candidate::class);
    }

    public function admissionWave(): BelongsTo
    {
        return $this->belongsTo(AdmissionWave::class);
    }

    public function verifiedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    // ─────────────────────────────────────────────
    // Status Helpers — Main Status
    // ─────────────────────────────────────────────

    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    public function isPaid(): bool
    {
        return $this->status === self::STATUS_PAID;
    }

    public function isFailed(): bool
    {
        return $this->status === self::STATUS_FAILED;
    }

    public function isExpired(): bool
    {
        return $this->status === self::STATUS_EXPIRED
            || ($this->isPending() && $this->expired_at?->isPast());
    }

    public function isCancelled(): bool
    {
        return $this->status === self::STATUS_CANCELLED;
    }

    public function isCancellable(): bool
    {
        return $this->isPending() && ! $this->isExpired();
    }

    // ─────────────────────────────────────────────
    // Channel Helpers
    // ─────────────────────────────────────────────

    public function isGateway(): bool
    {
        return $this->payment_channel === self::CHANNEL_GATEWAY;
    }

    public function isTransfer(): bool
    {
        return $this->payment_channel === self::CHANNEL_TRANSFER;
    }

    public function isCash(): bool
    {
        return $this->payment_channel === self::CHANNEL_CASH;
    }

    public function isManualChannel(): bool
    {
        return in_array($this->payment_channel, [
            self::CHANNEL_TRANSFER,
            self::CHANNEL_CASH,
        ]);
    }

    // ─────────────────────────────────────────────
    // Manual Status Helpers
    // ─────────────────────────────────────────────

    public function isWaitingProof(): bool
    {
        return $this->manual_status === self::MANUAL_WAITING_PROOF;
    }

    public function isProofUploaded(): bool
    {
        return $this->manual_status === self::MANUAL_PROOF_UPLOADED;
    }

    public function isManualVerified(): bool
    {
        return $this->manual_status === self::MANUAL_VERIFIED;
    }

    public function isManualRejected(): bool
    {
        return $this->manual_status === self::MANUAL_REJECTED;
    }

    public function canUploadProof(): bool
    {
        return $this->isManualChannel()
            && $this->isPending()
            && in_array($this->manual_status, [
                self::MANUAL_WAITING_PROOF,
                self::MANUAL_REJECTED,
            ]);
    }

    // ─────────────────────────────────────────────
    // Scopes
    // ─────────────────────────────────────────────

    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    public function scopePaid($query)
    {
        return $query->where('status', self::STATUS_PAID);
    }

    public function scopeManualChannel($query)
    {
        return $query->whereIn('payment_channel', [
            self::CHANNEL_TRANSFER,
            self::CHANNEL_CASH,
        ]);
    }

    public function scopeAwaitingVerification($query)
    {
        return $query->manualChannel()
            ->where('manual_status', self::MANUAL_PROOF_UPLOADED);
    }
}