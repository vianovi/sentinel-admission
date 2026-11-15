import axios from 'axios';
import { useCallback, useEffect, useRef, useState } from 'react';

type UseFullscreenEnforcementOptions = {
    isRunning: boolean;
    violationRoute: string;
    initialViolations?: number;
};

type UseFullscreenEnforcementReturn = {
    /** True when document is currently in fullscreen mode */
    isFullscreen: boolean;
    /** True only on first load before user has ever clicked "enter fullscreen" */
    needsInitialFullscreen: boolean;
    violationsCount: number;
    enterFullscreen: () => void;
};

/**
 * Manages fullscreen enforcement and violation tracking for exams.
 *
 * Violation rules:
 *  - Pressing Esc to exit fullscreen → 1 violation (via keydown listener)
 *  - Switching tab / changing application → 1 violation (via visibilitychange
 *    with a window blur fallback)
 *  - Browser-native permission dialogs and notification popups that steal focus
 *    do NOT count — they trigger visibilitychange to "visible", not "hidden"
 *
 * Double-count prevention:
 *  - A 600ms cooldown lock prevents both the Esc keydown AND the subsequent
 *    fullscreenchange event from each recording a separate violation.
 */
export function useFullscreenEnforcement({
    isRunning,
    violationRoute,
    initialViolations = 0,
}: UseFullscreenEnforcementOptions): UseFullscreenEnforcementReturn {
    const [isFullscreen, setIsFullscreen] = useState(false);
    // True only on very first render — user has not yet pressed "enter fullscreen"
    const [needsInitialFullscreen, setNeedsInitialFullscreen] = useState(true);
    const [violationsCount, setViolationsCount] = useState(initialViolations);

    // Cooldown ref: prevents double-counting when Esc fires both keydown + fullscreenchange
    const violationCooldown = useRef(false);
    const wasFullscreen = useRef(false);
    const fullscreenCheckTimeout = useRef<number | null>(null);

    const enterFullscreen = useCallback(() => {
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch(() => {});
        }
        // Once user has interacted, we no longer need the "initial" overlay
        setNeedsInitialFullscreen(false);
    }, []);

    const reportViolation = useCallback(
        async (type: string) => {
            if (violationCooldown.current) return;

            // Lock for 600ms to absorb the paired fullscreenchange that follows an Esc keydown
            violationCooldown.current = true;
            window.setTimeout(() => {
                violationCooldown.current = false;
            }, 600);

            setViolationsCount((count) => count + 1);
            try {
                await axios.post(violationRoute, { type });
            } catch {
                // silent fail — violation still counted client-side
            }
        },
        [violationRoute],
    );

    useEffect(() => {
        if (!isRunning) return;

        // Sync fullscreen state without recording a violation
        const handleFullscreenChange = () => {
            const isFS = Boolean(document.fullscreenElement);
            if (wasFullscreen.current && !isFS) {
                void reportViolation('exit_fullscreen');
            }
            wasFullscreen.current = isFS;
            setIsFullscreen(isFS);
            // If user re-enters fullscreen after a violation, mark initial prompt as dismissed
            if (isFS) {
                setNeedsInitialFullscreen(false);
            }
        };

        // Only record violation when user presses Esc (intentional exit)
        // The fullscreenchange that fires right after is suppressed by the cooldown
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'F11') {
                // Browser fullscreen is not exposed through document.fullscreenElement.
                // Check after the browser handles F11 so the warning clears on re-entry.
                fullscreenCheckTimeout.current = window.setTimeout(() => {
                    const browserFullscreen =
                        window.innerHeight >= window.screen.height - 1;

                    if (browserFullscreen) {
                        wasFullscreen.current = true;
                        setIsFullscreen(true);
                        setNeedsInitialFullscreen(false);
                    }
                }, 0);

                return;
            }

            if (e.key === 'Escape' && document.fullscreenElement) {
                void reportViolation('exit_fullscreen');
            }
        };

        // Tab switch / window blur is a clear violation
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                void reportViolation('tab_switch');
            }
        };

        const handleWindowBlur = () => {
            window.setTimeout(() => {
                if (
                    document.visibilityState === 'visible' &&
                    !document.hasFocus()
                ) {
                    void reportViolation('tab_switch');
                }
            }, 0);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleWindowBlur);

        const initialFullscreen = Boolean(document.fullscreenElement);
        wasFullscreen.current = initialFullscreen;
        setIsFullscreen(initialFullscreen);

        return () => {
            document.removeEventListener(
                'fullscreenchange',
                handleFullscreenChange,
            );
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener(
                'visibilitychange',
                handleVisibilityChange,
            );
            window.removeEventListener('blur', handleWindowBlur);
            if (fullscreenCheckTimeout.current !== null) {
                window.clearTimeout(fullscreenCheckTimeout.current);
            }
        };
    }, [isRunning, reportViolation]);

    return {
        isFullscreen,
        needsInitialFullscreen,
        violationsCount,
        enterFullscreen,
    };
}
