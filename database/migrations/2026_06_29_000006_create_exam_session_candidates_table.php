<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('exam_session_candidates');

        Schema::create('exam_session_candidates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_session_id')
                ->constrained('exam_sessions')
                ->cascadeOnDelete();
            $table->foreignId('candidate_id')
                ->constrained('candidates')
                ->cascadeOnDelete();
            $table->foreignId('assigned_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->enum('status', ['eligible', 'blocked', 'completed'])->default('eligible');
            $table->timestamp('assigned_at')->nullable();
            $table->text('note')->nullable();
            $table->timestamps();

            $table->unique(['exam_session_id', 'candidate_id'], 'exam_session_candidate_unique');
            $table->index(['candidate_id', 'status']);
            $table->index(['exam_session_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exam_session_candidates');
    }
};
