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

            // Relasi ke gelombang (opsional, bisa null)
            $table->foreignId('admission_wave_id')
                ->nullable()
                ->nullOnDelete()
                ->constrained('admission_waves');

            // =========================
            // SECURITY KEYS
            // =========================

            /**
             * registration_code → tampil ke user sebagai referensi
             * secret_token      → UUID v4, disimpan di HttpOnly Cookie
             *                     tidak pernah ditampilkan ke user
             * Keduanya harus match untuk bisa akses draft (Double Key Lock)
             */
            $table->string('registration_code')->unique();
            $table->string('secret_token')->unique();
            $table->timestamp('expires_at');               // created_at + 3 hari

            // =========================
            // DATA IDENTITAS SISWA
            // =========================
            $table->string('nisn', 10)->nullable();
            $table->string('full_name')->nullable();
            $table->enum('gender', ['L', 'P'])->nullable();
            $table->string('place_of_birth')->nullable();
            $table->date('date_of_birth')->nullable();

            // =========================
            // DATA KONTAK
            // =========================
            $table->string('mother_name')->nullable();     // Source → tabel guardians
            $table->string('whatsapp_number', 20)->nullable(); // Kontak orang tua
            $table->string('phone_number', 20)->nullable();    // WA siswa (opsional)
            $table->string('email')->nullable();           // Email untuk buat akun

            // =========================
            // DATA ALAMAT
            // =========================
            $table->text('address_full')->nullable();      // Alamat lengkap gabungan
            $table->json('address_detail')->nullable();    // {jalan, rt, rw, kelurahan,
                                                           //  kecamatan, kabupaten, provinsi}

            // =========================
            // DATA SEKOLAH
            // =========================
            $table->string('school_origin')->nullable();   // Dilengkapi di step 3

            // Soft delete — aktif saat draft dikonversi jadi akun
            $table->softDeletes();
            $table->timestamps();

            // =========================
            // INDEX
            // =========================
            $table->index('registration_code');
            $table->index('secret_token');
            $table->index('expires_at');                   // Untuk query cleanup draft expired
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('registration_drafts');
    }
};