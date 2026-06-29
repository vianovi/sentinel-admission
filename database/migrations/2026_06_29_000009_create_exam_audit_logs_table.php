<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('exam_audit_logs');

        Schema::create('exam_audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('actor_user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->foreignId('candidate_id')
                ->nullable()
                ->constrained('candidates')
                ->nullOnDelete();
            $table->foreignId('exam_session_id')
                ->nullable()
                ->constrained('exam_sessions')
                ->nullOnDelete();
            $table->foreignId('exam_package_id')
                ->nullable()
                ->constrained('exam_packages')
                ->nullOnDelete();
            $table->foreignId('exam_attempt_id')
                ->nullable()
                ->constrained('exam_attempts')
                ->nullOnDelete();
            $table->string('event_type', 80);
            $table->json('metadata')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamps();

            $table->index(['event_type', 'created_at']);
            $table->index(['candidate_id', 'created_at']);
            $table->index(['exam_attempt_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exam_audit_logs');
    }
};
