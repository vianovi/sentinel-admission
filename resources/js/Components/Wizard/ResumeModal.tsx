import { useEffect, useRef } from 'react'
import { animate } from 'animejs'
import { Link } from '@inertiajs/react'

interface MaskedData {
    name: string
    nisn: string
    nik: string
    draft_id?: number
    updated_at?: string
}

interface ResumeModalProps {
    status: 'draft' | 'registered'
    data: MaskedData
    onResume: () => void
    onStartNew: () => void
    onClose: () => void
}

export default function ResumeModal({ status, data, onResume, onStartNew, onClose }: ResumeModalProps) {
    const overlayRef = useRef<HTMLDivElement>(null)
    const cardRef    = useRef<HTMLDivElement>(null)

    useEffect(() => {
        animate(overlayRef.current!, { opacity: [0, 1], duration: 300, ease: 'outQuad' })
        animate(cardRef.current!, { opacity: [0, 1], translateY: [32, 0], scale: [0.96, 1], duration: 420, ease: 'outExpo' })
    }, [])

    const dismiss = (action: 'resume' | 'new' | 'close') => {
        animate(cardRef.current!, { opacity: [1, 0], translateY: [0, 20], scale: [1, 0.96], duration: 260, ease: 'inExpo' })
        animate(overlayRef.current!, {
            opacity: [1, 0], duration: 300, ease: 'inQuad',
            onComplete: () => {
                if (action === 'resume') onResume()
                else if (action === 'new') onStartNew()
                else onClose()
            },
        })
    }

    const DataRow = ({ label, value }: { label: string; value: string }) => (
        <div className="flex justify-between gap-3 text-sm">
            <span className="text-slate-500 flex-shrink-0">{label}</span>
            <span className="font-mono font-semibold text-slate-800 text-right">{value}</span>
        </div>
    )

    // ── Status: registered (sudah punya akun) ─────────────────────────────────
    if (status === 'registered') {
        return (
            <div ref={overlayRef} style={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
                <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm" />
                <div ref={cardRef} style={{ opacity: 0 }} className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
                    <div className="h-1 w-full bg-gradient-to-r from-emerald-400 to-emerald-500" />
                    <div className="p-6">
                        <div className="flex items-start gap-4 mb-5">
                            <div className="w-11 h-11 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center flex-shrink-0">
                                <i className="fa-solid fa-user-check text-emerald-500 text-lg"></i>
                            </div>
                            <div>
                                <h3 className="font-display font-bold text-slate-900 text-lg leading-tight">Sudah Terdaftar</h3>
                                <p className="text-xs text-slate-500 mt-1">NISN atau NIK ini sudah memiliki akun aktif di sistem.</p>
                            </div>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-2">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full">
                                    <i className="fa-solid fa-circle-check text-[9px]"></i> Terdaftar
                                </span>
                            </div>
                            <div className="space-y-2">
                                <DataRow label="Nama" value={data.name} />
                                <DataRow label="NISN" value={data.nisn} />
                                <DataRow label="NIK"  value={data.nik}  />
                            </div>
                        </div>
                        <div className="flex items-start gap-2 text-[11px] text-slate-400 mb-5 px-1">
                            <i className="fa-solid fa-shield-halved mt-0.5 flex-shrink-0"></i>
                            <span>Data ditampilkan sebagian untuk keamanan. Hanya pemilik yang mengetahui data lengkapnya.</span>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button type="button" onClick={() => dismiss('close')}
                                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition active:scale-95">
                                Kembali
                            </button>
                            <Link href="/login"
                                className="flex-1 px-4 py-2.5 rounded-xl bg-navy text-white text-sm font-bold text-center shadow-md hover:bg-navy/90 hover:-translate-y-0.5 transition active:scale-95">
                                <i className="fa-solid fa-right-to-bracket mr-1.5"></i> Login Sekarang
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // ── Status: draft (belum selesai daftar) ──────────────────────────────────
    return (
        <div ref={overlayRef} style={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm" />
            <div ref={cardRef} style={{ opacity: 0 }} className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
                <div className="h-1 w-full bg-gradient-to-r from-amber-400 via-gold to-amber-300" />
                <div className="p-6">
                    <div className="flex items-start gap-4 mb-5">
                        <div className="w-11 h-11 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center flex-shrink-0">
                            <i className="fa-solid fa-file-circle-question text-gold text-lg"></i>
                        </div>
                        <div>
                            <h3 className="font-display font-bold text-slate-900 text-lg leading-tight">Pendaftaran Belum Selesai</h3>
                            <p className="text-xs text-slate-500 mt-1">NISN atau NIK ini ditemukan dengan status belum terdaftar.</p>
                        </div>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-2">
                        <div className="flex items-center justify-between mb-3">
                            <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full">
                                <i className="fa-solid fa-clock text-[9px]"></i> Belum Terdaftar
                            </span>
                            {data.updated_at && <span className="text-[10px] text-slate-400">{data.updated_at}</span>}
                        </div>
                        <div className="space-y-2">
                            <DataRow label="Nama" value={data.name} />
                            <DataRow label="NISN" value={data.nisn} />
                            <DataRow label="NIK"  value={data.nik}  />
                        </div>
                    </div>
                    <div className="flex items-start gap-2 text-[11px] text-slate-400 mb-4 px-1">
                        <i className="fa-solid fa-shield-halved mt-0.5 flex-shrink-0"></i>
                        <span>Data ditampilkan sebagian untuk keamanan. Draft dihapus otomatis jika melewati batas waktu.</span>
                    </div>
                    <p className="text-sm text-slate-600 mb-5 font-medium">Apakah ini milikmu? Lanjutkan atau mulai pendaftaran baru.</p>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button type="button" onClick={() => dismiss('new')}
                            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition active:scale-95">
                            Mulai Baru
                        </button>
                        <button type="button" onClick={() => dismiss('resume')}
                            className="flex-1 px-4 py-2.5 rounded-xl bg-gold text-slate-900 text-sm font-bold shadow-md shadow-amber-200/50 hover:shadow-lg hover:-translate-y-0.5 transition active:scale-95">
                            <i className="fa-solid fa-rotate-right mr-1.5"></i> Lanjutkan
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
