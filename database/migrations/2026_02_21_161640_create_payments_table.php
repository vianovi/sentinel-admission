<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();

            $table->foreignId('candidate_id')
                ->constrained()
                ->onDelete('cascade');

            // Jejak admin yang verifikasi
            $table->foreignId('verified_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            // =========================
            // IDENTITAS TRANSAKSI
            // =========================
            $table->string('transaction_code')->unique(); // INV-2026-XXXXX
            $table->string('payment_type');               // registration, reregistration
            $table->string('payment_method');             // manual_transfer, cash, gateway

            // =========================
            // NOMINAL
            // =========================
            $table->decimal('expected_amount', 12, 2);   // Seharusnya dibayar
            $table->decimal('amount', 12, 2);             // Yang diklaim dibayar user

            // =========================
            // BUKTI PEMBAYARAN
            // =========================
            /**
             * proof_file nullable untuk kasus cash
             * payment_method = cash → tidak ada foto bukti
             */
            $table->string('proof_file')->nullable();     // Path foto bukti transfer

            // =========================
            // STATUS & VERIFIKASI
            // =========================
            $table->string('status')->default('pending'); // pending, paid, failed
            $table->timestamp('verified_at')->nullable(); // Kapan admin verifikasi
            $table->text('admin_note')->nullable();       // Catatan admin

            $table->timestamps();

            // =========================
            // INDEX
            // =========================
            $table->index('candidate_id');
            $table->index('status');
            $table->index('transaction_code');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};