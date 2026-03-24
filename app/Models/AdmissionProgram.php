<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AdmissionProgram extends Model
{
    use HasFactory;

    protected $fillable = [
        'admission_wave_id',
        'name',
        'priority',
        'quota_ideal',
        'quota_max',
        'is_open_quota',
        'description',
        'is_active',
    ];

    protected $casts = [
        'priority'       => 'integer',
        'quota_ideal'    => 'integer',
        'quota_max'      => 'integer',
        'is_open_quota'  => 'boolean',
        'is_active'      => 'boolean',
    ];

    // ─────────────────────────────────────────────
    // Relations
    // ─────────────────────────────────────────────

    public function admissionWave()
    {
        return $this->belongsTo(AdmissionWave::class);
    }

    // ─────────────────────────────────────────────
    // Quota Helpers
    // ─────────────────────────────────────────────

    /**
     * Hitung jumlah kandidat yang sudah memilih program ini.
     * Menggunakan string match pada program_choice di tabel candidates.
     */
    public function filledCount(): int
    {
        return Candidate::where('admission_wave_id', $this->admission_wave_id)
            ->where('program_choice', $this->name)
            ->whereNotIn('status', ['draft'])
            ->count();
    }

    /**
     * Zona kuota untuk program ini.
     *
     * Zona:
     *   green  → filled < quota_ideal              (normal)
     *   yellow → quota_ideal <= filled < quota_max (warning — melebihi ideal)
     *   red    → filled >= quota_max               (penuh, ditolak)
     *   open   → is_open_quota = true              (hanya dibatasi total gelombang)
     */
    public function quotaZone(): string
    {
        if ($this->is_open_quota) {
            return 'open';
        }

        $filled = $this->filledCount();

        if ($filled >= $this->quota_max) {
            return 'red';
        }

        if ($filled >= $this->quota_ideal) {
            return 'yellow';
        }

        return 'green';
    }

    /**
     * Apakah program ini masih bisa menerima pendaftar baru?
     * Menerima total filled gelombang untuk validasi batas atas gelombang.
     */
    public function isAccepting(int $waveTotalFilled): bool
    {
        if (! $this->is_active) {
            return false;
        }

        // Batas total gelombang selalu berlaku untuk semua program
        $waveQuota = $this->admissionWave->quota_target;
        if ($waveTotalFilled >= $waveQuota) {
            return false;
        }

        // Program open quota (Reguler) — hanya dibatasi total gelombang
        if ($this->is_open_quota) {
            return true;
        }

        // Program ketat — dibatasi quota_max
        return $this->filledCount() < $this->quota_max;
    }

    /**
     * Warning message per role untuk zona kuning.
     * Kembalikan null jika tidak perlu warning.
     */
    public function warningMessage(string $role = 'candidate'): ?string
    {
        if ($this->quotaZone() !== 'yellow') {
            return null;
        }

        return match ($role) {
            'candidate' => 'Kuota ideal program ini kemungkinan sudah terpenuhi, namun Anda masih dapat mendaftarkan diri. Pendaftaran di luar kuota ideal tetap akan diproses.',
            'staff'     => "Program {$this->name} telah melewati kuota ideal ({$this->quota_ideal}). Pendaftaran masih dibuka hingga kuota maksimal ({$this->quota_max}).",
            'admin'     => "Program {$this->name}: {$this->filledCount()} terdaftar — melebihi ideal {$this->quota_ideal}, batas maksimal {$this->quota_max}.",
            default     => null,
        };
    }

    // ─────────────────────────────────────────────
    // Scopes
    // ─────────────────────────────────────────────

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('priority')->orderBy('name');
    }
}
