<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Gelombang harus dibuat duluan — candidates butuh admission_wave_id
        $this->call([
            AdmissionWaveSeeder::class,
            UserSeeder::class,
            ExtracurricularSeeder::class,
            PaymentConfigSeeder::class,
        ]);
    }
}
