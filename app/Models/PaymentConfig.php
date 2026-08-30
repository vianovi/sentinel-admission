<?php

// =============================================================================
// LOKASI FILE: app/Models/PaymentConfig.php
// =============================================================================

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaymentConfig extends Model
{
    protected $fillable = [
        'admission_wave_id',
        'gateway_fee_type',
        'gateway_fee_value',
        'gateway_fee_label',
        'bank_name',
        'bank_account_number',
        'bank_account_name',
        'bank_logo_key',
        'whatsapp_contact',
        'whatsapp_contact_label',
        'is_active',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'gateway_fee_value' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    // ─────────────────────────────────────────────
    // Constants
    // ─────────────────────────────────────────────

    const FEE_TYPE_PERCENTAGE = 'percentage';

    const FEE_TYPE_FLAT = 'flat';

    const BANK_LOGOS = [
        'bca' => 'BCA',
        'bri' => 'BRI',
        'mandiri' => 'Mandiri',
        'bni' => 'BNI',
        'bsi' => 'BSI',
        'other' => 'Bank Lainnya',
    ];

    // ─────────────────────────────────────────────
    // Relations
    // ─────────────────────────────────────────────

    public function admissionWave(): BelongsTo
    {
        return $this->belongsTo(AdmissionWave::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    // ─────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────

    /**
     * Hitung fee amount dari base amount.
     * Transfer dan cash selalu return 0.
     */
    public function calculateFee(float $baseAmount): float
    {
        if ($this->gateway_fee_type === self::FEE_TYPE_PERCENTAGE) {
            return round($baseAmount * ($this->gateway_fee_value / 100), 2);
        }

        return (float) $this->gateway_fee_value;
    }

    /**
     * Hitung final amount (base + fee) untuk channel gateway.
     */
    public function calculateFinalAmount(float $baseAmount): float
    {
        return $baseAmount + $this->calculateFee($baseAmount);
    }

    /**
     * Ambil label bank yang readable.
     */
    public function getBankLogoLabelAttribute(): string
    {
        return self::BANK_LOGOS[$this->bank_logo_key] ?? 'Bank Lainnya';
    }

    /**
     * Generate URL wa.me dengan pesan pre-filled.
     * Dipanggil dengan data kandidat untuk personalisasi pesan.
     */
    public function generateWhatsAppUrl(string $candidateName, string $candidateCode): string
    {
        if (empty($this->whatsapp_contact)) {
            return '#';
        }

        $message = "Halo {$this->whatsapp_contact_label}, saya {$candidateName} "
            ."dengan kode kandidat {$candidateCode} sudah melakukan upload "
            .'bukti pembayaran biaya pendaftaran. Mohon untuk segera diverifikasi. '
            .'Terima kasih 🙏';

        return 'https://wa.me/'.$this->whatsapp_contact
            .'?text='.urlencode($message);
    }

    // ─────────────────────────────────────────────
    // Scopes
    // ─────────────────────────────────────────────

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Ambil config yang relevan untuk wave tertentu.
     * Priority: config spesifik wave > global default (null wave).
     */
    public function scopeForWave($query, int $waveId)
    {
        return $query->active()
            ->where(function ($q) use ($waveId) {
                $q->where('admission_wave_id', $waveId)
                    ->orWhereNull('admission_wave_id');
            })
            // IS NULL = 1 saat DESC → null (global default) ke bawah, spesifik wave ke atas
            ->orderByRaw('admission_wave_id IS NULL DESC')
            ->limit(1);
    }
}
