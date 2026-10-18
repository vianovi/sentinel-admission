<?php

namespace App\Console\Commands;

use App\Services\Trash\TrashManagerService;
use Illuminate\Console\Command;

class PruneSystemTrashCommand extends Command
{
    protected $signature = 'system:prune-trash {--force : Jalankan pembersihan otomatis tanpa konfirmasi}';

    protected $description = 'Bersihkan data sampah sistem (gambar bank media & draft) yang telah melewati retensi 30 hari';

    public function handle(TrashManagerService $trashService): int
    {
        $this->info('Memulai pembersihan data sampah yang melewati masa retensi 30 hari...');

        $purgedCount = $trashService->pruneExpiredTrash();

        if ($purgedCount > 0) {
            $this->info("Berhasil membersihkan {$purgedCount} data sampah kadaluarsa.");
        } else {
            $this->line('Tidak ada data sampah yang melewati batas 30 hari.');
        }

        return self::SUCCESS;
    }
}
