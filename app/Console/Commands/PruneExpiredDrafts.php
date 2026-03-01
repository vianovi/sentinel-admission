<?php

namespace App\Console\Commands;

use App\Models\RegistrationDraft;
use Illuminate\Console\Command;

class PruneExpiredDrafts extends Command
{
    protected $signature   = 'drafts:prune';
    protected $description = 'Hard delete all registration drafts that have passed their expires_at date';

    public function handle(): int
    {
        // Hanya hapus draft yang:
        // 1. expires_at sudah lewat (tidak null)
        // 2. Belum dikonversi jadi akun (deleted_at null — belum soft-deleted)
        //    ATAU sudah soft-deleted (cleanup draft yang sudah jadi akun juga)
        $count = RegistrationDraft::withTrashed()
            ->whereNotNull('expires_at')
            ->where('expires_at', '<', now())
            ->forceDelete();

        $this->info("Pruned {$count} expired draft(s).");

        return self::SUCCESS;
    }
}
