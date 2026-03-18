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
    // expires_at = now + 2 hari — di-set sekali, tidak pernah diubah
    // =============================================
    public static function createFromStep1(array $data, ?int $waveId = null): self
    {
        return self::create([
            'admission_wave_id' => $waveId,
            'current_step'      => 1,
            'expires_at'        => Carbon::now()->addDays(2),
            'nisn'              => $data['nisn'],
            'nik'               => $data['nik'],
            'full_name'         => $data['full_name'],
            'gender'            => $data['gender'],
            'place_of_birth'    => $data['place_of_birth'],
            'date_of_birth'     => $data['date_of_birth'],
        ]);
    }

    // =============================================
    // STEP 2: Update kontak & alamat
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
            'email'           => $data['email'],
            'address_full'    => $addressFull,
            'address_detail'  => $addressDetail,
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
    // Generate: REG-{random4}-{yy}-G{gelombang}
    // Contoh: REG-A3X9-26-G2
    //
    // Random 4 karakter alphanumeric uppercase
    // Loop sampai unique — collision hampir mustahil
    // =============================================
    public static function generateCode(?int $waveId): string
    {
        // Nomor gelombang dari title: "Gelombang 2" → 2
        $waveNumber = 0;
        if ($waveId) {
            $wave = \App\Models\AdmissionWave::find($waveId);
            if ($wave) {
                preg_match('/\d+/', $wave->title, $matches);
                $waveNumber = (int) ($matches[0] ?? $waveId);
            }
        }

        $year = date('y'); // 2 digit: 26

        do {
            $random = strtoupper(Str::random(4));
            $code   = "REG-{$random}-{$year}-G{$waveNumber}";
        } while (self::withTrashed()->where('registration_code', $code)->exists());

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