<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tambah kolom is_transfer ke tabel candidates.
     *
     * Diperlukan untuk fitur dokumen kondisional:
     * transfer_letter (Surat Keterangan Pindah) hanya muncul
     * jika kandidat ini berstatus pindahan.
     */
    public function up(): void
    {
        Schema::table('candidates', function (Blueprint $table) {
            $table->boolean('is_transfer')->default(false)->after('major_choice');
            // false = kandidat reguler (default)
            // true  = kandidat pindahan — tampilkan kolom transfer_letter di halaman Dokumen
        });
    }

    public function down(): void
    {
        Schema::table('candidates', function (Blueprint $table) {
            $table->dropColumn('is_transfer');
        });
    }
};
