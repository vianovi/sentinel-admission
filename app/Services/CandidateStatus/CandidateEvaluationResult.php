<?php

namespace App\Services\CandidateStatus;

final class CandidateEvaluationResult
{
    /**
     * @param array<int, CandidateRequirement> $requirements
     * @param array<int, CandidateRequirement> $missing
     */
    public function __construct(
        private readonly array $requirements,
        private readonly array $missing
    ) {}

    public function complete(): bool
    {
        return count($this->missing) === 0;
    }

    /**
     * @return array<int, CandidateRequirement>
     */
    public function requirements(): array
    {
        return $this->requirements;
    }

    /**
     * @return array<int, CandidateRequirement>
     */
    public function missing(): array
    {
        return $this->missing;
    }

    public function total(): int
    {
        return count($this->requirements);
    }

    public function completedCount(): int
    {
        return max(0, $this->total() - count($this->missing));
    }

    public function percentage(): int
    {
        if ($this->total() === 0) {
            return 100;
        }

        return (int) round(($this->completedCount() / $this->total()) * 100);
    }

    /**
     * @return array<int, string>
     */
    public function missingKeys(): array
    {
        return array_map(fn (CandidateRequirement $requirement) => $requirement->key, $this->missing);
    }

    /**
     * @return array<int, string>
     */
    public function missingLabels(): array
    {
        return array_map(fn (CandidateRequirement $requirement) => $requirement->label, $this->missing);
    }

    public function toArray(): array
    {
        return [
            'complete' => $this->complete(),
            'percentage' => $this->percentage(),
            'total' => $this->total(),
            'completed' => $this->completedCount(),
            'missing' => array_map(fn (CandidateRequirement $requirement) => $requirement->toArray(), $this->missing),
            'missing_keys' => $this->missingKeys(),
            'missing_labels' => $this->missingLabels(),
        ];
    }
}
