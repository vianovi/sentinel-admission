<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AdmissionWave extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'academic_year',
        'description',
        'start_date',
        'end_date',
        'exam_info',
        'announcement_info',
        'reregistration_date',
        'registration_fee',
        'quota_target',
        'is_active',
    ];

    protected $casts = [
        'start_date'          => 'date',
        'end_date'            => 'date',
        'reregistration_date' => 'date',
        'registration_fee'    => 'decimal:2',
        'is_active'           => 'boolean',
    ];

    /**
     * Relasi ke candidates — dipakai untuk hitung quota_filled realtime.
     */
    public function candidates()
    {
        return $this->hasMany(Candidate::class);
    }
}