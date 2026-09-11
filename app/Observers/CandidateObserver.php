<?php

namespace App\Observers;

use App\Events\DashboardMetricsUpdated;
use App\Models\Candidate;
use App\Services\CandidateStatus\CandidateStatusService;
use Illuminate\Support\Facades\Log;

/**
 * CandidateObserver
 *
 * Dua tanggung jawab utama:
 *
 * 1. Propagate candidate_code ke semua tabel terkait
 *    saat record candidate dibuat atau candidate_code diupdate.
 *
 * 2. Trigger candidate lifecycle synchronization through CandidateStatusService.
 *    The observer does not own lifecycle requirements.
 */
class CandidateObserver
{
    // =========================================================================
    // CANDIDATE EVENTS
    // =========================================================================

    /**
     * Saat candidate baru dibuat:
     * - Propagate candidate_code ke tabel terkait
     * - Trigger lifecycle sync
     * - Broadcast dashboard metrics update
     */
    public function created(Candidate $candidate): void
    {
        if ($candidate->candidate_code) {
            $this->propagate($candidate);
        }

        $this->sync($candidate, 'candidate.created');
        DashboardMetricsUpdated::dispatchSafely('candidate.created');
    }

    /**
     * Saat candidate diupdate:
     * - Propagate candidate_code kalau berubah
     * - Trigger lifecycle sync
     * - Broadcast dashboard metrics update
     */
    public function updated(Candidate $candidate): void
    {
        // Propagate candidate_code kalau berubah
        if ($candidate->isDirty('candidate_code') && $candidate->candidate_code) {
            $this->propagate($candidate);
        }

        $this->sync($candidate, 'candidate.updated');
        DashboardMetricsUpdated::dispatchSafely('candidate.updated');
    }

    /**
     * Saat candidate dihapus:
     * - Broadcast dashboard metrics update
     */
    public function deleted(Candidate $candidate): void
    {
        DashboardMetricsUpdated::dispatchSafely('candidate.deleted');
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

        if ($candidate->guardian()->exists()) {
            $candidate->guardian()
                ->withTrashed()
                ->whereNull('candidate_code')
                ->update(['candidate_code' => $code]);
        }

        if ($candidate->healthRecord()->exists()) {
            $candidate->healthRecord()
                ->withTrashed()
                ->whereNull('candidate_code')
                ->update(['candidate_code' => $code]);
        }

        if ($candidate->documents()->exists()) {
            $candidate->documents()
                ->withTrashed()
                ->whereNull('candidate_code')
                ->update(['candidate_code' => $code]);
        }

        if ($candidate->payments()->exists()) {
            $candidate->payments()
                ->withTrashed()
                ->whereNull('candidate_code')
                ->update(['candidate_code' => $code]);
        }
    }

    private function sync(Candidate $candidate, string $event): void
    {
        try {
            app(CandidateStatusService::class)->syncAfterEvent($candidate, $event);
        } catch (\Throwable $e) {
            Log::error('CandidateObserver lifecycle sync failed', [
                'candidate_id' => $candidate->id ?? null,
                'event' => $event,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
