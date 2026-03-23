<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('candidate_documents');

        Schema::create('candidate_documents', function (Blueprint $table) {
            $table->id();

            // ─── RELASI ───────────────────────────────────────────────────
            $table->foreignId('candidate_id')
                  ->constrained()
                  ->onDelete('cascade');

            // Denormalisasi — konsisten dengan guardians, health_records, payments
            $table->string('candidate_code')->nullable()->index();

            // ─── KLASIFIKASI ──────────────────────────────────────────────
            $table->string('doc_type', 50);
            // Nilai valid: lihat konstanta CandidateDocument::DOC_TYPES
            // Contoh: 'photo_formal', 'birth_certificate', 'kip_card', dll

            $table->enum('doc_group', [
                'identity',    // Kelompok A — Identitas & Kependudukan
                'academic',    // Kelompok B — Akademik
                'achievement', // Kelompok C — Prestasi (multi-upload diizinkan)
                'welfare',     // Kelompok D — Bantuan & Afirmasi (pilih salah satu)
                'boarding',    // Kelompok E — Boarding School (sebagian kondisional)
            ]);

            // ─── FILE INFO ────────────────────────────────────────────────
            $table->string('original_filename', 255);
            // Nama asli dari user — hanya untuk audit trail & display
            // TIDAK PERNAH digunakan sebagai filesystem path

            $table->string('stored_filename', 255);
            // UUID-renamed oleh sistem: {uuid}.{ext}
            // Ekstensi diambil dari magic bytes, BUKAN dari nama asli user

            $table->string('file_path', 500);
            // Full path: candidates/{candidate_code}/{stored_filename}
            // Selalu di storage/app/private/ — tidak web-accessible

            $table->string('mime_type', 100)->nullable();
            $table->unsignedInteger('file_size_kb')->nullable();

            // ─── STATUS VERIFIKASI ────────────────────────────────────────
            $table->enum('status', ['pending', 'verified', 'rejected'])->default('pending');
            // pending  = baru diupload, menunggu review staff
            // verified = staff konfirmasi dokumen valid
            // rejected = staff tolak, lihat rejection_reason

            $table->text('rejection_reason')->nullable();
            // Diisi staff saat reject — ditampilkan ke kandidat dengan bahasa sopan

            $table->foreignId('verified_by')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete();
            $table->timestamp('verified_at')->nullable();

            $table->timestamps();
            $table->softDeletes();
            // SoftDeletes: dokumen terhapus tetap tercatat untuk audit trail

            // ─── INDEX (strategis — leading column = most selective) ──────
            $table->index(['candidate_id', 'doc_type']);
            // Query: "apakah kandidat X sudah upload doc_type Y?"
            // Dipakai: cek kelengkapan, progress bar per dokumen

            $table->index(['candidate_id', 'doc_group']);
            // Query: "berapa dokumen kelompok A milik kandidat X?"
            // Dipakai: progress bar per kelompok, halaman Status

            $table->index(['candidate_id', 'status']);
            // Query: "semua dokumen pending milik kandidat X"
            // Dipakai: reminder notifikasi, badge kandidat

            $table->index('status');
            // Query: "semua dokumen pending" — untuk staff dashboard
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('candidate_documents');
    }
};
