<?php

namespace App\Services\Exam;

use Illuminate\Support\Facades\DB;

class PublicExamResultService
{
    /**
     * @return array{completed: bool, average_score: ?float, is_passed: ?bool, subjects: array<int, array<string, mixed>>}
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
                ->join('exam_public_packages', 'exam_public_packages.id', '=', 'exam_public_session_packages.exam_public_package_id')
                ->where('exam_public_session_id', $session->id)
                ->orderBy('exam_public_session_packages.sort_order')
                ->get(['exam_public_session_packages.exam_public_subject_id', 'exam_public_packages.passing_score', 'exam_public_packages.allow_retry', 'exam_public_packages.show_result_to_participant']);
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
                $effectiveScore = $primaryScore === null ? null : max($primaryScore, $remedialScore ?? $primaryScore);
                $attemptCount = $attempts->get($package->exam_public_subject_id, collect())->count();

                $subjects[] = [
                    'subject_id' => (int) $package->exam_public_subject_id,
                    'primary_score' => $primaryScore,
                    'remedial_score' => $remedialScore,
                    'effective_score' => $effectiveScore,
                    'passing_score' => $package->passing_score === null ? null : (float) $package->passing_score,
                    'subject_passed' => $effectiveScore === null || $package->passing_score === null ? null : $effectiveScore > (float) $package->passing_score,
                    'show_result_to_participant' => (bool) $package->show_result_to_participant,
                    'remedial_available' => $primaryScore !== null && $attemptCount < 2 && (bool) $package->allow_retry
                        && (! $package->show_result_to_participant || $effectiveScore <= (float) $package->passing_score),
                ];
            }

            $completed = $packages->count() === 4
                && collect($subjects)->every(fn (array $subject): bool => $subject['primary_score'] !== null);
            $average = $completed ? round(collect($subjects)->sum('effective_score') / 4, 2) : null;
            $isPassed = $completed ? collect($subjects)->sum('effective_score') > (float) $session->passing_score * 4 : null;

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
