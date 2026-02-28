<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Candidate extends Model
{
    protected $fillable = [
        'user_id',
        'admission_wave_id',
        'registration_draft_id',
        'nisn',
        'full_name',
        'gender',
        'place_of_birth',
        'date_of_birth',
        'address',
        'school_origin',
        'program_choice',
        'phone_number',
        'status',
    ];

    protected $casts = [
        'date_of_birth' => 'date',
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

    // =============================================
    // STATIC: Konversi dari draft → candidate
    // =============================================
    public static function createFromDraft(RegistrationDraft $draft, int $userId): self
    {
        return self::create([
            'user_id'               => $userId,
            'admission_wave_id'     => $draft->admission_wave_id,
            'registration_draft_id' => $draft->id,
            'nisn'                  => $draft->nisn,
            'full_name'             => $draft->full_name,
            'gender'                => $draft->gender,
            'place_of_birth'        => $draft->place_of_birth,
            'date_of_birth'         => $draft->date_of_birth,
            'address'               => $draft->address_full,
            'school_origin'         => $draft->school_origin,
            'status'                => 'draft',
        ]);
    }

    // =============================================
    // HELPER: Label gender
    // =============================================
    public function genderLabel(): string
    {
        return $this->gender === 'L' ? 'Laki-laki' : 'Perempuan';
    }
}
