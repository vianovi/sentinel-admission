<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('candidates', function (Blueprint $table) {
            $table->id();

            // =========================
            // RELASI
            // =========================
            $table->foreignId('user_id')
                ->constrained()
                ->onDelete('cascade');

            $table->foreignId('admission_wave_id')
                ->nullable()
                ->nullOnDelete()
                ->constrained('admission_waves');

            $table->foreignId('registration_draft_id')
                ->nullable()
                ->nullOnDelete()
                ->constrained('registration_drafts');

            // =========================
            // IDENTITAS SISWA
            // =========================
            $table->string('nisn', 10)->nullable()->unique();
            $table->string('nik', 16)->nullable()->unique();    // ← TAMBAH: dari KTP/KK
            $table->string('full_name');
            $table->enum('gender', ['L', 'P']);
            $table->string('place_of_birth');
            $table->date('date_of_birth');

            // =========================
            // ALAMAT
            // =========================
            $table->text('address_full')->nullable();           // ← RENAME dari address
            $table->json('address_detail')->nullable();         // ← TAMBAH: {jalan, rt, rw,
                                                                //   kelurahan, kecamatan,
                                                                //   kabupaten, provinsi}

            // =========================
            // SEKOLAH
            // =========================
            $table->string('school_origin')->nullable();

            // =========================
            // DATA TAMBAHAN (Diisi setelah login)
            // =========================
            $table->string('program_choice')->nullable();
            $table->string('phone_number', 20)->nullable();     // WA siswa (opsional)

            // =========================
            // STATUS PENDAFTARAN
            // =========================
            /**
             * draft     → data awal dari konversi draft
             * submitted → kandidat sudah submit lengkap
             * verified  → lolos verifikasi administrasi
             * accepted  → diterima
             * rejected  → ditolak
             */
            $table->enum('status', [
                'draft',
                'submitted',
                'verified',
                'accepted',
                'rejected',
            ])->default('draft');

            $table->timestamps();

            // =========================
            // INDEX
            // =========================
            $table->index('user_id');
            $table->index('status');
            $table->index('nisn');
            $table->index('nik');                               // ← TAMBAH
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('candidates');
    }
};