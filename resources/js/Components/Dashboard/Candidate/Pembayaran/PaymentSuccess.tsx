// =============================================================================
// LOKASI FILE: resources/js/Components/Dashboard/Candidate/Pembayaran/PaymentSuccess.tsx
// =============================================================================

import { useEffect, useRef } from 'react'
import { animate, stagger }  from 'animejs'

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type PaidPayment = {
    order_id:        string
    final_amount:    number
    payment_method:  string | null
    payment_channel: string
    paid_at:         string | null
}

type Props = {
    payment: PaidPayment
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const formatRupiah = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

const formatDate = (iso: string | null) => {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    })
}

const getChannelLabel = (channel: string, method: string | null) => {
    if (channel === 'gateway') return method ? `Gateway · ${method}` : 'Payment Gateway'
    if (channel === 'transfer') return 'Transfer Bank'
    return 'Bayar Langsung (Cash)'
}

// ─────────────────────────────────────────────────────────────────────────────
// CONFETTI ENGINE — pure canvas, no library
// ─────────────────────────────────────────────────────────────────────────────

const CONFETTI_COLORS = [
    '#f97316', // orange (brand)
    '#d4a017', // gold (brand)
    '#22c55e', // emerald
    '#3b82f6', // blue
    '#a855f7', // violet
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#eab308', // yellow
]

type Particle = {
    x:       number
    y:       number
    vx:      number
    vy:      number
    angle:   number
    spin:    number
    size:    number
    color:   string
    shape:   'rect' | 'circle' | 'ribbon'
    opacity: number
    decay:   number
    gravity: number
}

function launchConfetti(canvas: HTMLCanvasElement) {
    const ctx    = canvas.getContext('2d')!
    const W      = canvas.width  = canvas.offsetWidth
    const H      = canvas.height = canvas.offsetHeight
    const center = W / 2
    const particles: Particle[] = []

    // Buat 180 partikel dari bawah check icon (sekitar 30% dari atas)
    const originY = H * 0.25

    for (let i = 0; i < 180; i++) {
        const angle  = (Math.random() * Math.PI * 2)
        const speed  = 4 + Math.random() * 8
        const shape  = Math.random() < 0.5 ? 'rect' : Math.random() < 0.5 ? 'circle' : 'ribbon'

        particles.push({
            x:       center + (Math.random() - 0.5) * 40,
            y:       originY,
            vx:      Math.cos(angle) * speed,
            vy:      Math.sin(angle) * speed - 6, // bias ke atas
            angle:   Math.random() * 360,
            spin:    (Math.random() - 0.5) * 8,
            size:    4 + Math.random() * 8,
            color:   CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
            shape,
            opacity: 1,
            decay:   0.012 + Math.random() * 0.008,
            gravity: 0.25 + Math.random() * 0.15,
        })
    }

    let rafId: number
    let frame = 0

    const draw = () => {
        ctx.clearRect(0, 0, W, H)
        frame++

        let alive = false

        for (const p of particles) {
            if (p.opacity <= 0) continue
            alive = true

            p.vy      += p.gravity
            p.vx      *= 0.99
            p.x       += p.vx
            p.y       += p.vy
            p.angle   += p.spin
            p.opacity -= p.decay

            ctx.save()
            ctx.globalAlpha = Math.max(0, p.opacity)
            ctx.fillStyle   = p.color
            ctx.translate(p.x, p.y)
            ctx.rotate((p.angle * Math.PI) / 180)

            if (p.shape === 'circle') {
                ctx.beginPath()
                ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
                ctx.fill()
            } else if (p.shape === 'ribbon') {
                ctx.fillRect(-p.size * 1.5 / 2, -p.size / 4, p.size * 1.5, p.size / 2)
            } else {
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6)
            }

            ctx.restore()
        }

        if (alive) {
            rafId = requestAnimationFrame(draw)
        } else {
            ctx.clearRect(0, 0, W, H)
        }
    }

    rafId = requestAnimationFrame(draw)

    // Cleanup setelah 5 detik
    const timeout = setTimeout(() => {
        cancelAnimationFrame(rafId)
        ctx.clearRect(0, 0, W, H)
    }, 5000)

    return () => {
        cancelAnimationFrame(rafId)
        clearTimeout(timeout)
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function PaymentSuccess({ payment }: Props) {
    const containerRef = useRef<HTMLDivElement>(null)
    const checkRef     = useRef<HTMLDivElement>(null)
    const canvasRef    = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        // Check icon pop
        animate(checkRef.current!, {
            scale:    [0, 1.2, 1],
            opacity:  [0, 1],
            duration: 700,
            ease:     'outExpo',
        })

        // Content stagger
        animate('.success-row', {
            opacity:    [0, 1],
            translateY: [16, 0],
            duration:   450,
            delay:      stagger(90, { start: 350 }),
            ease:       'outExpo',
        })

        // Launch confetti setelah check icon muncul
        let cleanup: (() => void) | undefined
        const t = setTimeout(() => {
            if (canvasRef.current) {
                cleanup = launchConfetti(canvasRef.current)
            }
        }, 400)

        return () => {
            clearTimeout(t)
            cleanup?.()
        }
    }, [])

    return (
        <div ref={containerRef} className="relative flex flex-col items-center text-center py-6">

            {/* Canvas confetti — absolute overlay, pointer-events-none */}
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{ zIndex: 10 }}
            />

            {/* Check icon */}
            <div ref={checkRef}
                className="relative w-24 h-24 rounded-full flex items-center justify-center mb-5
                    dark:bg-emerald-500/15 bg-emerald-100"
                style={{ opacity: 0, zIndex: 20 }}>
                {/* Outer ring pulse */}
                <div className="absolute inset-0 rounded-full border-2 dark:border-emerald-500/40 border-emerald-300/60 animate-ping opacity-30" />
                {/* Inner ring */}
                <div className="absolute inset-2 rounded-full dark:border dark:border-emerald-500/20 border border-emerald-200/60" />
                <i className="fa-solid fa-circle-check text-5xl dark:text-emerald-400 text-emerald-600" />
            </div>

            {/* Label + title */}
            <div className="success-row relative" style={{ opacity: 0, zIndex: 20 }}>
                <p className="text-xs dark:text-emerald-400 text-emerald-600 font-bold uppercase tracking-widest mb-1.5">
                    Pembayaran Lunas
                </p>
                <p className="text-2xl font-bold dark:text-slate-100 text-slate-800 mb-2">
                    Terima kasih! 🎉
                </p>
                <p className="text-sm dark:text-slate-400 text-slate-600 max-w-sm leading-relaxed">
                    Pembayaran biaya pendaftaran sudah tercatat lunas. Cek halaman Status Pendaftaran dan Seleksi untuk melihat akses ujian, jadwal sesi, dan langkah berikutnya.
                </p>
            </div>

            {/* Receipt */}
            <div className="success-row relative w-full max-w-sm mt-6 rounded-2xl border overflow-hidden
                dark:border-white/[0.08] border-black/[0.08] dark:bg-white/[0.02] bg-white text-left"
                style={{ opacity: 0, zIndex: 20 }}>

                <div className="px-5 py-3 border-b dark:border-white/[0.06] border-black/[0.06]
                    dark:bg-white/[0.02] bg-slate-50/80">
                    <p className="text-xs font-bold uppercase tracking-widest dark:text-slate-400 text-slate-500">
                        Bukti Pembayaran
                    </p>
                </div>

                <div className="px-5 py-4 space-y-3">
                    {[
                        { label: 'Jumlah',   value: formatRupiah(payment.final_amount), highlight: true },
                        { label: 'Metode',   value: getChannelLabel(payment.payment_channel, payment.payment_method) },
                        { label: 'Tanggal',  value: formatDate(payment.paid_at) },
                        { label: 'Order ID', value: payment.order_id, mono: true },
                    ].map((row) => (
                        <div key={row.label} className="flex items-baseline justify-between">
                            <p className="text-xs dark:text-slate-500 text-slate-500 shrink-0">{row.label}</p>
                            <p className={`text-right ml-4 max-w-[180px] truncate
                                ${row.highlight
                                    ? 'text-sm font-bold dark:text-emerald-400 text-emerald-600'
                                    : row.mono
                                        ? 'text-xs font-mono dark:text-slate-400 text-slate-500'
                                        : 'text-sm font-medium dark:text-slate-300 text-slate-700'
                                }`}>
                                {row.value}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Next step */}
            <div className="success-row relative mt-5 w-full max-w-sm p-4 rounded-xl border
                dark:border-blue-500/20 border-blue-200 dark:bg-blue-500/[0.06] bg-blue-50 text-left"
                style={{ opacity: 0, zIndex: 20 }}>
                <div className="flex items-start gap-3">
                    <i className="fa-solid fa-arrow-right-long dark:text-blue-400 text-blue-600 mt-0.5 text-sm shrink-0" />
                    <div>
                        <p className="text-xs font-semibold dark:text-blue-300 text-blue-700">Langkah Selanjutnya</p>
                        <p className="text-xs dark:text-blue-400/70 text-blue-600/70 mt-0.5 leading-relaxed">
                            Buka Status Pendaftaran dan Seleksi untuk melihat akses ujian, jadwal sesi, serta instruksi terbaru dari gelombang aktif.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
