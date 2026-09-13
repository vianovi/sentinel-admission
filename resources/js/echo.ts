import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

(window as any).Pusher = Pusher;

const reverbKey = import.meta.env.VITE_REVERB_APP_KEY || 'izrzek6ll7undw2aihtx';

const isBrowser = typeof window !== 'undefined';
const isHttps = isBrowser && window.location.protocol === 'https:';
const hostname = isBrowser ? window.location.hostname : 'localhost';
const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';

// In production/tunnel (HTTPS), route via tunnel on standard 443 with TLS.
// In local dev (HTTP), connect directly to local Reverb port (default 8085).
const wsHost = isLocalhost ? 'localhost' : hostname;
const wsPort = isHttps ? 443 : (Number(import.meta.env.VITE_REVERB_PORT) || 8085);
const forceTLS = isHttps || import.meta.env.VITE_REVERB_SCHEME === 'https';

export const echo = new Echo({
    broadcaster: 'reverb',
    key: reverbKey,
    wsHost: wsHost,
    wsPort: wsPort,
    wssPort: wsPort,
    forceTLS: forceTLS,
    enabledTransports: ['ws', 'wss'],
});

if (isBrowser) {
    (window as any).Echo = echo;

    (echo.connector as any)?.pusher?.connection?.bind('connected', () => {
        console.log(`[Sentinel Reverb] Connected to WebSocket at ${wsHost}:${wsPort} (TLS: ${forceTLS})`);
    });

    (echo.connector as any)?.pusher?.connection?.bind('error', (err: any) => {
        console.warn('[Sentinel Reverb] WebSocket connection error:', err);
    });

    (echo.connector as any)?.pusher?.connection?.bind('unavailable', () => {
        console.warn('[Sentinel Reverb] WebSocket server unavailable. Ensure Reverb is running.');
    });
}

export default echo;

