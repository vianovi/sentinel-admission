<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('exam_public_sessions', function (Blueprint $table): void {
            $table->enum('time_source', ['server', 'participant'])->default('server')->after('order_type');
        });
    }

    public function down(): void
    {
        Schema::table('exam_public_sessions', function (Blueprint $table): void {
            $table->dropColumn('time_source');
        });
    }
};
