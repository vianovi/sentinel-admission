<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\AdmissionWave;
use App\Models\AdmissionProgram;
use Carbon\Carbon;

class AdmissionWaveSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        AdmissionWave::query()->update(['is_active' => false]);

        // ======================================================
        // 1. GELOMBANG 1 (SUDAH TUTUP / NON-AKTIF)
        // ======================================================
        $wave1Close = $now->copy()->subMonth();

        $wave1 = AdmissionWave::updateOrCreate(
            [
                'title'         => 'Gelombang 1',
                'academic_year' => '2026/2027',
            ],
            [
                'description'         => 'Pendaftaran tahap pertama untuk tahun ajaran baru.',
                'start_date'          => $now->copy()->subMonths(3)->toDateString(),
                'end_date'            => $wave1Close->toDateString(),
                'exam_info'           => 'Ujian dilaksanakan setiap Sabtu, pengumuman setiap Senin berikutnya.',
                'announcement_info'   => 'Pengumuman hasil seleksi via WhatsApp & website resmi.',
                'reregistration_date' => $wave1Close->copy()->addDays(9)->toDateString(),
                'registration_fee'    => 250000,
                'quota_target'        => 50,
                'available_majors'    => [],
                'majors_enabled'      => false,
                'is_active'           => false,
            ]
        );

        $this->seedPrograms($wave1, [
            ['name' => 'Tahfidz',  'priority' => 1, 'quota_ideal' => 20, 'quota_max' => 25, 'is_open_quota' => false],
            ['name' => 'Reguler',  'priority' => 99, 'quota_ideal' => 0,  'quota_max' => 0,  'is_open_quota' => true],
        ]);

        // ======================================================
        // 2. GELOMBANG 2 (SEDANG BUKA / AKTIF)
        // ======================================================
        $wave2Close = $now->copy()->addMonths(2);

        $wave2 = AdmissionWave::updateOrCreate(
            [
                'title'         => 'Gelombang 2',
                'academic_year' => '2026/2027',
            ],
            [
                'description'         => 'Pendaftaran tahap kedua jalur reguler.',
                'start_date'          => $now->toDateString(),
                'end_date'            => $wave2Close->toDateString(),
                'exam_info'           => 'Ujian setiap Sabtu, hasil diumumkan Senin berikutnya.',
                'announcement_info'   => 'Pengumuman bertahap setiap Senin via WhatsApp & website.',
                'reregistration_date' => $wave2Close->copy()->addDays(9)->toDateString(),
                'registration_fee'    => 300000,
                'quota_target'        => 70,
                'available_majors'    => [],
                'majors_enabled'      => false,
                'is_active'           => true,
            ]
        );

        $this->seedPrograms($wave2, [
            ['name' => 'Tahfidz',  'priority' => 1,  'quota_ideal' => 30, 'quota_max' => 40, 'is_open_quota' => false],
            ['name' => 'Unggulan', 'priority' => 2,  'quota_ideal' => 20, 'quota_max' => 25, 'is_open_quota' => false],
            ['name' => 'Reguler',  'priority' => 99, 'quota_ideal' => 0,  'quota_max' => 0,  'is_open_quota' => true],
        ]);

        // ======================================================
        // 3. GELOMBANG 3 (BELUM DIBUKA / UPCOMING)
        // ======================================================
        $wave3Open  = $now->copy()->addMonths(3);
        $wave3Close = $now->copy()->addMonths(5);

        $wave3 = AdmissionWave::updateOrCreate(
            [
                'title'         => 'Gelombang 3',
                'academic_year' => '2026/2027',
            ],
            [
                'description'         => 'Pendaftaran tahap ketiga, kuota terbatas.',
                'start_date'          => $wave3Open->toDateString(),
                'end_date'            => $wave3Close->toDateString(),
                'exam_info'           => null,
                'announcement_info'   => null,
                'reregistration_date' => null,
                'registration_fee'    => 350000,
                'quota_target'        => 30,
                'available_majors'    => [],
                'majors_enabled'      => false,
                'is_active'           => false,
            ]
        );

        $this->seedPrograms($wave3, [
            ['name' => 'Tahfidz',  'priority' => 1,  'quota_ideal' => 15, 'quota_max' => 20, 'is_open_quota' => false],
            ['name' => 'Unggulan', 'priority' => 2,  'quota_ideal' => 10, 'quota_max' => 12, 'is_open_quota' => false],
            ['name' => 'Reguler',  'priority' => 99, 'quota_ideal' => 0,  'quota_max' => 0,  'is_open_quota' => true],
        ]);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Helper — seed programs untuk satu gelombang
    // Hapus programs lama dulu biar tidak duplikat saat re-seed
    // ──────────────────────────────────────────────────────────────────────────
    private function seedPrograms(AdmissionWave $wave, array $programs): void
    {
        AdmissionProgram::where('admission_wave_id', $wave->id)->delete();

        foreach ($programs as $program) {
            AdmissionProgram::create([
                'admission_wave_id' => $wave->id,
                'name'              => $program['name'],
                'priority'          => $program['priority'],
                'quota_ideal'       => $program['quota_ideal'],
                'quota_max'         => $program['quota_max'],
                'is_open_quota'     => $program['is_open_quota'],
                'description'       => null,
                'is_active'         => true,
            ]);
        }
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