import { useCallback, useEffect, useState } from "react";
import axios from "axios";

type UseFullscreenEnforcementOptions = {
    isRunning: boolean;
    attemptId: number;
    violationRoute: string;
    initialViolations?: number;
};

type UseFullscreenEnforcementReturn = {
    isFullscreen: boolean;
    violationsCount: number;
    enterFullscreen: () => void;
};

/**
 * Manages fullscreen enforcement and violation tracking for exams.
 * Tracks both fullscreen exits and tab switches, reporting them to the server.
 */
export function useFullscreenEnforcement({
    isRunning,
    attemptId,
    violationRoute,
    initialViolations = 0,
}: UseFullscreenEnforcementOptions): UseFullscreenEnforcementReturn {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [violationsCount, setViolationsCount] = useState(initialViolations);

    const enterFullscreen = useCallback(() => {
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch(() => {});
        }
    }, []);

    const reportViolation = useCallback(
        async (type: string) => {
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

        const handleFullscreenChange = () => {
            const isFS = Boolean(document.fullscreenElement);
            setIsFullscreen(isFS);

            if (!isFS) {
                void reportViolation("exit_fullscreen");
            }
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === "hidden") {
                void reportViolation("tab_switch");
            }
        };

        document.addEventListener("fullscreenchange", handleFullscreenChange);
        document.addEventListener("visibilitychange", handleVisibilityChange);

        setIsFullscreen(Boolean(document.fullscreenElement));

        return () => {
            document.removeEventListener("fullscreenchange", handleFullscreenChange);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [isRunning, reportViolation]);

    return { isFullscreen, violationsCount, enterFullscreen };
}
