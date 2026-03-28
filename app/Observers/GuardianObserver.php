<?php

namespace App\Observers;

use App\Models\Guardian;

/**
 * GuardianObserver
 *
 * Trigger auto-submitted check ke CandidateObserver
 * setiap kali data guardian di-save (created atau updated).
 *
 * Field yang diawasi untuk auto-submitted:
 *   - mother_name, income_type, father_status, mother_status, no_kk
 */
class GuardianObserver
{
    public function created(Guardian $guardian): void
    {
        $this->triggerCheck($guardian);
    }

    public function updated(Guardian $guardian): void
    {
        // Early exit — hanya trigger kalau field relevan yang berubah
        $watchedFields = ['mother_name', 'income_type', 'father_status', 'mother_status', 'no_kk'];
        if (! $guardian->isDirty($watchedFields)) return;

        $this->triggerCheck($guardian);
    }

    private function triggerCheck(Guardian $guardian): void
    {
        (new CandidateObserver())->checkFromGuardian($guardian);
    }
}
