<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CandidateDocumentSecurity extends Model
{
    protected $table = 'candidate_document_security';

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
        'scanned_at'     => 'datetime',
    ];

    // =============================================
    // RELASI
    // =============================================

    public function document(): BelongsTo
    {
        return $this->belongsTo(CandidateDocument::class, 'document_id');
    }

    // =============================================
    // HELPERS
    // =============================================

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
