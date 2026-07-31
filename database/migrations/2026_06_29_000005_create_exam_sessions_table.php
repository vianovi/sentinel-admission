<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('exam_sessions');

        Schema::create('exam_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_package_id')
                ->constrained('exam_packages')
                ->cascadeOnDelete();
            $table->foreignId('admission_wave_id')
                ->nullable()
                ->constrained('admission_waves')
                ->nullOnDelete();
            $table->foreignId('created_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->longText('instructions')->nullable();
            $table->timestamp('opens_at');
            $table->timestamp('closes_at');
            $table->unsignedSmallInteger('duration_minutes');
            $table->decimal('passing_score', 5, 2);
            $table->unsignedTinyInteger('max_attempts')->default(1);
            $table->boolean('show_result_to_candidate')->default(false);
            $table->boolean('is_public')->default(false);
            $table->enum('public_access_type', ['token_required', 'open'])->default('token_required');
            $table->enum('status', ['draft', 'published', 'closed', 'archived'])->default('draft');
            $table->timestamps();

            $table->index(['exam_package_id', 'status']);
            $table->index(['admission_wave_id', 'status']);
            $table->index(['opens_at', 'closes_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exam_sessions');
    }
};
