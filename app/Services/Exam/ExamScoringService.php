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

            $bulkUpdates = [];

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

                if ($answer) {
                    $bulkUpdates[] = [
                        'id' => $answer->id,
                        'is_correct' => $isCorrect,
                        'point_awarded' => $awarded,
                    ];
                }
            }

            // B-01 FIX: Single bulk UPDATE replaces N per-row updates.
            // Uses raw CASE WHEN to set different values per row in one query.
            if (! empty($bulkUpdates)) {
                $ids = [];
                $correctCases = [];
                $pointCases = [];
                $correctBindings = [];
                $pointBindings = [];

                foreach ($bulkUpdates as $update) {
                    $ids[] = $update['id'];
                    $correctCases[] = 'WHEN id = ? THEN ?';
                    $correctBindings[] = $update['id'];
                    $correctBindings[] = $update['is_correct'] ? 1 : 0;
                    $pointCases[] = 'WHEN id = ? THEN ?';
                    $pointBindings[] = $update['id'];
                    $pointBindings[] = $update['point_awarded'];
                }

                $idPlaceholders = implode(',', array_fill(0, count($ids), '?'));
                $now = now()->toDateTimeString();
                // Bindings must match SQL clause order: is_correct CASEs, point_awarded CASEs, updated_at, WHERE IN
                $bindings = array_merge($correctBindings, $pointBindings, [$now], $ids);

                DB::update(
                    'UPDATE exam_attempt_answers SET '
                    .'is_correct = CASE '.implode(' ', $correctCases).' END, '
                    .'point_awarded = CASE '.implode(' ', $pointCases).' END, '
                    ."updated_at = ? WHERE id IN ({$idPlaceholders})",
                    $bindings
                );
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
