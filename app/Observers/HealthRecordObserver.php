<?php

namespace App\Observers;

use App\Models\HealthRecord;

/**
 * HealthRecordObserver
 *
 * Trigger auto-submitted check ke CandidateObserver
 * setiap kali data health record di-save (created atau updated).
 *
 * Field yang diawasi untuk auto-submitted:
 *   - blood_type, rhesus, height_cm, weight_kg,
 *     general_health_condition, eye_right_type, eye_left_type
 */
class HealthRecordObserver
{
    public function created(HealthRecord $healthRecord): void
    {
        $this->triggerCheck($healthRecord);
    }

    public function updated(HealthRecord $healthRecord): void
    {
        // Early exit — hanya trigger kalau field relevan yang berubah
        $watchedFields = [
            'blood_type', 'rhesus', 'height_cm', 'weight_kg',
            'general_health_condition', 'eye_right_type', 'eye_left_type',
        ];
        if (! $healthRecord->isDirty($watchedFields)) return;

        $this->triggerCheck($healthRecord);
    }

    private function triggerCheck(HealthRecord $healthRecord): void
    {
        (new CandidateObserver())->checkFromHealthRecord($healthRecord);
    }
}
