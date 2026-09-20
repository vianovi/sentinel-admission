<?php

namespace App\Console\Commands;

use App\Models\Exam\ExamSession;
use App\Models\Exam\ExamSessionToken;
use App\Services\Exam\ExamAuditLogger;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

class RotateExamTokens extends Command
{
    protected $signature = 'exam:rotate-tokens 
                            {--session= : ID of specific exam session to rotate} 
                            {--force : Force rotation regardless of current token age}
                            {--interval=15 : Rotation interval in minutes}';

    protected $description = 'Automatically rotate dynamic room tokens for published public exam sessions (ANBK/CBT style)';

    public function __construct(private readonly ExamAuditLogger $audit)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        $sessionId = $this->option('session');
        $force = (bool) $this->option('force');
        $intervalMinutes = max(1, (int) $this->option('interval'));

        $query = ExamSession::query()
            ->where('is_public', true)
            ->where('status', ExamSession::STATUS_PUBLISHED);

        if ($sessionId) {
            $query->where('id', $sessionId);
        }

        $sessions = $query->get();

        if ($sessions->isEmpty()) {
            $this->info('No active published public exam sessions found.');
            return self::SUCCESS;
        }

        $rotatedCount = 0;

        foreach ($sessions as $session) {
            if (! $session->isOpenForStart()) {
                continue;
            }

            /** @var ExamSessionToken|null $latestToken */
            $latestToken = $session->publicTokens()
                ->latest()
                ->first();

            $needsRotation = false;

            if (! $latestToken) {
                $needsRotation = true;
            } elseif ($force || $latestToken->isExpired() || $latestToken->isExhausted()) {
                $needsRotation = true;
            } elseif ($latestToken->created_at && $latestToken->created_at->diffInMinutes(now()) >= $intervalMinutes) {
                $needsRotation = true;
            }

            if (! $needsRotation) {
                $this->line("Session #{$session->id} [{$session->title}] token is still fresh ({$latestToken?->token}).");
                continue;
            }

            if ($latestToken && ! $latestToken->isExpired()) {
                $latestToken->update(['expires_at' => now()]);
            }

            $newTokenString = Str::upper(Str::random(6));

            $newToken = ExamSessionToken::create([
                'exam_session_id' => $session->id,
                'token' => $newTokenString,
                'label' => 'Token Otomatis Proktor (' . now()->format('H:i') . ')',
                'type' => ExamSessionToken::TYPE_MULTI_USE,
                'max_uses' => 0,
                'expires_at' => $session->closes_at,
                'created_by' => null,
            ]);

            $this->audit->log('proctor_token_auto_rotated', [
                'exam_session_id' => $session->id,
                'old_token' => $latestToken?->token,
                'new_token' => $newToken->token,
                'trigger' => $force ? 'forced_cli' : 'scheduled_cron',
            ]);

            $this->info("Rotated Token for Session #{$session->id} [{$session->title}]: " . ($latestToken ? $latestToken->token : 'NONE') . " -> {$newToken->token}");
            $rotatedCount++;
        }

        $this->info("Completed token rotation task. Total rotated: {$rotatedCount}");

        return self::SUCCESS;
    }
}
