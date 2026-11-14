import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";

type UseFullscreenEnforcementOptions = {
    isRunning: boolean;
    attemptId: number;
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
 *  - Switching tab / hiding page → 1 violation (via visibilitychange)
 *  - Browser-native permission dialogs and notification popups that steal focus
 *    do NOT count — they trigger visibilitychange to "visible", not "hidden"
 *
 * Double-count prevention:
 *  - A 600ms cooldown lock prevents both the Esc keydown AND the subsequent
 *    fullscreenchange event from each recording a separate violation.
 */
export function useFullscreenEnforcement({
    isRunning,
    attemptId,
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
                void reportViolation("exit_fullscreen");
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
            if (e.key === "Escape" && document.fullscreenElement) {
                void reportViolation("exit_fullscreen");
            }
        };

        // Tab switch / window blur is a clear violation
        const handleVisibilityChange = () => {
            if (document.visibilityState === "hidden") {
                void reportViolation("tab_switch");
            }
        };

        document.addEventListener("fullscreenchange", handleFullscreenChange);
        document.addEventListener("keydown", handleKeyDown);
        document.addEventListener("visibilitychange", handleVisibilityChange);

        const initialFullscreen = Boolean(document.fullscreenElement);
        wasFullscreen.current = initialFullscreen;
        setIsFullscreen(initialFullscreen);

        return () => {
            document.removeEventListener("fullscreenchange", handleFullscreenChange);
            document.removeEventListener("keydown", handleKeyDown);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [isRunning, reportViolation]);

    return { isFullscreen, needsInitialFullscreen, violationsCount, enterFullscreen };
}
