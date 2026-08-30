<?php

namespace App\Models\Exam;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ExamSessionToken extends Model
{
    public const TYPE_SINGLE_USE = 'single_use';

    public const TYPE_MULTI_USE = 'multi_use';

    protected $fillable = [
        'exam_session_id',
        'token',
        'label',
        'type',
        'max_uses',
        'used_count',
        'expires_at',
        'created_by',
    ];

    protected $casts = [
        'max_uses' => 'integer',
        'used_count' => 'integer',
        'expires_at' => 'datetime',
    ];

    public function session(): BelongsTo
    {
        return $this->belongsTo(ExamSession::class, 'exam_session_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function attempts(): HasMany
    {
        return $this->hasMany(ExamAttempt::class, 'exam_session_token_id');
    }

    public function isSingleUse(): bool
    {
        return $this->type === self::TYPE_SINGLE_USE;
    }

    public function isMultiUse(): bool
    {
        return $this->type === self::TYPE_MULTI_USE;
    }

    public function isExpired(): bool
    {
        return $this->expires_at?->lte(now()) ?? false;
    }

    public function isExhausted(): bool
    {
        if ($this->isSingleUse()) {
            return $this->used_count >= 1;
        }

        return $this->max_uses > 0 && $this->used_count >= $this->max_uses;
    }

    public function isValid(): bool
    {
        return ! $this->isExpired() && ! $this->isExhausted();
    }
}
