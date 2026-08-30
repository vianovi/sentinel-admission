<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('candidates');

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

            // Kode unik kandidat — derived dari registration_code draft
            // Format: CDT-XXXX-YY-GZ (prefix REG- diganti CDT-, nilai belakang sama persis)
            $table->string('candidate_code')->unique()->nullable();

            // =========================
            // IDENTITAS SISWA
            // =========================
            $table->string('nisn', 10)->nullable()->unique();
            $table->string('nik', 16)->nullable()->unique();
            $table->string('full_name');
            $table->enum('gender', ['L', 'P']);
            $table->string('place_of_birth');
            $table->date('date_of_birth');
            $table->string('religion')->nullable();
            $table->tinyInteger('child_order')->nullable();
            $table->tinyInteger('siblings_count')->nullable();
            $table->text('hobbies')->nullable();
            $table->text('ambitions')->nullable();
            $table->text('habits')->nullable();
            $table->json('extracurricular_interests')->nullable();

            // =========================
            // ALAMAT
            // =========================
            $table->text('address_full')->nullable();
            $table->json('address_detail')->nullable();
            $table->string('postal_code', 10)->nullable();

            // =========================
            // SEKOLAH ASAL
            // =========================
            $table->string('school_origin')->nullable();
            $table->string('school_npsn', 8)->nullable();
            $table->string('certificate_number')->nullable();

            // =========================
            // DATA TAMBAHAN (Diisi setelah login)
            // =========================
            $table->string('email')->nullable();
            $table->string('phone_number', 20)->nullable();
            $table->string('birth_certificate_number')->nullable();
            $table->string('family_card_number', 16)->nullable();
            $table->string('program_choice')->nullable();
            $table->string('major_choice')->nullable();

            // false = kandidat reguler (default)
            // true  = kandidat pindahan — tampilkan transfer_letter di halaman Dokumen
            $table->boolean('is_transfer')->default(false);

            // =========================
            // PENGAJUAN PERUBAHAN DATA KUNCI
            // =========================
            // Format: { field, old_value, new_value, reason, status, requested_at }
            // status: pending | approved | rejected
            $table->json('data_change_request')->nullable();

            // =========================
            // STATUS PENDAFTARAN
            // =========================
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
            $table->index('nik');
            $table->index('candidate_code');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('candidates');
    }
};
