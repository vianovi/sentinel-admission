<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('health_records', function (Blueprint $table) {
            $table->id();

            $table->foreignId('candidate_id')
                ->constrained()
                ->onDelete('cascade');

            // Denormalisasi candidate_code untuk kemudahan query lintas tabel
            $table->string('candidate_code')->nullable()->index();

            // =========================
            // TAB FISIK
            // =========================

            // Golongan darah: A, B, AB, O, unknown (belum pernah tes)
            $table->enum('blood_type', ['A', 'B', 'AB', 'O', 'unknown'])->nullable();

            // Rhesus: positive (+), negative (-), unknown (belum pernah tes)
            $table->enum('rhesus', ['positive', 'negative', 'unknown'])->nullable();

            $table->unsignedSmallInteger('height_cm')->nullable(); // Tinggi badan (cm)
            $table->unsignedSmallInteger('weight_kg')->nullable(); // Berat badan (kg)
            // BMI tidak disimpan → dihitung via accessor di Model

            // Kondisi kesehatan umum (fisik + pola hidup)
            $table->text('general_health_condition')->nullable();

            // Kondisi mental yang dapat mempengaruhi kesehatan
            // unknown = "Tidak ada catatan"
            $table->text('mental_health_notes')->nullable();

            // Kondisi mata — kanan & kiri terpisah
            // Tipe: normal, minus, plus, silinder, unknown (tidak tahu)
            $table->enum('eye_right_type', ['normal', 'minus', 'plus', 'silinder', 'unknown'])->nullable();
            $table->decimal('eye_right_value', 4, 2)->nullable(); // misal: -2.50, +1.25
            $table->enum('eye_left_type', ['normal', 'minus', 'plus', 'silinder', 'unknown'])->nullable();
            $table->decimal('eye_left_value', 4, 2)->nullable();
            $table->year('eye_condition_since')->nullable(); // sejak tahun berapa (kondisi mata)

            // =========================
            // TAB RIWAYAT KESEHATAN
            // =========================

            // Riwayat penyakit berat — wajib diisi, boleh "Tidak Ada / Tidak Tahu"
            $table->text('major_illnesses')->nullable();

            // Sakit terakhir yang dialami — wajib diisi
            $table->text('last_illness')->nullable();

            // Alergi dipecah menjadi 3 field — wajib diisi, boleh "Tidak Ada / Tidak Tahu"
            $table->text('allergy_food')->nullable();      // Alergi makanan
            $table->text('allergy_medicine')->nullable();  // Alergi obat
            $table->text('allergy_condition')->nullable(); // Alergi kondisi (debu, dingin, dll)

            // Disabilitas fisik / kebutuhan khusus — wajib diisi, boleh "Tidak Ada"
            $table->text('physical_disabilities')->nullable();

            // Dokumen hasil lab / CT Scan / USG (opsional murni)
            $table->string('chronic_disease_doc_path')->nullable();

            // =========================
            // TAB CATATAN KHUSUS
            // =========================

            // Catatan umum dari orang tua untuk tim kesehatan (opsional)
            $table->text('special_notes')->nullable();

            // Keluhan terkini dari orang tua — kondisi 1-3 bulan terakhir (opsional)
            $table->text('parent_concern_notes')->nullable();

            // Dokumen kesehatan — upload (semua opsional, BPJS wajib direspons via frontend)
            $table->string('surat_sehat_path')->nullable();   // Surat Keterangan Sehat
            $table->string('bpjs_card_path')->nullable();     // Kartu BPJS / JKN
            $table->string('vaccine_card_path')->nullable();  // Kartu Vaksin / Imunisasi

            $table->timestamps();

            // =========================
            // INDEX
            // =========================
            $table->unique('candidate_id'); // 1 kandidat hanya punya 1 health record
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('health_records');
    }
};
