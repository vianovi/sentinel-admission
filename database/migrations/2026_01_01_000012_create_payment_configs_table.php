<?php
// =============================================================================
// LOKASI FILE: database/migrations/2026_01_01_000012_create_payment_configs_table.php
// =============================================================================


use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('payment_configs');

        Schema::create('payment_configs', function (Blueprint $table) {
            $table->id();

            // ─── SCOPE ───────────────────────────────────────────────────
            // null = global default, dipakai kalau tidak ada config per wave
            $table->foreignId('admission_wave_id')
                ->nullable()
                ->constrained('admission_waves')
                ->onDelete('cascade');

            // ─── GATEWAY FEE ─────────────────────────────────────────────
            // Fee hanya dikenakan pada channel 'gateway'
            // Transfer dan cash selalu 0 fee
            $table->enum('gateway_fee_type', ['percentage', 'flat'])->default('percentage');

            // percentage: nilai dalam persen (misal 2.5 = 2.5%)
            // flat: nilai dalam rupiah (misal 5000 = Rp 5.000)
            $table->decimal('gateway_fee_value', 8, 2)->default(0);

            // Label yang tampil ke user di halaman pembayaran
            // Contoh: "Biaya layanan gateway (2.5% + PPN)"
            $table->string('gateway_fee_label', 100)->default('Biaya layanan');

            // ─── BANK TRANSFER INFO ──────────────────────────────────────
            // Rekening tujuan transfer manual
            $table->string('bank_name', 50)->nullable();
            $table->string('bank_account_number', 30)->nullable();
            $table->string('bank_account_name', 100)->nullable();

            // Enum key untuk mapping logo bank di frontend
            // Frontend map ke asset: /assets/banks/{bank_logo_key}.svg
            $table->enum('bank_logo_key', [
                'bca', 'bri', 'mandiri', 'bni', 'bsi', 'other',
            ])->nullable();

            // ─── WHATSAPP CONTACT ────────────────────────────────────────
            // Nomor WA tim PSB — format internasional tanpa +
            // Contoh: 6281234567890
            $table->string('whatsapp_contact', 20)->nullable();

            // Label yang tampil ke user
            // Contoh: "Kak Rini - Tim PSB"
            $table->string('whatsapp_contact_label', 80)->nullable();

            // ─── STATUS ──────────────────────────────────────────────────
            $table->boolean('is_active')->default(true);

            // ─── AUDIT TRAIL ─────────────────────────────────────────────
            $table->foreignId('created_by')
                ->constrained('users')
                ->onDelete('cascade');

            $table->foreignId('updated_by')
                ->nullable()
                ->constrained('users')
                ->onDelete('set null');

            $table->timestamps();

            // ─── INDEX ───────────────────────────────────────────────────
            // Query: ambil config aktif untuk wave tertentu
            $table->index(['admission_wave_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_configs');
    }
};