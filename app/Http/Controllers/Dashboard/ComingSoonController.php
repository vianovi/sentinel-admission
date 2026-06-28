<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ComingSoonController extends Controller
{
    private const FEATURES = [
        'candidate.info' => [
            'title' => 'Informasi SPMB',
            'description' => 'Pusat informasi pendaftaran akan dipakai untuk pengumuman dan panduan kandidat.',
            'back_url' => '/dashboard',
            'back_label' => 'Kembali ke Dashboard',
        ],
        'candidate.status' => [
            'title' => 'Status Pendaftaran',
            'description' => 'Status kandidat masih ditampilkan di dashboard utama sampai halaman khususnya siap.',
            'back_url' => '/dashboard',
            'back_label' => 'Kembali ke Dashboard',
        ],
        'staff.selection-status' => [
            'title' => 'Seleksi & Status',
            'description' => 'Workflow keputusan seleksi lanjutan belum diaktifkan sebagai halaman terpisah.',
            'back_url' => '/dashboard/staff',
            'back_label' => 'Kembali ke Dashboard Staff',
        ],
        'staff.reports' => [
            'title' => 'Laporan Umum',
            'description' => 'Rekap operasional umum akan disiapkan setelah kebutuhan laporan final.',
            'back_url' => '/dashboard/staff',
            'back_label' => 'Kembali ke Dashboard Staff',
        ],
        'staff.payment-recap' => [
            'title' => 'Rekap Pembayaran',
            'description' => 'Rekap pembayaran belum menjadi modul laporan penuh. Validasi pembayaran tetap tersedia di detail kandidat.',
            'back_url' => '/dashboard/staff',
            'back_label' => 'Kembali ke Dashboard Staff',
        ],
        'admin.selection-status' => [
            'title' => 'Seleksi & Status',
            'description' => 'Halaman keputusan seleksi admin akan dibuka setelah workflow seleksi dipastikan.',
            'back_url' => '/dashboard/admin',
            'back_label' => 'Kembali ke Dashboard Admin',
        ],
        'admin.reports' => [
            'title' => 'Laporan Umum',
            'description' => 'Laporan admin belum diaktifkan agar tidak menampilkan data rekap yang belum final.',
            'back_url' => '/dashboard/admin',
            'back_label' => 'Kembali ke Dashboard Admin',
        ],
        'admin.payment-recap' => [
            'title' => 'Rekap Pembayaran',
            'description' => 'Rekap pembayaran admin belum menjadi modul laporan penuh. Validasi bukti tetap tersedia di detail kandidat.',
            'back_url' => '/dashboard/admin',
            'back_label' => 'Kembali ke Dashboard Admin',
        ],
        'admin.programs' => [
            'title' => 'Program / Jalur',
            'description' => 'Pengaturan program dan jalur belum tersedia sebagai halaman admin mandiri.',
            'back_url' => '/dashboard/admin',
            'back_label' => 'Kembali ke Dashboard Admin',
        ],
        'admin.settings' => [
            'title' => 'Pengaturan Sistem',
            'description' => 'Pengaturan sistem belum dibuka dari dashboard untuk menjaga konfigurasi tetap terkendali.',
            'back_url' => '/dashboard/admin',
            'back_label' => 'Kembali ke Dashboard Admin',
        ],
    ];

    public function __invoke(Request $request, string $feature): Response
    {
        $meta = self::FEATURES[$feature] ?? [
            'title' => 'Fitur Dashboard',
            'description' => 'Fitur ini belum tersedia untuk digunakan.',
            'back_url' => $this->dashboardUrl($request),
            'back_label' => 'Kembali ke Dashboard',
        ];

        return Inertia::render('Errors/NotFound', [
            'comingSoon' => true,
            'featureName' => $meta['title'],
            'description' => $meta['description'],
            'statusLabel' => 'Dalam Persiapan',
            'backUrl' => $meta['back_url'],
            'backLabel' => $meta['back_label'],
        ]);
    }

    private function dashboardUrl(Request $request): string
    {
        return match ($request->user()?->role) {
            'admin' => '/dashboard/admin',
            'staff' => '/dashboard/staff',
            default => '/dashboard',
        };
    }
}
