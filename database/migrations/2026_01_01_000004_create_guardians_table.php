<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('guardians');

        Schema::create('guardians', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('candidate_id')->unique();
            $table->string('candidate_code')->unique();

            // ─── SHARED / KELUARGA ────────────────────────────────────────
            $table->string('no_kk', 16)->nullable();
            $table->enum('income_type', ['separate', 'combined'])->default('separate');
            $table->boolean('alamat_shared')->default(true);

            // ─── AYAH ─────────────────────────────────────────────────────
            $table->enum('father_status', ['hidup', 'meninggal', 'tidak_diketahui'])->default('hidup');
            $table->string('father_name')->nullable();
            $table->string('father_nik', 16)->nullable();
            $table->string('father_place_of_birth')->nullable();
            $table->date('father_date_of_birth')->nullable();
            $table->enum('father_education', [
                'tidak_sekolah', 'sd_sederajat', 'smp_sederajat',
                'sma_smk_sederajat', 'd1', 'd2', 'd3', 'd4_s1', 's2', 's3'
            ])->nullable();
            $table->string('father_job_ktp')->nullable();
            $table->string('father_job_actual')->nullable();
            $table->enum('father_income_range', [
                'tidak_berpenghasilan', 'tidak_ingin_memberitahu', 'di_bawah_1jt', '1jt_2_5jt',
                '2_5jt_3_5jt', '3_5jt_5jt', '5jt_10jt', 'di_atas_10jt'
            ])->nullable();
            $table->string('father_phone')->nullable();
            $table->string('father_province')->nullable();
            $table->string('father_city')->nullable();
            $table->string('father_district')->nullable();
            $table->string('father_village')->nullable();
            $table->text('father_address')->nullable();
            $table->string('father_postal_code', 5)->nullable();

            // ─── IBU ──────────────────────────────────────────────────────
            $table->enum('mother_status', ['hidup', 'meninggal', 'tidak_diketahui'])->default('hidup');
            $table->string('mother_name');  // NOT NULL — wajib dari draft
            $table->string('mother_nik', 16)->nullable();
            $table->string('mother_place_of_birth')->nullable();
            $table->date('mother_date_of_birth')->nullable();
            $table->enum('mother_education', [
                'tidak_sekolah', 'sd_sederajat', 'smp_sederajat',
                'sma_smk_sederajat', 'd1', 'd2', 'd3', 'd4_s1', 's2', 's3'
            ])->nullable();
            $table->string('mother_job_ktp')->nullable();
            $table->string('mother_job_actual')->nullable();
            $table->enum('mother_income_range', [
                'tidak_berpenghasilan', 'tidak_ingin_memberitahu', 'di_bawah_1jt', '1jt_2_5jt',
                '2_5jt_3_5jt', '3_5jt_5jt', '5jt_10jt', 'di_atas_10jt'
            ])->nullable();
            $table->string('mother_phone')->nullable();
            $table->string('mother_province')->nullable();
            $table->string('mother_city')->nullable();
            $table->string('mother_district')->nullable();
            $table->string('mother_village')->nullable();
            $table->text('mother_address')->nullable();
            $table->string('mother_postal_code', 5)->nullable();

            // ─── WALI ─────────────────────────────────────────────────────
            $table->enum('guardian_status', ['hidup', 'meninggal', 'tidak_diketahui'])->nullable();
            $table->string('guardian_name')->nullable();
            $table->string('guardian_relation')->nullable();
            $table->string('guardian_nik', 16)->nullable();
            $table->string('guardian_place_of_birth')->nullable();
            $table->date('guardian_date_of_birth')->nullable();
            $table->enum('guardian_education', [
                'tidak_sekolah', 'sd_sederajat', 'smp_sederajat',
                'sma_smk_sederajat', 'd1', 'd2', 'd3', 'd4_s1', 's2', 's3'
            ])->nullable();
            $table->string('guardian_job_ktp')->nullable();
            $table->string('guardian_job_actual')->nullable();
            $table->enum('guardian_income_range', [
                'tidak_berpenghasilan', 'tidak_ingin_memberitahu', 'di_bawah_1jt', '1jt_2_5jt',
                '2_5jt_3_5jt', '3_5jt_5jt', '5jt_10jt', 'di_atas_10jt'
            ])->nullable();
            $table->string('guardian_phone')->nullable();
            $table->string('guardian_province')->nullable();
            $table->string('guardian_city')->nullable();
            $table->string('guardian_district')->nullable();
            $table->string('guardian_village')->nullable();
            $table->text('guardian_address')->nullable();
            $table->string('guardian_postal_code', 5)->nullable();

            // ─── PROFIL KELUARGA ──────────────────────────────────────────
            $table->string('family_email')->nullable(); // wajib @gmail.com
            $table->enum('marital_status', [
                'nikah_tercatat', 'cerai_hidup', 'cerai_mati'
            ])->nullable();
            $table->enum('house_ownership', [
                'milik_sendiri', 'kontrak', 'menumpang', 'rumah_dinas'
            ])->nullable();
            $table->enum('vehicle_ownership', [
                'tidak_ada', 'motor', 'mobil', 'motor_dan_mobil'
            ])->nullable();
            $table->unsignedTinyInteger('family_dependents')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->foreign('candidate_id')->references('id')->on('candidates')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('guardians');
    }
};
