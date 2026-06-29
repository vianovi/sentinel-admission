<?php

namespace App\Services;

use App\Models\Candidate;
use App\Models\CandidateDocument;
use App\Models\Payment;

class CandidateVerificationChecklist
{
    private const REQUIRED_DOCUMENT_TYPES = [
        'photo_formal',
        'birth_certificate',
        'family_card',
        'parent_id_card',
        'graduation_certificate',
        'report_card',
        'parent_statement',
    ];

    public function requiredDocumentTypes(Candidate $candidate): array
    {
        $types = self::REQUIRED_DOCUMENT_TYPES;

        if ($candidate->is_transfer) {
            $types[] = 'transfer_letter';
        }

        return $types;
    }

    public function requiredDocumentLabels(Candidate $candidate): array
    {
        return collect($this->requiredDocumentTypes($candidate))
            ->mapWithKeys(fn (string $type) => [$type => CandidateDocument::DOC_TYPES[$type]['label'] ?? $type])
            ->all();
    }

    public function missingRequiredDocuments(Candidate $candidate): array
    {
        $verifiedTypes = $candidate->documents()
            ->whereNull('deleted_at')
            ->where('status', 'verified')
            ->pluck('doc_type')
            ->unique()
            ->all();

        return collect($this->requiredDocumentTypes($candidate))
            ->diff($verifiedTypes)
            ->values()
            ->all();
    }

    public function hasRequiredHealthDocuments(Candidate $candidate): bool
    {
        return ! empty($candidate->healthRecord?->bpjs_card_path);
    }

    public function hasVerifiedPayment(Candidate $candidate): bool
    {
        return $candidate->payments()
            ->where('status', Payment::STATUS_PAID)
            ->exists();
    }

    public function isReadyForCandidateVerification(Candidate $candidate): bool
    {
        $candidate->loadMissing(['healthRecord']);

        return empty($this->missingRequiredDocuments($candidate))
            && $this->hasRequiredHealthDocuments($candidate)
            && $this->hasVerifiedPayment($candidate);
    }

    public function syncCandidateStatus(Candidate $candidate): void
    {
        $candidate->refresh();

        if (in_array($candidate->status, ['accepted', 'rejected'], true)) {
            return;
        }

        if ($this->isReadyForCandidateVerification($candidate)) {
            if ($candidate->status !== 'verified') {
                $candidate->update(['status' => 'verified']);
            }

            return;
        }

        if ($candidate->status === 'verified') {
            $candidate->update(['status' => 'submitted']);
        }
    }
}
