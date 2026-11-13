<?php

namespace App\Services\Exam;

use Illuminate\Support\Facades\DB;

class PublicExamAttemptSubmissionService
{
    public function __construct(private readonly PublicExamResultService $results) {}

    public function submit(int $attemptId, bool $force = false): void
    {
        DB::transaction(function () use ($attemptId, $force): void {
            $attempt = DB::table('exam_public_subject_attempts')->where('id', $attemptId)->lockForUpdate()->firstOrFail();
            abort_unless($attempt->status === 'in_progress', 409);
            $ids = collect(json_decode($attempt->question_order, true, 512, JSON_THROW_ON_ERROR));
            $questions = DB::table('exam_public_questions')->whereIn('id', $ids)->get(['id', 'correct_answer', 'point'])->keyBy('id');
            $answers = DB::table('exam_public_attempt_answers')->where('exam_public_subject_attempt_id', $attempt->id)->get()->keyBy('exam_public_question_id');
            $score = 0;
            $correct = 0;
            $answered = 0;
            $max = 0;

            foreach ($ids as $id) {
                $question = $questions->get($id);
                abort_unless($question, 409, 'Soal ujian tidak tersedia.');
                $max += (float) $question->point;
                $answer = $answers->get($id);
                if ($answer?->selected_option !== null) {
                    $answered++;
                    $isCorrect = $answer->selected_option === $question->correct_answer;
                    $correct += (int) $isCorrect;
                    $score += $isCorrect ? (float) $question->point : 0;
                    DB::table('exam_public_attempt_answers')->where('id', $answer->id)
                        ->update(['is_correct' => $isCorrect, 'point_awarded' => $isCorrect ? $question->point : 0]);
                }
            }

            DB::table('exam_public_subject_attempts')->where('id', $attempt->id)->update([
                'status' => $force || $attempt->expires_at <= now() ? 'auto_submitted' : 'submitted',
                'submitted_at' => now(),
                'answered_questions' => $answered,
                'correct_answers' => $correct,
                'raw_score' => $score,
                'max_score' => $max,
                'percentage_score' => $max > 0 ? round($score / $max * 100, 2) : 0,
                'updated_at' => now(),
            ]);
            $this->results->refresh($attempt->exam_public_participant_id);
        });
    }
}
