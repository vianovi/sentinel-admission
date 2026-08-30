<?php

namespace Database\Seeders;

use App\Models\AdmissionWave;
use App\Models\Candidate;
use App\Models\Guardian;
use App\Models\User;
use Illuminate\Database\Seeder;

class CandidateSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(UserSeeder::class);

        // Ambil gelombang aktif
        $wave = AdmissionWave::where('is_active', true)->first();
        $program = $wave?->programs()->where('is_active', true)->orderBy('priority')->first();

        if (! $wave) {
            $this->command->warn('Tidak ada gelombang aktif. Skip candidate seeder.');

            return;
        }

        // ──────────────────────────────────────────────────────────
        // Kandidat 1 — Silvia Dewi Noviana Putri (submitted)
        //              bisa akses halaman Pembayaran
        // ──────────────────────────────────────────────────────────
        $user1 = User::firstOrCreate(
            ['email' => 'silvia@spmb.com'],
            [
                'name' => 'Silvia Dewi Noviana Putri',
                'password' => Hash::make('password'),
                'role' => 'candidate',
                'whatsapp_number' => '6281234567892',
                'email_verified_at' => now(),
                'is_active' => true,
            ]
        );

        if (! $user1->candidate()->exists()) {
            $candidate1 = Candidate::create([
                'user_id' => $user1->id,
                'admission_wave_id' => $wave->id,
                'candidate_code' => 'CDT-SLV1-26-G2',
                'nisn' => '1234567890',
                'nik' => '3201015505100001',
                'full_name' => 'Silvia Dewi Noviana Putri',
                'gender' => 'P',
                'place_of_birth' => 'Bandung',
                'date_of_birth' => '2010-05-15',
                'religion' => 'Islam',
                'child_order' => 1,
                'siblings_count' => 2,
                'hobbies' => 'Membaca, menulis, coding',
                'ambitions' => 'Menjadi software engineer',
                'habits' => 'Belajar setiap hari',
                'extracurricular_interests' => ['Robotika', 'Desain Grafis'],
                'address_full' => 'Jl. Cihampelas No. 10, Bandung',
                'address_detail' => [
                    'jalan' => 'Jl. Cihampelas No. 10',
                    'rt' => '003',
                    'rw' => '005',
                    'kelurahan' => 'Cipaganti',
                    'kecamatan' => 'Coblong',
                    'kabupaten' => 'Bandung',
                    'provinsi' => 'Jawa Barat',
                ],
                'postal_code' => '40131',
                'school_origin' => 'SMP Negeri 2 Bandung',
                'school_npsn' => '20217314',
                'email' => 'silvia@spmb.com',
                'phone_number' => '081234567892',
                'birth_certificate_number' => 'BC-2010-0001',
                'family_card_number' => '3201015505100001',
                'program_choice' => $program?->name ?? 'Reguler',
                'status' => 'submitted',
            ]);

            Guardian::create([
                'candidate_id' => $candidate1->id,
                'candidate_code' => $candidate1->candidate_code,
                'no_kk' => '3201015505100001',
                'income_type' => 'separate',
                'father_name' => 'Dedi Noviana',
                'father_nik' => '3201015505100002',
                'father_place_of_birth' => 'Bandung',
                'father_date_of_birth' => '1978-04-20',
                'father_job_ktp' => 'PNS',
                'father_job_actual' => 'Guru SMA',
                'father_income_range' => '3_5jt_5jt',
                'father_phone' => '081234567893',
                'mother_name' => 'Lestari Wulandari',
                'mother_nik' => '3201015505100003',
                'mother_place_of_birth' => 'Sumedang',
                'mother_date_of_birth' => '1980-09-12',
                'mother_job_ktp' => 'Ibu Rumah Tangga',
                'mother_job_actual' => 'Ibu Rumah Tangga',
                'mother_income_range' => 'tidak_berpenghasilan',
                'mother_phone' => '081234567894',
            ]);

            $this->command->info('Kandidat 1 dibuat: silvia@spmb.com (submitted) ✅');
        }

        // ──────────────────────────────────────────────────────────
        // Kandidat 2 — Rizky Fadhillah (draft)
        //              tidak bisa akses halaman Pembayaran
        // ──────────────────────────────────────────────────────────
        $user2 = User::firstOrCreate(
            ['email' => 'rizky@spmb.com'],
            [
                'name' => 'Rizky Fadhillah',
                'password' => Hash::make('password'),
                'role' => 'candidate',
                'whatsapp_number' => '6281234567895',
                'email_verified_at' => now(),
                'is_active' => true,
            ]
        );

        if (! $user2->candidate()->exists()) {
            $candidate2 = Candidate::create([
                'user_id' => $user2->id,
                'admission_wave_id' => $wave->id,
                'candidate_code' => 'CDT-RZK1-26-G2',
                'nisn' => '0987654321',
                'nik' => '3201011101090001',
                'full_name' => 'Rizky Fadhillah',
                'gender' => 'L',
                'place_of_birth' => 'Jakarta',
                'date_of_birth' => '2009-11-11',
                'address_full' => 'Jl. Kebon Jeruk No. 5, Jakarta Barat',
                'school_origin' => 'SMP Negeri 3 Jakarta',
                'status' => 'draft',
            ]);

            Guardian::create([
                'candidate_id' => $candidate2->id,
                'candidate_code' => $candidate2->candidate_code,
                'no_kk' => '3201011101090001',
                'income_type' => 'separate',
                'mother_name' => 'Dewi Rahmawati',
                'mother_phone' => '081234567896',
            ]);

            $this->command->info('Kandidat 2 dibuat: rizky@spmb.com (draft) ✅');
        }

        // ──────────────────────────────────────────────────────────
        // Kandidat 3 — Adiguna Erlangga (submitted)
        //              bisa akses halaman Pembayaran
        // ──────────────────────────────────────────────────────────
        $user1 = User::firstOrCreate(
            ['email' => 'erlangga@spmb.com'],
            [
                'name' => 'Adiguna Erlangga',
                'password' => Hash::make('password'),
                'role' => 'candidate',
                'whatsapp_number' => '6281234567892',
                'email_verified_at' => now(),
                'is_active' => true,
            ]
        );

        if (! $user1->candidate()->exists()) {
            $candidate1 = Candidate::create([
                'user_id' => $user1->id,
                'admission_wave_id' => $wave->id,
                'candidate_code' => 'CDT-ERL3-26-G2',
                'nisn' => '1234567897',
                'nik' => '3201015527100001',
                'full_name' => 'Adiguna Erlangga',
                'gender' => 'L',
                'place_of_birth' => 'Bandung',
                'date_of_birth' => '2006-05-27',
                'religion' => 'Islam',
                'child_order' => 1,
                'siblings_count' => 2,
                'hobbies' => 'Membaca, menulis, coding',
                'ambitions' => 'Menjadi software engineer',
                'habits' => 'Belajar setiap hari',
                'extracurricular_interests' => ['Robotika', 'Desain Grafis'],
                'address_full' => 'Jl. Cihampelas No. 10, Bandung',
                'address_detail' => [
                    'jalan' => 'Jl. Cihampelas No. 10',
                    'rt' => '003',
                    'rw' => '005',
                    'kelurahan' => 'Cipaganti',
                    'kecamatan' => 'Coblong',
                    'kabupaten' => 'Bandung',
                    'provinsi' => 'Jawa Barat',
                ],
                'postal_code' => '40131',
                'school_origin' => 'SMP Negeri 2 Bandung',
                'school_npsn' => '20217314',
                'email' => 'erlangga@spmb.com',
                'phone_number' => '081234567892',
                'birth_certificate_number' => 'BC-2010-0001',
                'family_card_number' => '3201015505100001',
                'program_choice' => $program?->name ?? 'Reguler',
                'status' => 'submitted',
            ]);

            Guardian::create([
                'candidate_id' => $candidate1->id,
                'candidate_code' => $candidate1->candidate_code,
                'no_kk' => '3201015505100001',
                'income_type' => 'separate',
                'father_name' => 'Dedi Noviana',
                'father_nik' => '3201015505100002',
                'father_place_of_birth' => 'Bandung',
                'father_date_of_birth' => '1978-04-20',
                'father_job_ktp' => 'PNS',
                'father_job_actual' => 'Guru SMA',
                'father_income_range' => '3_5jt_5jt',
                'father_phone' => '081234567893',
                'mother_name' => 'Lestari Wulandari',
                'mother_nik' => '3201015505100003',
                'mother_place_of_birth' => 'Sumedang',
                'mother_date_of_birth' => '1980-09-12',
                'mother_job_ktp' => 'Ibu Rumah Tangga',
                'mother_job_actual' => 'Ibu Rumah Tangga',
                'mother_income_range' => 'tidak_berpenghasilan',
                'mother_phone' => '081234567894',
            ]);

            $this->command->info('Kandidat 3 dibuat: erlangga@spmb.com (submitted) ✅');
        }
    }
}
