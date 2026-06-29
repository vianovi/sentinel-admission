<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('exam_import_batches');

        Schema::create('exam_import_batches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_subject_id')
                ->nullable()
                ->constrained('exam_subjects')
                ->nullOnDelete();
            $table->foreignId('exam_package_id')
                ->nullable()
                ->constrained('exam_packages')
                ->nullOnDelete();
            $table->foreignId('uploaded_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->string('original_filename');
            $table->string('stored_path', 500)->nullable();
            $table->string('file_hash', 128)->nullable();
            $table->unsignedInteger('file_size_kb')->nullable();
            $table->enum('status', ['pending', 'completed', 'failed'])->default('pending');
            $table->unsignedInteger('total_rows')->default(0);
            $table->unsignedInteger('imported_rows')->default(0);
            $table->unsignedInteger('failed_rows')->default(0);
            $table->json('missing_columns')->nullable();
            $table->json('failure_report')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('finished_at')->nullable();
            $table->timestamps();

            $table->index(['exam_package_id', 'status']);
            $table->index(['uploaded_by', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exam_import_batches');
    }
};
