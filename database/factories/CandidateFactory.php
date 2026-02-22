<?php

namespace Database\Factories;

use App\Models\User;
use App\Models\AdmissionWave;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Candidate>
 */
class CandidateFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id'              => User::factory(),
            'admission_wave_id'    => AdmissionWave::inRandomOrder()->first()?->id,
            'registration_draft_id'=> null,

            // 10 digit angka (NISN)
            'nisn'                 => $this->faker->unique()->numerify('##########'),

            'full_name'            => $this->faker->name(),
            'gender'               => $this->faker->randomElement(['L', 'P']),
            'place_of_birth'       => $this->faker->city(),

            // Umur 10-17 tahun (calon siswa)
            'date_of_birth'        => $this->faker->dateTimeBetween('-17 years', '-10 years')
                                        ->format('Y-m-d'),

            'address'              => $this->faker->address(),
            'school_origin'        => 'SMP ' . $this->faker->company(),
            'program_choice'       => null,
            'phone_number'         => null,

            'status'               => $this->faker->randomElement([
                                        'draft',
                                        'submitted',
                                        'verified',
                                        'accepted',
                                        'rejected',
                                    ]),
        ];
    }
}