import axios from 'axios';
import { useEffect, useRef } from 'react';

type Options = {
    enabled: boolean;
    routeUrl: string;
    state: string;
    event?: string;
    questionIndex?: number;
};

export function usePublicExamMonitoring({ enabled, routeUrl, state, event, questionIndex }: Options): void {
    const latest = useRef({ state, event, questionIndex });
    latest.current = { state, event, questionIndex };

    useEffect(() => {
        if (!enabled) return;

        const send = (eventName = latest.current.event) => {
            localStorage.setItem(`public-exam-monitoring:${routeUrl}`, JSON.stringify({
                ...latest.current,
                event: eventName,
                recorded_at: new Date().toISOString(),
            }));
            void axios.post(routeUrl, {
                state: latest.current.state,
                event: eventName,
                question_index: latest.current.questionIndex,
            }).catch(() => {});
        };
        const onVisibility = () => send(document.visibilityState === 'hidden' ? 'visibility_hidden' : 'visibility_visible');
        const onFocus = () => send('window_focus');
        const onBlur = () => send('window_blur');
        const onOnline = () => send('connection_online');
        const onOffline = () => send('connection_offline');
        const onFullscreen = () => send(document.fullscreenElement ? 'fullscreen_enter' : 'fullscreen_exit');

        send('monitoring_started');
        const timer = window.setInterval(() => send('heartbeat'), 10000);
        document.addEventListener('visibilitychange', onVisibility);
        document.addEventListener('fullscreenchange', onFullscreen);
        window.addEventListener('focus', onFocus);
        window.addEventListener('blur', onBlur);
        window.addEventListener('online', onOnline);
        window.addEventListener('offline', onOffline);

        return () => {
            window.clearInterval(timer);
            document.removeEventListener('visibilitychange', onVisibility);
            document.removeEventListener('fullscreenchange', onFullscreen);
            window.removeEventListener('focus', onFocus);
            window.removeEventListener('blur', onBlur);
            window.removeEventListener('online', onOnline);
            window.removeEventListener('offline', onOffline);
        };
    }, [enabled, routeUrl]);
}
