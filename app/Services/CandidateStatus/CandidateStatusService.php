<?php

namespace App\Services\CandidateStatus;

use App\Models\Candidate;
use Illuminate\Support\Facades\Log;

class CandidateStatusService
{
    private const FINAL_STATUSES = ['accepted', 'rejected'];

    public function __construct(
        private readonly CandidateCompletionEvaluator $completionEvaluator,
        private readonly CandidateVerificationEvaluator $verificationEvaluator
    ) {}

    public function syncAfterEvent(Candidate $candidate, string $event): CandidateStatusResult
    {
        $candidate->refresh();

        $previousStatus = (string) $candidate->status;
        $completion = $this->completionEvaluator->evaluate($candidate);
        $verification = $this->verificationEvaluator->evaluate($candidate);

        if (in_array($previousStatus, self::FINAL_STATUSES, true)) {
            return new CandidateStatusResult(
                $event,
                $previousStatus,
                $previousStatus,
                [],
                $completion,
                $verification,
                true
            );
        }

        $transitions = [];
        $status = $previousStatus;

        if (! $completion->complete()) {
            if (in_array($status, ['submitted', 'verified'], true)) {
                $this->transition($candidate, $status, 'draft', $event, $transitions);
                $status = 'draft';
            }

            return $this->result($candidate, $event, $previousStatus, $transitions);
        }

        if ($status === 'draft') {
            $this->transition($candidate, 'draft', 'submitted', $event, $transitions);
            $status = 'submitted';
        }

        $verification = $this->verificationEvaluator->evaluate($candidate);

        if ($status === 'submitted' && $verification->complete()) {
            $this->transition($candidate, 'submitted', 'verified', $event, $transitions);
            $status = 'verified';
        } elseif ($status === 'verified' && ! $verification->complete()) {
            $this->transition($candidate, 'verified', 'submitted', $event, $transitions);
            $status = 'submitted';
        }

        return $this->result($candidate, $event, $previousStatus, $transitions);
    }

    /**
     * @param array<int, array{from: string, to: string}> $transitions
     */
    private function transition(
        Candidate $candidate,
        string $from,
        string $to,
        string $event,
        array &$transitions
    ): void {
        if ($from === $to) {
            return;
        }

        $candidate->updateQuietly(['status' => $to]);
        $candidate->refresh();

        $transitions[] = ['from' => $from, 'to' => $to];

        Log::info('Candidate lifecycle status synchronized.', [
            'candidate_id' => $candidate->id,
            'candidate_code' => $candidate->candidate_code,
            'event' => $event,
            'from' => $from,
            'to' => $to,
        ]);
    }

    /**
     * @param array<int, array{from: string, to: string}> $transitions
     */
    private function result(
        Candidate $candidate,
        string $event,
        string $previousStatus,
        array $transitions
    ): CandidateStatusResult {
        $candidate->refresh();

        return new CandidateStatusResult(
            $event,
            $previousStatus,
            (string) $candidate->status,
            $transitions,
            $this->completionEvaluator->evaluate($candidate),
            $this->verificationEvaluator->evaluate($candidate)
        );
    }
}
