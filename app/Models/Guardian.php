<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Guardian extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'candidate_id', 'candidate_code',

        // Shared
        'no_kk', 'income_type', 'alamat_shared',

        // Ayah
        'father_status', 'father_name', 'father_nik',
        'father_place_of_birth', 'father_date_of_birth',
        'father_education', 'father_job_ktp', 'father_job_actual',
        'father_income_range', 'father_phone',
        'father_province', 'father_city', 'father_district',
        'father_village', 'father_address', 'father_postal_code',

        // Ibu
        'mother_status', 'mother_name', 'mother_nik',
        'mother_place_of_birth', 'mother_date_of_birth',
        'mother_education', 'mother_job_ktp', 'mother_job_actual',
        'mother_income_range', 'mother_phone',
        'mother_province', 'mother_city', 'mother_district',
        'mother_village', 'mother_address', 'mother_postal_code',

        // Wali
        'guardian_status', 'guardian_name', 'guardian_relation',
        'guardian_nik', 'guardian_place_of_birth', 'guardian_date_of_birth',
        'guardian_education', 'guardian_job_ktp', 'guardian_job_actual',
        'guardian_income_range', 'guardian_phone',
        'guardian_province', 'guardian_city', 'guardian_district',
        'guardian_village', 'guardian_address', 'guardian_postal_code',

        // Profil Keluarga
        'family_email', 'marital_status', 'house_ownership',
        'vehicle_ownership', 'family_dependents',
    ];

    protected $casts = [
        'father_date_of_birth'   => 'date',
        'mother_date_of_birth'   => 'date',
        'guardian_date_of_birth' => 'date',
        'alamat_shared'          => 'boolean',
        'family_dependents'      => 'integer',
    ];

    // ─── Label Maps (untuk display di Rangkuman) ──────────────────────────

    public static array $educationLabels = [
        'tidak_sekolah'    => 'Tidak Sekolah',
        'sd_sederajat'     => 'SD / Sederajat',
        'smp_sederajat'    => 'SMP / Sederajat',
        'sma_smk_sederajat'=> 'SMA / SMK / Sederajat',
        'd1'               => 'D1',
        'd2'               => 'D2',
        'd3'               => 'D3',
        'd4_s1'            => 'D4 / S1',
        's2'               => 'S2',
        's3'               => 'S3',
    ];

    public static array $incomeLabels = [
        'tidak_berpenghasilan' => 'Tidak Berpenghasilan',
        'di_bawah_1jt'        => '< Rp 1.000.000',
        '1jt_2_5jt'           => 'Rp 1.000.000 – 2.500.000',
        '2_5jt_3_5jt'         => 'Rp 2.500.000 – 3.500.000',
        '3_5jt_5jt'           => 'Rp 3.500.000 – 5.000.000',
        '5jt_10jt'            => 'Rp 5.000.000 – 10.000.000',
        'di_atas_10jt'        => '> Rp 10.000.000',
    ];

    public static array $statusLabels = [
        'hidup'          => 'Hidup',
        'meninggal'      => 'Meninggal',
        'tidak_diketahui'=> 'Tidak Diketahui',
    ];

    public static array $maritalLabels = [
        'nikah_tercatat' => 'Nikah Tercatat',
        'cerai_hidup'    => 'Cerai Hidup',
        'cerai_mati'     => 'Cerai Mati',
    ];

    public static array $houseLabels = [
        'milik_sendiri' => 'Milik Sendiri',
        'kontrak'       => 'Kontrak / Sewa',
        'menumpang'     => 'Menumpang',
        'rumah_dinas'   => 'Rumah Dinas',
    ];

    public static array $vehicleLabels = [
        'tidak_ada'      => 'Tidak Ada',
        'motor'          => 'Motor',
        'mobil'          => 'Mobil',
        'motor_dan_mobil'=> 'Motor & Mobil',
    ];

    // ─── Progress Calculation ─────────────────────────────────────────────

    /**
     * Hitung completion percentage Data Wali berdasarkan field wajib.
     * Data wali ikut dihitung saat status pernikahan bukan nikah tercatat.
     */
    public function getCompletionPercentageAttribute(): int
    {
        $required = $this->requiredCompletionFields();
        $filled = collect($required)
            ->filter(fn (string $field) => $this->filledForCompletion($field))
            ->count();

        return (int) round(($filled / count($required)) * 100);
    }

    public function requiredCompletionFields(): array
    {
        $fields = [
            'father_status',
            'mother_status',
            'mother_name',
            'no_kk',
            'income_type',
            'marital_status',
        ];

        if ($this->marital_status && $this->marital_status !== 'nikah_tercatat') {
            $fields = array_merge($fields, [
                'guardian_name',
                'guardian_relation',
                'guardian_date_of_birth',
                'guardian_education',
                'guardian_phone',
                'guardian_province',
                'guardian_city',
                'guardian_district',
                'guardian_village',
                'guardian_address',
                'guardian_postal_code',
            ]);
        }

        return $fields;
    }

    private function filledForCompletion(string $field): bool
    {
        $value = $this->{$field};

        if ($value === null) {
            return false;
        }

        return is_string($value) ? trim($value) !== '' : true;
    }

    // ─── Helpers ──────────────────────────────────────────────────────────

    public function getFatherAbsentAttribute(): bool
    {
        return in_array($this->father_status, ['meninggal', 'tidak_diketahui']);
    }

    public function getIncomeIsCombinedAttribute(): bool
    {
        return $this->income_type === 'combined';
    }

    // ─── Factory Method ───────────────────────────────────────────────────

    /**
     * Buat guardian baru dari data registration draft.
     * Dipanggil di RegisterController setelah candidate dibuat.
     * mother_name di-seed dari draft, sisanya kosong (diisi kandidat nanti).
     */
    public static function createFromDraft(
        \App\Models\RegistrationDraft $draft,
        int $candidateId
    ): static {
        return static::create([
            'candidate_id'   => $candidateId,
            'candidate_code' => str_replace('REG-', 'CDT-', $draft->registration_code),
            'mother_name'    => $draft->mother_name ?? '',
        ]);
    }

    // ─── Relationships ────────────────────────────────────────────────────

    public function candidate(): BelongsTo
    {
        return $this->belongsTo(Candidate::class);
    }
}
