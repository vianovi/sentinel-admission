<?php

namespace App\Services\CandidateStatus;

use App\Models\Candidate;
use App\Models\CandidateDocument;
use App\Models\Payment;

class CandidateVerificationEvaluator
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

    public function evaluate(Candidate $candidate): CandidateEvaluationResult
    {
        $requirements = [
            ...$this->documentRequirements($candidate),
            new CandidateRequirement('payment.paid', 'Pembayaran pendaftaran lunas', 'payment'),
        ];

        $verifiedTypes = $candidate->documents()
            ->whereNull('deleted_at')
            ->where('status', 'verified')
            ->pluck('doc_type')
            ->unique()
            ->all();

        $hasPaidPayment = $candidate->payments()
            ->where('status', Payment::STATUS_PAID)
            ->exists();

        $missing = array_values(array_filter(
            $requirements,
            function (CandidateRequirement $requirement) use ($verifiedTypes, $hasPaidPayment): bool {
                if ($requirement->group === 'document') {
                    $docType = str_replace('document.', '', $requirement->key);

                    return ! in_array($docType, $verifiedTypes, true);
                }

                if ($requirement->group === 'payment') {
                    return ! $hasPaidPayment;
                }

                return true;
            }
        ));

        return new CandidateEvaluationResult($requirements, $missing);
    }

    /**
     * @return array<int, string>
     */
    public function requiredDocumentTypes(Candidate $candidate): array
    {
        $types = self::REQUIRED_DOCUMENT_TYPES;

        if ((bool) $candidate->is_transfer) {
            $types[] = 'transfer_letter';
        }

        return $types;
    }

    /**
     * @return array<string, string>
     */
    public function requiredDocumentLabels(Candidate $candidate): array
    {
        return collect($this->requiredDocumentTypes($candidate))
            ->mapWithKeys(fn (string $type) => [$type => CandidateDocument::DOC_TYPES[$type]['label'] ?? $type])
            ->all();
    }

    public function hasUploadedMandatoryDocuments(Candidate $candidate): bool
    {
        $uploadedTypes = $candidate->documents()
            ->whereNull('deleted_at')
            ->pluck('doc_type')
            ->unique()
            ->all();

        return collect($this->requiredDocumentTypes($candidate))
            ->diff($uploadedTypes)
            ->isEmpty();
    }

    /**
     * @return array<int, string>
     */
    public function missingRequiredDocumentTypes(Candidate $candidate): array
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

    /**
     * @return array<int, CandidateRequirement>
     */
    private function documentRequirements(Candidate $candidate): array
    {
        return collect($this->requiredDocumentLabels($candidate))
            ->map(fn (string $label, string $type) => new CandidateRequirement("document.{$type}", $label, 'document'))
            ->values()
            ->all();
    }
}
