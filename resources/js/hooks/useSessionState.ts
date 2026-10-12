import { useState, useCallback } from "react";

/**
 * In-memory store that survives client-side Inertia SPA navigation,
 * but automatically resets to default on full page refresh (F5), tab close, or logout.
 */
const memoryStore = new Map<string, any>();

export function useSessionState<T>(
    key: string,
    defaultValue: T | (() => T)
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
    const [state, setState] = useState<T>(() => {
        if (memoryStore.has(key)) {
            return memoryStore.get(key) as T;
        }
        return typeof defaultValue === "function" ? (defaultValue as () => T)() : defaultValue;
    });

    const setSessionState = useCallback(
        (value: T | ((prev: T) => T)) => {
            setState((prev) => {
                const next = typeof value === "function" ? (value as (prev: T) => T)(prev) : value;
                memoryStore.set(key, next);
                return next;
            });
        },
        [key]
    );

    const resetSessionState = useCallback(() => {
        const def = typeof defaultValue === "function" ? (defaultValue as () => T)() : defaultValue;
        memoryStore.set(key, def);
        setState(def);
    }, [key, defaultValue]);

    return [state, setSessionState, resetSessionState];
}

/** Clear all in-memory filter states (useful on explicit logout or full reset) */
export function clearSessionStates(): void {
    memoryStore.clear();
}
