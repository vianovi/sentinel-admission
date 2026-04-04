// =============================================================================
// LOKASI FILE: resources/js/Components/Dashboard/Candidate/Pembayaran/useCountdown.ts
// =============================================================================

import { useState, useEffect } from 'react'

type TimeLeft = {
    hours:   number
    minutes: number
    seconds: number
} | null

export default function useCountdown(expiredAt: string | null): {
    timeLeft:  TimeLeft
    isExpired: boolean
} {
    const calc = (): TimeLeft => {
        if (!expiredAt) return null
        const diff = new Date(expiredAt).getTime() - Date.now()
        if (diff <= 0) return null
        const totalSecs = Math.floor(diff / 1000)
        return {
            hours:   Math.floor(totalSecs / 3600),
            minutes: Math.floor((totalSecs % 3600) / 60),
            seconds: totalSecs % 60,
        }
    }

    const [timeLeft, setTimeLeft]   = useState<TimeLeft>(calc)
    const [isExpired, setIsExpired] = useState(!expiredAt || new Date(expiredAt) <= new Date())

    useEffect(() => {
        if (!expiredAt) return

        const tick = () => {
            const t = calc()
            setTimeLeft(t)
            if (!t) setIsExpired(true)
        }

        tick()
        const id = setInterval(tick, 1000)
        return () => clearInterval(id)
    }, [expiredAt])

    return { timeLeft, isExpired }
}
