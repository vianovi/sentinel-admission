<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CandidateCalendarEvent extends Model
{
    use HasFactory;

    public const TYPES = [
        'registration',
        'payment',
        'test',
        'announcement',
        'document',
        'meeting',
        'note',
        'holiday',
    ];

    public const STATUSES = [
        'scheduled',
        'active',
        'completed',
        'cancelled',
        'urgent',
    ];

    protected $fillable = [
        'user_id',
        'candidate_id',
        'title',
        'description',
        'event_date',
        'starts_at',
        'ends_at',
        'all_day',
        'type',
        'status',
        'location',
    ];

    protected $casts = [
        'event_date' => 'date',
        'starts_at'  => 'datetime',
        'ends_at'    => 'datetime',
        'all_day'    => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function candidate()
    {
        return $this->belongsTo(Candidate::class);
    }
}
