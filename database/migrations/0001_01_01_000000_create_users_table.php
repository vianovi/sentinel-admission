<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        /**
         * Tabel utama untuk kredensial login.
         * Aku pisahkan data profil detail ke tabel candidates,
         * supaya tabel ini tetap bersih dan hanya ngurusin autentikasi.
         */
        Schema::create('users', function (Blueprint $table) {
            $table->id();

            // Nama tampilan akun (bukan nama lengkap resmi, itu ada di candidates)
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');

            // =========================
            // ROLE & AKSES
            // =========================

            /**
             * Aku pakai enum biar strict di level DB.
             * - candidate → siswa pendaftar, akses terbatas ke dashboard sendiri
             * - staff     → bisa verifikasi berkas & pembayaran, tidak bisa ubah setting
             * - admin     → akses penuh ke seluruh sistem
             */
            $table->enum('role', ['admin', 'staff', 'candidate'])
                ->default('candidate');

            // =========================
            // PROFIL
            // =========================

            /**
             * Nomor WA ini aku copy otomatis dari guardians.whatsapp_number
             * saat draft dikonversi jadi akun.
             * Sumbernya: registration_drafts -> guardians -> users
             * Tidak diisi manual oleh user di form akun.
             */
            $table->string('whatsapp_number', 20)->nullable();

            // Path foto profil kecil untuk navbar
            $table->string('avatar')->nullable();

            // =========================
            // STATUS AKUN
            // =========================

            /**
             * Aku pakai is_active untuk suspend/ban akun
             * tanpa harus hapus data — lebih aman untuk audit trail
             * dan berguna juga untuk keperluan lab hacking.
             */
            $table->boolean('is_active')->default(true);

            $table->rememberToken();
            $table->timestamps();
        });

        /**
         * Tabel token untuk reset password.
         * Aku biarkan default Laravel — sudah cukup untuk kebutuhan kita.
         */
        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        /**
         * Tabel sessions untuk manajemen sesi login.
         * Ini juga aku biarkan default — nanti berguna untuk
         * keperluan lab (session hijacking, dll).
         */
        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('sessions');
    }
};