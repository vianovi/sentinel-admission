<?php

namespace App\Services\Exam;

use App\Models\Exam\ExamAuditLog;
use Illuminate\Http\Request;

class ExamAuditLogger
{
    public function log(string $eventType, array $context = [], ?Request $request = null): ExamAuditLog
    {
        return ExamAuditLog::create([
            'actor_user_id' => $context['actor_user_id'] ?? $request?->user()?->id,
            'candidate_id' => $context['candidate_id'] ?? null,
            'exam_session_id' => $context['exam_session_id'] ?? null,
            'exam_package_id' => $context['exam_package_id'] ?? null,
            'exam_attempt_id' => $context['exam_attempt_id'] ?? null,
            'event_type' => $eventType,
            'metadata' => $context['metadata'] ?? null,
            'ip_address' => $request?->ip(),
            'user_agent' => $request?->userAgent(),
        ]);
    }
}
