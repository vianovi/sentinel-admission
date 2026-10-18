<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SystemTrash extends Model
{
    use HasFactory;

    protected $fillable = [
        'type',
        'name',
        'identifier',
        'original_path',
        'trash_path',
        'file_size',
        'mime_type',
        'metadata',
        'deleted_by',
        'deleted_by_name',
        'purge_at',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
            'file_size' => 'integer',
            'purge_at' => 'datetime',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function deletedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'deleted_by');
    }

    public function getDaysRemainingAttribute(): int
    {
        if (! $this->purge_at) {
            return 0;
        }

        $diff = now()->diffInDays($this->purge_at, false);

        return max(0, (int) ceil($diff));
    }

    public function getHumanFileSizeAttribute(): ?string
    {
        if ($this->file_size === null) {
            return null;
        }

        $bytes = $this->file_size;
        $units = ['B', 'KB', 'MB', 'GB'];

        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }

        return round($bytes, 1).' '.$units[$i];
    }
}
