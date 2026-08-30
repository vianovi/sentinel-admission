<?php

// =============================================================================
// LOKASI FILE: database/migrations/2026_01_01_000011_create_payments_table.php
// =============================================================================

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

            // ─── RELASI ───────────────────────────────────────────────────
            $table->foreignId('candidate_id')
                ->constrained('candidates')
                ->onDelete('cascade');

            $table->foreignId('admission_wave_id')
                ->constrained('admission_waves')
                ->onDelete('cascade');

            $table->string('candidate_code');

            // ─── ORDER ID ─────────────────────────────────────────────────
            // Format: {candidate_code}-{timestamp}
            // Contoh: CDT-A3X9-26-G2-1743000000
            $table->string('order_id')->unique();

            // ─── PAYMENT CHANNEL ──────────────────────────────────────────
            // gateway  = Midtrans Snap
            // transfer = Transfer bank manual
            // cash     = Bayar langsung ke sekolah
            $table->enum('payment_channel', ['gateway', 'transfer', 'cash'])
                ->default('gateway');

            // ─── AMOUNT (SNAPSHOT) ────────────────────────────────────────
            // base_amount  = nominal dari admission_waves.registration_fee saat transaksi dibuat
            // fee_amount   = fee gateway (0 kalau transfer/cash)
            // final_amount = yang user bayar = base + fee
            // Semua di-snapshot agar perubahan wave tidak affect transaksi lama
            $table->decimal('base_amount', 12, 2);
            $table->decimal('fee_amount', 12, 2)->default(0);
            $table->decimal('final_amount', 12, 2);

            // ─── GATEWAY SPECIFIC ─────────────────────────────────────────
            // snap_token dari Midtrans — hanya untuk channel gateway
            $table->string('snap_token')->nullable();

            // Diisi Midtrans via webhook setelah user memilih metode
            $table->string('payment_method')->nullable();

            // transaction_id di sisi Midtrans — dari webhook
            $table->string('midtrans_transaction_id')->nullable();

            // Raw response Midtrans — untuk audit & debugging
            $table->json('metadata')->nullable();

            // ─── MAIN STATUS ─────────────────────────────────────────────
            // Status utama transaksi — berlaku untuk semua channel
            $table->enum('status', [
                'pending',   // Transaksi dibuat, menunggu pembayaran
                'paid',      // Pembayaran berhasil (gateway: otomatis, manual: setelah verified)
                'failed',    // Pembayaran gagal (gateway only)
                'expired',   // Melewati batas waktu
                'cancelled', // Dibatalkan
            ])->default('pending');

            // ─── MANUAL STATUS ────────────────────────────────────────────
            // Hanya diisi kalau payment_channel = 'transfer' atau 'cash'
            // NULL kalau channel = 'gateway'
            // waiting_proof  = menunggu user upload bukti
            // proof_uploaded = bukti sudah diupload, menunggu staff verifikasi
            // verified       = staff konfirmasi — trigger status = 'paid'
            // rejected       = bukti ditolak staff, user perlu upload ulang
            $table->enum('manual_status', [
                'waiting_proof',
                'proof_uploaded',
                'verified',
                'rejected',
            ])->nullable();

            // ─── PROOF OF PAYMENT ─────────────────────────────────────────
            // Berlaku untuk channel transfer dan cash
            // Sentinel rules: private storage, UUID rename, signed URL
            $table->string('proof_path', 500)->nullable();
            $table->string('proof_original_filename', 255)->nullable();

            // Timestamp upload bukti — untuk SLA tracking staff
            $table->timestamp('proof_uploaded_at')->nullable();

            // Counter upload ulang — untuk deteksi abuse / spam
            // Increment setiap kali user upload bukti baru
            $table->tinyInteger('proof_attempt')->default(0)->unsigned();

            // ─── TRANSFER DETAIL ─────────────────────────────────────────
            // Info dari user saat pilih channel transfer
            $table->string('bank_name', 50)->nullable();
            $table->string('account_name', 100)->nullable();
            $table->date('transfer_date')->nullable();

            // ─── VERIFICATION ─────────────────────────────────────────────
            // Staff yang memverifikasi bukti pembayaran manual
            $table->foreignId('verified_by')
                ->nullable()
                ->constrained('users')
                ->onDelete('set null');

            $table->timestamp('verified_at')->nullable();

            // Alasan penolakan — wajib diisi staff saat manual_status = 'rejected'
            $table->text('rejection_reason')->nullable();

            // ─── TIMESTAMPS ───────────────────────────────────────────────
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('expired_at')->nullable();
            $table->timestamps();

            // ─── INDEX ────────────────────────────────────────────────────
            $table->index('candidate_id');
            $table->index('candidate_code');
            $table->index('order_id');
            $table->index('status');
            $table->index('payment_channel');
            // Query: staff dashboard — semua bukti yang perlu diverifikasi
            $table->index('manual_status');
            // Query: SLA — bukti yang sudah lama menunggu verifikasi
            $table->index('proof_uploaded_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
