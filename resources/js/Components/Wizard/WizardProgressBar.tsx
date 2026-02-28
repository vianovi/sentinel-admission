/**
 * WizardProgressBar.tsx
 *
 * Gold NProgress-style progress bar menggunakan animejs.
 * Cara pakai di parent Wizard page:
 *
 *   import WizardProgressBar from '@/Components/WizardProgressBar'
 *   <WizardProgressBar currentStep={currentStep} />
 *
 * Bar otomatis muncul di dua kondisi:
 *   1. currentStep berubah  → step transition dalam wizard
 *   2. Inertia router event → navigasi ke/dari halaman lain
 */

import { useEffect, useRef } from 'react'
import { router } from '@inertiajs/react'
import { animate } from 'animejs'

interface WizardProgressBarProps {
    currentStep: 1 | 2 | 3
}

export default function WizardProgressBar({ currentStep }: WizardProgressBarProps) {
    const barRef      = useRef<HTMLDivElement>(null)
    const wrapRef     = useRef<HTMLDivElement>(null)
    const t1          = useRef<ReturnType<typeof setTimeout> | null>(null)
    const t2          = useRef<ReturnType<typeof setTimeout> | null>(null)
    const isRunning   = useRef(false)

    // ─── Helpers ───────────────────────────────────────────────────────────

    const clearTimers = () => {
        if (t1.current) clearTimeout(t1.current)
        if (t2.current) clearTimeout(t2.current)
    }

    /** Tampilkan wrapper, reset bar ke 0%, lalu jalankan animasi fase 1 & 2 */
    const runBar = (phase1Duration = 550, phase2Duration = 550) => {
        const bar  = barRef.current
        const wrap = wrapRef.current
        if (!bar || !wrap) return

        clearTimers()
        isRunning.current = true

        // Reset posisi
        bar.style.width   = '0%'
        wrap.style.opacity = '1'

        // Fase 1 — cepat sampai 68%
        animate(bar, {
            width: ['0%', '68%'],
            duration: phase1Duration,
            ease: 'outExpo',
        })

        // Fase 2 — selesaikan ke 100% setelah fase 1
        t1.current = setTimeout(() => {
            animate(bar, {
                width: ['68%', '100%'],
                duration: phase2Duration,
                ease: 'outExpo',
            })

            // Fade out setelah selesai
            t2.current = setTimeout(() => {
                animate(wrap, {
                    opacity: [1, 0],
                    duration: 300,
                    ease: 'outExpo',
                })
                // Reset lebar supaya animasi berikutnya mulai dari 0
                setTimeout(() => {
                    bar.style.width   = '0%'
                    wrap.style.opacity = '0'
                    isRunning.current  = false
                }, 320)
            }, phase2Duration + 60)
        }, phase1Duration + 20)
    }

    /** Mulai bar "indeterminate" saat Inertia mulai navigasi */
    const startExternal = () => {
        const bar  = barRef.current
        const wrap = wrapRef.current
        if (!bar || !wrap) return

        clearTimers()
        isRunning.current  = true
        bar.style.width    = '0%'
        wrap.style.opacity = '1'

        // Maju pelan sampai ~78% (kesan loading)
        animate(bar, {
            width: ['0%', '78%'],
            duration: 1800,
            ease: 'out(1.5)',
        })
    }

    /** Selesaikan bar saat Inertia selesai navigasi */
    const finishExternal = () => {
        const bar  = barRef.current
        const wrap = wrapRef.current
        if (!bar || !wrap) return

        clearTimers()

        animate(bar, {
            width: ['78%', '100%'],
            duration: 450,
            ease: 'outExpo',
        })

        t1.current = setTimeout(() => {
            animate(wrap, {
                opacity: [1, 0],
                duration: 350,
                ease: 'outExpo',
            })
            t2.current = setTimeout(() => {
                bar.style.width    = '0%'
                wrap.style.opacity = '0'
                isRunning.current  = false
            }, 370)
        }, 470)
    }

    // ─── Step transition trigger ────────────────────────────────────────────
    // Durasi sedikit lebih panjang agar progress bar jelas terlihat saat ganti step

    useEffect(() => {
        runBar(600, 600)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentStep])

    // ─── Inertia router events (keluar/masuk halaman lain) ─────────────────

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

    // ─── Render ─────────────────────────────────────────────────────────────

    return (
        // Wrapper — opacity dikendalikan via animejs (bukan state agar tidak re-render)
        <div
            ref={wrapRef}
            style={{ opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-[9999] h-[3px] pointer-events-none"
        >
            <div
                ref={barRef}
                style={{ width: '0%' }}
                className="h-full bg-gold"
                // Glow effect — gold
                // Tailwind tidak support arbitrary box-shadow dengan CSS var jadi pakai style
                // Sesuaikan warna #D4AF37 dengan nilai `gold` di tailwind config kamu
            />
        </div>
    )
}
