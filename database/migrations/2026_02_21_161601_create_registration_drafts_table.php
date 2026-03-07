<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('registration_drafts', function (Blueprint $table) {
            $table->id();

            $table->foreignId('admission_wave_id')
                ->nullable()
                ->nullOnDelete()
                ->constrained('admission_waves');

            // =========================
            // SECURITY KEYS
            // =========================
            // registration_code → tampil ke user sebagai referensi
            // secret_token      → UUID v4, disimpan di HttpOnly Cookie
            // Keduanya harus match untuk akses draft (Double Key Lock)
            $table->string('registration_code')->unique()->nullable();
            $table->string('secret_token')->unique()->nullable();
            $table->timestamp('expires_at')->nullable();

            // =========================
            // PROGRESS TRACKING
            // =========================
            $table->tinyInteger('current_step')->default(1);

            // =========================
            // DATA IDENTITAS SISWA
            // =========================
            $table->string('nisn', 10)->nullable();
            $table->string('nik', 16)->nullable();
            $table->string('full_name')->nullable();
            $table->enum('gender', ['L', 'P'])->nullable();
            $table->string('place_of_birth')->nullable();
            $table->date('date_of_birth')->nullable();

            // =========================
            // DATA KONTAK
            // =========================
            $table->string('mother_name')->nullable();
            // whatsapp_number = nomor utama akun → masuk ke users.whatsapp_number
            // phone_number TIDAK ADA di draft — kandidat isi sendiri setelah login
            $table->string('whatsapp_number', 20)->nullable();
            $table->string('email')->nullable();

            // =========================
            // DATA ALAMAT
            // =========================
            $table->text('address_full')->nullable();
            $table->json('address_detail')->nullable(); // {jalan, rt, rw, kelurahan, kecamatan, kabupaten, provinsi}

            // =========================
            // DATA SEKOLAH
            // =========================
            $table->string('school_origin')->nullable();

            $table->softDeletes();
            $table->timestamps();

            // =========================
            // INDEX
            // =========================
            $table->index('registration_code');
            $table->index('secret_token');
            $table->index('expires_at');
            $table->index('nisn');
            $table->index('nik');
            $table->index('current_step');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('registration_drafts');
    }
};