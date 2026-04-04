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
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function PaymentSuccess({ payment }: Props) {
    const containerRef = useRef<HTMLDivElement>(null)
    const checkRef     = useRef<HTMLDivElement>(null)

    useEffect(() => {
        // Check icon pop
        animate(checkRef.current!, {
            scale:    [0, 1.15, 1],
            opacity:  [0, 1],
            duration: 600,
            ease:     'outExpo',
        })
        // Content stagger
        animate('.success-row', {
            opacity:    [0, 1],
            translateY: [12, 0],
            duration:   400,
            delay:      stagger(80, { start: 300 }),
            ease:       'outExpo',
        })
    }, [])

    return (
        <div ref={containerRef} className="flex flex-col items-center text-center py-6">
            {/* Check icon */}
            <div ref={checkRef} className="w-20 h-20 rounded-full flex items-center justify-center mb-5
                dark:bg-emerald-500/15 bg-emerald-100 relative"
                style={{ opacity: 0 }}>
                {/* Ring pulse */}
                <div className="absolute inset-0 rounded-full dark:border-emerald-500/30 border-emerald-300/60 border-2
                    animate-ping opacity-20" />
                <i className="fa-solid fa-circle-check text-4xl dark:text-emerald-400 text-emerald-600" />
            </div>

            <div className="success-row" style={{ opacity: 0 }}>
                <p className="text-[11px] dark:text-emerald-400 text-emerald-600 font-bold uppercase tracking-widest mb-1">
                    Pembayaran Lunas
                </p>
                <p className="text-xl font-bold dark:text-slate-100 text-slate-800 mb-1">
                    Terima kasih! 🎉
                </p>
                <p className="text-[12px] dark:text-slate-400 text-slate-600 max-w-sm leading-relaxed">
                    Pembayaran biaya pendaftaran kamu sudah kami terima. Pantau status seleksi di halaman Status.
                </p>
            </div>

            {/* Receipt */}
            <div className="success-row w-full max-w-sm mt-6 rounded-2xl border overflow-hidden
                dark:border-white/[0.08] border-black/[0.08] dark:bg-white/[0.02] bg-white text-left"
                style={{ opacity: 0 }}>

                <div className="px-5 py-3 border-b dark:border-white/[0.06] border-black/[0.06]
                    dark:bg-white/[0.02] bg-slate-50/80">
                    <p className="text-[10px] font-bold uppercase tracking-widest dark:text-slate-400 text-slate-500">
                        Bukti Pembayaran
                    </p>
                </div>

                <div className="px-5 py-4 space-y-3">
                    {[
                        { label: 'Jumlah',    value: formatRupiah(payment.final_amount), highlight: true },
                        { label: 'Metode',    value: getChannelLabel(payment.payment_channel, payment.payment_method) },
                        { label: 'Tanggal',   value: formatDate(payment.paid_at) },
                        { label: 'Order ID',  value: payment.order_id, mono: true },
                    ].map((row) => (
                        <div key={row.label} className="flex items-baseline justify-between">
                            <p className="text-[11px] dark:text-slate-500 text-slate-500 shrink-0">{row.label}</p>
                            <p className={`text-right ml-4 max-w-[180px] truncate
                                ${row.highlight
                                    ? 'text-sm font-bold dark:text-emerald-400 text-emerald-600'
                                    : row.mono
                                        ? 'text-[10px] font-mono dark:text-slate-400 text-slate-500'
                                        : 'text-[12px] font-medium dark:text-slate-300 text-slate-700'
                                }`}>
                                {row.value}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Next step hint */}
            <div className="success-row mt-5 w-full max-w-sm p-4 rounded-xl border
                dark:border-blue-500/20 border-blue-200 dark:bg-blue-500/[0.06] bg-blue-50 text-left"
                style={{ opacity: 0 }}>
                <div className="flex items-start gap-3">
                    <i className="fa-solid fa-arrow-right-long dark:text-blue-400 text-blue-600 mt-0.5 text-sm" />
                    <div>
                        <p className="text-xs font-semibold dark:text-blue-300 text-blue-700">Langkah Selanjutnya</p>
                        <p className="text-[11px] dark:text-blue-400/70 text-blue-600/70 mt-0.5 leading-relaxed">
                            Tim PSB akan menghubungi kamu untuk informasi tes seleksi. Pantau halaman Status secara berkala.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
