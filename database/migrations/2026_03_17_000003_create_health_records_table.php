<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('health_records', function (Blueprint $table) {
            $table->id();

            $table->foreignId('candidate_id')
                ->constrained()
                ->onDelete('cascade');

            // =========================
            // DATA FISIK
            // =========================
            $table->string('blood_type', 3)->nullable();    // A, B, AB, O
            $table->unsignedSmallInteger('height_cm')->nullable(); // Tinggi badan (cm)
            $table->unsignedSmallInteger('weight_kg')->nullable(); // Berat badan (kg)

            // =========================
            // RIWAYAT KESEHATAN
            // =========================
            // Wajib diisi, boleh diisi "Tidak Ada"
            $table->text('major_illnesses')->nullable();    // Riwayat penyakit berat (Asma, Jantung, dll)
            $table->text('allergies')->nullable();          // Alergi obat / makanan

            // =========================
            // CATATAN KHUSUS
            // =========================
            $table->text('physical_disabilities')->nullable(); // Kelainan fisik / kebutuhan khusus
            $table->text('special_notes')->nullable();         // Catatan khusus dari orang tua untuk perawat

            $table->timestamps();

            // =========================
            // INDEX
            // =========================
            $table->unique('candidate_id'); // 1 kandidat hanya punya 1 health record
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('health_records');
    }
};
