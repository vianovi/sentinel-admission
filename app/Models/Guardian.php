<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Guardian extends Model
{
    protected $fillable = [
        'candidate_id',
        // Ayah
        'father_name',
        'father_nik',
        'father_place_of_birth',
        'father_date_of_birth',
        'father_job',
        'father_income',
        'father_phone',
        // Ibu
        'mother_name',
        'mother_nik',
        'mother_place_of_birth',
        'mother_date_of_birth',
        'mother_job',
        'mother_income',
        'mother_phone',
        // Wali (opsional)
        'guardian_name',
        'guardian_relation',
        'guardian_job',
        'guardian_income',
        'guardian_phone',
        // Administrasi
        'no_kk',
    ];

    protected $casts = [
        'father_date_of_birth' => 'date',
        'mother_date_of_birth' => 'date',
    ];

    // =============================================
    // RELASI
    // =============================================

    public function candidate()
    {
        return $this->belongsTo(Candidate::class);
    }

    // =============================================
    // STATIC: Buat guardian awal dari draft
    // Hanya mother_name yang tersedia dari draft.
    // Sisa data dilengkapi kandidat setelah login.
    // =============================================

    public static function createFromDraft(RegistrationDraft $draft, int $candidateId): self
    {
        return self::create([
            'candidate_id' => $candidateId,
            'mother_name'  => $draft->mother_name,
        ]);
    }

    // =============================================
    // HELPERS
    // =============================================

    /**
     * Cek apakah data sudah cukup lengkap untuk submit.
     * Minimal: mother_name + salah satu nomor kontak ortu.
     */
    public function isComplete(): bool
    {
        return ! empty($this->mother_name) &&
               (! empty($this->father_phone) || ! empty($this->mother_phone));
    }

    /**
     * Cek apakah data wali (bukan ortu) diisi.
     */
    public function hasGuardian(): bool
    {
        return ! empty($this->guardian_name);
    }
}