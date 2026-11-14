<?php

namespace App\Console\Commands;

use App\Services\Exam\PublicSessionTokenService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class RotatePublicExamTokens extends Command
{
    protected $signature = 'exam:rotate-public-tokens';

    protected $description = 'Rotate due room tokens for published public exam sessions';

    public function handle(PublicSessionTokenService $tokens): int
    {
        DB::table('exam_public_sessions')->where('status', 'published')->where('closes_at', '>', now())
            ->select('id')->chunkById(100, function ($sessions) use ($tokens): void {
                foreach ($sessions as $session) {
                    $tokens->current($session->id);
                }
            });

        return self::SUCCESS;
    }
}
