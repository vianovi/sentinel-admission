import { useCallback, useEffect, useRef, useState } from "react";
import type { ExamAttemptState } from "@/types/exam";

type UseExamTimerOptions = {
    attempt: ExamAttemptState;
    isRunning: boolean;
    onExpired: () => void;
    syncIntervalMs?: number;
    onSync?: () => Promise<void>;
};

type UseExamTimerReturn = {
    remaining: number;
    setRemaining: (seconds: number) => void;
    syncFromAttempt: (attempt: ExamAttemptState) => void;
};

/**
 * Manages exam countdown timer using client device clock.
 * Calculates remaining time from `expires_at_iso` vs `Date.now()` to stay
 * accurate regardless of Cloudflare Tunnel server timezone.
 */
export function useExamTimer({
    attempt,
    isRunning,
    onExpired,
    syncIntervalMs = 20000,
    onSync,
}: UseExamTimerOptions): UseExamTimerReturn {
    const [remaining, setRemaining] = useState(() =>
        calcClientRemaining(attempt.expires_at_iso, attempt.remaining_seconds),
    );
    const expiredTriggered = useRef(false);

    const syncFromAttempt = useCallback((updated: ExamAttemptState) => {
        setRemaining(calcClientRemaining(updated.expires_at_iso, updated.remaining_seconds));
    }, []);

    // Sync remaining on prop change
    useEffect(() => {
        syncFromAttempt(attempt);
    }, [attempt, syncFromAttempt]);

    // Countdown tick — driven by device clock
    useEffect(() => {
        if (!isRunning) return;

        const timer = window.setInterval(() => {
            setRemaining((prev) => {
                const current = calcClientRemaining(attempt.expires_at_iso, prev > 0 ? prev - 1 : 0);
                if (current <= 0 && !expiredTriggered.current) {
                    expiredTriggered.current = true;
                    onExpired();
                }
                return current;
            });
        }, 1000);

        return () => window.clearInterval(timer);
    }, [isRunning, attempt.expires_at_iso, onExpired]);

    // Periodic server sync
    useEffect(() => {
        if (!isRunning || !onSync) return;

        const timer = window.setInterval(() => {
            void onSync();
        }, syncIntervalMs);

        return () => window.clearInterval(timer);
    }, [isRunning, onSync, syncIntervalMs]);

    return { remaining, setRemaining, syncFromAttempt };
}

function calcClientRemaining(expiresIso: string | null, fallbackSec: number): number {
    if (!expiresIso) return fallbackSec;
    const expiresMs = new Date(expiresIso).getTime();
    if (isNaN(expiresMs)) return fallbackSec;
    return Math.max(0, Math.floor((expiresMs - Date.now()) / 1000));
}
