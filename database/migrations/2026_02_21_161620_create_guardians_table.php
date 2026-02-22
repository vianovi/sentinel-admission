<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('guardians', function (Blueprint $table) {
            $table->id();

            $table->foreignId('candidate_id')
                ->constrained()
                ->onDelete('cascade');

            // =========================
            // DATA AYAH
            // =========================
            $table->string('father_name')->nullable();
            $table->string('father_nik', 16)->nullable();
            $table->string('father_place_of_birth')->nullable();
            $table->date('father_date_of_birth')->nullable();
            $table->string('father_job')->nullable();
            $table->string('father_income')->nullable();    // "< 1 Juta", "1-3 Juta", dll

            // =========================
            // DATA IBU
            // =========================
            $table->string('mother_name');                  // NOT NULL — source dari draft
            $table->string('mother_nik', 16)->nullable();
            $table->string('mother_place_of_birth')->nullable();
            $table->date('mother_date_of_birth')->nullable();
            $table->string('mother_job')->nullable();
            $table->string('mother_income')->nullable();

            // =========================
            // DATA WALI
            // =========================
            $table->string('guardian_name')->nullable();
            $table->string('guardian_relation')->nullable(); // "Kakak", "Paman", dll
            $table->string('guardian_job')->nullable();
            $table->string('guardian_income')->nullable();

            // =========================
            // KONTAK & ADMINISTRASI
            // =========================
            $table->string('whatsapp_number', 20);          // NOT NULL — wajib diisi
            $table->string('no_kk', 16)->nullable();        // Nomor Kartu Keluarga

            $table->timestamps();

            // =========================
            // INDEX
            // =========================
            $table->index('candidate_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('guardians');
    }
};