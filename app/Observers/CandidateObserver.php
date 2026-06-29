<?php

namespace App\Observers;

use App\Models\Candidate;
use App\Models\Guardian;
use App\Models\HealthRecord;
use Illuminate\Support\Facades\Log;

/**
 * CandidateObserver
 *
 * Dua tanggung jawab utama:
 *
 * 1. Propagate candidate_code ke semua tabel terkait
 *    saat record candidate dibuat atau candidate_code diupdate.
 *
 * 2. Auto-submitted: ubah status kandidat dari 'draft' → 'submitted'
 *    secara otomatis ketika semua kriteria wajib terpenuhi.
 *    Status TIDAK PERNAH mundur dari 'submitted' → 'draft' secara otomatis.
 *
 * Kriteria auto-submitted dari 3 tabel:
 *
 *   candidates:
 *     - phone_number     → not null
 *     - religion        → not null
 *     - family_card_number → not null
 *     - postal_code     → not null
 *     - school_npsn     → not null
 *     - program_choice  → not null
 *
 *   guardians:
 *     - mother_name     → not null
 *     - income_type     → not null
 *     - father_status   → not null
 *     - mother_status   → not null
 *     - no_kk           → not null
 *     - marital_status  → not null
 *     - guardian fields → required when marital_status is not nikah_tercatat
 *
 *   health_records:
 *     - blood_type               → not null
 *     - rhesus                   → not null
 *     - height_cm                → not null
 *     - weight_kg                → not null
 *     - general_health_condition → not null
 *     - eye_right_type           → not null
 *     - eye_left_type            → not null
 */
class CandidateObserver
{
    // =========================================================================
    // CANDIDATE EVENTS
    // =========================================================================

    /**
     * Saat candidate baru dibuat:
     * - Propagate candidate_code ke tabel terkait
     * - Cek auto-submitted (kemungkinan belum terpenuhi, tapi tetap dicek)
     */
    public function created(Candidate $candidate): void
    {
        if ($candidate->candidate_code) {
            $this->propagate($candidate);
        }

        $this->checkAndSubmit($candidate);
    }

    /**
     * Saat candidate diupdate:
     * - Propagate candidate_code kalau berubah
     * - Cek auto-submitted kalau field relevan berubah
     */
    public function updated(Candidate $candidate): void
    {
        // Propagate candidate_code kalau berubah
        if ($candidate->isDirty('candidate_code') && $candidate->candidate_code) {
            $this->propagate($candidate);
        }

        // Cek auto-submitted hanya kalau field relevan yang berubah
        // Early exit kalau sudah submitted — tidak perlu cek apapun
        if ($candidate->status === 'submitted') return;

        $watchedFields = [
            'phone_number',
            'religion',
            'family_card_number',
            'postal_code',
            'school_npsn',
            'program_choice',
            'status',
        ];
        if ($candidate->isDirty($watchedFields)) {
            $this->checkAndSubmit($candidate);
        }
    }

    // =========================================================================
    // GUARDIAN & HEALTH RECORD EVENTS
    // =========================================================================
    // Dipanggil dari Guardian Observer dan HealthRecord Observer masing-masing.
    // Dipisah agar setiap model bisa trigger cek secara independen.

    /**
     * Dipanggil oleh GuardianObserver saat guardian di-save.
     * Cek auto-submitted untuk candidate yang terkait.
     */
    public function checkFromGuardian(Guardian $guardian): void
    {
        $candidate = $guardian->candidate;
        if (! $candidate || $candidate->status === 'submitted') return;

        $this->checkAndSubmit($candidate);
    }

    /**
     * Dipanggil oleh HealthRecordObserver saat health record di-save.
     * Cek auto-submitted untuk candidate yang terkait.
     */
    public function checkFromHealthRecord(HealthRecord $healthRecord): void
    {
        $candidate = $healthRecord->candidate;
        if (! $candidate || $candidate->status === 'submitted') return;

        $this->checkAndSubmit($candidate);
    }

    // =========================================================================
    // PRIVATE
    // =========================================================================

    /**
     * Cek apakah semua kriteria terpenuhi, lalu update status ke 'submitted'.
     *
     * Optimasi server:
     * - Early exit kalau status sudah submitted
     * - Query guardian & health_record pakai select() — hanya kolom yang dicek
     * - Tidak ada N+1, semua dalam 1 query per tabel
     * - Wrapped dalam try-catch — tidak boleh throw exception ke user
     */
    private function checkAndSubmit(Candidate $candidate): void
    {
        try {
            // ── Early exit — sudah submitted, tidak perlu cek ────────────────
            if ($candidate->status === 'submitted') return;

            // ── Cek candidates table (sudah ada di memory) ───────────────────
            if (empty($candidate->phone_number))        return;
            if (empty($candidate->religion))            return;
            if (empty($candidate->family_card_number))  return;
            if (empty($candidate->postal_code))         return;
            if (empty($candidate->school_npsn))         return;
            if (empty($candidate->program_choice))      return;

            // ── Cek guardians table — select hanya kolom yang dicek ──────────
            $guardian = $candidate->guardian()
                ->select([
                    'mother_name', 'income_type', 'father_status', 'mother_status', 'no_kk',
                    'marital_status', 'guardian_name', 'guardian_relation',
                    'guardian_date_of_birth', 'guardian_education', 'guardian_phone',
                    'guardian_province', 'guardian_city', 'guardian_district',
                    'guardian_village', 'guardian_address', 'guardian_postal_code',
                ])
                ->first();

            if (! $guardian)                        return;
            if (empty($guardian->mother_name))      return;
            if (empty($guardian->income_type))      return;
            if (empty($guardian->father_status))    return;
            if (empty($guardian->mother_status))    return;
            if (empty($guardian->no_kk))            return;
            if (empty($guardian->marital_status))   return;

            if ($guardian->marital_status !== 'nikah_tercatat') {
                foreach ([
                    'guardian_name', 'guardian_relation', 'guardian_date_of_birth',
                    'guardian_education', 'guardian_phone', 'guardian_province',
                    'guardian_city', 'guardian_district', 'guardian_village',
                    'guardian_address', 'guardian_postal_code',
                ] as $field) {
                    if (empty($guardian->{$field})) return;
                }
            }

            // ── Cek health_records table — select hanya kolom yang dicek ─────
            $health = $candidate->healthRecord()
                ->select([
                    'blood_type', 'rhesus', 'height_cm', 'weight_kg',
                    'general_health_condition', 'eye_right_type', 'eye_left_type',
                ])
                ->first();

            if (! $health)                                  return;
            if (empty($health->blood_type))                 return;
            if (empty($health->rhesus))                     return;
            if (empty($health->height_cm))                  return;
            if (empty($health->weight_kg))                  return;
            if (empty($health->general_health_condition))   return;
            if (empty($health->eye_right_type))             return;
            if (empty($health->eye_left_type))              return;

            // ── Semua kriteria terpenuhi → update status ─────────────────────
            // Pakai updateQuietly() agar tidak trigger observer loop
            $candidate->updateQuietly(['status' => 'submitted']);

            Log::info('Candidate auto-submitted', [
                'candidate_id'   => $candidate->id,
                'candidate_code' => $candidate->candidate_code,
            ]);

        } catch (\Exception $e) {
            // Silent — jangan crash request user karena gagal auto-submitted
            Log::error('CandidateObserver@checkAndSubmit failed', [
                'candidate_id' => $candidate->id ?? null,
                'error'        => $e->getMessage(),
            ]);
        }
    }

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
}
