<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('admission_programs');

        Schema::create('admission_programs', function (Blueprint $table) {
            $table->id();

            $table->foreignId('admission_wave_id')
                ->constrained('admission_waves')
                ->onDelete('cascade');

            // Nama program: "Reguler", "Tahfidz", "Unggulan", dll
            $table->string('name');

            // Urutan prioritas — 1 = tertinggi
            // Sistem akan membaca priority untuk tampilan & validasi kuota
            $table->unsignedTinyInteger('priority')->default(99);

            // Kuota ideal — batas normal (zona hijau)
            // Diisi manual oleh admin, fitur otomatisasi = fitur lanjutan
            $table->unsignedInteger('quota_ideal')->default(0);

            // Kuota maksimal — batas hard (zona merah = ditolak)
            // Harus selalu >= quota_ideal
            $table->unsignedInteger('quota_max')->default(0);

            // true  = program "sisa" (Reguler) — hanya dibatasi total gelombang
            // false = program ketat — validasi quota_ideal & quota_max berlaku
            $table->boolean('is_open_quota')->default(false);

            $table->text('description')->nullable();

            $table->boolean('is_active')->default(true);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admission_programs');
    }
};
