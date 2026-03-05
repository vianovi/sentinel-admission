<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Storage;

class User extends Authenticatable implements MustVerifyEmail
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'whatsapp_number',
        'avatar',
        'pending_email',
        'pending_email_token',
        'pending_email_requested_at',
        'is_active',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'pending_email_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at'          => 'datetime',
            'pending_email_requested_at' => 'datetime',
            'password'                   => 'hashed',
            'is_active'                  => 'boolean',
        ];
    }

    // =============================================
    // ACCESSORS
    // =============================================

    /**
     * URL avatar — kalau ada file di storage, return URL via controller.
     * Kalau tidak ada, return null (frontend handle dengan initials/fallback).
     */
    public function getAvatarUrlAttribute(): ?string
    {
        if (! $this->avatar) return null;
        // Tambah timestamp sebagai cache buster — browser paksa fetch ulang setiap avatar diganti
        return route('dashboard.profile.avatar') . '?v=' . $this->updated_at->timestamp;
    }

    /**
     * Cek apakah ada request ganti email yang pending.
     */
    public function hasPendingEmailRequest(): bool
    {
        return ! is_null($this->pending_email);
    }

    /**
     * Cek apakah token ganti email masih valid (belum expired 24 jam).
     */
    public function isPendingEmailTokenValid(): bool
    {
        if (! $this->pending_email_requested_at) return false;
        return $this->pending_email_requested_at->diffInHours(now()) < 24;
    }

    // =============================================
    // HELPERS
    // =============================================

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isStaff(): bool
    {
        return $this->role === 'staff';
    }

    public function isCandidate(): bool
    {
        return $this->role === 'candidate';
    }

    /**
     * Inisial dari nama — untuk fallback avatar.
     * Contoh: "Silvia Dewi" → "SD"
     */
    public function getInitialsAttribute(): string
    {
        $words = explode(' ', trim($this->name));
        if (count($words) >= 2) {
            return strtoupper($words[0][0] . $words[1][0]);
        }
        return strtoupper(substr($this->name, 0, 2));
    }

    // =============================================
    // RELASI
    // =============================================

    public function candidate()
    {
        return $this->hasOne(Candidate::class);
    }
}