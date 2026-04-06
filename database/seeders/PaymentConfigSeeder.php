<?php

// =============================================================================
// LOKASI FILE: database/seeders/PaymentConfigSeeder.php
// =============================================================================

namespace Database\Seeders;

use App\Models\PaymentConfig;
use App\Models\User;
use Illuminate\Database\Seeder;

class PaymentConfigSeeder extends Seeder
{
    public function run(): void
    {
        // Ambil admin sebagai created_by
        $admin = User::where('role', 'admin')->first();

        PaymentConfig::create([
            'admission_wave_id'      => null, // global default — berlaku untuk semua gelombang
            'gateway_fee_type'       => 'percentage',
            'gateway_fee_value'      => 2.5,
            'gateway_fee_label'      => 'Biaya layanan gateway (2.5%)',
            'bank_name'              => 'Bank Syariah Indonesia',
            'bank_account_number'    => '7890123456',
            'bank_account_name'      => 'Yayasan Al-Muntaha',
            'bank_logo_key'          => 'bsi',
            'whatsapp_contact'       => '6282211223344', // Bendahara SPMB
            'whatsapp_contact_label' => 'Bendahara SPMB',
            'is_active'              => true,
            'created_by'             => $admin?->id ?? 1,
            'updated_by'             => null,
        ]);
    }
}
