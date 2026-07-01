<?php

namespace App\Observers;

use App\Models\HealthRecord;
use App\Services\CandidateStatus\CandidateStatusService;
use Illuminate\Support\Facades\Log;

/**
 * HealthRecordObserver
 *
 * Trigger candidate lifecycle sync setiap kali data kesehatan berubah.
 * Requirement detail hidup di CandidateStatusService, bukan observer ini.
 */
class HealthRecordObserver
{
    public function created(HealthRecord $healthRecord): void
    {
        $this->triggerCheck($healthRecord);
    }

    public function updated(HealthRecord $healthRecord): void
    {
        $this->triggerCheck($healthRecord);
    }

    private function triggerCheck(HealthRecord $healthRecord): void
    {
        $candidate = $healthRecord->candidate;

        if (! $candidate) {
            return;
        }

        try {
            app(CandidateStatusService::class)->syncAfterEvent($candidate, 'health_record.saved');
        } catch (\Throwable $e) {
            Log::error('HealthRecordObserver lifecycle sync failed', [
                'health_record_id' => $healthRecord->id,
                'candidate_id' => $healthRecord->candidate_id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
