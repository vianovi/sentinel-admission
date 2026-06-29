<?php

namespace App\Services\Exam;

use App\Models\Exam\ExamAttempt;
use App\Models\Exam\ExamAttemptAnswer;
use App\Models\Exam\ExamQuestion;
use Illuminate\Support\Facades\DB;

class ExamScoringService
{
    public function score(ExamAttempt $attempt): ExamAttempt
    {
        return DB::transaction(function () use ($attempt) {
            $attempt = ExamAttempt::query()
                ->whereKey($attempt->id)
                ->lockForUpdate()
                ->firstOrFail();

            $questionIds = collect($attempt->question_order ?? [])
                ->filter(fn ($id) => is_numeric($id))
                ->map(fn ($id) => (int) $id)
                ->values();

            if ($questionIds->isEmpty()) {
                $questionIds = ExamQuestion::query()
                    ->where('exam_package_id', $attempt->exam_package_id)
                    ->where('is_active', true)
                    ->orderBy('sort_order')
                    ->orderBy('id')
                    ->pluck('id');
            }

            $questions = ExamQuestion::query()
                ->whereIn('id', $questionIds)
                ->get()
                ->keyBy('id');

            $answers = ExamAttemptAnswer::query()
                ->where('exam_attempt_id', $attempt->id)
                ->whereIn('exam_question_id', $questionIds)
                ->get()
                ->keyBy('exam_question_id');

            $total = $questionIds->count();
            $answered = 0;
            $correct = 0;
            $rawScore = 0.0;
            $maxScore = 0.0;

            foreach ($questionIds as $questionId) {
                $question = $questions->get($questionId);

                if (! $question) {
                    continue;
                }

                $point = (float) $question->point;
                $maxScore += $point;
                $answer = $answers->get($questionId);
                $selected = $answer?->selected_option;

                if ($selected === null || $selected === '') {
                    continue;
                }

                $answered++;
                $isCorrect = $selected === $question->correct_answer;
                $awarded = $isCorrect ? $point : 0.0;

                if ($isCorrect) {
                    $correct++;
                    $rawScore += $awarded;
                }

                $answer->update([
                    'is_correct' => $isCorrect,
                    'point_awarded' => $awarded,
                ]);
            }

            $blank = max(0, $total - $answered);
            $wrong = max(0, $answered - $correct);
            $percentage = $maxScore > 0 ? round(($rawScore / $maxScore) * 100, 2) : 0.0;
            $passingScore = (float) ($attempt->session?->passing_score ?? $attempt->passing_score ?? 70);

            $attempt->update([
                'total_questions' => $total,
                'answered_questions' => $answered,
                'blank_questions' => $blank,
                'correct_answers' => $correct,
                'wrong_answers' => $wrong,
                'raw_score' => $rawScore,
                'max_score' => $maxScore,
                'percentage_score' => $percentage,
                'passing_score' => $passingScore,
                'passed' => $percentage >= $passingScore,
                'finalized_at' => now(),
            ]);

            return $attempt->fresh(['session', 'package', 'answers']);
        });
    }
}
