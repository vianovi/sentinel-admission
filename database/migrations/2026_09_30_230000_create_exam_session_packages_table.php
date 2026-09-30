<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exam_session_packages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_session_id')
                ->constrained('exam_sessions')
                ->cascadeOnDelete();
            $table->foreignId('exam_package_id')
                ->constrained('exam_packages')
                ->cascadeOnDelete();
            $table->unsignedTinyInteger('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['exam_session_id', 'exam_package_id']);
        });

        // Migrate existing single-package sessions into pivot
        DB::table('exam_sessions')
            ->whereNotNull('exam_package_id')
            ->orderBy('id')
            ->each(function (object $session) {
                DB::table('exam_session_packages')->insert([
                    'exam_session_id' => $session->id,
                    'exam_package_id' => $session->exam_package_id,
                    'sort_order' => 0,
                    'created_at' => $session->created_at,
                    'updated_at' => $session->updated_at,
                ]);
            });
    }

    public function down(): void
    {
        Schema::dropIfExists('exam_session_packages');
    }
};
