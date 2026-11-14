<?php

namespace App\Services\Exam;

use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PublicSessionTokenService
{
    public function current(int $sessionId): ?object
    {
        return DB::transaction(function () use ($sessionId): ?object {
            $session = DB::table('exam_public_sessions')->where('id', $sessionId)->lockForUpdate()->first();
            if (! $session || $session->status !== 'published' || $session->closes_at <= now()) {
                return null;
            }

            $tokens = DB::table('exam_public_session_tokens')->where('exam_public_session_id', $sessionId);
            $token = (clone $tokens)->latest('id')->lockForUpdate()->first();
            $expiresAt = Carbon::parse($session->opens_at)->max(now())->addMinutes($session->token_rotation_minutes)
                ->min(Carbon::parse($session->closes_at));
            if ($token) {
                (clone $tokens)->where('id', '!=', $token->id)->delete();
            }
            if ($token && strlen($token->token) === 5 && $token->max_uses === null && $token->expires_at && $token->expires_at > now() && $token->expires_at <= $expiresAt) {
                return $token;
            }

            $values = [
                'token' => Str::upper(Str::random(5)), 'expires_at' => $expiresAt,
                'max_uses' => null, 'updated_at' => now(),
            ];
            if ($token) {
                DB::table('exam_public_session_tokens')->where('id', $token->id)->update($values);
                $id = $token->id;
            } else {
                $id = DB::table('exam_public_session_tokens')->insertGetId([
                    ...$values, 'exam_public_session_id' => $sessionId, 'created_at' => now(),
                ]);
            }

            return DB::table('exam_public_session_tokens')->find($id);
        }, 3);
    }
}
