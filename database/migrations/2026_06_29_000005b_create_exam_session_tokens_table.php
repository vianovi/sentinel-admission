<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('exam_session_tokens');

        Schema::create('exam_session_tokens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_session_id')
                ->constrained('exam_sessions')
                ->cascadeOnDelete();
            $table->string('token', 100)->unique();
            $table->string('label')->nullable();
            $table->enum('type', ['single_use', 'multi_use'])->default('single_use');
            $table->unsignedInteger('max_uses')->default(1);
            $table->unsignedInteger('used_count')->default(0);
            $table->timestamp('expires_at')->nullable();
            $table->foreignId('created_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->timestamps();

            $table->index(['exam_session_id', 'token']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exam_session_tokens');
    }
};
