<?php

namespace App\Models\Exam;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ExamPackage extends Model
{
    public const STATUS_DRAFT = 'draft';

    public const STATUS_PUBLISHED = 'published';

    public const STATUS_CLOSED = 'closed';

    public const STATUS_ARCHIVED = 'archived';

    protected $fillable = [
        'exam_subject_id',
        'created_by',
        'title',
        'code',
        'description',
        'duration_minutes',
        'passing_score',
        'max_attempts',
        'randomize_questions',
        'randomize_options',
        'show_result_to_candidate',
        'status',
        'published_at',
    ];

    protected $casts = [
        'duration_minutes' => 'integer',
        'passing_score' => 'decimal:2',
        'max_attempts' => 'integer',
        'randomize_questions' => 'boolean',
        'randomize_options' => 'boolean',
        'show_result_to_candidate' => 'boolean',
        'published_at' => 'datetime',
    ];

    public function subject(): BelongsTo
    {
        return $this->belongsTo(ExamSubject::class, 'exam_subject_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function questions(): HasMany
    {
        return $this->hasMany(ExamQuestion::class);
    }

    public function activeQuestions(): HasMany
    {
        return $this->questions()->where('is_active', true)->orderBy('sort_order')->orderBy('id');
    }

    public function sessions(): HasMany
    {
        return $this->hasMany(ExamSession::class);
    }

    public function importBatches(): HasMany
    {
        return $this->hasMany(ExamImportBatch::class);
    }

    public function isPublished(): bool
    {
        return $this->status === self::STATUS_PUBLISHED;
    }
}
