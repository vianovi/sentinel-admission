<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Performance indexes identified by Exam Performance Audit (findings Q-01 & Q-02).
 *
 * Q-01: Composite index on exam_attempts(exam_session_id, last_activity_at) to eliminate
 *        "Using filesort" in ExamMonitoringService::snapshot() ordering by last_activity_at.
 *        Also adds (status, last_activity_at) for status-filtered activity queries.
 *
 * Q-02: Composite index on exam_attempts(exam_session_id, guest_name, guest_school, status)
 *        for fast public guest auto-resume lookups in ExamAttemptService::startPublicAttempt().
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('exam_attempts', function (Blueprint $table) {
            // Q-01: Monitoring service orders by last_activity_at within session(s)
            $table->index(['exam_session_id', 'last_activity_at'], 'exam_attempts_session_activity_index');
            $table->index(['status', 'last_activity_at'], 'exam_attempts_status_activity_index');

            // Q-02: Guest auto-resume lookup by session + identity + status
            $table->index(
                ['exam_session_id', 'guest_name', 'guest_school', 'status'],
                'exam_attempts_guest_resume_index'
            );
        });
    }

    public function down(): void
    {
        Schema::table('exam_attempts', function (Blueprint $table) {
            $table->dropIndex('exam_attempts_session_activity_index');
            $table->dropIndex('exam_attempts_status_activity_index');
            $table->dropIndex('exam_attempts_guest_resume_index');
        });
    }
};
