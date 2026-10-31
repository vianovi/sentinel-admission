<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exam_public_subjects', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code', 50)->unique();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('exam_public_packages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_public_subject_id')->constrained('exam_public_subjects')->restrictOnDelete();
            $table->string('title');
            $table->string('code', 80)->unique();
            $table->unsignedSmallInteger('duration_minutes')->default(60);
            $table->boolean('randomize_questions')->default(false);
            $table->boolean('randomize_options')->default(false);
            $table->enum('status', ['draft', 'published', 'closed', 'archived'])->default('draft');
            $table->timestamps();

            $table->unique(['id', 'exam_public_subject_id'], 'public_package_subject_pair');
        });

        Schema::create('exam_public_questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_public_package_id')->constrained('exam_public_packages')->restrictOnDelete();
            $table->longText('question_text');
            $table->json('options');
            $table->enum('correct_answer', ['A', 'B', 'C', 'D', 'E']);
            $table->decimal('point', 8, 2)->default(1);
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['exam_public_package_id', 'is_active', 'sort_order'], 'public_question_package_active_order');
        });

        Schema::create('exam_public_sessions', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->longText('instructions')->nullable();
            $table->timestamp('opens_at');
            $table->timestamp('closes_at');
            $table->decimal('passing_score', 5, 2)->default(65);
            $table->decimal('remedial_score_limit', 5, 2)->default(50);
            $table->boolean('allow_remedial')->default(true);
            $table->unsignedTinyInteger('max_remedial_attempts')->default(1);
            $table->enum('order_type', ['free', 'sequential'])->default('free');
            $table->boolean('show_result_to_participant')->default(false);
            $table->enum('status', ['draft', 'published', 'closed', 'archived'])->default('draft');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['status', 'opens_at', 'closes_at']);
        });

        Schema::create('exam_public_session_packages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_public_session_id')->constrained('exam_public_sessions')->cascadeOnDelete();
            $table->foreignId('exam_public_package_id')->constrained('exam_public_packages')->restrictOnDelete();
            $table->foreignId('exam_public_subject_id')->constrained('exam_public_subjects')->restrictOnDelete();
            $table->unsignedTinyInteger('sort_order');
            $table->timestamps();

            $table->unique(['exam_public_session_id', 'exam_public_subject_id'], 'public_session_one_package_per_subject');
            $table->unique(['exam_public_session_id', 'exam_public_package_id'], 'public_session_package_unique');
            $table->foreign(['exam_public_package_id', 'exam_public_subject_id'], 'public_session_package_subject_fk')
                ->references(['id', 'exam_public_subject_id'])->on('exam_public_packages');
        });

        Schema::create('exam_public_session_tokens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_public_session_id')->constrained('exam_public_sessions')->cascadeOnDelete();
            $table->string('token', 100)->unique();
            $table->string('label')->nullable();
            $table->unsignedInteger('max_uses')->nullable();
            $table->unsignedInteger('used_count')->default(0);
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });

        Schema::create('exam_public_participants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_public_session_id')->constrained('exam_public_sessions')->restrictOnDelete();
            $table->foreignId('exam_public_session_token_id')->nullable()->constrained('exam_public_session_tokens')->nullOnDelete();
            $table->string('participant_code', 40)->unique();
            $table->string('name');
            $table->string('school_origin');
            $table->text('address')->nullable();
            $table->string('phone', 30)->nullable();
            $table->string('session_secret', 64)->unique();
            $table->enum('status', ['in_progress', 'completed'])->default('in_progress');
            $table->decimal('average_score', 5, 2)->nullable();
            $table->boolean('is_passed')->nullable();
            $table->timestamp('started_at');
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index(['exam_public_session_id', 'name']);
        });

        Schema::create('exam_public_subject_attempts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_public_participant_id')->constrained('exam_public_participants')->cascadeOnDelete();
            $table->foreignId('exam_public_package_id')->constrained('exam_public_packages')->restrictOnDelete();
            $table->foreignId('exam_public_subject_id')->constrained('exam_public_subjects')->restrictOnDelete();
            $table->enum('attempt_type', ['primary', 'remedial'])->default('primary');
            $table->unsignedTinyInteger('attempt_number')->default(1);
            $table->enum('status', ['in_progress', 'submitted', 'auto_submitted', 'expired'])->default('in_progress');
            $table->timestamp('started_at');
            $table->timestamp('expires_at');
            $table->timestamp('submitted_at')->nullable();
            $table->json('question_order')->nullable();
            $table->unsignedInteger('total_questions')->default(0);
            $table->unsignedInteger('answered_questions')->default(0);
            $table->unsignedInteger('correct_answers')->default(0);
            $table->decimal('raw_score', 10, 2)->default(0);
            $table->decimal('max_score', 10, 2)->default(0);
            $table->decimal('percentage_score', 5, 2)->nullable();
            $table->timestamps();

            $table->unique(['exam_public_participant_id', 'exam_public_subject_id', 'attempt_number'], 'public_participant_subject_attempt_unique');
            $table->index(['status', 'expires_at']);
            $table->foreign(['exam_public_package_id', 'exam_public_subject_id'], 'public_attempt_package_subject_fk')
                ->references(['id', 'exam_public_subject_id'])->on('exam_public_packages');
        });

        Schema::create('exam_public_attempt_answers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_public_subject_attempt_id');
            $table->foreign('exam_public_subject_attempt_id', 'public_answer_attempt_fk')
                ->references('id')->on('exam_public_subject_attempts')->cascadeOnDelete();
            $table->foreignId('exam_public_question_id')->constrained('exam_public_questions')->restrictOnDelete();
            $table->enum('selected_option', ['A', 'B', 'C', 'D', 'E'])->nullable();
            $table->boolean('is_correct')->nullable();
            $table->decimal('point_awarded', 8, 2)->default(0);
            $table->timestamp('saved_at')->nullable();
            $table->timestamps();

            $table->unique(['exam_public_subject_attempt_id', 'exam_public_question_id'], 'public_attempt_question_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exam_public_attempt_answers');
        Schema::dropIfExists('exam_public_subject_attempts');
        Schema::dropIfExists('exam_public_participants');
        Schema::dropIfExists('exam_public_session_tokens');
        Schema::dropIfExists('exam_public_session_packages');
        Schema::dropIfExists('exam_public_sessions');
        Schema::dropIfExists('exam_public_questions');
        Schema::dropIfExists('exam_public_packages');
        Schema::dropIfExists('exam_public_subjects');
    }
};
