<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('system_trashes', function (Blueprint $table) {
            $table->id();
            $table->string('type'); // exam_media, candidate_draft
            $table->string('name');
            $table->string('identifier')->index();
            $table->string('original_path')->nullable();
            $table->string('trash_path')->nullable();
            $table->unsignedBigInteger('file_size')->nullable();
            $table->string('mime_type')->nullable();
            $table->json('metadata')->nullable(); // affected questions, draft snapshot, etc.
            $table->foreignId('deleted_by')->nullable()->nullOnDelete()->constrained('users');
            $table->string('deleted_by_name')->nullable();
            $table->timestamp('purge_at')->index();
            $table->timestamps();

            $table->index('type');
            $table->index(['type', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('system_trashes');
    }
};
