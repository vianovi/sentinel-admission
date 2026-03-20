<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CandidateDocument extends Model
{
    protected $fillable = [
        'candidate_id',
        'candidate_code',
        'document_type',
        'document_owner',
        'document_category',
        'stored_name',
        'file_path',
        'mime_type',
        'file_size',
        'status',
        'admin_note',
    ];

    // =============================================
    // RELASI
    // =============================================

    public function candidate()
    {
        return $this->belongsTo(Candidate::class);
    }
}