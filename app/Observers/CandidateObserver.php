<?php

namespace App\Observers;

use App\Models\Candidate;

/**
 * CandidateObserver
 *
 * Otomatis propagate candidate_code ke semua tabel terkait
 * saat record candidate dibuat atau candidate_code diupdate.
 *
 * Tabel yang di-handle:
 * - guardians
 * - health_records
 * - candidate_documents
 * - payments
 */
class CandidateObserver
{
    /**
     * Saat candidate baru dibuat — propagate candidate_code ke guardian
     * yang sudah dibuat sebelumnya via Guardian::createFromDraft().
     *
     * Catatan: guardian dibuat di RegisterController SETELAH candidate dibuat,
     * jadi guardian sudah dapat candidate_code langsung di createFromDraft().
     * Observer ini sebagai safety net kalau ada create manual lain.
     */
    public function created(Candidate $candidate): void
    {
        if (! $candidate->candidate_code) return;

        $this->propagate($candidate);
    }

    /**
     * Saat candidate_code diupdate — sync ke semua tabel terkait.
     * Seharusnya tidak pernah terjadi, tapi tetap di-handle untuk keamanan.
     */
    public function updated(Candidate $candidate): void
    {
        if (! $candidate->isDirty('candidate_code')) return;
        if (! $candidate->candidate_code) return;

        $this->propagate($candidate);
    }

    // =========================================================================
    // PRIVATE
    // =========================================================================

    /**
     * Propagate candidate_code ke semua tabel terkait.
     * Hanya update record yang candidate_code-nya masih null.
     */
    private function propagate(Candidate $candidate): void
    {
        $code = $candidate->candidate_code;

        // Guardians
        $candidate->guardian()
            ->whereNull('candidate_code')
            ->update(['candidate_code' => $code]);

        // Health records
        $candidate->healthRecord()
            ->whereNull('candidate_code')
            ->update(['candidate_code' => $code]);

        // Candidate documents
        $candidate->documents()
            ->whereNull('candidate_code')
            ->update(['candidate_code' => $code]);

        // Payments
        $candidate->payments()
            ->whereNull('candidate_code')
            ->update(['candidate_code' => $code]);
    }
}
