// resources/js/Components/Dashboard/Candidate/Pembayaran/useCountdown.ts

import { useEffect, useState } from 'react'

type CountdownResult = {
    display:  string   // "23:45:12"
    isUrgent: boolean  // true kalau < 1 jam
    isDead:   boolean  // true kalau sudah expired
    pct:      number   // 0-100 untuk progress ring (dari 24 jam)
}

export function useCountdown(expiredAt: string | null): CountdownResult {
    const [result, setResult] = useState<CountdownResult>({
        display:  '--:--:--',
        isUrgent: false,
        isDead:   false,
        pct:      100,
    })

    useEffect(() => {
        if (!expiredAt) return

        const expired  = new Date(expiredAt).getTime()
        const total    = 24 * 60 * 60 * 1000 // 24 jam dalam ms

        const tick = () => {
            const now  = Date.now()
            const diff = expired - now

            if (diff <= 0) {
                setResult({ display: '00:00:00', isUrgent: true, isDead: true, pct: 0 })
                return
            }

            const h   = Math.floor(diff / 3_600_000)
            const m   = Math.floor((diff % 3_600_000) / 60_000)
            const s   = Math.floor((diff % 60_000) / 1_000)
            const pct = Math.min(100, Math.max(0, (diff / total) * 100))

            setResult({
                display:  `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`,
                isUrgent: diff < 3_600_000, // < 1 jam
                isDead:   false,
                pct,
            })
        }

        tick()
        const id = setInterval(tick, 1_000)
        return () => clearInterval(id)
    }, [expiredAt])

    return result
}
