<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SystemActivityLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'actor_id',
        'actor_name',
        'actor_role',
        'action',
        'module',
        'target_type',
        'target_id',
        'target_label',
        'description',
        'metadata',
        'ip_address',
        'user_agent',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }

    /**
     * Helper to quickly record a human-readable activity log.
     */
    public static function log(
        string $action,
        string $module,
        string $description,
        ?string $targetLabel = null,
        ?array $metadata = null,
        ?string $targetType = null,
        ?string $targetId = null,
        ?User $actor = null
    ): self {
        $user = $actor ?? auth()->user();

        return self::create([
            'actor_id' => $user?->id,
            'actor_name' => $user?->name ?? 'Sistem Otomatis',
            'actor_role' => $user?->role ?? 'system',
            'action' => $action,
            'module' => $module,
            'target_type' => $targetType,
            'target_id' => $targetId,
            'target_label' => $targetLabel,
            'description' => $description,
            'metadata' => $metadata,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }
}
