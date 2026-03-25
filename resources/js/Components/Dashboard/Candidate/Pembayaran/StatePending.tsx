// resources/js/Components/Dashboard/Candidate/Pembayaran/StatePending.tsx

import { useEffect, useRef } from 'react'
import { animate, stagger }  from 'animejs'
import { useCountdown }      from './useCountdown'

type ActivePayment = {
    id:             number
    order_id:       string
    snap_token:     string | null
    amount:         number
    status:         string
    expired_at:     string | null
    payment_method: string | null
}

type Props = {
    payment:       ActivePayment
    processing:    boolean
    cancelling:    boolean
    onPay:         () => void
    onCancel:      () => void
}

function formatRupiah(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
        style:    'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(amount)
}

export default function StatePending({ payment, processing, cancelling, onPay, onCancel }: Props) {
    const ref                             = useRef<HTMLDivElement>(null)
    const { display, isUrgent, isDead, pct } = useCountdown(payment.expired_at)

    useEffect(() => {
        if (!ref.current) return
        animate(ref.current.querySelectorAll('.anim-item'), {
            opacity:    [0, 1],
            translateY: [20, 0],
            duration:   600,
            delay:      stagger(80),
            ease:       'outExpo',
        })
    }, [])

    // Shake kalau expired
    useEffect(() => {
        if (!isDead || !ref.current) return
        const timerEl = ref.current.querySelector('.timer-display') as HTMLElement | null
        if (!timerEl) return
        animate(timerEl, {
            translateX: [0, -6, 6, -4, 4, 0],
            duration:   400,
            ease:       'outExpo',
        })
    }, [isDead])

    // Radius untuk progress ring
    const radius      = 28
    const circumference = 2 * Math.PI * radius
    const dashOffset    = circumference * (1 - pct / 100)

    return (
        <div ref={ref} className="flex flex-col gap-4">

            {/* ── Amount + Timer card ─────────────────────────── */}
            <div className="anim-item bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <p className="text-[10px] text-slate-600 uppercase tracking-widest mb-1">Total Pembayaran</p>
                        <p className="text-3xl font-extrabold text-white">{formatRupiah(payment.amount)}</p>
                    </div>
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 text-[11px] font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                        Menunggu
                    </span>
                </div>

                <div className="border-t border-white/[0.06] pt-4">
                    <div className="flex items-center justify-between">

                        {/* Timer text + ring */}
                        <div className="flex items-center gap-4">
                            <div className="relative w-16 h-16">
                                <svg width="64" height="64" viewBox="0 0 64 64" className="-rotate-90">
                                    <circle cx="32" cy="32" r={radius}
                                        fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4"/>
                                    <circle cx="32" cy="32" r={radius}
                                        fill="none"
                                        stroke={isDead ? '#ef4444' : isUrgent ? '#f97316' : '#d4a017'}
                                        strokeWidth="4"
                                        strokeLinecap="round"
                                        strokeDasharray={circumference}
                                        strokeDashoffset={dashOffset}
                                        style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s ease' }}
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <i className={`fa-solid fa-clock text-sm ${isDead ? 'text-red-400' : isUrgent ? 'text-orange-400' : 'text-gold/60'}`}></i>
                                </div>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-600 mb-0.5">Sisa waktu</p>
                                <p className={`timer-display text-2xl font-bold font-mono tracking-widest transition-colors duration-500 ${
                                    isDead ? 'text-red-400' : isUrgent ? 'text-orange-400' : 'text-white'
                                }`}>{display}</p>
                                {isUrgent && !isDead && (
                                    <p className="text-[10px] text-orange-400 mt-0.5 animate-pulse">Segera selesaikan!</p>
                                )}
                                {isDead && (
                                    <p className="text-[10px] text-red-400 mt-0.5">Transaksi kedaluwarsa</p>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* ── Detail transaksi ─────────────────────────────── */}
            <div className="anim-item bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
                <p className="text-[10px] text-slate-600 uppercase tracking-widest mb-3">Detail Transaksi</p>
                <div className="flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">Order ID</span>
                        <span className="text-xs font-mono text-slate-300 bg-white/[0.04] px-2 py-1 rounded-lg">{payment.order_id}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">Status</span>
                        <span className="text-xs text-amber-400 font-semibold">Menunggu Pembayaran</span>
                    </div>
                    {payment.expired_at && (
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-500">Berlaku hingga</span>
                            <span className="text-xs text-slate-300">
                                {new Date(payment.expired_at).toLocaleString('id-ID', {
                                    day: '2-digit', month: 'short', year: 'numeric',
                                    hour: '2-digit', minute: '2-digit'
                                })}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Cara pembayaran ──────────────────────────────── */}
            <div className="anim-item bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
                <p className="text-[10px] text-slate-600 uppercase tracking-widest mb-3">Cara Pembayaran</p>
                <div className="flex flex-col gap-2">
                    {[
                        { n: '1', text: 'Klik tombol "Bayar Sekarang" di bawah' },
                        { n: '2', text: 'Pilih metode pembayaran yang diinginkan' },
                        { n: '3', text: 'Selesaikan pembayaran sesuai instruksi' },
                        { n: '4', text: 'Status akan otomatis diperbarui' },
                    ].map((step) => (
                        <div key={step.n} className="flex items-start gap-3">
                            <div className="w-5 h-5 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-[9px] font-bold text-gold">{step.n}</span>
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed">{step.text}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Actions ─────────────────────────────────────── */}
            <div className="anim-item flex flex-col gap-2">
                <button
                    onClick={onPay}
                    disabled={processing || isDead || !payment.snap_token}
                    className="w-full bg-gold hover:bg-goldhover disabled:opacity-50 text-navy font-bold text-sm px-6 py-3.5 rounded-xl shadow-glow transition hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2"
                >
                    {processing
                        ? <><i className="fa-solid fa-spinner fa-spin"></i> Memproses...</>
                        : <><i className="fa-solid fa-credit-card"></i> Bayar Sekarang</>
                    }
                </button>

                <button
                    onClick={onCancel}
                    disabled={cancelling || isDead}
                    className="w-full bg-transparent hover:bg-white/[0.04] disabled:opacity-40 text-slate-500 hover:text-slate-300 border border-white/[0.06] font-medium text-xs px-6 py-2.5 rounded-xl transition flex items-center justify-center gap-2"
                >
                    {cancelling
                        ? <><i className="fa-solid fa-spinner fa-spin"></i> Membatalkan...</>
                        : <><i className="fa-solid fa-rotate-right"></i> Ganti Metode Pembayaran</>
                    }
                </button>

                {isDead && (
                    <p className="text-[11px] text-red-400/70 text-center">
                        Transaksi kedaluwarsa. Batalkan untuk membuat transaksi baru.
                    </p>
                )}
            </div>

        </div>
    )
}