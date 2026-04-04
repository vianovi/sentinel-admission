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
    gateway_fee_type:        string
    gateway_fee_value:       number
    gateway_fee_label:       string
    bank_name:               string | null
    bank_account_number:     string | null
    bank_account_name:       string | null
    bank_logo_key:           string | null
    whatsapp_contact_label:  string | null
}

type Props = {
    baseAmount:   number
    config:       Config | null
    onSelect:     (channel: 'gateway' | 'transfer' | 'cash') => void
    processing:   boolean
    candidateName: string
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const formatRupiah = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

const calcFee = (base: number, config: Config | null): number => {
    if (!config) return 0
    if (config.gateway_fee_type === 'percentage') return Math.round(base * config.gateway_fee_value / 100)
    return config.gateway_fee_value
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
    delay:       number
}

function ChannelCard({
    icon, label, recommended, badge, badgeColor,
    description, points, feeNote, feeColor,
    onSelect, processing, delay,
}: CardProps) {
    const cardRef  = useRef<HTMLDivElement>(null)
    const [hover, setHover] = useState(false)

    const handleClick = () => {
        if (processing) return
        // Ripple effect sebelum navigate
        animate(cardRef.current!, {
            scale:    [1, 0.97, 1],
            duration: 280,
            ease:     'outExpo',
        })
        setTimeout(onSelect, 180)
    }

    return (
        <div
            ref={cardRef}
            className={`channel-card relative rounded-2xl border cursor-pointer transition-all duration-300 overflow-hidden
                ${recommended
                    ? 'dark:border-orange-500/40 border-orange-400/50 dark:bg-orange-500/[0.06] bg-orange-50/80'
                    : 'dark:border-white/[0.08] border-black/[0.08] dark:bg-white/[0.02] bg-white/80'
                }
                ${hover && !processing ? 'dark:shadow-[0_0_32px_rgba(249,115,22,0.12)] shadow-[0_4px_24px_rgba(0,0,0,0.08)] -translate-y-0.5' : ''}
            `}
            style={{ opacity: 0 }}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            onClick={handleClick}
        >
            {/* Recommended glow */}
            {recommended && (
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full
                        dark:bg-orange-500/10 bg-orange-400/8 blur-2xl" />
                </div>
            )}

            <div className="p-5 relative z-10">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-base
                            ${recommended
                                ? 'dark:bg-orange-500/20 bg-orange-100 dark:text-orange-400 text-orange-600'
                                : 'dark:bg-white/[0.06] bg-slate-100 dark:text-slate-400 text-slate-500'
                            }`}>
                            <i className={icon} />
                        </div>
                        <div>
                            <p className="text-sm font-bold dark:text-slate-100 text-slate-800">{label}</p>
                            <p className={`text-[10px] font-semibold uppercase tracking-wider mt-0.5 ${badgeColor}`}>{badge}</p>
                        </div>
                    </div>
                    {recommended && (
                        <span className="recommended-badge flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold
                            dark:bg-orange-500/20 bg-orange-100 dark:text-orange-400 text-orange-600
                            dark:border dark:border-orange-500/20 border border-orange-300/50">
                            <i className="fa-solid fa-star text-[8px]" />
                            Disarankan
                        </span>
                    )}
                </div>

                {/* Description */}
                <p className="text-[12px] dark:text-slate-400 text-slate-600 leading-relaxed mb-3">
                    {description}
                </p>

                {/* Points */}
                <ul className="space-y-1.5 mb-4">
                    {points.map((pt, i) => (
                        <li key={i} className="flex items-start gap-2 text-[11px] dark:text-slate-500 text-slate-500">
                            <i className={`fa-solid fa-circle-check text-[9px] mt-0.5 shrink-0
                                ${recommended ? 'dark:text-orange-500 text-orange-500' : 'dark:text-slate-600 text-slate-400'}`} />
                            {pt}
                        </li>
                    ))}
                </ul>

                {/* Fee note */}
                <div className={`text-[11px] font-medium px-3 py-2 rounded-xl border mb-4
                    ${feeColor}`}>
                    <i className="fa-solid fa-circle-info text-[9px] mr-1.5" />
                    {feeNote}
                </div>

                {/* CTA */}
                <button
                    disabled={processing}
                    onClick={(e) => { e.stopPropagation(); handleClick() }}
                    className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2
                        ${recommended
                            ? 'dark:bg-orange-500 bg-orange-500 text-white dark:hover:bg-orange-400 hover:bg-orange-400'
                            : 'dark:bg-white/[0.06] bg-slate-100 dark:text-slate-200 text-slate-700 dark:hover:bg-white/[0.1] hover:bg-slate-200'
                        }
                        disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                    {processing ? (
                        <><i className="fa-solid fa-spinner fa-spin" /> Memproses...</>
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

export default function ChannelSelection({ baseAmount, config, onSelect, processing, candidateName }: Props) {
    const feeAmount    = calcFee(baseAmount, config)
    const gatewayTotal = baseAmount + feeAmount
    const [popup, setPopup] = useState<'alur' | 'bantuan' | null>(null)

    useEffect(() => {
        // Stagger entrance semua card
        animate('.channel-card', {
            opacity:    [0, 1],
            translateY: [24, 0],
            duration:   550,
            delay:      stagger(100, { start: 200 }),
            ease:       'outExpo',
        })
        // Info pills entrance
        animate('.info-pill', {
            opacity:    [0, 1],
            translateY: [12, 0],
            duration:   400,
            delay:      stagger(80, { start: 600 }),
            ease:       'outExpo',
        })
        // Pulse recommended badge
        animate('.recommended-badge', {
            scale:    [1, 1.04, 1],
            duration: 2000,
            loop:     true,
            ease:     'inOutSine',
        })
    }, [])

    const channels: CardProps[] = [
        {
            icon:        'fa-solid fa-bolt',
            label:       'Bayar via Gateway',
            recommended: true,
            badge:       'Otomatis · Terverifikasi Instan',
            badgeColor:  'dark:text-orange-500 text-orange-600',
            description: 'Pembayaran diproses otomatis oleh sistem. Terkonfirmasi dalam hitungan menit tanpa perlu menunggu staff.',
            points: [
                'GoPay, QRIS, Virtual Account BCA/BRI/Mandiri',
                'Kartu Debit & Kredit semua bank',
                'Status langsung terupdate di dashboard',
            ],
            feeNote:  config
                ? `${config.gateway_fee_label}: ${formatRupiah(feeAmount)} → Total ${formatRupiah(gatewayTotal)}`
                : 'Biaya layanan gateway akan ditampilkan',
            feeColor: 'dark:bg-orange-500/10 dark:border-orange-500/20 dark:text-orange-400 bg-orange-50 border-orange-200 text-orange-700',
            onSelect:   () => onSelect('gateway'),
            processing, delay: 0,
        },
        {
            icon:       'fa-solid fa-building-columns',
            label:      'Transfer Bank',
            badge:      'Manual · Verifikasi Staff',
            badgeColor: 'dark:text-slate-400 text-slate-500',
            description: 'Transfer ke rekening sekolah, kemudian upload bukti pembayaran untuk diverifikasi oleh tim PSB.',
            points: [
                'Upload foto/scan bukti transfer',
                'Verifikasi oleh staff PSB (hari kerja)',
                'Estimasi konfirmasi: 1×24 jam kerja',
            ],
            feeNote:  'Biaya transfer bergantung pada bank asal & tujuan Anda. Cek tarif di aplikasi bank masing-masing.',
            feeColor: 'dark:bg-slate-800/60 dark:border-white/[0.06] dark:text-slate-400 bg-slate-50 border-slate-200 text-slate-500',
            onSelect:   () => onSelect('transfer'),
            processing, delay: 100,
        },
        {
            icon:       'fa-solid fa-school',
            label:      'Bayar Langsung',
            badge:      'Cash · Datang ke Sekolah',
            badgeColor: 'dark:text-slate-400 text-slate-500',
            description: 'Datang langsung ke kantor sekolah dan bayar ke petugas. Upload foto kwitansi sebagai bukti pembayaran.',
            points: [
                'Bayar langsung ke bendahara/petugas',
                'Upload foto kwitansi resmi',
                'Verifikasi oleh staff PSB',
            ],
            feeNote:  'Tidak ada biaya tambahan dari sistem. Jam layanan sesuai jam kerja sekolah.',
            feeColor: 'dark:bg-slate-800/60 dark:border-white/[0.06] dark:text-slate-400 bg-slate-50 border-slate-200 text-slate-500',
            onSelect:   () => onSelect('cash'),
            processing, delay: 200,
        },
    ]

    return (
        <div>
            {/* Welcome greeting */}
            <div className="mb-6 p-5 rounded-2xl border dark:border-orange-500/20 border-orange-200/60
                dark:bg-orange-500/[0.04] bg-orange-50/60 relative overflow-hidden">
                <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full
                    dark:bg-orange-500/10 bg-orange-300/10 blur-2xl pointer-events-none" />
                <div className="relative z-10">
                    <p className="text-[11px] dark:text-orange-400/70 text-orange-600/70 font-semibold uppercase tracking-widest mb-1">
                        Tahap Terakhir
                    </p>
                    <p className="text-base font-bold dark:text-slate-100 text-slate-800 mb-1">
                        Selamat, {candidateName.split(' ')[0]}! 🎉
                    </p>
                    <p className="text-[12px] dark:text-slate-400 text-slate-600 leading-relaxed">
                        Kamu sudah mengisi semua data yang diperlukan. Satu langkah lagi — selesaikan pembayaran biaya pendaftaran untuk mengunci posisimu.
                    </p>
                </div>
            </div>

            {/* Nominal */}
            <div className="mb-5 flex items-center justify-between px-1">
                <p className="text-xs dark:text-slate-500 text-slate-500">Biaya Pendaftaran</p>
                <p className="text-lg font-bold dark:text-slate-100 text-slate-800">
                    {formatRupiah(baseAmount)}
                </p>
            </div>

            {/* Channel cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                {channels.map((ch) => (
                    <ChannelCard key={ch.label} {...ch} />
                ))}
            </div>

            {/* Info pills */}
            <div className="flex flex-wrap gap-2">
                {[
                    { key: 'alur',    icon: 'fa-solid fa-list-check',   label: 'Alur Pembayaran' },
                    { key: 'bantuan', icon: 'fa-solid fa-headset',       label: 'Butuh Bantuan?' },
                ].map((pill) => (
                    <button
                        key={pill.key}
                        onClick={() => setPopup(pill.key as any)}
                        className="info-pill opacity-0 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium
                            dark:bg-white/[0.04] bg-slate-100 dark:border dark:border-white/[0.06] border border-black/[0.06]
                            dark:text-slate-400 text-slate-600 dark:hover:bg-white/[0.08] hover:bg-slate-200
                            transition-all duration-200"
                    >
                        <i className={`${pill.icon} text-[10px]`} />
                        {pill.label}
                    </button>
                ))}
            </div>

            {/* Popups */}
            {popup && (
                <InfoPopup
                    type={popup}
                    onClose={() => setPopup(null)}
                />
            )}
        </div>
    )
}
