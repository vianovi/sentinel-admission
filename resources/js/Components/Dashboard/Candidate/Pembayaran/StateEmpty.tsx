// resources/js/Components/Dashboard/Candidate/Pembayaran/StateEmpty.tsx

import { useEffect, useRef } from 'react'
import { animate, stagger }  from 'animejs'

type Props = {
    wave: {
        title:            string
        academic_year:    string
        registration_fee: number
    } | null
    processing: boolean
    onCreateTransaction: () => void
}

function formatRupiah(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
        style:    'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(amount)
}

export default function StateEmpty({ wave, processing, onCreateTransaction }: Props) {
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!ref.current) return
        animate(ref.current.querySelectorAll('.anim-item'), {
            opacity:      [0, 1],
            translateY:   [20, 0],
            duration:     600,
            delay:        stagger(80),
            ease:         'outExpo',
        })
    }, [])

    return (
        <div ref={ref} className="flex flex-col gap-4">

            {/* ── Ilustrasi ───────────────────────────────────── */}
            <div className="anim-item flex flex-col items-center justify-center py-8 gap-4">
                <div className="relative">
                    <div className="w-20 h-20 rounded-2xl bg-gold/8 border border-gold/15 flex justify-content-center items-center justify-center">
                        <i className="fa-solid fa-wallet text-3xl text-gold/60"></i>
                    </div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-navy border border-amber-400/30 flex items-center justify-center">
                        <i className="fa-solid fa-arrow-right text-amber-400 text-[9px]"></i>
                    </div>
                </div>
                <div className="text-center">
                    <p className="text-sm font-semibold text-white">Belum Ada Transaksi</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs">
                        Buat transaksi pembayaran untuk melanjutkan proses pendaftaran.
                    </p>
                </div>
            </div>

            {/* ── Detail biaya ─────────────────────────────────── */}
            {wave && (
                <div className="anim-item bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
                    <p className="text-[10px] text-slate-600 uppercase tracking-widest mb-4">Rincian Pembayaran</p>

                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-slate-400">Biaya Pendaftaran</span>
                        <span className="text-sm font-semibold text-white">{formatRupiah(wave.registration_fee)}</span>
                    </div>
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-slate-400">Gelombang</span>
                        <span className="text-sm text-slate-300">{wave.title}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-400">Tahun Akademik</span>
                        <span className="text-sm text-slate-300">{wave.academic_year}</span>
                    </div>

                    <div className="border-t border-white/[0.06] mt-4 pt-4 flex items-center justify-between">
                        <span className="text-sm font-bold text-white">Total</span>
                        <span className="text-xl font-bold text-gold">{formatRupiah(wave.registration_fee)}</span>
                    </div>
                </div>
            )}

            {/* ── Metode pembayaran tersedia ───────────────────── */}
            <div className="anim-item bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
                <p className="text-[10px] text-slate-600 uppercase tracking-widest mb-3">Metode yang Tersedia</p>
                <div className="grid grid-cols-4 gap-2">
                    {[
                        { icon: 'fa-qrcode',       label: 'QRIS'   },
                        { icon: 'fa-building-columns', label: 'VA Bank' },
                        { icon: 'fa-mobile-screen', label: 'GoPay'  },
                        { icon: 'fa-ellipsis',      label: 'Lainnya'},
                    ].map((m) => (
                        <div key={m.label} className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                            <i className={`fa-solid ${m.icon} text-slate-500 text-sm`}></i>
                            <span className="text-[10px] text-slate-600">{m.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── CTA ─────────────────────────────────────────── */}
            <div className="anim-item">
                <button
                    onClick={onCreateTransaction}
                    disabled={processing || !wave}
                    className="w-full bg-gold hover:bg-goldhover disabled:opacity-50 text-navy font-bold text-sm px-6 py-3.5 rounded-xl shadow-glow transition hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2"
                >
                    {processing
                        ? <><i className="fa-solid fa-spinner fa-spin"></i> Membuat Transaksi...</>
                        : <><i className="fa-solid fa-lock-open"></i> Buat Transaksi Pembayaran</>
                    }
                </button>
                <p className="text-[11px] text-slate-600 text-center mt-2">
                    Transaksi berlaku selama 24 jam setelah dibuat
                </p>
            </div>

        </div>
    )
}
