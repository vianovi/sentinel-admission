<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('exam_public_participants', function (Blueprint $table): void {
            $table->timestamp('last_seen_at')->nullable()->after('completed_at');
            $table->string('current_state', 40)->nullable()->after('last_seen_at');
            $table->string('last_event', 60)->nullable()->after('current_state');
            $table->timestamp('last_event_at')->nullable()->after('last_event');
        });

        Schema::table('exam_public_subject_attempts', function (Blueprint $table): void {
            $table->timestamp('last_seen_at')->nullable()->after('metadata');
            $table->unsignedInteger('current_question_index')->nullable()->after('last_seen_at');
            $table->string('last_state', 40)->nullable()->after('current_question_index');
            $table->string('last_event', 60)->nullable()->after('last_state');
            $table->timestamp('last_event_at')->nullable()->after('last_event');
        });
    }

    public function down(): void
    {
        Schema::table('exam_public_subject_attempts', function (Blueprint $table): void {
            $table->dropColumn(['last_seen_at', 'current_question_index', 'last_state', 'last_event', 'last_event_at']);
        });

        Schema::table('exam_public_participants', function (Blueprint $table): void {
            $table->dropColumn(['last_seen_at', 'current_state', 'last_event', 'last_event_at']);
        });
    }
};
