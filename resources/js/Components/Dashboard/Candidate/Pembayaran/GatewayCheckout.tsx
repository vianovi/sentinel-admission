// =============================================================================
// LOKASI FILE: resources/js/Components/Dashboard/Candidate/Pembayaran/GatewayCheckout.tsx
// =============================================================================

import { useEffect, useRef, useState } from 'react'
import { animate }                     from 'animejs'
import useCountdown                     from './useCountdown'

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type Payment = {
    id:              number
    order_id:        string
    snap_token:      string | null
    base_amount:     number
    fee_amount:      number
    final_amount:    number
    status:          string
    expired_at:      string | null
    is_expired:      boolean
    is_cancellable:  boolean
}

type CandidateInfo = {
    full_name:       string
    candidate_code:  string
    admission_wave:  string | null
    program_choice?: string | null
}

type Config = {
    gateway_fee_label: string
    gateway_fee_value: number
}

type Props = {
    payment:       Payment
    candidate:     CandidateInfo
    config:        Config | null
    processing:    boolean
    cancelling:    boolean
    onPay:         () => void
    onCancel:      () => void
    onBack:        () => void
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const formatRupiah = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function GatewayCheckout({
    payment, candidate, config, processing, cancelling, onPay, onCancel, onBack,
}: Props) {
    const containerRef = useRef<HTMLDivElement>(null)
    const { timeLeft, isExpired } = useCountdown(payment.expired_at)

    // Timer color based on time left
    const getTimerColor = () => {
        if (!timeLeft || isExpired || payment.is_expired) return 'text-rose-500'
        const totalSecs = timeLeft.hours * 3600 + timeLeft.minutes * 60 + timeLeft.seconds
        if (totalSecs < 300) return 'text-rose-500'  // < 5 menit
        if (totalSecs < 1800) return 'text-amber-500' // < 30 menit
        return 'dark:text-emerald-400 text-emerald-600'
    }

    useEffect(() => {
        animate(containerRef.current!, {
            opacity:    [0, 1],
            translateX: [30, 0],
            duration:   380,
            ease:       'outExpo',
        })
        // Stagger rows
        animate('.checkout-row', {
            opacity:    [0, 1],
            translateX: [16, 0],
            duration:   350,
            delay:      (_, i) => 100 + i * 60,
            ease:       'outExpo',
        })
    }, [])

    const expired = isExpired || payment.is_expired

    return (
        <div ref={containerRef} style={{ opacity: 0 }}>
            {/* Back button */}
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-xs dark:text-slate-400 text-slate-500
                    dark:hover:text-slate-200 hover:text-slate-700 transition-colors duration-150 mb-5 group"
            >
                <i className="fa-solid fa-arrow-left group-hover:-translate-x-0.5 transition-transform duration-150" />
                Ganti Metode Pembayaran
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center
                    dark:bg-orange-500/15 bg-orange-100 dark:text-orange-400 text-orange-600">
                    <i className="fa-solid fa-bolt" />
                </div>
                <div>
                    <p className="text-base font-bold dark:text-slate-100 text-slate-800">Bayar via Gateway</p>
                    <p className="text-[11px] dark:text-slate-500 text-slate-500">Terkonfirmasi otomatis setelah pembayaran</p>
                </div>
            </div>

            {/* Order Summary */}
            <div className="rounded-2xl border dark:border-white/[0.08] border-black/[0.08]
                dark:bg-white/[0.02] bg-white overflow-hidden mb-4">

                {/* Summary header */}
                <div className="px-5 py-3.5 border-b dark:border-white/[0.06] border-black/[0.06]
                    dark:bg-white/[0.02] bg-slate-50/80">
                    <p className="text-[11px] font-bold uppercase tracking-widest dark:text-slate-400 text-slate-500">
                        Ringkasan Pembayaran
                    </p>
                </div>

                {/* Candidate info */}
                <div className="px-5 pt-4 pb-2 space-y-0">
                    {[
                        { label: 'Nama Kandidat',  value: candidate.full_name },
                        { label: 'Kode Kandidat',  value: candidate.candidate_code },
                        { label: 'Gelombang',       value: candidate.admission_wave ?? '—' },
                        ...(candidate.program_choice ? [{ label: 'Program', value: candidate.program_choice }] : []),
                    ].map((row) => (
                        <div key={row.label} className="checkout-row flex items-baseline justify-between py-2
                            border-b dark:border-white/[0.04] border-black/[0.04] last:border-0"
                            style={{ opacity: 0 }}>
                            <p className="text-[11px] dark:text-slate-500 text-slate-500 shrink-0">{row.label}</p>
                            <p className="text-[12px] font-medium dark:text-slate-300 text-slate-700 text-right ml-4 truncate max-w-[200px]">
                                {row.value}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Amount breakdown */}
                <div className="px-5 pb-4 pt-2 border-t dark:border-white/[0.06] border-black/[0.06] space-y-2">
                    <div className="checkout-row flex items-center justify-between" style={{ opacity: 0 }}>
                        <p className="text-[12px] dark:text-slate-400 text-slate-600">Biaya Pendaftaran</p>
                        <p className="text-[12px] font-medium dark:text-slate-300 text-slate-700">
                            {formatRupiah(payment.base_amount)}
                        </p>
                    </div>
                    {payment.fee_amount > 0 && (
                        <div className="checkout-row flex items-center justify-between" style={{ opacity: 0 }}>
                            <p className="text-[12px] dark:text-slate-400 text-slate-600">
                                {config?.gateway_fee_label ?? 'Biaya Layanan'}
                            </p>
                            <p className="text-[12px] font-medium dark:text-orange-400 text-orange-600">
                                + {formatRupiah(payment.fee_amount)}
                            </p>
                        </div>
                    )}
                    {/* Total */}
                    <div className="checkout-row flex items-center justify-between pt-2 border-t dark:border-white/[0.06] border-black/[0.06]"
                        style={{ opacity: 0 }}>
                        <p className="text-sm font-bold dark:text-slate-100 text-slate-800">Total Pembayaran</p>
                        <p className="text-lg font-bold dark:text-orange-400 text-orange-600">
                            {formatRupiah(payment.final_amount)}
                        </p>
                    </div>
                </div>

                {/* Order ID */}
                <div className="px-5 py-3 border-t dark:border-white/[0.06] border-black/[0.06]
                    dark:bg-white/[0.02] bg-slate-50/50">
                    <p className="text-[10px] dark:text-slate-600 text-slate-400 font-mono">
                        ID: {payment.order_id}
                    </p>
                </div>
            </div>

            {/* Expired notice */}
            {expired && (
                <div className="mb-4 p-4 rounded-xl border dark:border-rose-500/20 border-rose-200
                    dark:bg-rose-500/10 bg-rose-50">
                    <div className="flex items-start gap-3">
                        <i className="fa-solid fa-clock-rotate-left dark:text-rose-400 text-rose-500 mt-0.5" />
                        <div>
                            <p className="text-sm font-semibold dark:text-rose-300 text-rose-700">Transaksi Kadaluarsa</p>
                            <p className="text-[11px] dark:text-rose-400/70 text-rose-600/70 mt-0.5">
                                Transaksi ini sudah melewati batas waktu. Kembali dan buat transaksi baru.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Timer + CTA */}
            {!expired && (
                <div className="space-y-3 mb-4">
                    {/* Timer */}
                    {timeLeft && (
                        <div className="flex items-center justify-center gap-2 py-2">
                            <i className={`fa-regular fa-clock text-xs ${getTimerColor()}`} />
                            <p className={`text-xs font-mono font-semibold ${getTimerColor()}`}>
                                Batas waktu:{' '}
                                {String(timeLeft.hours).padStart(2, '0')}:
                                {String(timeLeft.minutes).padStart(2, '0')}:
                                {String(timeLeft.seconds).padStart(2, '0')}
                            </p>
                        </div>
                    )}

                    {/* Bayar button */}
                    <button
                        onClick={onPay}
                        disabled={processing || !payment.snap_token}
                        className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2
                            bg-orange-500 hover:bg-orange-400 text-white
                            disabled:opacity-50 disabled:cursor-not-allowed
                            transition-all duration-200 shadow-lg shadow-orange-500/20"
                    >
                        {processing ? (
                            <><i className="fa-solid fa-spinner fa-spin" /> Memuat Pembayaran...</>
                        ) : (
                            <><i className="fa-solid fa-bolt" /> Bayar Sekarang</>
                        )}
                    </button>

                    {/* Available methods */}
                    <div className="flex flex-wrap items-center justify-center gap-2 py-1">
                        {['GoPay', 'QRIS', 'VA BCA', 'VA BRI', 'VA Mandiri', 'Kartu Debit/Kredit'].map((m) => (
                            <span key={m} className="text-[10px] px-2 py-0.5 rounded-md
                                dark:bg-white/[0.04] bg-slate-100 dark:text-slate-500 text-slate-500
                                dark:border dark:border-white/[0.06] border border-black/[0.05]">
                                {m}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Cancel / Back */}
            <div className="flex gap-2">
                {payment.is_cancellable && !expired && (
                    <button
                        onClick={onCancel}
                        disabled={cancelling}
                        className="flex-1 py-2.5 rounded-xl text-xs font-semibold
                            dark:bg-white/[0.04] bg-slate-100 dark:text-slate-400 text-slate-600
                            dark:hover:bg-white/[0.08] hover:bg-slate-200
                            disabled:opacity-50 transition-all duration-150"
                    >
                        {cancelling ? (
                            <><i className="fa-solid fa-spinner fa-spin mr-1.5" />Membatalkan...</>
                        ) : (
                            'Batalkan Transaksi'
                        )}
                    </button>
                )}
                {expired && (
                    <button
                        onClick={onBack}
                        className="flex-1 py-2.5 rounded-xl text-xs font-semibold
                            dark:bg-white/[0.04] bg-slate-100 dark:text-slate-400 text-slate-600
                            dark:hover:bg-white/[0.08] hover:bg-slate-200 transition-all duration-150"
                    >
                        <i className="fa-solid fa-arrow-left mr-1.5" />
                        Buat Transaksi Baru
                    </button>
                )}
            </div>
        </div>
    )
}
