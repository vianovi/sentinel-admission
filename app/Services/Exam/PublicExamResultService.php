<?php

namespace App\Services\Exam;

use Illuminate\Support\Facades\DB;

class PublicExamResultService
{
    /**
     * @return array{completed: bool, average_score: ?float, is_passed: ?bool, subjects: array<int, array{subject_id: int, primary_score: ?float, remedial_score: ?float, effective_score: ?float, remedial_available: bool}>}
     */
    public function refresh(int $participantId): array
    {
        return DB::transaction(function () use ($participantId): array {
            $participant = DB::table('exam_public_participants')->where('id', $participantId)->lockForUpdate()->first();

            if (! $participant) {
                throw new \Illuminate\Database\Eloquent\ModelNotFoundException('Public exam participant not found.');
            }

            $session = DB::table('exam_public_sessions')->where('id', $participant->exam_public_session_id)->first();
            $packages = DB::table('exam_public_session_packages')
                ->where('exam_public_session_id', $session->id)
                ->orderBy('sort_order')
                ->get();
            $attempts = DB::table('exam_public_subject_attempts')
                ->where('exam_public_participant_id', $participantId)
                ->get()
                ->groupBy('exam_public_subject_id');

            $subjects = [];

            foreach ($packages as $package) {
                $subjectAttempts = $attempts->get($package->exam_public_subject_id, collect())
                    ->whereIn('status', ['submitted', 'auto_submitted']);
                $primary = $subjectAttempts->firstWhere('attempt_type', 'primary');
                $remedial = $subjectAttempts->where('attempt_type', 'remedial')->sortByDesc('percentage_score')->first();
                $primaryScore = $primary?->percentage_score !== null ? (float) $primary->percentage_score : null;
                $remedialScore = $remedial?->percentage_score !== null ? (float) $remedial->percentage_score : null;

                $subjects[] = [
                    'subject_id' => (int) $package->exam_public_subject_id,
                    'primary_score' => $primaryScore,
                    'remedial_score' => $remedialScore,
                    'effective_score' => $primaryScore === null ? null : max($primaryScore, $remedialScore ?? $primaryScore),
                    'remedial_available' => false,
                ];
            }

            $completed = $packages->count() === 4
                && collect($subjects)->every(fn (array $subject): bool => $subject['primary_score'] !== null);
            $average = $completed ? round(collect($subjects)->sum('effective_score') / 4, 2) : null;
            $isPassed = $completed ? collect($subjects)->sum('effective_score') > (float) $session->passing_score * 4 : null;

            if ($completed && ! $isPassed && $session->allow_remedial) {
                foreach ($subjects as &$subject) {
                    $remedialCount = $attempts->get($subject['subject_id'], collect())
                        ->where('attempt_type', 'remedial')->count();
                    $subject['remedial_available'] = $subject['primary_score'] < (float) $session->remedial_score_limit
                        && $remedialCount < (int) $session->max_remedial_attempts;
                }
                unset($subject);
            }

            DB::table('exam_public_participants')->where('id', $participantId)->update([
                'status' => $completed ? 'completed' : 'in_progress',
                'average_score' => $average,
                'is_passed' => $isPassed,
                'completed_at' => $completed ? ($participant->completed_at ?? now()) : null,
                'updated_at' => now(),
            ]);

            return [
                'completed' => $completed,
                'average_score' => $average,
                'is_passed' => $isPassed,
                'subjects' => $subjects,
            ];
        });
    }
}
