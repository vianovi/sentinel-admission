<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('payments');

        Schema::create('payments', function (Blueprint $table) {
            $table->id();

            $table->foreignId('candidate_id')
                ->constrained('candidates')
                ->onDelete('cascade');

            // Denormalisasi — untuk audit trail tanpa perlu join ke candidates
            $table->foreignId('admission_wave_id')
                ->constrained('admission_waves')
                ->onDelete('cascade');

            $table->string('candidate_code');

            // order_id kita generate sendiri — format: {candidate_code}-{timestamp}
            // Contoh: CDT-A3X9-26-G2-1743000000
            $table->string('order_id')->unique();

            // snap_token dari Midtrans — dipakai frontend untuk tampilkan UI Snap
            $table->string('snap_token')->nullable();

            // Snapshot nominal saat transaksi dibuat
            $table->decimal('amount', 12, 2);

            // Diisi Midtrans via webhook setelah user memilih metode
            // gopay, bank_transfer, qris, credit_card, dll
            $table->string('payment_method')->nullable();

            $table->enum('status', [
                'pending',   // Transaksi dibuat, menunggu pembayaran
                'paid',      // Pembayaran berhasil
                'failed',    // Pembayaran gagal
                'expired',   // Melewati batas waktu 24 jam
                'cancelled', // Dibatalkan user (ganti metode pembayaran)
            ])->default('pending');

            // transaction_id di sisi Midtrans — dari webhook
            $table->string('midtrans_transaction_id')->nullable();

            $table->timestamp('paid_at')->nullable();
            $table->timestamp('expired_at')->nullable();

            // Raw response Midtrans — untuk audit & debugging
            $table->json('metadata')->nullable();

            $table->timestamps();

            $table->index('candidate_id');
            $table->index('order_id');
            $table->index('status');
            $table->index('candidate_code');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
