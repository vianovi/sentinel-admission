<?php

namespace App\Models;

use App\Models\Exam\ExamAttempt;
use App\Models\Exam\ExamSessionCandidate;
use App\Services\CandidateStatus\CandidateCompletionEvaluator;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Candidate extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'admission_wave_id',
        'registration_draft_id',
        'candidate_code',
        // Identitas
        'nisn',
        'nik',
        'full_name',
        'gender',
        'place_of_birth',
        'date_of_birth',
        'religion',
        'child_order',
        'siblings_count',
        'hobbies',
        'ambitions',
        'habits',
        'extracurricular_interests',
        // Alamat
        'address_full',
        'address_detail',
        'postal_code',
        // Sekolah asal
        'school_origin',
        'school_npsn',
        'certificate_number',
        // Data tambahan
        'email',
        'phone_number',
        'birth_certificate_number',
        'family_card_number',
        'program_choice',
        'major_choice',
        'is_transfer',
        // Status & change request
        'status',
        'data_change_request',
    ];

    protected $casts = [
        'date_of_birth'              => 'date',
        'address_detail'             => 'array',
        'data_change_request'        => 'array',
        'child_order'                => 'integer',
        'siblings_count'             => 'integer',
        'extracurricular_interests'  => 'array',
        'is_transfer'                => 'boolean',
    ];

    // =============================================
    // RELASI
    // =============================================

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function admissionWave()
    {
        return $this->belongsTo(AdmissionWave::class);
    }

    public function registrationDraft()
    {
        return $this->belongsTo(RegistrationDraft::class);
    }

    public function guardian()
    {
        return $this->hasOne(Guardian::class);
    }

    public function healthRecord()
    {
        return $this->hasOne(HealthRecord::class);
    }

    public function documents()
    {
        return $this->hasMany(CandidateDocument::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    public function examSessionCandidates()
    {
        return $this->hasMany(ExamSessionCandidate::class);
    }

    public function examAttempts()
    {
        return $this->hasMany(ExamAttempt::class);
    }

    // =============================================
    // STATIC: Konversi dari draft → candidate
    // =============================================

    public static function createFromDraft(RegistrationDraft $draft, int $userId): self
    {
        // Derive candidate_code dari registration_code — hanya ganti prefix REG- → CDT-
        // Nilai di belakang prefix HARUS sama persis, tidak boleh di-generate ulang
        $candidateCode = $draft->registration_code
            ? str_replace('REG-', 'CDT-', $draft->registration_code)
            : null;

        $candidate = self::create([
            'user_id'               => $userId,
            'admission_wave_id'     => $draft->admission_wave_id,
            'registration_draft_id' => $draft->id,
            'candidate_code'        => $candidateCode,
            'nisn'                  => $draft->nisn,
            'nik'                   => $draft->nik,
            'full_name'             => $draft->full_name,
            'gender'                => $draft->gender,
            'place_of_birth'        => $draft->place_of_birth,
            'date_of_birth'         => $draft->date_of_birth,
            'address_full'          => $draft->address_full,
            'address_detail'        => $draft->address_detail,
            'school_origin'         => $draft->school_origin,
            'email'                 => $draft->email,
            'phone_number'          => self::normalizePhoneNumber($draft->whatsapp_number),
            'status'                => 'draft',
            // program_choice   → diisi kandidat sendiri setelah login
        ]);

        // Simpan relasi balik draft → candidate
        $draft->update(['candidate_id' => $candidate->id]);

        return $candidate;
    }

    // =============================================
    // HELPERS
    // =============================================

    public function genderLabel(): string
    {
        return $this->gender === 'L' ? 'Laki-laki' : 'Perempuan';
    }

    public function hasPendingChangeRequest(): bool
    {
        return ! empty($this->data_change_request) &&
               ($this->data_change_request['status'] ?? '') === 'pending';
    }

    public function isDataComplete(): bool
    {
        return collect(array_keys(CandidateCompletionEvaluator::DATA_DIRI_FIELDS))
            ->every(fn (string $field) => ! empty($this->{$field}));
    }

    public static function normalizePhoneNumber(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $number = preg_replace('/\D+/', '', $value) ?? '';

        if (str_starts_with($number, '0062')) {
            $number = '0' . substr($number, 4);
        } elseif (str_starts_with($number, '62')) {
            $number = '0' . substr($number, 2);
        }

        return $number !== '' ? substr($number, 0, 14) : null;
    }
}
