<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        User::firstOrCreate(['email' => 'admin@spmb.com'], [
            'name'              => 'Admin SPMB',
            'password'          => Hash::make('password'),
            'role'              => 'admin',
            'whatsapp_number'   => '6281234567890',
            'email_verified_at' => now(),
            'is_active'         => true,
        ]);

        User::firstOrCreate(['email' => 'staff@spmb.com'], [
            'name'              => 'Staff Verifikasi',
            'password'          => Hash::make('password'),
            'role'              => 'staff',
            'whatsapp_number'   => '6281234567891',
            'email_verified_at' => now(),
            'is_active'         => true,
        ]);
    }
}
