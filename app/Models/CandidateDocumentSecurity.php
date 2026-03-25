<?php

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
        'snap_token',
        'amount',
        'payment_method',
        'status',
        'midtrans_transaction_id',
        'paid_at',
        'expired_at',
        'metadata',
    ];

    protected $casts = [
        'amount'   => 'decimal:2',
        'paid_at'  => 'datetime',
        'expired_at' => 'datetime',
        'metadata' => 'array',
    ];

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

    // ─────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isPaid(): bool
    {
        return $this->status === 'paid';
    }

    public function isExpired(): bool
    {
        return $this->status === 'expired'
            || ($this->isPending() && $this->expired_at?->isPast());
    }

    public function isCancellable(): bool
    {
        return $this->isPending() && ! $this->isExpired();
    }

    // ─────────────────────────────────────────────
    // Scopes
    // ─────────────────────────────────────────────

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopePaid($query)
    {
        return $query->where('status', 'paid');
    }
}
