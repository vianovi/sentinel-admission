<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Candidate;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ---------------------------------------------------
        // 0. MASTER DATA (Gelombang dulu sebelum yang lain)
        // ---------------------------------------------------
        $this->call([
            AdmissionWaveSeeder::class,
        ]);

        // ---------------------------------------------------
        // 1. Admin
        // ---------------------------------------------------
        User::create([
            'name'            => 'Admin SPMB',
            'email'           => 'admin@spmb.com',
            'password'        => bcrypt('password'),
            'role'            => 'admin',
            'whatsapp_number' => '6281234567890',
            'is_active'       => true,
        ]);

        // ---------------------------------------------------
        // 2. Staff
        // ---------------------------------------------------
        User::create([
            'name'            => 'Staff Verifikasi',
            'email'           => 'staff@spmb.com',
            'password'        => bcrypt('password'),
            'role'            => 'staff',
            'whatsapp_number' => '6281234567891',
            'is_active'       => true,
        ]);

        // ---------------------------------------------------
        // 3. Akun Silvia (untuk testing & lab hacking)
        // ---------------------------------------------------
        $silvia = User::create([
            'name'            => 'Silvia Hacker',
            'email'           => 'silvia@spmb.com',
            'password'        => bcrypt('password'),
            'role'            => 'candidate',
            'whatsapp_number' => '6289876543210',
            'is_active'       => true,
        ]);

        Candidate::factory()->create([
            'user_id' => $silvia->id,
            'status'  => 'draft',
        ]);

        // ---------------------------------------------------
        // 4. 10 Dummy Candidates (Target Operasi Lab)
        // ---------------------------------------------------
        User::factory(10)->create()->each(function ($user) {
            Candidate::factory()->create(['user_id' => $user->id]);
        });
    }
}