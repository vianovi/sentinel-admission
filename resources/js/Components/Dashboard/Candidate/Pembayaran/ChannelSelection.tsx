// =============================================================================
// LOKASI FILE: resources/js/Components/Dashboard/Candidate/Pembayaran/ChannelSelection.tsx
// =============================================================================

import { useEffect, useRef, useState } from 'react'
import { animate, stagger }            from 'animejs'
import InfoPopup                        from './InfoPopup'

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type Config = {
    gateway_fee_type:       string
    gateway_fee_value:      number
    gateway_fee_label:      string
    bank_name:              string | null
    bank_account_number:    string | null
    bank_account_name:      string | null
    bank_logo_key:          string | null
    whatsapp_contact_label: string | null
}

type PaymentData = {
    payment_channel: string
    status:          string
    is_expired:      boolean
}

type Props = {
    baseAmount:    number
    config:        Config | null
    payment:       PaymentData | null
    onSelect:      (channel: 'gateway' | 'transfer' | 'cash') => void
    processing:    boolean
    candidateName: string
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const formatRupiah = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

// Format nama: kalau > 2 kata, ambil 2 kata pertama + singkatan sisanya
// Contoh: "Silvia Dewi Noviana Putri" → "Silvia Dewi N.P"
const formatDisplayName = (name: string): string => {
    const words = name.trim().split(' ')
    if (words.length <= 2) return name
    const first2  = words.slice(0, 2).join(' ')
    const rest    = words.slice(2).map(w => w[0].toUpperCase() + '.').join('')
    return `${first2} ${rest}`
}

const calcFee = (base: number, config: Config | null): number => {
    if (!config) return 0
    if (config.gateway_fee_type === 'percentage') return Math.round(base * config.gateway_fee_value / 100)
    return config.gateway_fee_value
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP PROGRESS — bubble pill style
// ─────────────────────────────────────────────────────────────────────────────

const PROGRESS_STEPS = [
    { label: 'Data Diri',  icon: 'fa-solid fa-id-card' },
    { label: 'Kesehatan',  icon: 'fa-solid fa-heart-pulse' },
    { label: 'Wali',       icon: 'fa-solid fa-people-roof' },
    { label: 'Dokumen',    icon: 'fa-solid fa-file-lines' },
    { label: 'Pembayaran', icon: 'fa-solid fa-credit-card' },
]

function StepProgress() {
    return (
        <div className="flex items-center gap-1 mb-5 overflow-x-auto pb-1">
            {PROGRESS_STEPS.map((step, i) => {
                const isDone   = i < 4
                const isActive = i === 4
                return (
                    <div key={step.label} className="flex items-center gap-1 shrink-0">
                        <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full
                            ${isDone
                                ? 'dark:bg-emerald-500/15 bg-emerald-100 dark:border dark:border-emerald-500/20 border border-emerald-200'
                                : isActive
                                    ? 'dark:bg-orange-500/20 bg-orange-100 dark:border dark:border-orange-500/30 border border-orange-300/60'
                                    : 'dark:bg-white/[0.04] bg-slate-100 dark:border dark:border-white/[0.06] border border-slate-200'
                            }`}>
                            <i className={`text-xs
                                ${isDone
                                    ? 'fa-solid fa-check dark:text-emerald-400 text-emerald-600'
                                    : `${step.icon} ${isActive
                                        ? 'dark:text-orange-400 text-orange-600'
                                        : 'dark:text-slate-600 text-slate-400'}`
                                }`} />
                            <span className={`text-xs font-semibold hidden sm:inline
                                ${isDone
                                    ? 'dark:text-emerald-400 text-emerald-600'
                                    : isActive
                                        ? 'dark:text-orange-400 text-orange-600'
                                        : 'dark:text-slate-600 text-slate-400'
                                }`}>
                                {step.label}
                            </span>
                        </div>
                        {i < PROGRESS_STEPS.length - 1 && (
                            <div className={`h-px w-2 sm:w-3 rounded-full shrink-0
                                ${isDone ? 'dark:bg-emerald-500/40 bg-emerald-300' : 'dark:bg-white/[0.08] bg-slate-200'}`} />
                        )}
                    </div>
                )
            })}
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// CHANNEL CARD
// ─────────────────────────────────────────────────────────────────────────────

type CardProps = {
    icon:        string
    label:       string
    recommended?: boolean
    badge:       string
    badgeColor:  string
    description: string
    points:      string[]
    feeNote:     string
    feeColor:    string
    onSelect:    () => void
    processing:  boolean
    blocked:     boolean
}

function ChannelCard({
    icon, label, recommended, badge, badgeColor,
    description, points, feeNote, feeColor,
    onSelect, processing, blocked,
}: CardProps) {
    const btnRef = useRef<HTMLButtonElement>(null)

    const handleBtnClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (processing || blocked) return
        animate(btnRef.current!, {
            scale:    [1, 0.94, 1],
            duration: 250,
            ease:     'outExpo',
        })
        setTimeout(onSelect, 150)
    }

    return (
        // Card sendiri tidak bisa diklik — hanya tombol CTA di dalam
        <div className={`relative rounded-2xl border overflow-hidden
            ${recommended
                ? 'dark:border-orange-500/40 border-orange-400/50 dark:bg-orange-500/[0.06] bg-orange-50/80'
                : 'dark:border-white/[0.08] border-black/[0.08] dark:bg-white/[0.02] bg-white/80'
            }
            ${blocked ? 'opacity-60' : ''}
        `}>
            {recommended && (
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full
                        dark:bg-orange-500/10 bg-orange-300/8 blur-2xl" />
                </div>
            )}

            <div className="p-5 relative z-10">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-base shrink-0
                            ${recommended
                                ? 'dark:bg-orange-500/20 bg-orange-100 dark:text-orange-400 text-orange-600'
                                : 'dark:bg-white/[0.06] bg-slate-100 dark:text-slate-400 text-slate-500'
                            }`}>
                            <i className={icon} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-bold dark:text-slate-100 text-slate-800 truncate">{label}</p>
                            <p className={`text-xs font-semibold uppercase tracking-wider mt-0.5 ${badgeColor}`}>{badge}</p>
                        </div>
                    </div>

                    {/* Badge recommended — icon only on mobile, text on sm+ */}
                    {recommended && (
                        <span className="recommended-badge flex items-center gap-1 px-2 py-1 rounded-lg shrink-0 ml-2
                            text-xs font-bold
                            dark:bg-orange-500/20 bg-orange-100 dark:text-orange-400 text-orange-600
                            dark:border dark:border-orange-500/20 border border-orange-300/50">
                            <i className="fa-solid fa-star text-[8px]" />
                            <span className="hidden sm:inline">Recommended</span>
                        </span>
                    )}
                </div>

                {/* Description */}
                <p className="text-[13px] dark:text-slate-400 text-slate-600 leading-relaxed mb-3">
                    {description}
                </p>

                {/* Points */}
                <ul className="space-y-1.5 mb-4">
                    {points.map((pt, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs dark:text-slate-500 text-slate-500">
                            <i className={`fa-solid fa-circle-check text-xs mt-0.5 shrink-0
                                ${recommended ? 'dark:text-orange-500 text-orange-500' : 'dark:text-slate-600 text-slate-400'}`} />
                            {pt}
                        </li>
                    ))}
                </ul>

                {/* Fee note */}
                <div className={`text-xs font-medium px-3 py-2 rounded-xl border mb-4 ${feeColor}`}>
                    <i className="fa-solid fa-circle-info text-xs mr-1.5" />
                    {feeNote}
                </div>

                {/* CTA — satu-satunya elemen yang clickable */}
                <button
                    ref={btnRef}
                    disabled={processing || blocked}
                    onClick={handleBtnClick}
                    className={`w-full py-2.5 rounded-xl text-sm font-semibold
                        flex items-center justify-center gap-2 transition-all duration-200
                        ${blocked
                            ? 'dark:bg-white/[0.04] bg-slate-100 dark:text-slate-600 text-slate-400 cursor-not-allowed'
                            : recommended
                                ? 'dark:bg-orange-500 bg-orange-500 text-white dark:hover:bg-orange-400 hover:bg-orange-400'
                                : 'dark:bg-white/[0.06] bg-slate-100 dark:text-slate-200 text-slate-700 dark:hover:bg-white/[0.1] hover:bg-slate-200'
                        }
                        disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                    {processing ? (
                        <><i className="fa-solid fa-spinner fa-spin" /> Memproses...</>
                    ) : blocked ? (
                        <><i className="fa-solid fa-lock text-xs" /> Ada Transaksi Aktif</>
                    ) : (
                        <><i className="fa-solid fa-arrow-right" /> Pilih Metode Ini</>
                    )}
                </button>
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function ChannelSelection({
    baseAmount, config, payment, onSelect, processing, candidateName,
}: Props) {
    const feeAmount        = calcFee(baseAmount, config)
    const gatewayTotal     = baseAmount + feeAmount
    const [popup, setPopup] = useState<'alur' | 'bantuan' | null>(null)

    // Blokir semua channel kalau ada transaksi pending yang belum expired
    const hasActivePayment = !!payment && payment.status === 'pending' && !payment.is_expired

    useEffect(() => {
        animate('.channel-card-wrap', {
            opacity:    [0, 1],
            translateY: [24, 0],
            duration:   550,
            delay:      stagger(100, { start: 200 }),
            ease:       'outExpo',
        })
        animate('.info-pill', {
            opacity:    [0, 1],
            translateY: [12, 0],
            duration:   400,
            delay:      stagger(80, { start: 600 }),
            ease:       'outExpo',
        })
        animate('.recommended-badge', {
            scale:    [1, 1.05, 1],
            duration: 2200,
            loop:     true,
            ease:     'inOutSine',
        })
    }, [])

    const channels: CardProps[] = [
        {
            icon:        'fa-solid fa-bolt',
            label:       'Bayar via Gateway',
            recommended: true,
            badge:       'Otomatis · Instan',
            badgeColor:  'dark:text-orange-500 text-orange-600',
            description: 'Pembayaran diproses otomatis. Terkonfirmasi dalam hitungan menit tanpa menunggu staff.',
            points: [
                'GoPay, QRIS, VA BCA/BRI/Mandiri',
                'Kartu Debit & Kredit semua bank',
                'Status terupdate otomatis',
            ],
            feeNote:  config
                ? `${config.gateway_fee_label}: ${formatRupiah(feeAmount)} → Total ${formatRupiah(gatewayTotal)}`
                : 'Biaya layanan gateway akan ditampilkan',
            feeColor: 'dark:bg-orange-500/10 dark:border-orange-500/20 dark:text-orange-400 bg-orange-50 border-orange-200 text-orange-700',
            onSelect: () => onSelect('gateway'),
            processing, blocked: hasActivePayment,
        },
        {
            icon:       'fa-solid fa-building-columns',
            label:      'Transfer Bank',
            badge:      'Manual · Staff Verifikasi',
            badgeColor: 'dark:text-slate-400 text-slate-500',
            description: 'Transfer ke rekening sekolah lalu upload bukti. Diverifikasi tim PSB hari kerja.',
            points: [
                'Upload foto/scan bukti transfer',
                'Verifikasi staff hari kerja',
                'Estimasi: 1×24 jam',
            ],
            feeNote:  'Biaya transfer bergantung bank asal & tujuan. Cek tarif di aplikasi bank Anda.',
            feeColor: 'dark:bg-slate-800/60 dark:border-white/[0.06] dark:text-slate-400 bg-slate-50 border-slate-200 text-slate-500',
            onSelect: () => onSelect('transfer'),
            processing, blocked: hasActivePayment,
        },
        {
            icon:       'fa-solid fa-school',
            label:      'Bayar Langsung',
            badge:      'Cash · Ke Sekolah',
            badgeColor: 'dark:text-slate-400 text-slate-500',
            description: 'Datang ke kantor sekolah dan bayar ke petugas. Upload foto kwitansi sebagai bukti.',
            points: [
                'Bayar ke bendahara/petugas',
                'Upload foto kwitansi resmi',
                'Verifikasi staff PSB',
            ],
            feeNote:  'Tidak ada biaya tambahan dari sistem. Sesuai jam kerja sekolah.',
            feeColor: 'dark:bg-slate-800/60 dark:border-white/[0.06] dark:text-slate-400 bg-slate-50 border-slate-200 text-slate-500',
            onSelect: () => onSelect('cash'),
            processing, blocked: hasActivePayment,
        },
    ]

    return (
        <div>
            {/* Step progress bubble */}
            <StepProgress />

            {/* Alert transaksi aktif */}
            {hasActivePayment && (
                <div className="mb-5 p-4 rounded-xl border dark:border-amber-500/25 border-amber-300/60
                    dark:bg-amber-500/[0.07] bg-amber-50">
                    <div className="flex items-start gap-3">
                        <i className="fa-solid fa-triangle-exclamation dark:text-amber-400 text-amber-600 mt-0.5 shrink-0" />
                        <div className="flex-1">
                            <p className="text-sm font-semibold dark:text-amber-300 text-amber-700">
                                Ada transaksi yang sedang berjalan
                            </p>
                            <p className="text-xs dark:text-amber-400/70 text-amber-600/70 mt-0.5">
                                Selesaikan atau batalkan transaksi aktif sebelum memilih metode baru.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => onSelect(payment!.payment_channel as any)}
                        className="mt-3 w-full py-2 rounded-xl text-xs font-semibold
                            dark:bg-amber-500/20 bg-amber-100 dark:text-amber-300 text-amber-700
                            dark:hover:bg-amber-500/30 hover:bg-amber-200 transition-colors duration-150"
                    >
                        <i className="fa-solid fa-arrow-right mr-1.5" />
                        Lanjutkan ke Transaksi Aktif
                    </button>
                </div>
            )}

            {/* Welcome greeting */}
            <div className="mb-5 p-5 rounded-2xl border dark:border-orange-500/20 border-orange-200/60
                dark:bg-orange-500/[0.04] bg-orange-50/60 relative overflow-hidden">
                <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full
                    dark:bg-orange-500/10 bg-orange-300/10 blur-2xl pointer-events-none" />
                <div className="relative z-10">
                    <p className="text-xs dark:text-orange-400/70 text-orange-600/70 font-semibold uppercase tracking-widest mb-1">
                        Tahap Terakhir
                    </p>
                    <p className="text-lg font-bold dark:text-slate-100 text-slate-800 mb-1.5">
                        Selamat, {formatDisplayName(candidateName)}! 🎉
                    </p>
                    <p className="text-sm dark:text-slate-400 text-slate-600 leading-relaxed">
                        Semua data sudah terisi dengan lengkap. Satu langkah lagi — selesaikan pembayaran untuk{' '}
                        <span className="dark:text-orange-400 text-orange-600 font-semibold">mengunci posisimu</span>
                        {' '}dan ikuti sesi seleksi masuk Al-Muntaha School.
                    </p>
                </div>
            </div>

            {/* Nominal */}
            <div className="mb-5 flex items-center justify-between px-1">
                <p className="text-sm dark:text-slate-500 text-slate-500">Biaya Pendaftaran</p>
                <p className="text-xl font-bold dark:text-slate-100 text-slate-800">
                    {formatRupiah(baseAmount)}
                </p>
            </div>

            {/* Channel cards — wrapper pakai class baru channel-card-wrap */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                {channels.map((ch) => (
                    <div key={ch.label} className="channel-card-wrap" style={{ opacity: 0 }}>
                        <ChannelCard {...ch} />
                    </div>
                ))}
            </div>

            {/* Info pills */}
            <div className="flex flex-wrap gap-2">
                {[
                    { key: 'alur',    icon: 'fa-solid fa-list-check', label: 'Alur Pembayaran' },
                    { key: 'bantuan', icon: 'fa-solid fa-headset',     label: 'Butuh Bantuan?' },
                ].map((pill) => (
                    <button
                        key={pill.key}
                        onClick={() => setPopup(pill.key as any)}
                        className="info-pill opacity-0 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium
                            dark:bg-white/[0.04] bg-slate-100
                            dark:border dark:border-white/[0.06] border border-black/[0.06]
                            dark:text-slate-400 text-slate-600
                            dark:hover:bg-white/[0.08] hover:bg-slate-200
                            transition-all duration-200"
                    >
                        <i className={`${pill.icon} text-xs`} />
                        {pill.label}
                    </button>
                ))}
            </div>

            {popup && <InfoPopup type={popup} onClose={() => setPopup(null)} />}
        </div>
    )
}