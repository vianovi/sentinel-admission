<?php

namespace App\Observers;

use App\Models\Guardian;
use App\Services\CandidateStatus\CandidateStatusService;
use Illuminate\Support\Facades\Log;

/**
 * GuardianObserver
 *
 * Trigger candidate lifecycle sync setiap kali data guardian berubah.
 * Requirement detail hidup di CandidateStatusService, bukan observer ini.
 */
class GuardianObserver
{
    public function created(Guardian $guardian): void
    {
        $this->triggerCheck($guardian);
    }

    public function updated(Guardian $guardian): void
    {
        $this->triggerCheck($guardian);
    }

    private function triggerCheck(Guardian $guardian): void
    {
        $candidate = $guardian->candidate;

        if (! $candidate) {
            return;
        }

        try {
            app(CandidateStatusService::class)->syncAfterEvent($candidate, 'guardian.saved');
        } catch (\Throwable $e) {
            Log::error('GuardianObserver lifecycle sync failed', [
                'guardian_id' => $guardian->id,
                'candidate_id' => $guardian->candidate_id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
