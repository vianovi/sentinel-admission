<?php

namespace App\Services\CandidateStatus;

final class CandidateStatusResult
{
    /**
     * @param  array<int, array{from: string, to: string}>  $transitions
     */
    public function __construct(
        public readonly string $event,
        public readonly string $previousStatus,
        public readonly string $currentStatus,
        public readonly array $transitions,
        public readonly CandidateEvaluationResult $completion,
        public readonly CandidateEvaluationResult $verification,
        public readonly bool $finalStatusProtected = false
    ) {}

    public function changed(): bool
    {
        return count($this->transitions) > 0;
    }

    public function toArray(): array
    {
        return [
            'event' => $this->event,
            'previous_status' => $this->previousStatus,
            'current_status' => $this->currentStatus,
            'changed' => $this->changed(),
            'transitions' => $this->transitions,
            'final_status_protected' => $this->finalStatusProtected,
            'completion' => $this->completion->toArray(),
            'verification' => $this->verification->toArray(),
        ];
    }
}
