<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;
use Carbon\Carbon;

class RegistrationDraft extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'admission_wave_id',
        'registration_code',
        'secret_token',
        'expires_at',
        'nisn',
        'full_name',
        'gender',
        'place_of_birth',
        'date_of_birth',
        'mother_name',
        'whatsapp_number',
        'phone_number',
        'email',
        'address_full',
        'address_detail',
        'school_origin',
    ];

    protected $casts = [
        'date_of_birth' => 'date',
        'expires_at'    => 'datetime',
        'address_detail' => 'array',
    ];

    // =============================================
    // STATIC: Generate draft baru dari step 1+2+3
    // =============================================
    public static function createFromWizard(array $data, ?int $waveId = null): self
    {
        $addressDetail = [
            'jalan'      => $data['addr_jalan'] ?? '',
            'rt'         => $data['addr_rt'] ?? '',
            'rw'         => $data['addr_rw'] ?? '',
            'kelurahan'  => $data['addr_desa'] ?? '',
            'kecamatan'  => $data['addr_kec'] ?? '',
            'kabupaten'  => $data['addr_kab'] ?? '',
            'provinsi'   => $data['addr_prov'] ?? '',
        ];

        $addressFull = implode(', ', array_filter([
            $addressDetail['jalan'],
            'RT ' . $addressDetail['rt'] . '/RW ' . $addressDetail['rw'],
            $addressDetail['kelurahan'],
            'Kec. ' . $addressDetail['kecamatan'],
            $addressDetail['kabupaten'],
            $addressDetail['provinsi'],
        ]));

        return self::create([
            'admission_wave_id' => $waveId,
            'registration_code' => self::generateCode(),
            'secret_token'      => Str::uuid()->toString(),
            'expires_at'        => Carbon::now()->addDays(3),
            'nisn'              => $data['nisn'],
            'full_name'         => $data['full_name'],
            'gender'            => $data['gender'],
            'place_of_birth'    => $data['place_of_birth'],
            'date_of_birth'     => $data['date_of_birth'],
            'mother_name'       => $data['mother_name'],
            'whatsapp_number'   => $data['whatsapp_number'],
            'phone_number'      => $data['phone_number'] ?? null,
            'email'             => $data['email'],
            'school_origin'     => $data['school_origin'],
            'address_full'      => $addressFull,
            'address_detail'    => $addressDetail,
        ]);
    }

    // =============================================
    // Generate registration code: REG-2026-XXXXX
    // =============================================
    public static function generateCode(): string
    {
        do {
            $code = 'REG-' . date('Y') . '-' . strtoupper(Str::random(5));
        } while (self::where('registration_code', $code)->exists());

        return $code;
    }

    // =============================================
    // Cek apakah draft masih valid (belum expired)
    // =============================================
    public function isValid(): bool
    {
        return $this->expires_at->isFuture() && is_null($this->deleted_at);
    }

    // =============================================
    // RELASI
    // =============================================
    public function admissionWave()
    {
        return $this->belongsTo(AdmissionWave::class);
    }

    public function candidate()
    {
        return $this->hasOne(Candidate::class);
    }
}
