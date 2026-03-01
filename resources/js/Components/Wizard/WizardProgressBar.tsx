/**
 * WizardProgressBar.tsx
 *
 * Gold NProgress-style progress bar menggunakan animejs.
 * Aktif di dua kondisi:
 *   1. currentStep berubah  → animasi saat ganti step wizard
 *   2. Inertia router event → animasi saat navigasi keluar/masuk halaman
 */

import { useEffect, useRef } from 'react'
import { router } from '@inertiajs/react'
import { animate } from 'animejs'

interface WizardProgressBarProps {
    currentStep: 1 | 2 | 3
}

export default function WizardProgressBar({ currentStep }: WizardProgressBarProps) {
    const barRef    = useRef<HTMLDivElement>(null)
    const wrapRef   = useRef<HTMLDivElement>(null)
    const t1        = useRef<ReturnType<typeof setTimeout> | null>(null)
    const t2        = useRef<ReturnType<typeof setTimeout> | null>(null)
    const isFirstRender = useRef(true)

    // ─── Helpers ─────────────────────────────────────────────────────────────

    const clearTimers = () => {
        if (t1.current) clearTimeout(t1.current)
        if (t2.current) clearTimeout(t2.current)
    }

    /**
     * Jalankan full progress bar:
     * Fase 1 → cepat ke 68%, Fase 2 → selesai ke 100%, lalu fade out
     */
    const runBar = (phase1Ms = 550, phase2Ms = 550) => {
        const bar  = barRef.current
        const wrap = wrapRef.current
        if (!bar || !wrap) return

        clearTimers()

        bar.style.width    = '0%'
        wrap.style.opacity = '1'

        animate(bar, { width: ['0%', '68%'], duration: phase1Ms, ease: 'outExpo' })

        t1.current = setTimeout(() => {
            animate(bar, { width: ['68%', '100%'], duration: phase2Ms, ease: 'outExpo' })

            t2.current = setTimeout(() => {
                animate(wrap, { opacity: [1, 0], duration: 300, ease: 'outExpo' })
                setTimeout(() => {
                    bar.style.width    = '0%'
                    wrap.style.opacity = '0'
                }, 320)
            }, phase2Ms + 60)
        }, phase1Ms + 20)
    }

    /** Mulai bar indeterminate saat Inertia mulai navigasi */
    const startExternal = () => {
        const bar  = barRef.current
        const wrap = wrapRef.current
        if (!bar || !wrap) return
        clearTimers()
        bar.style.width    = '0%'
        wrap.style.opacity = '1'
        animate(bar, { width: ['0%', '78%'], duration: 1800, ease: 'out(1.5)' })
    }

    /** Selesaikan bar saat Inertia selesai navigasi */
    const finishExternal = () => {
        const bar  = barRef.current
        const wrap = wrapRef.current
        if (!bar || !wrap) return
        clearTimers()
        animate(bar, { width: ['78%', '100%'], duration: 450, ease: 'outExpo' })
        t1.current = setTimeout(() => {
            animate(wrap, { opacity: [1, 0], duration: 350, ease: 'outExpo' })
            t2.current = setTimeout(() => {
                bar.style.width    = '0%'
                wrap.style.opacity = '0'
            }, 370)
        }, 470)
    }

    // ─── Trigger saat step berubah ────────────────────────────────────────────
    // Skip saat first render agar tidak muncul saat halaman pertama dibuka
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false
            return
        }
        runBar(600, 600)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentStep])

    // ─── Inertia router events ────────────────────────────────────────────────
    useEffect(() => {
        const offStart  = router.on('start',  startExternal)
        const offFinish = router.on('finish', finishExternal)
        return () => {
            offStart()
            offFinish()
            clearTimers()
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <div
            ref={wrapRef}
            style={{ opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-[9999] h-[3px] pointer-events-none"
        >
            <div
                ref={barRef}
                style={{ width: '0%' }}
                className="h-full bg-gold shadow-[0_0_8px_rgba(212,160,23,0.8)]"
            />
        </div>
    )
}
