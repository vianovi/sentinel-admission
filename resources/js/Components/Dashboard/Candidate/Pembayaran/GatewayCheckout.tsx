// =============================================================================
// LOKASI FILE: resources/js/Components/Dashboard/Candidate/Pembayaran/GatewayCheckout.tsx
// =============================================================================

import { useEffect, useRef, useState } from 'react'
import { animate, stagger }            from 'animejs'
import useCountdown                     from './useCountdown'

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type Payment = {
    id:             number
    order_id:       string
    snap_token:     string | null
    base_amount:    number
    fee_amount:     number
    final_amount:   number
    status:         string
    expired_at:     string | null
    is_expired:     boolean
    is_cancellable: boolean
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
    payment:    Payment
    candidate:  CandidateInfo
    config:     Config | null
    processing: boolean
    cancelling: boolean
    onPay:      () => void
    onCancel:   () => void
    onBack:     () => void
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const formatRupiah = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

const formatDateTime = (iso: string | null) => {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    })
}

const formatExpiredLabel = (iso: string | null) => {
    if (!iso) return null
    return new Date(iso).toLocaleDateString('id-ID', {
        weekday: 'short', day: 'numeric', month: 'short',
        hour: '2-digit', minute: '2-digit',
    })
}

// ─────────────────────────────────────────────────────────────────────────────
// PAYMENT METHODS
// ─────────────────────────────────────────────────────────────────────────────

// Logo URLs — pakai direct CDN / official asset yang stabil
// Clearbit untuk bank, direct CDN untuk e-wallet yang punya asset publik
const PAYMENT_METHODS = [
    // E-Wallets
    { logo: 'https://logo.clearbit.com/gojek.com',    label: 'GoPay',      sub: 'e-Wallet Gojek',    group: 'wallet' },
    { logo: 'https://logo.clearbit.com/dana.id',      label: 'DANA',       sub: 'e-Wallet',          group: 'wallet' },
    { logo: 'https://logo.clearbit.com/ovo.id',       label: 'OVO',        sub: 'e-Wallet',          group: 'wallet' },
    { logo: 'https://logo.clearbit.com/shopee.co.id', label: 'ShopeePay', sub: 'e-Wallet Shopee',   group: 'wallet' },
    { logo: 'https://logo.clearbit.com/linkaja.id',   label: 'LinkAja',    sub: 'e-Wallet Telkom',   group: 'wallet' },
    // QRIS
    { logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Logo_QRIS.svg/800px-Logo_QRIS.svg.png',
             label: 'QRIS',         sub: 'Semua e-Wallet',    group: 'qris' },
    // Virtual Account
    { logo: 'https://logo.clearbit.com/bca.co.id',         label: 'BCA',     sub: 'Virtual Account', group: 'bank' },
    { logo: 'https://logo.clearbit.com/bri.co.id',         label: 'BRI',     sub: 'Virtual Account', group: 'bank' },
    { logo: 'https://logo.clearbit.com/bankmandiri.co.id', label: 'Mandiri', sub: 'Virtual Account', group: 'bank' },
    { logo: 'https://logo.clearbit.com/bni.co.id',         label: 'BNI',     sub: 'Virtual Account', group: 'bank' },
    { logo: 'https://logo.clearbit.com/bankbsi.co.id',     label: 'BSI',     sub: 'Virtual Account', group: 'bank' },
    // Kartu
    { logo: null, label: 'Kartu Kredit/Debit', sub: 'Visa, Mastercard, JCB', group: 'card', icon: 'fa-regular fa-credit-card' },
]

function MethodIcon({ logo, icon }: { logo: string | null; icon?: string }) {
    const [err, setErr] = useState(false)

    if (logo && !err) {
        return (
            <img
                src={logo}
                alt=""
                className="w-5 h-5 object-contain rounded drop-shadow-sm"
                onError={() => setErr(true)}
            />
        )
    }
    return <i className={`${icon ?? 'fa-solid fa-building-columns'} text-xs dark:text-slate-400 text-slate-500`} />
}

// ─────────────────────────────────────────────────────────────────────────────
// RING TIMER — premium glowing SVG
// ─────────────────────────────────────────────────────────────────────────────

function RingTimer({ expiredAt }: { expiredAt: string | null }) {
    const { timeLeft, isExpired } = useCountdown(expiredAt)

    const RADIUS = 52
    const STROKE = 5
    const CIRCUM = 2 * Math.PI * RADIUS
    const TOTAL  = 24 * 3600
    const SIZE   = (RADIUS + STROKE + 6) * 2

    if (isExpired || !expiredAt || !timeLeft) return null

    const totalSecs = timeLeft.hours * 3600 + timeLeft.minutes * 60 + timeLeft.seconds
    const pct       = Math.max(0, totalSecs / TOTAL)
    const dash      = CIRCUM * pct

    const color     = totalSecs < 300 ? '#f43f5e' : totalSecs < 1800 ? '#f59e0b' : '#10b981'
    const textCls   = totalSecs < 300
        ? 'dark:text-rose-400 text-rose-500'
        : totalSecs < 1800
            ? 'dark:text-amber-400 text-amber-500'
            : 'dark:text-emerald-400 text-emerald-600'

    return (
        <div className="flex flex-col items-center gap-4">
            {/* Glow filter */}
            <svg width="0" height="0" className="absolute">
                <defs>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </defs>
            </svg>

            <div className="relative" style={{ width: SIZE, height: SIZE }}>
                <svg width={SIZE} height={SIZE} className="-rotate-90">
                    {/* Track */}
                    <circle cx={SIZE/2} cy={SIZE/2} r={RADIUS} fill="none"
                        stroke="currentColor" strokeWidth={STROKE}
                        className="dark:text-slate-800 text-slate-100" />
                    {/* Glow layer */}
                    <circle cx={SIZE/2} cy={SIZE/2} r={RADIUS} fill="none"
                        stroke={color} strokeWidth={STROKE + 4} strokeLinecap="round"
                        strokeDasharray={`${dash} ${CIRCUM - dash}`}
                        opacity="0.15"
                        style={{ transition: 'stroke-dasharray 1s linear, stroke 0.5s' }} />
                    {/* Main ring */}
                    <circle cx={SIZE/2} cy={SIZE/2} r={RADIUS} fill="none"
                        stroke={color} strokeWidth={STROKE} strokeLinecap="round"
                        strokeDasharray={`${dash} ${CIRCUM - dash}`}
                        style={{ transition: 'stroke-dasharray 1s linear, stroke 0.5s' }}
                        filter="url(#glow)" />
                </svg>

                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-2xl font-black tabular-nums tracking-tight leading-none ${textCls}`}>
                        {String(timeLeft.hours).padStart(2,'0')}:{String(timeLeft.minutes).padStart(2,'0')}
                    </span>
                    <span className={`text-xs font-bold mt-0.5 ${textCls}`}>
                        {String(timeLeft.seconds).padStart(2,'0')}s
                    </span>
                </div>
            </div>

            {/* Label */}
            <div className="text-center">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] dark:text-slate-500 text-slate-400 mb-1.5">
                    Batas Pembayaran
                </p>
                <span className="text-xs font-semibold dark:text-slate-300 text-slate-600
                    dark:bg-white/[0.05] bg-slate-100
                    border dark:border-white/[0.06] border-slate-200
                    px-3 py-1 rounded-full">
                    {formatExpiredLabel(expiredAt)}
                </span>
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function GatewayCheckout({
    payment, candidate, config, processing, cancelling, onPay, onCancel, onBack,
}: Props) {
    const ref     = useRef<HTMLDivElement>(null)
    const expired = payment.is_expired

    const createdAt = payment.expired_at
        ? new Date(new Date(payment.expired_at).getTime() - 24 * 3600 * 1000).toISOString()
        : null

    useEffect(() => {
        if (!ref.current) return
        animate(ref.current, { opacity: [0,1], translateX: [20,0], duration: 400, ease: 'outExpo' })
        animate('.gw-s', {
            opacity:    [0, 1],
            translateY: [16, 0],
            duration:   450,
            delay:      stagger(70, { start: 100 }),
            ease:       'outExpo',
        })
    }, [])

    return (
        <div ref={ref} style={{ opacity: 0 }} className="w-full">

            {/* ── Top Bar ─────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between mb-6 pt-1">
                <button onClick={onBack}
                    className="gw-s inline-flex items-center gap-2 px-4 py-2 rounded-full
                        dark:bg-white/[0.03] bg-white
                        border dark:border-white/[0.07] border-slate-200
                        text-xs font-bold dark:text-slate-400 text-slate-500
                        dark:hover:text-white hover:text-slate-800
                        dark:hover:border-white/[0.12] hover:border-slate-300
                        transition-all shadow-sm group">
                    <i className="fa-solid fa-arrow-left text-[10px] group-hover:-translate-x-0.5 transition-transform" />
                    Kembali
                </button>

                <div className="gw-s px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest
                    dark:bg-amber-500/10 bg-amber-50
                    dark:border dark:border-amber-500/20 border border-amber-200
                    dark:text-amber-400 text-amber-600">
                    Menunggu Pembayaran
                </div>
            </div>

            {/* ── Main Layout: 7/5 cols ───────────────────────────────────── */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">

                {/* ══ KIRI: Digital Receipt Card (7 cols) ══════════════════ */}
                <div className="gw-s xl:col-span-7">
                    <div className="relative dark:bg-slate-900/80 bg-white backdrop-blur-xl
                        rounded-[1.75rem] border dark:border-white/[0.08] border-slate-200
                        shadow-xl dark:shadow-black/30 overflow-hidden">

                        {/* Gold accent line di atas */}
                        <div className="h-[3px] w-full"
                            style={{ background: 'linear-gradient(to right, #d4a017, #f59e0b, #d4a017)' }} />

                        <div className="p-7 sm:p-8">
                            {/* Total header */}
                            <div className="flex items-start justify-between mb-7">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em]
                                        dark:text-slate-500 text-slate-400 mb-2">
                                        Total Tagihan
                                    </p>
                                    <div className="flex items-start gap-1.5">
                                        <span className="text-lg font-bold dark:text-slate-400 text-slate-500 mt-1.5">Rp</span>
                                        <span className="text-5xl font-black dark:text-white text-slate-900 tracking-tight leading-none">
                                            {payment.final_amount.toLocaleString('id-ID')}
                                        </span>
                                    </div>
                                    {payment.fee_amount > 0 && (
                                        <p className="text-[11px] dark:text-amber-400/70 text-amber-600/80 mt-2">
                                            Sudah termasuk {config?.gateway_fee_label ?? 'biaya layanan'} {formatRupiah(payment.fee_amount)}
                                        </p>
                                    )}
                                </div>

                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0
                                    dark:bg-amber-500/10 bg-amber-50
                                    dark:border dark:border-amber-500/20 border border-amber-200
                                    dark:text-amber-400 text-amber-600">
                                    <i className="fa-solid fa-file-invoice-dollar text-lg" />
                                </div>
                            </div>

                            {/* Dotted ticket divider */}
                            <div className="relative flex items-center w-full my-7">
                                <div className="h-px w-full border-t-2 border-dashed
                                    dark:border-slate-700 border-slate-200" />
                                <div className="absolute -left-10 w-5 h-5 rounded-full
                                    dark:bg-[#0d1117] bg-slate-50
                                    dark:border-r dark:border-white/[0.08] border-r border-slate-200" />
                                <div className="absolute -right-10 w-5 h-5 rounded-full
                                    dark:bg-[#0d1117] bg-slate-50
                                    dark:border-l dark:border-white/[0.08] border-l border-slate-200" />
                            </div>

                            {/* Detail rows — grid 2 kolom */}
                            <div className="space-y-5">
                                <div className="grid grid-cols-2 gap-5 pb-5
                                    border-b dark:border-white/[0.05] border-slate-100">
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest
                                            dark:text-slate-500 text-slate-400 mb-1.5">Order ID</p>
                                        <p className="text-xs font-mono font-bold
                                            dark:text-slate-200 text-slate-700 break-all">
                                            {payment.order_id}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest
                                            dark:text-slate-500 text-slate-400 mb-1.5">Tanggal</p>
                                        <p className="text-xs font-medium dark:text-slate-300 text-slate-600">
                                            {formatDateTime(createdAt)}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-5 pb-5
                                    border-b dark:border-white/[0.05] border-slate-100">
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest
                                            dark:text-slate-500 text-slate-400 mb-1.5">Kandidat</p>
                                        <p className="text-xs font-bold dark:text-slate-200 text-slate-700">
                                            {candidate.full_name}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest
                                            dark:text-slate-500 text-slate-400 mb-1.5">Kode</p>
                                        <p className="text-xs font-mono font-bold dark:text-slate-300 text-slate-600">
                                            {candidate.candidate_code}
                                        </p>
                                    </div>
                                </div>

                                {(candidate.admission_wave || candidate.program_choice) && (
                                    <div className="grid grid-cols-2 gap-5 pb-5
                                        border-b dark:border-white/[0.05] border-slate-100">
                                        {candidate.admission_wave && (
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-widest
                                                    dark:text-slate-500 text-slate-400 mb-1.5">Gelombang</p>
                                                <p className="text-xs font-medium dark:text-slate-300 text-slate-600">
                                                    {candidate.admission_wave}
                                                </p>
                                            </div>
                                        )}
                                        {candidate.program_choice && (
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-widest
                                                    dark:text-slate-500 text-slate-400 mb-1.5">Program</p>
                                                <p className="text-xs font-bold dark:text-blue-400 text-blue-600">
                                                    {candidate.program_choice}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Rincian biaya */}
                                <div className="space-y-2.5 pt-1">
                                    <div className="flex justify-between items-center">
                                        <p className="text-xs dark:text-slate-500 text-slate-400">Biaya Pendaftaran</p>
                                        <p className="text-sm font-bold dark:text-slate-300 text-slate-700">
                                            {formatRupiah(payment.base_amount)}
                                        </p>
                                    </div>
                                    {payment.fee_amount > 0 && (
                                        <div className="flex justify-between items-center">
                                            <p className="text-xs dark:text-slate-500 text-slate-400">
                                                {config?.gateway_fee_label ?? 'Biaya Layanan'}
                                            </p>
                                            <p className="text-sm font-bold dark:text-amber-400 text-amber-600">
                                                +{formatRupiah(payment.fee_amount)}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Info tambahan di bawah receipt — isi gap kosong */}
                    <div className="mt-3 grid grid-cols-2 gap-2">
                        <div className="flex items-start gap-2.5 p-3 rounded-2xl
                            dark:bg-white/[0.02] bg-slate-50
                            border dark:border-white/[0.05] border-slate-100">
                            <i className="fa-solid fa-shield-halved text-emerald-500 text-xs mt-0.5 shrink-0" />
                            <div>
                                <p className="text-[10px] font-bold dark:text-slate-300 text-slate-700">
                                    Transaksi Aman
                                </p>
                                <p className="text-[10px] dark:text-slate-500 text-slate-400 leading-snug mt-0.5">
                                    Diproses via Midtrans · PCI DSS Level 1
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-2.5 p-3 rounded-2xl
                            dark:bg-white/[0.02] bg-slate-50
                            border dark:border-white/[0.05] border-slate-100">
                            <i className="fa-solid fa-bolt text-amber-500 text-xs mt-0.5 shrink-0" />
                            <div>
                                <p className="text-[10px] font-bold dark:text-slate-300 text-slate-700">
                                    Konfirmasi Instan
                                </p>
                                <p className="text-[10px] dark:text-slate-500 text-slate-400 leading-snug mt-0.5">
                                    Status otomatis update setelah bayar
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ══ KANAN: Actions + Methods (5 cols) ════════════════════ */}
                <div className="xl:col-span-5 flex flex-col gap-4">

                    {/* Timer atau Expired */}
                    {expired ? (
                        <div className="gw-s rounded-[1.75rem] border dark:border-rose-500/20 border-rose-200
                            dark:bg-rose-500/[0.08] bg-rose-50 p-7 flex flex-col items-center text-center">
                            <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4
                                dark:bg-rose-500/20 bg-rose-100
                                dark:border dark:border-rose-500/30 border border-rose-200
                                dark:text-rose-400 text-rose-500">
                                <i className="fa-solid fa-clock-rotate-left text-xl" />
                            </div>
                            <p className="text-lg font-bold dark:text-rose-400 text-rose-700 mb-1.5">Waktu Habis</p>
                            <p className="text-xs dark:text-rose-400/70 text-rose-600/70 leading-relaxed mb-6">
                                Sesi pembayaran telah kadaluarsa. Batalkan dan buat pesanan baru.
                            </p>
                            <button onClick={onBack}
                                className="w-full py-3 rounded-2xl bg-rose-500 hover:bg-rose-600
                                    text-white font-bold text-sm shadow-lg shadow-rose-500/25
                                    transition-all active:scale-95">
                                Buat Transaksi Baru
                            </button>
                        </div>
                    ) : (
                        <div className="gw-s rounded-[1.75rem] border dark:border-white/[0.08] border-slate-200
                            dark:bg-slate-900/80 bg-white shadow-lg p-7 flex flex-col items-center">
                            <RingTimer expiredAt={payment.expired_at} />
                        </div>
                    )}

                    {/* Metode grid */}
                    <div className="gw-s rounded-[1.75rem] border dark:border-white/[0.08] border-slate-200
                        dark:bg-slate-900/80 bg-white shadow-lg p-6 flex-1 flex flex-col">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em]
                            dark:text-slate-500 text-slate-400 mb-4">
                            Mendukung Pembayaran Via
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4 flex-1">
                            {PAYMENT_METHODS.map((m) => (
                                <div key={m.label}
                                    className="flex items-center gap-2.5 p-2.5 rounded-xl
                                        dark:bg-white/[0.03] bg-slate-50/80
                                        border dark:border-white/[0.05] border-slate-100
                                        hover:dark:border-amber-500/20 hover:border-amber-200
                                        transition-colors duration-150">
                                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0
                                        dark:bg-black/30 bg-white
                                        border dark:border-white/[0.06] border-slate-100 shadow-sm">
                                        <MethodIcon logo={m.logo} icon={(m as any).icon} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[11px] font-bold dark:text-slate-200 text-slate-700 leading-tight">
                                            {m.label}
                                        </p>
                                        <p className="text-[9px] dark:text-slate-500 text-slate-400 leading-tight mt-0.5">
                                            {m.sub}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Security badge */}
                        <div className="mt-auto pt-4 border-t dark:border-white/[0.05] border-slate-100
                            flex items-center justify-center gap-2">
                            <i className="fa-solid fa-shield-halved text-emerald-500 text-xs" />
                            <span className="text-[10px] dark:text-slate-500 text-slate-400 font-medium">
                                Transaksi terenkripsi & aman
                            </span>
                        </div>
                    </div>

                    {/* CTA Bayar */}
                    {!expired && (
                        <button
                            onClick={onPay}
                            disabled={processing}
                            className="gw-s group relative overflow-hidden rounded-[1.25rem]
                                dark:bg-slate-900 bg-slate-900
                                border dark:border-white/[0.08] border-slate-800
                                shadow-[0_8px_32px_-8px_rgba(0,0,0,0.4)]
                                transition-all duration-200
                                hover:scale-[1.015] active:scale-[0.985]
                                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                                py-4 px-6"
                        >
                            {/* Gold sweep hover effect */}
                            <div className="absolute inset-0 w-0 group-hover:w-full transition-all duration-300 ease-out"
                                style={{ background: 'linear-gradient(to right, #d4a017, #f59e0b)' }} />

                            <div className="relative z-10 flex items-center justify-center gap-3">
                                <i className={`text-base transition-colors duration-200
                                    ${processing
                                        ? 'fa-solid fa-circle-notch fa-spin text-slate-400 group-hover:text-white'
                                        : 'fa-solid fa-lock text-slate-500 group-hover:text-white/80'
                                    }`} />
                                <span className="font-bold text-base text-white group-hover:text-white transition-colors duration-200">
                                    {processing ? 'Memproses...' : 'Lanjutkan Pembayaran'}
                                </span>
                            </div>
                        </button>
                    )}

                    {/* Batalkan */}
                    {(payment.is_cancellable && !expired) && (
                        <button
                            onClick={onCancel}
                            disabled={cancelling}
                            className="gw-s w-full py-2 text-xs font-bold
                                dark:text-slate-500 text-slate-400
                                dark:hover:text-rose-400 hover:text-rose-500
                                transition-colors duration-150 disabled:opacity-50"
                        >
                            {cancelling
                                ? <><i className="fa-solid fa-spinner fa-spin mr-1.5" />Membatalkan...</>
                                : 'Batalkan Transaksi Ini'
                            }
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}