<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tambah FK constraint registration_drafts.candidate_id → candidates.id
     *
     * Harus dijalankan SETELAH kedua tabel ada — menghindari circular dependency:
     * registration_drafts (161601) dibuat sebelum candidates (161610),
     * sehingga FK constraint tidak bisa ditambah di migration asal.
     */
    public function up(): void
    {
        Schema::table('registration_drafts', function (Blueprint $table) {
            $table->foreign('candidate_id')
                ->references('id')
                ->on('candidates')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('registration_drafts', function (Blueprint $table) {
            $table->dropForeign(['candidate_id']);
        });
    }
};
