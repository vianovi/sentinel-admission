<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Candidate extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'admission_wave_id',
        'registration_draft_id',
        'nisn',
        'nik',
        'full_name',
        'gender',
        'place_of_birth',
        'date_of_birth',
        'address_full',
        'address_detail',
        'school_origin',
        'program_choice',
        'phone_number',
        'status',
    ];

    protected $casts = [
        'date_of_birth'  => 'date',
        'address_detail' => 'array',
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

    public function documents()
    {
        return $this->hasMany(CandidateDocument::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
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
            'nik'                   => $draft->nik,
            'full_name'             => $draft->full_name,
            'gender'                => $draft->gender,
            'place_of_birth'        => $draft->place_of_birth,
            'date_of_birth'         => $draft->date_of_birth,
            'address_full'          => $draft->address_full,
            'address_detail'        => $draft->address_detail,
            'school_origin'         => $draft->school_origin,
            'status'                => 'draft',
        ]);
    }

    // =============================================
    // HELPERS
    // =============================================

    public function genderLabel(): string
    {
        return $this->gender === 'L' ? 'Laki-laki' : 'Perempuan';
    }
}