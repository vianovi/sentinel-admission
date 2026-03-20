<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    protected $fillable = [
        'candidate_id',
        'candidate_code',
        'verified_by',
        'transaction_code',
        'payment_type',
        'payment_method',
        'expected_amount',
        'amount',
        'proof_file',
        'status',
        'verified_at',
        'admin_note',
    ];

    protected $casts = [
        'verified_at'     => 'datetime',
        'expected_amount' => 'decimal:2',
        'amount'          => 'decimal:2',
    ];

    // =============================================
    // RELASI
    // =============================================

    public function candidate()
    {
        return $this->belongsTo(Candidate::class);
    }

    public function verifiedBy()
    {
        return $this->belongsTo(User::class, 'verified_by');
    }
}