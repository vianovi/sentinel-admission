<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('system_activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('actor_id')->nullable()->nullOnDelete()->constrained('users');
            $table->string('actor_name');
            $table->string('actor_role')->default('system');
            $table->string('action'); // e.g., media.deleted_to_trash, media.restored, media.purged, candidate_draft.deleted_to_trash, etc.
            $table->string('module'); // e.g., exam_media, candidate_draft, system
            $table->string('target_type')->nullable(); // e.g., ExamMedia, RegistrationDraft, Candidate
            $table->string('target_id')->nullable();
            $table->string('target_label')->nullable();
            $table->text('description'); // Human-readable audit narrative
            $table->json('metadata')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamps();

            $table->index('module');
            $table->index('action');
            $table->index('created_at');
            $table->index(['module', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('system_activity_logs');
    }
};
