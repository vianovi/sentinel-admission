<?php

namespace App\Services\Exam;

use App\Models\Exam\ExamSession;
use App\Models\Exam\ExamSessionCandidate;
use Illuminate\Http\Request;

class ExamSessionService
{
    public function __construct(
        private readonly ExamAuditLogger $audit
    ) {}

    /**
     * Assign candidates to an exam session and audit log each assignment.
     */
    public function assignCandidates(ExamSession $session, array $candidateIds, ?string $note = null, ?Request $request = null): int
    {
        $created = 0;

        foreach ($candidateIds as $candidateId) {
            $assignment = ExamSessionCandidate::firstOrCreate(
                [
                    'exam_session_id' => $session->id,
                    'candidate_id' => $candidateId,
                ],
                [
                    'assigned_by' => $request?->user()?->id,
                    'status' => ExamSessionCandidate::STATUS_ELIGIBLE,
                    'assigned_at' => now(),
                    'note' => $note,
                ]
            );

            if ($assignment->wasRecentlyCreated) {
                $created++;
                $this->audit->log('candidate_assigned', [
                    'candidate_id' => $candidateId,
                    'exam_session_id' => $session->id,
                    'exam_package_id' => $session->exam_package_id,
                    'metadata' => ['assignment_id' => $assignment->id],
                ], $request);
            }
        }

        return $created;
    }
}
