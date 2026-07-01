<?php

namespace App\Services\CandidateStatus;

final class CandidateRequirement
{
    public function __construct(
        public readonly string $key,
        public readonly string $label,
        public readonly string $group
    ) {}

    public function toArray(): array
    {
        return [
            'key' => $this->key,
            'label' => $this->label,
            'group' => $this->group,
        ];
    }
}
