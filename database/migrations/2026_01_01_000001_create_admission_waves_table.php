<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('admission_waves');

        Schema::create('admission_waves', function (Blueprint $table) {
            $table->id();

            // Identitas Gelombang
            $table->string('title');                         // "Gelombang 1 - Jalur Prestasi"
            $table->string('academic_year');                 // "2026/2027"
            $table->text('description')->nullable();         // Syarat & keterangan khusus

            // Periode Pendaftaran
            $table->date('start_date');                      // Tanggal buka pendaftaran
            $table->date('end_date');                        // Tanggal tutup pendaftaran

            // Info Jadwal (Fleksibel - Free Text)
            $table->text('exam_info')->nullable();           // "Ujian setiap Sabtu..."
            $table->text('announcement_info')->nullable();   // "Pengumuman setiap Senin..."
            $table->date('reregistration_date')->nullable(); // Deadline daftar ulang

            // Biaya & Kuota
            $table->decimal('registration_fee', 12, 2)->default(0);
            $table->integer('quota_target')->default(0);    // quota_filled = realtime via relasi

            // available_programs dihapus — digantikan relasi hasMany ke admission_programs
            // Program dikelola via tabel admission_programs dengan priority, quota_ideal, quota_max

            // available_majors → JSON ["IPA", "IPS", "Teknik Komputer"]
            // Hanya relevan jika majors_enabled = true (SMA/SMK)
            $table->json('available_majors')->nullable();

            // majors_enabled → toggle aktif/tidak untuk input jurusan
            // false = input jurusan hidden di frontend
            // true  = input jurusan muncul sebagai pilihan
            $table->boolean('majors_enabled')->default(false);

            // Status
            $table->boolean('is_active')->default(false);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admission_waves');
    }
};