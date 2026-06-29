<?php

namespace App\Models\Exam;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExamAttemptAnswer extends Model
{
    protected $fillable = [
        'exam_attempt_id',
        'exam_question_id',
        'selected_option',
        'is_marked_for_review',
        'is_correct',
        'point_awarded',
        'answered_at',
        'saved_at',
    ];

    protected $casts = [
        'is_marked_for_review' => 'boolean',
        'is_correct' => 'boolean',
        'point_awarded' => 'decimal:2',
        'answered_at' => 'datetime',
        'saved_at' => 'datetime',
    ];

    public function attempt(): BelongsTo
    {
        return $this->belongsTo(ExamAttempt::class, 'exam_attempt_id');
    }

    public function question(): BelongsTo
    {
        return $this->belongsTo(ExamQuestion::class, 'exam_question_id');
    }
}
