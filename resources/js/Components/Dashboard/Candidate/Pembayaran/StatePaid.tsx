// resources/js/Components/Dashboard/Candidate/Pembayaran/StatePaid.tsx

import { useEffect, useRef } from 'react'
import { animate, stagger }  from 'animejs'
import confetti              from 'canvas-confetti'

type PaidPayment = {
    order_id:       string
    amount:         number
    payment_method: string | null
    paid_at:        string | null
}

type Props = {
    payment: PaidPayment
}

function formatRupiah(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
        style:    'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(amount)
}

function formatPaymentMethod(method: string | null): string {
    if (!method) return '-'
    const map: Record<string, string> = {
        'qris':          'QRIS',
        'gopay':         'GoPay',
        'shopeepay':     'ShopeePay',
        'bank_transfer': 'Transfer Bank',
        'credit_card':   'Kartu Kredit',
        'cstore':        'Minimarket',
        'dana':          'DANA',
        'ovo':           'OVO',
    }
    return map[method.toLowerCase()] ?? method
}

export default function StatePaid({ payment }: Props) {
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        // Confetti burst
        const fire = (particleRatio: number, opts: confetti.Options) => {
            confetti({
                origin: { y: 0.6 },
                ...opts,
                particleCount: Math.floor(200 * particleRatio),
            })
        }

        setTimeout(() => {
            fire(0.25, { spread: 26, startVelocity: 55, colors: ['#d4a017', '#f59e0b', '#fbbf24'] })
            fire(0.2,  { spread: 60, colors: ['#ffffff', '#e2e8f0'] })
            fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8, colors: ['#d4a017', '#10b981'] })
            fire(0.1,  { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 })
            fire(0.1,  { spread: 120, startVelocity: 45, colors: ['#d4a017'] })
        }, 300)

        // Entrance animation
        if (!ref.current) return
        animate(ref.current.querySelectorAll('.anim-item'), {
            opacity:    [0, 1],
            translateY: [20, 0],
            duration:   600,
            delay:      stagger(80),
            ease:       'outExpo',
        })

        // Checkmark draw animation
        const path = ref.current.querySelector('.check-path') as SVGPathElement | null
        if (path) {
            const length = path.getTotalLength()
            path.style.strokeDasharray  = `${length}`
            path.style.strokeDashoffset = `${length}`
            animate(path, {
                strokeDashoffset: [length, 0],
                duration:         600,
                delay:            400,
                ease:             'outExpo',
            })
        }
    }, [])

    return (
        <div ref={ref} className="flex flex-col gap-4">

            {/* ── Success hero ─────────────────────────────────── */}
            <div className="anim-item flex flex-col items-center py-8 gap-4">
                <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-emerald-400/10 border-2 border-emerald-400/30 flex items-center justify-center">
                        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                            <path
                                className="check-path"
                                d="M6 18l8 8L30 10"
                                stroke="#4ade80"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </div>
                    {/* Glow ring */}
                    <div className="absolute inset-0 rounded-full border-2 border-emerald-400/10 animate-ping"></div>
                </div>
                <div className="text-center">
                    <p className="text-lg font-bold text-emerald-400">Pembayaran Berhasil!</p>
                    <p className="text-xs text-slate-500 mt-1">Terima kasih, pembayaran kamu telah kami terima.</p>
                </div>
            </div>

            {/* ── Bukti pembayaran ─────────────────────────────── */}
            <div className="anim-item bg-white/[0.03] border border-emerald-400/10 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] text-slate-600 uppercase tracking-widest">Bukti Pembayaran</p>
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 text-[10px] font-semibold">
                        <i className="fa-solid fa-circle-check text-[8px]"></i>
                        Lunas
                    </span>
                </div>

                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">Total Dibayar</span>
                        <span className="text-base font-bold text-white">{formatRupiah(payment.amount)}</span>
                    </div>
                    <div className="border-t border-white/[0.04]"></div>
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">Metode</span>
                        <span className="text-xs font-semibold text-slate-300">{formatPaymentMethod(payment.payment_method)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">Waktu Bayar</span>
                        <span className="text-xs text-slate-300">{payment.paid_at ?? '-'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">Order ID</span>
                        <span className="text-xs font-mono text-slate-400 bg-white/[0.04] px-2 py-0.5 rounded-lg">{payment.order_id}</span>
                    </div>
                </div>
            </div>

            {/* ── Next step info ───────────────────────────────── */}
            <div className="anim-item bg-gold/5 border border-gold/10 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                    <i className="fa-solid fa-circle-info text-gold/60 text-sm mt-0.5 flex-shrink-0"></i>
                    <div>
                        <p className="text-xs font-semibold text-gold/80 mb-1">Langkah Selanjutnya</p>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            Tim kami sedang memverifikasi pembayaran kamu. Setelah terverifikasi,
                            status pendaftaran akan diperbarui dan kamu bisa melanjutkan ke tahap berikutnya.
                        </p>
                    </div>
                </div>
            </div>

        </div>
    )
}
