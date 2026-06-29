<?php

namespace App\Actions\Exam;

use App\Models\Exam\ExamAttempt;
use App\Services\Exam\ExamAttemptService;
use Illuminate\Http\Request;

class SubmitExamAttempt
{
    public function __construct(
        private readonly ExamAttemptService $attemptService
    ) {}

    public function handle(ExamAttempt $attempt, bool $auto = false, ?Request $request = null): ExamAttempt
    {
        return $this->attemptService->submit($attempt, $auto, $request);
    }
}
