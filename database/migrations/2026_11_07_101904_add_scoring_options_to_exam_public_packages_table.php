<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('exam_public_packages', function (Blueprint $table) {
            $table->decimal('passing_score', 5, 2)->nullable();
            $table->boolean('allow_retry')->nullable();
            $table->boolean('show_result_to_participant')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('exam_public_packages', function (Blueprint $table) {
            $table->dropColumn(['passing_score', 'allow_retry', 'show_result_to_participant']);
        });
    }
};
