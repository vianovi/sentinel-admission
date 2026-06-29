<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('exam_questions');

        Schema::create('exam_questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_subject_id')
                ->constrained('exam_subjects')
                ->cascadeOnDelete();
            $table->foreignId('exam_package_id')
                ->constrained('exam_packages')
                ->cascadeOnDelete();
            $table->foreignId('exam_import_batch_id')
                ->nullable()
                ->constrained('exam_import_batches')
                ->nullOnDelete();
            $table->longText('question_text');
            $table->json('options');
            $table->enum('correct_answer', ['A', 'B', 'C', 'D', 'E']);
            $table->decimal('point', 8, 2)->default(1);
            $table->enum('difficulty', ['easy', 'medium', 'hard'])->default('medium');
            $table->text('explanation')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->string('question_hash', 64)->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['exam_package_id', 'is_active']);
            $table->index(['exam_subject_id', 'difficulty']);
            $table->index('question_hash');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exam_questions');
    }
};
