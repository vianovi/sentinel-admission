<?php

namespace App\Services\Exam;

use App\Models\Exam\ExamSession;
use App\Models\Exam\ExamSessionCandidate;
use App\Models\Exam\ExamSessionToken;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

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

    /**
     * Generate public access tokens for an exam session.
     */
    public function generateTokens(ExamSession $session, array $data, ?Request $request = null): int
    {
        $count = $data['count'] ?? 1;

        for ($i = 0; $i < $count; $i++) {
            ExamSessionToken::create([
                'exam_session_id' => $session->id,
                'token' => Str::upper(Str::random(6)),
                'label' => $count > 1 ? ($data['label'] ? "{$data['label']} #" . ($i + 1) : null) : ($data['label'] ?? null),
                'type' => $data['type'],
                'max_uses' => $data['type'] === 'single_use' ? 1 : $data['max_uses'],
                'expires_at' => $session->closes_at,
                'created_by' => $request?->user()?->id,
            ]);
        }

        return $count;
    }
}
