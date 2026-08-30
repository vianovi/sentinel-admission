<?php

namespace App\Models\Exam;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class ExamQuestion extends Model
{
    use SoftDeletes;

    public const DIFFICULTY_EASY = 'easy';

    public const DIFFICULTY_MEDIUM = 'medium';

    public const DIFFICULTY_HARD = 'hard';

    protected $fillable = [
        'exam_subject_id',
        'exam_package_id',
        'exam_import_batch_id',
        'question_text',
        'options',
        'correct_answer',
        'point',
        'difficulty',
        'explanation',
        'is_active',
        'sort_order',
        'question_hash',
    ];

    protected $casts = [
        'options' => 'array',
        'point' => 'decimal:2',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    public function subject(): BelongsTo
    {
        return $this->belongsTo(ExamSubject::class, 'exam_subject_id');
    }

    public function package(): BelongsTo
    {
        return $this->belongsTo(ExamPackage::class, 'exam_package_id');
    }

    public function importBatch(): BelongsTo
    {
        return $this->belongsTo(ExamImportBatch::class, 'exam_import_batch_id');
    }

    public function answers(): HasMany
    {
        return $this->hasMany(ExamAttemptAnswer::class);
    }

    public function candidatePayload(): array
    {
        return [
            'id' => $this->id,
            'question_text' => $this->question_text,
            'options' => $this->options,
            'point' => (float) $this->point,
            'difficulty' => $this->difficulty,
        ];
    }
}
