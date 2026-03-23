<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('candidate_document_security');

        Schema::create('candidate_document_security', function (Blueprint $table) {
            $table->id();

            // 1-to-1 dengan candidate_documents
            // Cascade delete: hapus dokumen = hapus security record-nya
            $table->foreignId('document_id')
                  ->unique()
                  ->constrained('candidate_documents')
                  ->onDelete('cascade');

            // ─── MAGIC BYTES VERIFICATION ────────────────────────────────
            $table->enum('magic_bytes_result', ['passed', 'suspicious', 'rejected'])
                  ->default('passed');
            // passed     = header file sesuai mime_type yang diklaim
            // suspicious = header valid tapi ada konten mencurigakan (webshell)
            // rejected   = header tidak sesuai mime_type sama sekali

            // ─── POLYGLOT SCAN ───────────────────────────────────────────
            $table->boolean('polyglot_clean')->default(true);
            $table->string('polyglot_detail')->nullable();
            // Diisi jika polyglot_clean = false
            // Contoh: "PHP tag detected at offset 512"
            //         "eval() found at offset 1024"
            //         "system() found at offset 2048"

            // ─── FILE INTEGRITY ──────────────────────────────────────────
            $table->string('detected_mime', 100)->nullable();
            // MIME dari magic bytes scan — bukan dari client claim
            // Jika detected_mime != candidate_documents.mime_type = RED FLAG

            $table->string('file_hash', 64)->nullable();
            // SHA-256 hash dari konten file
            // Untuk: deduplication + integrity check saat download

            // ─── UPLOAD CONTEXT ──────────────────────────────────────────
            $table->string('upload_ip', 45)->nullable();   // IPv4 & IPv6 support
            $table->string('user_agent', 500)->nullable();
            $table->timestamp('scanned_at')->nullable();

            // ─── INDEX ────────────────────────────────────────────────────
            $table->index('magic_bytes_result');
            // Query: "semua file suspicious/rejected" — untuk security audit

            $table->index('polyglot_clean');
            // Query: "semua file yang tidak clean" — untuk investigasi insiden
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('candidate_document_security');
    }
};
