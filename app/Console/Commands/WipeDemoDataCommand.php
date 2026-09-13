<?php

namespace App\Console\Commands;

use App\Services\Demo\TrafficSimulatorService;
use Illuminate\Console\Command;

class WipeDemoDataCommand extends Command
{
    protected $signature = 'demo:wipe
        {--force : Lewati konfirmasi keamanan interaktif}';

    protected $description = 'Menghapus seluruh akun dan data simulasi kandidat (@demo.spmb.com) secara bersih';

    public function handle(TrafficSimulatorService $simulator): int
    {
        $force = (bool) $this->option('force');

        if (! $force && $this->input->isInteractive()) {
            $confirmed = $this->confirm(
                'PERINGATAN: Anda akan menghapus seluruh akun kandidat dan data transaksi simulasi bertanda @demo.spmb.com. Lanjutkan?',
                false
            );

            if (! $confirmed) {
                $this->line('<fg=yellow>Operasi pembersihan data demo dibatalkan.</>');

                return self::SUCCESS;
            }
        }

        $this->components->info('Sedang membersihkan data simulasi demo...');

        $result = $simulator->wipeDemoData();

        $this->table(
            ['Komponen Dihapus', 'Jumlah'],
            [
                ['Akun User (@demo.spmb.com)', $result['deleted_users']],
                ['Data Kandidat (Biodata & Dokumen)', $result['deleted_candidates']],
                ['Data Transaksi Pembayaran Demo', $result['deleted_payments']],
            ]
        );

        $this->components->info('Seluruh data simulasi demo berhasil dibersihkan dari sistem & disk!');

        return self::SUCCESS;
    }
}
