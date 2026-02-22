<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\AdmissionWave;
use Carbon\Carbon;

class AdmissionWaveSeeder extends Seeder
{
    public function run(): void
    {
        /**
         * Pakai waktu sekarang sebagai acuan utama,
         * supaya seeder ini selalu relevan kapan pun dijalankan.
         */
        $now = Carbon::now();

        /**
         * Pastikan tidak ada lebih dari satu gelombang aktif
         * sebelum insert data baru.
         *
         * Ini penting supaya:
         * - Hero section tidak bingung
         * - Logic pendaftaran tetap konsisten
         */
        AdmissionWave::query()->update(['is_active' => false]);

        // ======================================================
        // 1. GELOMBANG 1 (SUDAH TUTUP / NON-AKTIF)
        // ======================================================
        /**
         * Cerita bisnis:
         * - Dibuka 3 bulan lalu, ditutup 1 bulan lalu
         * - Kuota sudah terpenuhi (cek via candidates->count())
         */
        $wave1Close = $now->copy()->subMonth();

        AdmissionWave::updateOrCreate(
            [
                'title'         => 'Gelombang 1',
                'academic_year' => '2026/2027',
            ],
            [
                'description'          => 'Pendaftaran tahap pertama untuk tahun ajaran baru.',
                'start_date'           => $now->copy()->subMonths(3)->toDateString(),
                'end_date'             => $wave1Close->toDateString(),
                'exam_info'            => 'Ujian dilaksanakan setiap Sabtu, pengumuman setiap Senin berikutnya.',
                'announcement_info'    => 'Pengumuman hasil seleksi via WhatsApp & website resmi.',
                'reregistration_date'  => $wave1Close->copy()->addDays(9)->toDateString(),
                'registration_fee'     => 250000,
                'quota_target'         => 50,
                'is_active'            => false, // WAJIB FALSE — historical data
            ]
        );

        // ======================================================
        // 2. GELOMBANG 2 (SEDANG BUKA / AKTIF)
        // ======================================================
        /**
         * Cerita bisnis:
         * - Aktif sekarang, tutup 2 bulan ke depan
         * - Kuota masih tersedia
         */
        $wave2Close = $now->copy()->addMonths(2);

        AdmissionWave::updateOrCreate(
            [
                'title'         => 'Gelombang 2',
                'academic_year' => '2026/2027',
            ],
            [
                'description'          => 'Pendaftaran tahap kedua jalur reguler.',
                'start_date'           => $now->toDateString(),
                'end_date'             => $wave2Close->toDateString(),
                'exam_info'            => 'Ujian setiap Sabtu, hasil diumumkan Senin berikutnya.',
                'announcement_info'    => 'Pengumuman bertahap setiap Senin via WhatsApp & website.',
                'reregistration_date'  => $wave2Close->copy()->addDays(9)->toDateString(),
                'registration_fee'     => 300000,
                'quota_target'         => 70,
                'is_active'            => true, // INI YANG TERBACA SISTEM
            ]
        );

        // ======================================================
        // 3. GELOMBANG 3 (BELUM DIBUKA / UPCOMING)
        // ======================================================
        /**
         * Cerita bisnis:
         * - Belum dibuka, buka 3 bulan ke depan
         * - Untuk preview di landing page
         */
        $wave3Open  = $now->copy()->addMonths(3);
        $wave3Close = $now->copy()->addMonths(5);

        AdmissionWave::updateOrCreate(
            [
                'title'         => 'Gelombang 3',
                'academic_year' => '2026/2027',
            ],
            [
                'description'          => 'Pendaftaran tahap ketiga, kuota terbatas.',
                'start_date'           => $wave3Open->toDateString(),
                'end_date'             => $wave3Close->toDateString(),
                'exam_info'            => null,
                'announcement_info'    => null,
                'reregistration_date'  => null,
                'registration_fee'     => 350000,
                'quota_target'         => 30,
                'is_active'            => false, // Belum dibuka
            ]
        );
    }
}

/**
 * --- COMMAND TERMINAL ---
 *
 * Reset total & isi ulang semua data:
 * php artisan migrate:fresh --seed
 *
 * Jalankan seeder ini saja:
 * php artisan db:seed --class=AdmissionWaveSeeder
 */