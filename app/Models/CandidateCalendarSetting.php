<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CandidateCalendarSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'hide_javanese_calendar',
    ];

    protected $casts = [
        'hide_javanese_calendar' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
