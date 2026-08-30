<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CandidateDocumentSecurity extends Model
{
    // Override auto-pluralization: Laravel would resolve to 'candidate_document_securities'
    // but the actual table name is 'candidate_document_security' (matches migration)
    protected $table = 'candidate_document_security';

    // Migration tidak mendefinisikan timestamps() — scanned_at dipakai sebagai pengganti
    public $timestamps = false;

    protected $fillable = [
        'document_id',
        'magic_bytes_result',
        'polyglot_clean',
        'polyglot_detail',
        'detected_mime',
        'file_hash',
        'upload_ip',
        'user_agent',
        'scanned_at',
    ];

    protected $casts = [
        'polyglot_clean' => 'boolean',
        'scanned_at' => 'datetime',
    ];

    // ─────────────────────────────────────────────
    // Relations
    // ─────────────────────────────────────────────

    public function document(): BelongsTo
    {
        return $this->belongsTo(CandidateDocument::class, 'document_id');
    }

    // ─────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────

    public function isSuspicious(): bool
    {
        return $this->magic_bytes_result === 'suspicious'
            || $this->polyglot_clean === false;
    }

    public function isRejected(): bool
    {
        return $this->magic_bytes_result === 'rejected';
    }
}
