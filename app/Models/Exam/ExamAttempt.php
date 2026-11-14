<?php

namespace App\Models\Exam;

use App\Models\Candidate;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ExamAttempt extends Model
{
    public const STATUS_IN_PROGRESS = 'in_progress';

    public const STATUS_SUBMITTED = 'submitted';

    public const STATUS_AUTO_SUBMITTED = 'auto_submitted';

    public const STATUS_EXPIRED = 'expired';

    public const STATUS_CANCELLED = 'cancelled';

    public const STATUS_INVALIDATED = 'invalidated';

    protected $fillable = [
        'exam_session_id',
        'exam_session_candidate_id',
        'exam_package_id',
        'candidate_id',
        'attempt_number',
        'status',
        'started_at',
        'expires_at',
        'submitted_at',
        'finalized_at',
        'last_activity_at',
        'question_order',
        'total_questions',
        'answered_questions',
        'blank_questions',
        'correct_answers',
        'wrong_answers',
        'raw_score',
        'max_score',
        'percentage_score',
        'passing_score',
        'passed',
        'violations_count',
        'metadata',
    ];

    protected $casts = [
        'attempt_number' => 'integer',
        'started_at' => 'datetime',
        'expires_at' => 'datetime',
        'submitted_at' => 'datetime',
        'finalized_at' => 'datetime',
        'last_activity_at' => 'datetime',
        'question_order' => 'array',
        'total_questions' => 'integer',
        'answered_questions' => 'integer',
        'blank_questions' => 'integer',
        'correct_answers' => 'integer',
        'wrong_answers' => 'integer',
        'raw_score' => 'decimal:2',
        'max_score' => 'decimal:2',
        'percentage_score' => 'decimal:2',
        'passing_score' => 'decimal:2',
        'passed' => 'boolean',
        'violations_count' => 'integer',
        'metadata' => 'array',
    ];

    public function session(): BelongsTo
    {
        return $this->belongsTo(ExamSession::class, 'exam_session_id');
    }

    public function sessionCandidate(): BelongsTo
    {
        return $this->belongsTo(ExamSessionCandidate::class, 'exam_session_candidate_id');
    }

    public function package(): BelongsTo
    {
        return $this->belongsTo(ExamPackage::class, 'exam_package_id');
    }

    public function candidate(): BelongsTo
    {
        return $this->belongsTo(Candidate::class);
    }

    public function answers(): HasMany
    {
        return $this->hasMany(ExamAttemptAnswer::class);
    }

    public function participantName(): string
    {
        return $this->candidate?->full_name ?? 'Kandidat';
    }

    public function participantEmail(): ?string
    {
        return $this->candidate?->user?->email;
    }

    public function isInProgress(): bool
    {
        return $this->status === self::STATUS_IN_PROGRESS;
    }

    public function isExpiredByTime(): bool
    {
        return $this->expires_at?->lte(now()) ?? false;
    }

    public function isLocked(): bool
    {
        return ! $this->isInProgress() || $this->isExpiredByTime();
    }

    public function remainingSeconds(): int
    {
        if (! $this->expires_at) {
            return 0;
        }

        return max(0, now()->diffInSeconds($this->expires_at, false));
    }
}
