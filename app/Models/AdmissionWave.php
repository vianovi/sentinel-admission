<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AdmissionWave extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'academic_year',
        'description',
        'start_date',
        'end_date',
        'exam_info',
        'announcement_info',
        'reregistration_date',
        'registration_fee',
        'quota_target',
        'available_majors',
        'majors_enabled',
        'is_active',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'reregistration_date' => 'date',
        'registration_fee' => 'decimal:2',
        'available_majors' => 'array',
        'majors_enabled' => 'boolean',
        'is_active' => 'boolean',
    ];

    // ─────────────────────────────────────────────
    // Relations
    // ─────────────────────────────────────────────

    /**
     * Semua kandidat dalam gelombang ini.
     * Dipakai untuk hitung quota_filled realtime.
     */
    public function candidates()
    {
        return $this->hasMany(Candidate::class);
    }

    /**
     * Program-program yang tersedia dalam gelombang ini.
     * Menggantikan available_programs JSON yang lama.
     */
    public function programs()
    {
        return $this->hasMany(AdmissionProgram::class)->orderBy('priority')->orderBy('name');
    }

    /**
     * Program aktif saja — dipakai di frontend candidate.
     */
    public function activePrograms()
    {
        return $this->hasMany(AdmissionProgram::class)
            ->where('is_active', true)
            ->orderBy('priority')
            ->orderBy('name');
    }

    // ─────────────────────────────────────────────
    // Quota Helpers
    // ─────────────────────────────────────────────

    /**
     * Total kandidat yang sudah terdaftar di gelombang ini (realtime).
     * Exclude status draft — draft belum "mengisi" kuota.
     */
    public function totalFilled(): int
    {
        return $this->candidates()
            ->whereNotIn('status', ['draft'])
            ->count();
    }

    /**
     * Apakah gelombang ini masih bisa menerima pendaftar baru?
     */
    public function isAccepting(): bool
    {
        if (! $this->is_active) {
            return false;
        }

        return $this->totalFilled() < $this->quota_target;
    }
}
