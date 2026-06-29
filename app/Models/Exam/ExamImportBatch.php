<?php

namespace App\Models\Exam;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ExamImportBatch extends Model
{
    public const STATUS_PENDING = 'pending';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_FAILED = 'failed';

    protected $fillable = [
        'exam_subject_id',
        'exam_package_id',
        'uploaded_by',
        'original_filename',
        'stored_path',
        'file_hash',
        'file_size_kb',
        'status',
        'total_rows',
        'imported_rows',
        'failed_rows',
        'missing_columns',
        'failure_report',
        'started_at',
        'finished_at',
    ];

    protected $casts = [
        'total_rows' => 'integer',
        'imported_rows' => 'integer',
        'failed_rows' => 'integer',
        'missing_columns' => 'array',
        'failure_report' => 'array',
        'started_at' => 'datetime',
        'finished_at' => 'datetime',
    ];

    public function subject(): BelongsTo
    {
        return $this->belongsTo(ExamSubject::class, 'exam_subject_id');
    }

    public function package(): BelongsTo
    {
        return $this->belongsTo(ExamPackage::class, 'exam_package_id');
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function questions(): HasMany
    {
        return $this->hasMany(ExamQuestion::class);
    }
}
