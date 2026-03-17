<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Extracurricular;

class ExtracurricularSeeder extends Seeder
{
    public function run(): void
    {
        $defaults = [
            // Organisasi
            'OSIS',
            'Pramuka',
            'PMR (Palang Merah Remaja)',
            'Rohis',
            'Paskibra',

            // Olahraga
            'Futsal',
            'Basket',
            'Voli',
            'Badminton',
            'Renang',
            'Pencak Silat',
            'Taekwondo',

            // Seni & Budaya
            'Seni Musik',
            'Seni Tari',
            'Paduan Suara',
            'Teater',
            'Kaligrafi',

            // Akademik
            'Karya Ilmiah Remaja (KIR)',
            'Olimpiade Matematika',
            'Olimpiade Sains',
            'Debat Bahasa Indonesia',
            'Debat Bahasa Inggris',

            // Keagamaan
            'Tahfidz Al-Qur\'an',
            'Majelis Ta\'lim',

            // Teknologi
            'Robotika',
            'Coding Club',
        ];

        foreach ($defaults as $name) {
            Extracurricular::firstOrCreate(
                ['name' => $name],
                ['is_active' => true]
            );
        }
    }
}
