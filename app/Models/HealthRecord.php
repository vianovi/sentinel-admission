<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class HealthRecord extends Model
{
    protected $fillable = [
        'candidate_id',

        // Tab Fisik
        'blood_type',
        'rhesus',
        'height_cm',
        'weight_kg',
        'general_health_condition',
        'mental_health_notes',
        'eye_right_type',
        'eye_right_value',
        'eye_left_type',
        'eye_left_value',
        'eye_condition_since',

        // Tab Riwayat Kesehatan
        'major_illnesses',
        'last_illness',
        'allergy_food',
        'allergy_medicine',
        'allergy_condition',
        'physical_disabilities',
        'chronic_disease_doc_path',

        // Tab Catatan Khusus
        'special_notes',
        'parent_concern_notes',
        'surat_sehat_path',
        'bpjs_card_path',
        'vaccine_card_path',
    ];

    protected $casts = [
        'height_cm'        => 'integer',
        'weight_kg'        => 'integer',
        'eye_right_value'  => 'float',
        'eye_left_value'   => 'float',
        'eye_condition_since' => 'integer',
    ];

    // =============================================
    // RELASI
    // =============================================

    public function candidate()
    {
        return $this->belongsTo(Candidate::class);
    }

    // =============================================
    // ACCESSORS — BMI
    // =============================================

    /**
     * Hitung BMI jika tinggi & berat sudah diisi.
     * Tidak disimpan di DB — dihitung on-the-fly.
     */
    public function getBmiAttribute(): ?float
    {
        if (! $this->height_cm || ! $this->weight_kg) return null;
        $heightM = $this->height_cm / 100;
        return round($this->weight_kg / ($heightM * $heightM), 1);
    }

    /**
     * Kategori BMI dalam Bahasa Indonesia.
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

    // =============================================
    // ACCESSORS — LABEL DISPLAY (untuk Rangkuman)
    // =============================================

    /**
     * Label golongan darah yang ramah tampil.
     */
    public function getBloodTypeLabelAttribute(): string
    {
        return match ($this->blood_type) {
            'A', 'B', 'AB', 'O' => $this->blood_type,
            'unknown'            => 'Belum pernah tes',
            default              => 'Belum diisi',
        };
    }

    /**
     * Label rhesus yang ramah tampil.
     */
    public function getRhesusLabelAttribute(): string
    {
        return match ($this->rhesus) {
            'positive' => 'Positif (+)',
            'negative' => 'Negatif (-)',
            'unknown'  => 'Belum pernah tes',
            default    => 'Belum diisi',
        };
    }

    /**
     * Label kondisi mata kanan.
     */
    public function getEyeRightLabelAttribute(): string
    {
        return $this->formatEyeLabel($this->eye_right_type, $this->eye_right_value);
    }

    /**
     * Label kondisi mata kiri.
     */
    public function getEyeLeftLabelAttribute(): string
    {
        return $this->formatEyeLabel($this->eye_left_type, $this->eye_left_value);
    }

    private function formatEyeLabel(?string $type, ?float $value): string
    {
        return match ($type) {
            'normal'   => 'Normal',
            'unknown'  => 'Tidak diketahui',
            'minus'    => $value ? "Minus ({$value})" : 'Minus',
            'plus'     => $value ? "Plus (+{$value})" : 'Plus',
            'silinder' => $value ? "Silinder ({$value})" : 'Silinder',
            default    => 'Belum diisi',
        };
    }

    // =============================================
    // ACCESSORS — FILE URL (untuk preview dokumen)
    // =============================================

    public function getSuratSehatUrlAttribute(): ?string
    {
        return $this->surat_sehat_path
            ? Storage::url($this->surat_sehat_path)
            : null;
    }

    public function getBpjsCardUrlAttribute(): ?string
    {
        return $this->bpjs_card_path
            ? Storage::url($this->bpjs_card_path)
            : null;
    }

    public function getVaccineCardUrlAttribute(): ?string
    {
        return $this->vaccine_card_path
            ? Storage::url($this->vaccine_card_path)
            : null;
    }

    public function getChronicDiseaseDocUrlAttribute(): ?string
    {
        return $this->chronic_disease_doc_path
            ? Storage::url($this->chronic_disease_doc_path)
            : null;
    }

    // =============================================
    // HELPERS
    // =============================================

    /**
     * Cek kelengkapan data kesehatan.
     * Field wajib yang harus sudah direspons.
     */
    public function isComplete(): bool
    {
        return ! empty($this->blood_type)
            && ! empty($this->rhesus)
            && ! empty($this->height_cm)
            && ! empty($this->weight_kg)
            && ! empty($this->general_health_condition)
            && ! empty($this->eye_right_type)
            && ! empty($this->eye_left_type)
            && ! empty($this->major_illnesses)
            && ! empty($this->last_illness)
            && ! empty($this->allergy_food)
            && ! empty($this->allergy_medicine)
            && ! empty($this->allergy_condition)
            && ! empty($this->physical_disabilities);
    }

    /**
     * Persentase kelengkapan data (untuk progress bar kandidat).
     * Hanya field wajib yang dihitung.
     */
    public function completionPercentage(): int
    {
        $required = [
            'blood_type', 'rhesus', 'height_cm', 'weight_kg',
            'general_health_condition', 'eye_right_type', 'eye_left_type',
            'major_illnesses', 'last_illness',
            'allergy_food', 'allergy_medicine', 'allergy_condition',
            'physical_disabilities',
        ];

        $filled = collect($required)
            ->filter(fn($field) => ! empty($this->$field))
            ->count();

        return (int) round(($filled / count($required)) * 100);
    }

    /**
     * Cek apakah kondisi mata membutuhkan input nilai.
     * Nilai hanya relevan jika tipe bukan normal/unknown.
     */
    public function eyeNeedsValue(string $side): bool
    {
        $type = $side === 'right' ? $this->eye_right_type : $this->eye_left_type;
        return in_array($type, ['minus', 'plus', 'silinder']);
    }
}