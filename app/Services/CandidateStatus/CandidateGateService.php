<?php

namespace App\Services\CandidateStatus;

use App\Models\Candidate;
use App\Models\User;

class CandidateGateService
{
    public function coreData(Candidate $candidate, ?User $user = null): array
    {
        $allowed = ! $user || $candidate->user_id === $user->id;

        return $this->gate(
            'core_data',
            $allowed,
            $allowed ? [] : ['Data kandidat tidak tersedia untuk akun ini.'],
            $allowed ? null : 'dashboard.index'
        );
    }

    public function documents(Candidate $candidate, ?User $user = null): array
    {
        $reasons = [];

        if ($candidate->status === 'rejected') {
            $reasons[] = 'Status pendaftaran sudah final.';
        } elseif (! $this->isAtLeastSubmitted($candidate)) {
            $reasons[] = 'Lengkapi Data Diri, Data Wali, dan Data Kesehatan terlebih dahulu.';
        }

        if ($user && ! $user->hasVerifiedEmail()) {
            $reasons[] = 'Verifikasi email terlebih dahulu untuk mengunggah dokumen.';
        }

        return $this->gate('documents', empty($reasons), $reasons, 'dashboard.data-diri');
    }

    public function payment(Candidate $candidate, ?User $user = null): array
    {
        $reasons = [];

        if ($candidate->status === 'rejected') {
            $reasons[] = 'Status pendaftaran sudah final.';
        } elseif (! $this->isAtLeastSubmitted($candidate)) {
            $reasons[] = 'Lengkapi data pendaftaran terlebih dahulu sebelum melakukan pembayaran.';
        }

        if ($user && ! $user->hasVerifiedEmail()) {
            $reasons[] = 'Verifikasi email terlebih dahulu sebelum melakukan pembayaran.';
        }

        return $this->gate('payment', empty($reasons), $reasons, 'dashboard.data-diri');
    }

    public function exam(Candidate $candidate, ?User $user = null): array
    {
        $reasons = [];

        if ($candidate->status === 'rejected') {
            $reasons[] = 'Status pendaftaran sudah final.';
        } elseif ($candidate->status === 'draft') {
            $reasons[] = 'Lengkapi data pendaftaran terlebih dahulu.';
        } elseif ($candidate->status === 'submitted') {
            $reasons[] = 'Dokumen dan pembayaran harus diverifikasi terlebih dahulu.';
        }

        if ($user && ! $user->hasVerifiedEmail()) {
            $reasons[] = 'Verifikasi email terlebih dahulu untuk mengakses ujian seleksi.';
        }

        return $this->gate('exam', empty($reasons), $reasons, 'dashboard.index');
    }

    public function summary(Candidate $candidate, ?User $user = null): array
    {
        return [
            'core_data' => $this->coreData($candidate, $user),
            'documents' => $this->documents($candidate, $user),
            'payment' => $this->payment($candidate, $user),
            'exam' => $this->exam($candidate, $user),
            'next_action' => $this->nextRecommendedAction($candidate, $user),
        ];
    }

    public function nextRecommendedAction(Candidate $candidate, ?User $user = null): array
    {
        if ($candidate->status === 'draft') {
            return [
                'key' => 'complete_core_data',
                'label' => 'Lengkapi data pendaftaran',
                'href' => route('dashboard.data-diri'),
            ];
        }

        if ($user && ! $user->hasVerifiedEmail()) {
            return [
                'key' => 'verify_email',
                'label' => 'Verifikasi email akun',
                'href' => route('verification.notice'),
            ];
        }

        if ($candidate->status === 'submitted') {
            return [
                'key' => 'complete_verification',
                'label' => 'Lengkapi dokumen dan pembayaran',
                'href' => route('dashboard.data-dokumen.index'),
            ];
        }

        if ($candidate->status === 'verified') {
            return [
                'key' => 'open_exam',
                'label' => 'Buka ujian seleksi',
                'href' => route('dashboard.exam.index'),
            ];
        }

        return [
            'key' => 'final_status',
            'label' => 'Pantau status akhir',
            'href' => route('dashboard.index'),
        ];
    }

    private function isAtLeastSubmitted(Candidate $candidate): bool
    {
        return in_array($candidate->status, ['submitted', 'verified', 'accepted'], true);
    }

    /**
     * @param  array<int, string>  $reasons
     */
    private function gate(string $key, bool $allowed, array $reasons, ?string $fallbackRoute): array
    {
        return [
            'key' => $key,
            'allowed' => $allowed,
            'locked' => ! $allowed,
            'reason' => $reasons[0] ?? null,
            'reasons' => $reasons,
            'fallback_url' => $fallbackRoute ? route($fallbackRoute) : null,
        ];
    }
}
