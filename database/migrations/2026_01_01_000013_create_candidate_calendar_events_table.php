<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('candidate_calendar_events');

        Schema::create('candidate_calendar_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('candidate_id')->nullable()->constrained()->nullOnDelete();

            $table->string('title', 140);
            $table->text('description')->nullable();
            $table->date('event_date');
            $table->dateTime('starts_at')->nullable();
            $table->dateTime('ends_at')->nullable();
            $table->boolean('all_day')->default(true);
            $table->string('type', 32)->default('note');
            $table->string('status', 32)->default('scheduled');
            $table->string('location', 160)->nullable();

            $table->timestamps();

            $table->index(['user_id', 'event_date']);
            $table->index(['candidate_id', 'event_date']);
            $table->index(['type', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('candidate_calendar_events');
    }
};
