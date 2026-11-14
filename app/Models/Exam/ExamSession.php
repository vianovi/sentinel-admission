<?php

namespace App\Models\Exam;

use App\Models\AdmissionWave;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ExamSession extends Model
{
    public const STATUS_DRAFT = 'draft';

    public const STATUS_PUBLISHED = 'published';

    public const STATUS_CLOSED = 'closed';

    public const STATUS_ARCHIVED = 'archived';

    protected $fillable = [
        'exam_package_id',
        'admission_wave_id',
        'created_by',
        'title',
        'description',
        'instructions',
        'opens_at',
        'closes_at',
        'duration_minutes',
        'passing_score',
        'max_attempts',
        'show_result_to_candidate',
        'package_order_type',
        'status',
    ];

    protected $casts = [
        'opens_at' => 'datetime',
        'closes_at' => 'datetime',
        'duration_minutes' => 'integer',
        'passing_score' => 'decimal:2',
        'max_attempts' => 'integer',
        'show_result_to_candidate' => 'boolean',
    ];

    public function package(): BelongsTo
    {
        return $this->belongsTo(ExamPackage::class, 'exam_package_id');
    }

    public function packages(): BelongsToMany
    {
        return $this->belongsToMany(ExamPackage::class, 'exam_session_packages')
            ->withPivot('sort_order')
            ->orderByPivot('sort_order')
            ->withTimestamps();
    }

    public function admissionWave(): BelongsTo
    {
        return $this->belongsTo(AdmissionWave::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function candidates(): HasMany
    {
        return $this->hasMany(ExamSessionCandidate::class);
    }

    public function attempts(): HasMany
    {
        return $this->hasMany(ExamAttempt::class);
    }

    public function isPublished(): bool
    {
        return $this->status === self::STATUS_PUBLISHED;
    }

    public function isOpenForStart(): bool
    {
        return $this->isPublished()
            && $this->opens_at?->lte(now())
            && $this->closes_at?->gt(now());
    }

    public function isClosedByTime(): bool
    {
        return $this->closes_at?->lte(now()) ?? false;
    }
}
