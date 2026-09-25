<?php

namespace App\Console\Commands;

use App\Models\Exam\ExamAttempt;
use App\Services\Exam\ExamAttemptService;
use Illuminate\Console\Command;

class SyncExpiredExamAttempts extends Command
{
    protected $signature = 'exam:sync-expired {--limit=100 : Maximum attempts to process in one batch}';

    protected $description = 'Automatically process and auto-submit candidate attempts whose time limit has expired (ANBK/CBT style)';

    public function __construct(private readonly ExamAttemptService $attemptService)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        $limit = max(1, (int) $this->option('limit'));

        $expiredAttempts = ExamAttempt::query()
            ->where('status', ExamAttempt::STATUS_IN_PROGRESS)
            ->whereNotNull('expires_at')
            ->where('expires_at', '<=', now())
            ->take($limit)
            ->get();

        if ($expiredAttempts->isEmpty()) {
            $this->info('No expired in-progress exam attempts found.');

            return self::SUCCESS;
        }

        $processedCount = 0;

        foreach ($expiredAttempts as $attempt) {
            try {
                $this->attemptService->syncExpired($attempt);
                $this->line("Auto-submitted expired attempt #{$attempt->id} (Candidate/Guest: {$attempt->guest_name})");
                $processedCount++;
            } catch (\Throwable $e) {
                $this->error("Failed to sync attempt #{$attempt->id}: {$e->getMessage()}");
            }
        }

        $this->info("Completed expired exam attempt synchronization. Total processed: {$processedCount}");

        return self::SUCCESS;
    }
}
