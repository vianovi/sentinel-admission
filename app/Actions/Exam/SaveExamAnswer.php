<?php

namespace App\Actions\Exam;

use App\Models\Exam\ExamAttempt;
use App\Models\Exam\ExamAttemptAnswer;
use App\Services\Exam\ExamAttemptService;
use Illuminate\Http\Request;

class SaveExamAnswer
{
    public function __construct(
        private readonly ExamAttemptService $attemptService
    ) {}

    public function handle(
        ExamAttempt $attempt,
        int $questionId,
        ?string $selectedOption,
        bool $markedForReview,
        ?Request $request = null
    ): ExamAttemptAnswer {
        return $this->attemptService->saveAnswer($attempt, $questionId, $selectedOption, $markedForReview, $request);
    }
}
