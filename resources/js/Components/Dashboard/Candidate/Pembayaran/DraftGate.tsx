// =============================================================================
// LOKASI FILE: resources/js/Components/Dashboard/Candidate/Pembayaran/DraftGate.tsx
// =============================================================================

import { useEffect, useRef } from 'react'
import { animate, stagger }  from 'animejs'
import { router }            from '@inertiajs/react'

// ─────────────────────────────────────────────────────────────────────────────
// PROGRESS STEPS
// ─────────────────────────────────────────────────────────────────────────────

const STEPS = [
    { label: 'Data Diri',      icon: 'fa-solid fa-id-card',      href: '/dashboard/data-diri' },
    { label: 'Data Kesehatan', icon: 'fa-solid fa-heart-pulse',   href: '/dashboard/data-kesehatan' },
    { label: 'Data Wali',      icon: 'fa-solid fa-people-roof',   href: '/dashboard/data-wali' },
    { label: 'Dokumen',        icon: 'fa-solid fa-file-lines',    href: '/dashboard/data-dokumen' },
]

type Props = {
    candidateName: string
    reason?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function DraftGate({ candidateName, reason }: Props) {
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        animate('.gate-item', {
            opacity:    [0, 1],
            translateY: [16, 0],
            duration:   450,
            delay:      stagger(80),
            ease:       'outExpo',
        })
    }, [])

    return (
        <div ref={containerRef} className="max-w-lg">
            {/* Illustration area */}
            <div className="gate-item opacity-0 mb-6 p-5 rounded-2xl border
                dark:border-amber-500/20 border-amber-200/60
                dark:bg-amber-500/[0.05] bg-amber-50/60 relative overflow-hidden">

                <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full
                    dark:bg-amber-500/10 bg-amber-300/15 blur-xl pointer-events-none" />

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center
                            dark:bg-amber-500/20 bg-amber-100 dark:text-amber-400 text-amber-600">
                            <i className="fa-solid fa-lock text-sm" />
                        </div>
                        <div>
                            <p className="text-sm font-bold dark:text-slate-100 text-slate-800">
                                Halaman Belum Terbuka
                            </p>
                            <p className="text-[11px] dark:text-amber-400/70 text-amber-700/70">
                                {reason ?? 'Lengkapi data terlebih dahulu'}
                            </p>
                        </div>
                    </div>
                    <p className="text-[12px] dark:text-slate-400 text-slate-600 leading-relaxed">
                        Halo <strong className="dark:text-slate-200 text-slate-800">{candidateName.split(' ')[0]}</strong>!
                        {reason
                            ? ` ${reason}`
                            : ' Halaman pembayaran akan terbuka otomatis setelah semua data wajib di bawah ini sudah diisi dengan lengkap.'}
                    </p>
                </div>
            </div>

            {/* Progress steps */}
            <div className="space-y-2 mb-6">
                {STEPS.map((step) => (
                    <button
                        key={step.label}
                        onClick={() => router.visit(step.href)}
                        className="gate-item opacity-0 w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border
                            dark:border-white/[0.07] border-black/[0.07]
                            dark:bg-white/[0.02] bg-white
                            dark:hover:bg-white/[0.05] hover:bg-slate-50
                            transition-all duration-150 group text-left"
                    >
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0
                            dark:bg-white/[0.05] bg-slate-100 dark:text-slate-400 text-slate-500
                            dark:group-hover:bg-orange-500/15 group-hover:bg-orange-50
                            dark:group-hover:text-orange-400 group-hover:text-orange-600
                            transition-all duration-150">
                            <i className={`${step.icon} text-sm`} />
                        </div>
                        <p className="text-sm font-medium dark:text-slate-300 text-slate-700 flex-1">
                            {step.label}
                        </p>
                        <i className="fa-solid fa-chevron-right text-[10px] dark:text-slate-600 text-slate-400
                            group-hover:translate-x-0.5 transition-transform duration-150" />
                    </button>
                ))}
            </div>

            {/* Info note */}
            <div className="gate-item opacity-0 flex items-start gap-2 px-4 py-3 rounded-xl
                dark:bg-white/[0.02] bg-slate-50 border dark:border-white/[0.05] border-black/[0.05]">
                <i className="fa-solid fa-circle-info dark:text-slate-600 text-slate-400 text-xs mt-0.5 shrink-0" />
                <p className="text-[11px] dark:text-slate-500 text-slate-500 leading-relaxed">
                    Sistem akan otomatis membuka halaman pembayaran setelah semua data terisi. Tidak perlu muat ulang halaman.
                </p>
            </div>
        </div>
    )
}
