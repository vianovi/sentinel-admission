<?php

namespace App\Services\CandidateStatus;

use App\Models\Candidate;
use App\Models\Guardian;
use App\Models\HealthRecord;

class CandidateCompletionEvaluator
{
    public const DATA_DIRI_FIELDS = [
        'phone_number' => 'Nomor HP/WA siswa',
        'religion' => 'Agama',
        'family_card_number' => 'Nomor KK',
        'postal_code' => 'Kode pos',
        'school_npsn' => 'NPSN sekolah',
        'program_choice' => 'Pilihan program',
    ];

    public const GUARDIAN_FIELDS = [
        'mother_name' => 'Nama ibu',
        'income_type' => 'Tipe penghasilan',
        'father_status' => 'Status ayah',
        'mother_status' => 'Status ibu',
        'no_kk' => 'Nomor KK',
        'marital_status' => 'Status pernikahan orang tua',
    ];

    public const CONDITIONAL_GUARDIAN_FIELDS = [
        'guardian_name' => 'Nama wali',
        'guardian_relation' => 'Hubungan wali',
        'guardian_date_of_birth' => 'Tanggal lahir wali',
        'guardian_education' => 'Pendidikan wali',
        'guardian_phone' => 'Nomor HP wali',
        'guardian_province' => 'Provinsi wali',
        'guardian_city' => 'Kota/Kabupaten wali',
        'guardian_district' => 'Kecamatan wali',
        'guardian_village' => 'Kelurahan/Desa wali',
        'guardian_address' => 'Alamat wali',
        'guardian_postal_code' => 'Kode pos wali',
    ];

    public const HEALTH_FIELDS = [
        'blood_type' => 'Golongan darah',
        'rhesus' => 'Rhesus',
        'height_cm' => 'Tinggi badan',
        'weight_kg' => 'Berat badan',
        'general_health_condition' => 'Kondisi kesehatan umum',
        'eye_right_type' => 'Mata kanan',
        'eye_left_type' => 'Mata kiri',
        'major_illnesses' => 'Riwayat penyakit berat',
        'last_illness' => 'Penyakit terakhir',
        'allergy_food' => 'Alergi makanan',
        'allergy_medicine' => 'Alergi obat',
        'allergy_condition' => 'Kondisi alergi',
        'physical_disabilities' => 'Disabilitas fisik',
    ];

    public function evaluate(Candidate $candidate): CandidateEvaluationResult
    {
        $candidate->load(['guardian', 'healthRecord']);

        $requirements = [
            ...$this->candidateRequirements(),
            ...$this->guardianRequirements($candidate->guardian),
            ...$this->healthRequirements(),
        ];

        $missing = array_values(array_filter(
            $requirements,
            fn (CandidateRequirement $requirement) => ! $this->isRequirementFilled($candidate, $requirement)
        ));

        return new CandidateEvaluationResult($requirements, $missing);
    }

    public function candidateSection(Candidate $candidate): CandidateEvaluationResult
    {
        $requirements = $this->candidateRequirements();
        $missing = array_values(array_filter(
            $requirements,
            fn (CandidateRequirement $requirement) => ! $this->filled($candidate->{$requirement->key})
        ));

        return new CandidateEvaluationResult($requirements, $missing);
    }

    public function guardianSection(Candidate $candidate): CandidateEvaluationResult
    {
        $candidate->load('guardian');
        $guardian = $candidate->guardian;
        $requirements = $this->guardianRequirements($guardian);

        if (! $guardian) {
            return new CandidateEvaluationResult($requirements, $requirements);
        }

        $missing = array_values(array_filter(
            $requirements,
            fn (CandidateRequirement $requirement) => ! $this->filled($guardian->{$requirement->key})
        ));

        return new CandidateEvaluationResult($requirements, $missing);
    }

    public function healthSection(Candidate $candidate): CandidateEvaluationResult
    {
        $candidate->load('healthRecord');
        $health = $candidate->healthRecord;
        $requirements = $this->healthRequirements();

        if (! $health) {
            return new CandidateEvaluationResult($requirements, $requirements);
        }

        $missing = array_values(array_filter(
            $requirements,
            fn (CandidateRequirement $requirement) => ! $this->filled($health->{$requirement->key})
        ));

        return new CandidateEvaluationResult($requirements, $missing);
    }

    /**
     * @return array<int, CandidateRequirement>
     */
    public function candidateRequirements(): array
    {
        return $this->requirementsFromMap(self::DATA_DIRI_FIELDS, 'candidate');
    }

    /**
     * @return array<int, CandidateRequirement>
     */
    public function guardianRequirements(?Guardian $guardian = null): array
    {
        $fields = self::GUARDIAN_FIELDS;

        if ($guardian?->marital_status && $guardian->marital_status !== 'nikah_tercatat') {
            $fields += self::CONDITIONAL_GUARDIAN_FIELDS;
        }

        return $this->requirementsFromMap($fields, 'guardian');
    }

    /**
     * @return array<int, CandidateRequirement>
     */
    public function healthRequirements(): array
    {
        return $this->requirementsFromMap(self::HEALTH_FIELDS, 'health');
    }

    private function isRequirementFilled(Candidate $candidate, CandidateRequirement $requirement): bool
    {
        return match ($requirement->group) {
            'candidate' => $this->filled($candidate->{$requirement->key}),
            'guardian' => $candidate->guardian
                ? $this->filled($candidate->guardian->{$requirement->key})
                : false,
            'health' => $candidate->healthRecord
                ? $this->filled($candidate->healthRecord->{$requirement->key})
                : false,
            default => false,
        };
    }

    /**
     * @param array<string, string> $fields
     * @return array<int, CandidateRequirement>
     */
    private function requirementsFromMap(array $fields, string $group): array
    {
        return collect($fields)
            ->map(fn (string $label, string $key) => new CandidateRequirement($key, $label, $group))
            ->values()
            ->all();
    }

    private function filled(mixed $value): bool
    {
        if (is_array($value)) {
            return ! empty($value);
        }

        if (is_bool($value) || is_int($value) || is_float($value)) {
            return true;
        }

        return $value !== null && trim((string) $value) !== '';
    }
}
