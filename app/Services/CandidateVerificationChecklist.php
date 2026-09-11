<?php

namespace App\Services;

use App\Models\Candidate;
use App\Services\CandidateStatus\CandidateStatusService;
use App\Services\CandidateStatus\CandidateVerificationEvaluator;

class CandidateVerificationChecklist
{
    public function __construct(
        private readonly CandidateVerificationEvaluator $verificationEvaluator,
        private readonly CandidateStatusService $statusService
    ) {}

    public function requiredDocumentTypes(Candidate $candidate): array
    {
        return $this->verificationEvaluator->requiredDocumentTypes($candidate);
    }

    public function requiredDocumentLabels(Candidate $candidate): array
    {
        return $this->verificationEvaluator->requiredDocumentLabels($candidate);
    }

    public function missingRequiredDocuments(Candidate $candidate): array
    {
        return $this->verificationEvaluator->missingRequiredDocumentTypes($candidate);
    }

    public function hasVerifiedPayment(Candidate $candidate): bool
    {
        return ! in_array('payment.paid', $this->verificationEvaluator->evaluate($candidate)->missingKeys(), true);
    }

    public function isReadyForCandidateVerification(Candidate $candidate): bool
    {
        return $this->verificationEvaluator->evaluate($candidate)->complete();
    }

    public function syncCandidateStatus(Candidate $candidate): void
    {
        $this->statusService->syncAfterEvent($candidate, 'legacy.verification_checklist');
    }
}
