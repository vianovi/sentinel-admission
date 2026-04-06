// =============================================================================
// LOKASI FILE: resources/js/Components/Dashboard/Candidate/Pembayaran/useCountdown.ts
// =============================================================================

import { useState, useEffect, useCallback } from 'react'

type TimeLeft = {
    hours:   number
    minutes: number
    seconds: number
} | null

export default function useCountdown(expiredAt: string | null): {
    timeLeft:  TimeLeft
    isExpired: boolean
} {
    // Gunakan callback agar calc selalu fresh tiap dipanggil
    const calc = useCallback((): { timeLeft: TimeLeft; isExpired: boolean } => {
        if (!expiredAt) return { timeLeft: null, isExpired: false }

        // Parse ISO string — new Date() handle UTC ISO string dengan benar
        const expMs = new Date(expiredAt).getTime()
        const nowMs = Date.now()
        const diff  = expMs - nowMs

        if (diff <= 0) return { timeLeft: null, isExpired: true }

        const totalSecs = Math.floor(diff / 1000)
        return {
            timeLeft: {
                hours:   Math.floor(totalSecs / 3600),
                minutes: Math.floor((totalSecs % 3600) / 60),
                seconds: totalSecs % 60,
            },
            isExpired: false,
        }
    }, [expiredAt])

    const [state, setState] = useState(() => calc())

    useEffect(() => {
        // Reset state saat expiredAt berubah
        setState(calc())

        if (!expiredAt) return

        const id = setInterval(() => {
            const next = calc()
            setState(next)
            // Stop interval kalau sudah expired
            if (next.isExpired) clearInterval(id)
        }, 1000)

        return () => clearInterval(id)
    }, [expiredAt, calc])

    return state
}