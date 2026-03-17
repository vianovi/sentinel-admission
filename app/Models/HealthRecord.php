<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HealthRecord extends Model
{
    protected $fillable = [
        'candidate_id',
        'blood_type',
        'height_cm',
        'weight_kg',
        'major_illnesses',
        'allergies',
        'physical_disabilities',
        'special_notes',
    ];

    protected $casts = [
        'height_cm' => 'integer',
        'weight_kg' => 'integer',
    ];

    // =============================================
    // RELASI
    // =============================================

    public function candidate()
    {
        return $this->belongsTo(Candidate::class);
    }

    // =============================================
    // HELPERS
    // =============================================

    /**
     * Cek apakah data kesehatan wajib sudah diisi.
     * Minimal major_illnesses & allergies harus ada.
     */
    public function isComplete(): bool
    {
        return ! empty($this->major_illnesses) &&
               ! empty($this->allergies);
    }

    /**
     * Hitung BMI jika tinggi & berat sudah diisi.
     */
    public function getBmiAttribute(): ?float
    {
        if (! $this->height_cm || ! $this->weight_kg) return null;
        $heightM = $this->height_cm / 100;
        return round($this->weight_kg / ($heightM * $heightM), 1);
    }

    /**
     * Kategori BMI.
     */
    public function getBmiCategoryAttribute(): ?string
    {
        $bmi = $this->bmi;
        if (! $bmi) return null;
        return match (true) {
            $bmi < 18.5 => 'Kurus',
            $bmi < 25.0 => 'Normal',
            $bmi < 30.0 => 'Gemuk',
            default     => 'Obesitas',
        };
    }
}
