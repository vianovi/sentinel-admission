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
            $table->string('nik', 16)->nullable()->unique();
            $table->string('full_name');
            $table->enum('gender', ['L', 'P']);
            $table->string('place_of_birth');
            $table->date('date_of_birth');
            $table->string('religion')->nullable();             // Agama
            $table->tinyInteger('child_order')->nullable();     // Anak ke-berapa
            $table->tinyInteger('siblings_count')->nullable();  // Jumlah saudara kandung
            $table->text('hobbies')->nullable();                // Hobi / minat bakat
            $table->text('ambitions')->nullable();              // Cita-cita
            $table->text('habits')->nullable();                 // Kebiasaan
            $table->json('extracurricular_interests')->nullable(); // Minat ekstrakulikuler (JSON array nama)

            // =========================
            // ALAMAT
            // =========================
            $table->text('address_full')->nullable();
            $table->json('address_detail')->nullable();         // {jalan, rt, rw, kelurahan, kecamatan, kabupaten, provinsi}
            $table->string('postal_code', 10)->nullable();      // Kode pos

            // =========================
            // SEKOLAH ASAL
            // =========================
            $table->string('school_origin')->nullable();        // Nama sekolah asal
            $table->string('school_npsn', 8)->nullable();       // NPSN sekolah asal (standar Dapodik)
            $table->string('certificate_number')->nullable();   // Nomor ijazah (bisa disusulkan)

            // =========================
            // DATA TAMBAHAN (Diisi setelah login)
            // =========================
            $table->string('email')->nullable();                // Email siswa (beda dengan email akun)
            $table->string('phone_number', 20)->nullable();     // WA/HP siswa (opsional)
            $table->string('birth_certificate_number')->nullable(); // Nomor akta lahir
            $table->string('family_card_number', 16)->nullable();   // Nomor KK
            $table->string('program_choice')->nullable();       // Diambil dari admission_waves.available_programs
            $table->string('major_choice')->nullable();         // Diisi hanya jika admission_waves.majors_enabled = true

            // =========================
            // PENGAJUAN PERUBAHAN DATA KUNCI
            // =========================
            // Disimpan sebagai JSON — tidak perlu tabel terpisah
            // Format: { field, old_value, new_value, reason, status, requested_at }
            // status: pending | approved | rejected
            $table->json('data_change_request')->nullable();

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