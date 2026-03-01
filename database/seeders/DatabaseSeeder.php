<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Gelombang aktif harus dibuat duluan
        // karena candidates dan drafts butuh admission_wave_id
        $this->call([
            AdmissionWaveSeeder::class,
        ]);

        // Admin — akses penuh ke seluruh sistem
        User::create([
            'name'            => 'Admin SPMB',
            'email'           => 'admin@spmb.com',
            'password'        => bcrypt('password'),
            'role'            => 'admin',
            'whatsapp_number' => '6281234567890',
            'is_active'       => true,
        ]);

        // Staff — verifikasi berkas dan pembayaran
        User::create([
            'name'            => 'Staff Verifikasi',
            'email'           => 'staff@spmb.com',
            'password'        => bcrypt('password'),
            'role'            => 'staff',
            'whatsapp_number' => '6281234567891',
            'is_active'       => true,
        ]);

        // Akun candidate untuk testing flow wizard
        // Password: password
        User::create([
            'name'            => 'Test Candidate',
            'email'           => 'candidate@spmb.com',
            'password'        => bcrypt('password'),
            'role'            => 'candidate',
            'whatsapp_number' => '6289876543210',
            'is_active'       => true,
        ]);
    }
}