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
        'current_step',
        'nisn',
        'nik',
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
        'date_of_birth'  => 'date',
        'expires_at'     => 'datetime',
        'address_detail' => 'array',
    ];

    // =============================================
    // STEP 1: Insert draft baru
    // Dipanggil saat user klik "Lanjut ke Langkah 2"
    // =============================================
    public static function createFromStep1(array $data, ?int $waveId = null): self
    {
        return self::create([
            'admission_wave_id' => $waveId,
            'current_step'      => 1,
            'nisn'              => $data['nisn'],
            'nik'               => $data['nik'],
            'full_name'         => $data['full_name'],
            'gender'            => $data['gender'],
            'place_of_birth'    => $data['place_of_birth'],
            'date_of_birth'     => $data['date_of_birth'],
        ]);
    }

    // =============================================
    // STEP 2: Update draft dengan kontak & alamat
    // =============================================
    public function updateFromStep2(array $data): self
    {
        $addressDetail = [
            'jalan'     => $data['addr_jalan'] ?? '',
            'rt'        => $data['addr_rt']    ?? '',
            'rw'        => $data['addr_rw']    ?? '',
            'kelurahan' => $data['addr_desa']  ?? '',
            'kecamatan' => $data['addr_kec']   ?? '',
            'kabupaten' => $data['addr_kab']   ?? '',
            'provinsi'  => $data['addr_prov']  ?? '',
        ];

        $addressFull = implode(', ', array_filter([
            $addressDetail['jalan'],
            'RT ' . $addressDetail['rt'] . '/RW ' . $addressDetail['rw'],
            $addressDetail['kelurahan'],
            'Kec. ' . $addressDetail['kecamatan'],
            $addressDetail['kabupaten'],
            $addressDetail['provinsi'],
        ]));

        $this->update([
            'current_step'    => 2,
            'mother_name'     => $data['mother_name'],
            'whatsapp_number' => $data['whatsapp_number'],
            'phone_number'    => $data['phone_number'] ?? null,
            'email'           => $data['email'],
            'address_full'    => $addressFull,
            'address_detail'  => $addressDetail,
        ]);

        return $this;
    }

    // =============================================
    // STEP 3: Finalisasi draft
    // Generate registration_code, secret_token, expires_at
    // =============================================
    public function finalizeStep3(array $data): self
    {
        $this->update([
            'current_step'      => 3,
            'school_origin'     => $data['school_origin'],
            'registration_code' => self::generateCode(),
            'secret_token'      => Str::uuid()->toString(),
            'expires_at'        => Carbon::now()->addDays(3),
        ]);

        return $this;
    }

    // =============================================
    // RESUME: Cari draft aktif by NISN atau NIK
    // =============================================
    public static function findActive(string $nisn, string $nik): ?self
    {
        return self::where(function ($q) use ($nisn, $nik) {
                $q->where('nisn', $nisn)->orWhere('nik', $nik);
            })
            ->whereNull('deleted_at')
            ->where(function ($q) {
                $q->whereNull('expires_at')
                  ->orWhere('expires_at', '>', now());
            })
            ->latest()
            ->first();
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
    // Cek apakah draft masih valid
    // =============================================
    public function isValid(): bool
    {
        return is_null($this->deleted_at) &&
               (is_null($this->expires_at) || $this->expires_at->isFuture());
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
