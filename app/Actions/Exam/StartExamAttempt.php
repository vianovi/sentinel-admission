<?php

namespace App\Actions\Exam;

use App\Models\Candidate;
use App\Models\Exam\ExamAttempt;
use App\Models\Exam\ExamSessionCandidate;
use App\Services\Exam\ExamAttemptService;
use Illuminate\Http\Request;

class StartExamAttempt
{
    public function __construct(
        private readonly ExamAttemptService $attemptService
    ) {}

    public function handle(ExamSessionCandidate $assignment, Candidate $candidate, ?Request $request = null): ExamAttempt
    {
        return $this->attemptService->start($assignment, $candidate, $request);
    }
}
