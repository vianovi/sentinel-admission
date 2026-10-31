<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('exam_public_participants', function (Blueprint $table) {
            $table->string('session_secret', 64)->nullable()->change();
            $table->timestamp('started_at')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('exam_public_participants', function (Blueprint $table) {
            $table->string('session_secret', 64)->nullable(false)->change();
            $table->timestamp('started_at')->nullable(false)->change();
        });
    }
};
