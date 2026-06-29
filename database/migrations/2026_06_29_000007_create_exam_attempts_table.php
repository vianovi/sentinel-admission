<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('exam_attempts');

        Schema::create('exam_attempts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_session_id')
                ->constrained('exam_sessions')
                ->cascadeOnDelete();
            $table->foreignId('exam_session_candidate_id')
                ->constrained('exam_session_candidates')
                ->cascadeOnDelete();
            $table->foreignId('exam_package_id')
                ->constrained('exam_packages')
                ->cascadeOnDelete();
            $table->foreignId('candidate_id')
                ->constrained('candidates')
                ->cascadeOnDelete();
            $table->unsignedTinyInteger('attempt_number')->default(1);
            $table->enum('status', [
                'in_progress',
                'submitted',
                'auto_submitted',
                'expired',
                'cancelled',
                'invalidated',
            ])->default('in_progress');
            $table->timestamp('started_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('finalized_at')->nullable();
            $table->timestamp('last_activity_at')->nullable();
            $table->json('question_order')->nullable();
            $table->unsignedInteger('total_questions')->default(0);
            $table->unsignedInteger('answered_questions')->default(0);
            $table->unsignedInteger('blank_questions')->default(0);
            $table->unsignedInteger('correct_answers')->default(0);
            $table->unsignedInteger('wrong_answers')->default(0);
            $table->decimal('raw_score', 10, 2)->default(0);
            $table->decimal('max_score', 10, 2)->default(0);
            $table->decimal('percentage_score', 5, 2)->nullable();
            $table->decimal('passing_score', 5, 2)->nullable();
            $table->boolean('passed')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->unique(['exam_session_candidate_id', 'attempt_number'], 'exam_attempt_number_unique');
            $table->index(['candidate_id', 'status']);
            $table->index(['exam_session_id', 'status']);
            $table->index(['status', 'expires_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exam_attempts');
    }
};
