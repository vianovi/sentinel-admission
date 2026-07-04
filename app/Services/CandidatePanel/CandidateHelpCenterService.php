<?php

namespace App\Services\CandidatePanel;

use App\Models\Candidate;
use App\Models\User;
use App\Services\CandidateStatus\CandidateGateService;

class CandidateHelpCenterService
{
    public function __construct(
        private readonly CandidateGateService $gateService
    ) {}

    public function make(?Candidate $candidate, User $user): array
    {
        $gates = $candidate
            ? $this->gateService->summary($candidate, $user)
            : null;

        return [
            'identity' => [
                'name' => $user->name,
                'email' => $user->email,
                'candidate_code' => $candidate?->candidate_code,
                'status' => $candidate?->status,
            ],
            'primary_help' => $this->primaryHelp($candidate, $gates),
            'channels' => [
                [
                    'key' => 'dashboard',
                    'label' => 'Cek pusat status',
                    'description' => 'Lihat status pendaftaran, checklist, catatan panitia, dan aksi berikutnya dari satu halaman.',
                    'icon' => 'fa-solid fa-list-check',
                    'href' => route('dashboard.status-pendaftaran'),
                    'tone' => 'gold',
                ],
                [
                    'key' => 'profile',
                    'label' => 'Periksa profil akun',
                    'description' => 'Gunakan halaman profil untuk avatar, email, dan informasi akun yang terkait login.',
                    'icon' => 'fa-solid fa-circle-user',
                    'href' => route('dashboard.profile'),
                    'tone' => 'slate',
                ],
                [
                    'key' => 'calendar',
                    'label' => 'Lihat kalender SPMB',
                    'description' => 'Pantau jadwal penting, deadline, pembayaran, seleksi, dan agenda pribadi.',
                    'icon' => 'fa-solid fa-calendar-days',
                    'href' => route('dashboard.calendar'),
                    'tone' => 'blue',
                ],
            ],
            'topics' => [
                [
                    'key' => 'registration',
                    'title' => 'Data pendaftaran',
                    'description' => 'Pastikan Data Diri, Data Wali, dan Data Kesehatan sudah lengkap sebelum masuk tahap verifikasi.',
                    'links' => [
                        ['label' => 'Data Diri', 'href' => route('dashboard.data-diri')],
                        ['label' => 'Data Wali', 'href' => route('dashboard.data-wali')],
                        ['label' => 'Data Kesehatan', 'href' => route('dashboard.data-kesehatan')],
                    ],
                ],
                [
                    'key' => 'documents-payment',
                    'title' => 'Berkas dan pembayaran',
                    'description' => 'Dokumen dan pembayaran dibuka setelah data utama memenuhi syarat dan akun sudah siap.',
                    'links' => [
                        ['label' => 'Dokumen', 'href' => route('dashboard.data-dokumen.index')],
                        ['label' => 'Pembayaran', 'href' => route('dashboard.pembayaran')],
                        ['label' => 'Riwayat Pembayaran', 'href' => route('dashboard.payment-history')],
                    ],
                ],
                [
                    'key' => 'selection',
                    'title' => 'Seleksi',
                    'description' => 'Akses seleksi mengikuti status verifikasi kandidat dan jadwal sesi yang diberikan panitia.',
                    'links' => [
                        ['label' => 'Ujian Seleksi', 'href' => route('dashboard.exam.index')],
                        ['label' => 'Status Seleksi', 'href' => route('dashboard.selection-status')],
                        ['label' => 'Hasil Seleksi', 'href' => route('dashboard.selection-result')],
                    ],
                ],
            ],
            'faqs' => $this->faqs($gates),
        ];
    }

    private function primaryHelp(?Candidate $candidate, ?array $gates): array
    {
        if (! $candidate) {
            return [
                'title' => 'Data kandidat belum tersedia',
                'description' => 'Akun ini belum terhubung ke data kandidat. Mulai dari halaman utama atau hubungi panitia jika pendaftaran sudah pernah dibuat.',
                'href' => route('home'),
                'label' => 'Ke Halaman Utama',
                'icon' => 'fa-solid fa-house',
            ];
        }

        $next = $gates['next_action'] ?? null;

        return [
            'title' => $next['label'] ?? 'Pantau status pendaftaran',
            'description' => 'Sistem membaca status pendaftaranmu dari data backend. Mulai dari aksi yang paling relevan untuk akun ini.',
            'href' => $next['href'] ?? route('dashboard.status-pendaftaran'),
            'label' => 'Buka Aksi',
            'icon' => 'fa-solid fa-arrow-right',
        ];
    }

    private function faqs(?array $gates): array
    {
        return [
            [
                'question' => 'Kenapa dokumen atau pembayaran masih terkunci?',
                'answer' => $gates
                    ? ($gates['documents']['reason'] ?? $gates['payment']['reason'] ?? 'Lengkapi data utama dan verifikasi email terlebih dahulu jika diminta sistem.')
                    : 'Data kandidat belum tersedia untuk membaca status kunci fitur.',
            ],
            [
                'question' => 'Di mana melihat alasan dokumen atau pembayaran ditolak?',
                'answer' => 'Buka Status Pendaftaran, Dokumen, atau Pembayaran. Alasan yang aman untuk kandidat akan tampil pada halaman terkait.',
            ],
            [
                'question' => 'Kapan hasil seleksi tampil?',
                'answer' => 'Hasil seleksi mengikuti pengaturan sesi ujian dari panitia. Jika hasil belum dibuka, halaman hasil hanya menampilkan status menunggu.',
            ],
            [
                'question' => 'Apakah status diterima/ditolak otomatis dari nilai ujian?',
                'answer' => 'Tidak. Status accepted atau rejected tetap keputusan final manual dari panitia.',
            ],
        ];
    }
}
