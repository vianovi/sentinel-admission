<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('exam_attempt_answers');

        Schema::create('exam_attempt_answers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_attempt_id')
                ->constrained('exam_attempts')
                ->cascadeOnDelete();
            $table->foreignId('exam_question_id')
                ->constrained('exam_questions')
                ->cascadeOnDelete();
            $table->enum('selected_option', ['A', 'B', 'C', 'D', 'E'])->nullable();
            $table->boolean('is_marked_for_review')->default(false);
            $table->boolean('is_correct')->nullable();
            $table->decimal('point_awarded', 8, 2)->default(0);
            $table->timestamp('answered_at')->nullable();
            $table->timestamp('saved_at')->nullable();
            $table->timestamps();

            $table->unique(['exam_attempt_id', 'exam_question_id'], 'exam_attempt_question_unique');
            $table->index(['exam_question_id', 'selected_option']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exam_attempt_answers');
    }
};
