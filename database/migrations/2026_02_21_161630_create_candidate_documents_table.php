<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('candidate_documents', function (Blueprint $table) {
            $table->id();

            $table->foreignId('candidate_id')
                ->constrained()
                ->onDelete('cascade');

            // =========================
            // KLASIFIKASI DOKUMEN
            // =========================
            $table->string('document_type');        // kk, ktp, akta, ijazah, foto, dll
            $table->string('document_owner');       // candidate, father, mother, guardian
            $table->string('document_category');    // primary, supporting

            // =========================
            // FILE INFO
            // =========================
            $table->string('stored_name');          // Nama file hasil rename by sistem
            $table->string('file_path');            // Path di storage/app/public
            $table->string('mime_type')->nullable();
            $table->unsignedInteger('file_size')->nullable(); // Dalam KB

            // =========================
            // STATUS VERIFIKASI ADMIN
            // =========================
            $table->string('status')->default('pending'); // pending, valid, invalid
            $table->text('admin_note')->nullable();        // Alasan penolakan

            $table->timestamps();

            // =========================
            // INDEX
            // =========================
            $table->index('candidate_id');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('candidate_documents');
    }
};