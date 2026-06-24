<?php

namespace App\Console\Commands;

use App\Models\RegistrationDraft;
use Illuminate\Console\Command;

class PruneExpiredDrafts extends Command
{
    protected $signature   = 'drafts:prune';
    protected $description = 'Soft delete expired drafts and permanently delete drafts trashed for over 30 days';

    public function handle(): int
    {
        $softDeleted = RegistrationDraft::query()
            ->whereNotNull('expires_at')
            ->where('expires_at', '<=', now())
            ->delete();

        $forceDeleted = RegistrationDraft::onlyTrashed()
            ->where('deleted_at', '<=', now()->subDays(30))
            ->forceDelete();

        $this->info("Soft deleted {$softDeleted} expired draft(s); permanently deleted {$forceDeleted} old draft(s).");

        return self::SUCCESS;
    }
}
