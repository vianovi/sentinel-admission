import { useEffect, useRef } from 'react'
import { animate } from 'animejs'
import { router } from '@inertiajs/react'

/**
 * GlobalProgressBar
 *
 * NProgress-style bar di bagian paling atas halaman.
 * Aktif otomatis di setiap navigasi Inertia (link, form submit, redirect).
 * Dipasang sekali di app.tsx — tidak perlu import di setiap halaman.
 */
export default function GlobalProgressBar() {
    const barRef     = useRef<HTMLDivElement>(null)
    const glowRef    = useRef<HTMLDivElement>(null)
    const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null)
    const activeRef  = useRef(false)

    const start = () => {
        if (activeRef.current) return
        activeRef.current = true

        const bar  = barRef.current
        const glow = glowRef.current
        if (!bar || !glow) return

        // Reset posisi
        bar.style.opacity  = '1'
        bar.style.width    = '0%'
        glow.style.opacity = '1'

        // Fase 1 — cepat sampai 70%
        animate(bar, {
            width:    ['0%', '70%'],
            duration: 400,
            ease:     'outQuart',
        })

        animate(glow, {
            width:    ['0%', '70%'],
            duration: 400,
            ease:     'outQuart',
        })

        // Fase 2 — lambat sampai 90% (simulasi "menunggu server")
        timerRef.current = setTimeout(() => {
            if (!activeRef.current) return
            animate(bar, {
                width:    '90%',
                duration: 8000,
                ease:     'linear',
            })
            animate(glow, {
                width:    '90%',
                duration: 8000,
                ease:     'linear',
            })
        }, 400)
    }

    const finish = () => {
        if (!activeRef.current) return
        activeRef.current = false

        if (timerRef.current) {
            clearTimeout(timerRef.current)
            timerRef.current = null
        }

        const bar  = barRef.current
        const glow = glowRef.current
        if (!bar || !glow) return

        // Selesaikan ke 100% lalu fade out
        animate(bar, {
            width:    '100%',
            duration: 200,
            ease:     'outQuart',
            onComplete: () => {
                animate(bar, {
                    opacity:  0,
                    duration: 300,
                    delay:    100,
                    ease:     'outQuart',
                    onComplete: () => {
                        bar.style.width = '0%'
                    },
                })
            },
        })

        animate(glow, {
            width:    '100%',
            duration: 200,
            ease:     'outQuart',
            onComplete: () => {
                animate(glow, {
                    opacity:  0,
                    duration: 300,
                    delay:    100,
                    ease:     'outQuart',
                    onComplete: () => {
                        glow.style.width = '0%'
                    },
                })
            },
        })
    }

    useEffect(() => {
        // Hook ke event Inertia
        const unsubStart   = router.on('start',   start)
        const unsubFinish  = router.on('finish',  finish)
        const unsubError   = router.on('error',   finish)
        const unsubInvalid = router.on('invalid', finish)
        const unsubException = router.on('exception', finish)

        return () => {
            unsubStart()
            unsubFinish()
            unsubError()
            unsubInvalid()
            unsubException()
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <div className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none h-[3px]">
            {/* Bar utama */}
            <div
                ref={barRef}
                className="absolute top-0 left-0 h-full bg-gold"
                style={{ width: '0%', opacity: 0 }}
            />
            {/* Glow effect */}
            <div
                ref={glowRef}
                className="absolute top-0 left-0 h-full"
                style={{
                    width:     '0%',
                    opacity:   0,
                    boxShadow: '0 0 8px 2px #D4A017, 0 0 20px 4px #D4A01750',
                }}
            />
        </div>
    )
}
