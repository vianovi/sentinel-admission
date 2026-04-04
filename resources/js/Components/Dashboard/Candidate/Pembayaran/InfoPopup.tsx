// =============================================================================
// LOKASI FILE: resources/js/Components/Dashboard/Candidate/Pembayaran/InfoPopup.tsx
// =============================================================================

import { useEffect, useRef } from 'react'
import { animate }           from 'animejs'

type Props = {
    type:    'alur' | 'bantuan'
    onClose: () => void
}

// ─────────────────────────────────────────────────────────────────────────────
// HARDCODED DATA
// ─────────────────────────────────────────────────────────────────────────────

const CONTACTS = [
    {
        name:     'Bendahara Khusus SPMB',
        role:     'Konfirmasi & Verifikasi Pembayaran',
        phone:    '08XXXXXXXXXX',
        icon:     'fa-solid fa-coins',
        color:    'dark:text-amber-400 text-amber-600',
        bgColor:  'dark:bg-amber-500/10 bg-amber-50',
    },
    {
        name:     'Sekretaris SPMB',
        role:     'Informasi Pendaftaran & Dokumen',
        phone:    '08XXXXXXXXXX',
        icon:     'fa-solid fa-file-signature',
        color:    'dark:text-blue-400 text-blue-600',
        bgColor:  'dark:bg-blue-500/10 bg-blue-50',
    },
    {
        name:     'Admin Sistem',
        role:     'Kendala Teknis & Bantuan Umum',
        phone:    '08XXXXXXXXXX',
        icon:     'fa-solid fa-headset',
        color:    'dark:text-violet-400 text-violet-600',
        bgColor:  'dark:bg-violet-500/10 bg-violet-50',
    },
]

const ALUR_STEPS = [
    {
        channel: 'Gateway (Otomatis)',
        icon:    'fa-solid fa-bolt',
        color:   'dark:text-orange-400 text-orange-600',
        bg:      'dark:bg-orange-500/10 bg-orange-50',
        steps: [
            'Pilih metode "Bayar via Gateway"',
            'Klik tombol "Bayar Sekarang"',
            'Pilih metode pembayaran di popup Midtrans',
            'Selesaikan pembayaran sesuai instruksi',
            'Status otomatis berubah menjadi "Lunas"',
        ],
    },
    {
        channel: 'Transfer Bank',
        icon:    'fa-solid fa-building-columns',
        color:   'dark:text-blue-400 text-blue-600',
        bg:      'dark:bg-blue-500/10 bg-blue-50',
        steps: [
            'Pilih metode "Transfer Bank"',
            'Catat nomor rekening & berita transfer',
            'Transfer sesuai nominal yang tertera',
            'Upload bukti transfer (foto/screenshot)',
            'Konfirmasi ke tim PSB via WhatsApp',
            'Tunggu verifikasi staff (1×24 jam kerja)',
        ],
    },
    {
        channel: 'Bayar Langsung (Cash)',
        icon:    'fa-solid fa-school',
        color:   'dark:text-emerald-400 text-emerald-600',
        bg:      'dark:bg-emerald-500/10 bg-emerald-50',
        steps: [
            'Pilih metode "Bayar Langsung"',
            'Datang ke kantor sekolah jam kerja',
            'Bayar ke bendahara/petugas PSB',
            'Minta kwitansi resmi',
            'Upload foto kwitansi di dashboard',
            'Tunggu verifikasi staff',
        ],
    },
]

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function InfoPopup({ type, onClose }: Props) {
    const overlayRef = useRef<HTMLDivElement>(null)
    const panelRef   = useRef<HTMLDivElement>(null)

    useEffect(() => {
        // Animate in
        animate(overlayRef.current!, {
            opacity:  [0, 1],
            duration: 200,
            ease:     'outQuad',
        })
        animate(panelRef.current!, {
            opacity:    [0, 1],
            translateY: [20, 0],
            scale:      [0.96, 1],
            duration:   320,
            ease:       'outExpo',
        })
    }, [])

    const handleClose = () => {
        animate(panelRef.current!, {
            opacity:    [1, 0],
            translateY: [0, 12],
            scale:      [1, 0.96],
            duration:   200,
            ease:       'inQuad',
        })
        animate(overlayRef.current!, {
            opacity:  [1, 0],
            duration: 220,
            ease:     'inQuad',
        })
        setTimeout(onClose, 220)
    }

    const generateWAUrl = (phone: string, name: string) => {
        const msg = `Halo ${name}, saya ingin bertanya mengenai pembayaran pendaftaran SPMB Al-Muntaha School. Mohon bantuannya 🙏`
        return `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`
    }

    return (
        <div
            ref={overlayRef}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', opacity: 0 }}
            onClick={(e) => { if (e.target === overlayRef.current) handleClose() }}
        >
            <div
                ref={panelRef}
                className="w-full max-w-lg max-h-[85vh] flex flex-col rounded-2xl border overflow-hidden
                    dark:border-white/[0.08] border-black/[0.08]
                    dark:bg-[#0d1424] bg-white"
                style={{ opacity: 0 }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b dark:border-white/[0.06] border-black/[0.06] shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center
                            dark:bg-orange-500/15 bg-orange-100 dark:text-orange-400 text-orange-600">
                            <i className={`text-xs ${type === 'alur' ? 'fa-solid fa-list-check' : 'fa-solid fa-headset'}`} />
                        </div>
                        <div>
                            <p className="text-sm font-bold dark:text-slate-100 text-slate-800">
                                {type === 'alur' ? 'Alur Pembayaran' : 'Butuh Bantuan?'}
                            </p>
                            <p className="text-[11px] dark:text-slate-500 text-slate-500">
                                {type === 'alur' ? 'Panduan per metode pembayaran' : 'Hubungi tim PSB kami'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="w-8 h-8 rounded-xl flex items-center justify-center
                            dark:bg-white/[0.05] bg-slate-100 dark:hover:bg-white/[0.1] hover:bg-slate-200
                            dark:text-slate-400 text-slate-500 transition-colors duration-150"
                    >
                        <i className="fa-solid fa-xmark text-xs" />
                    </button>
                </div>

                {/* Body — scrollable */}
                <div className="overflow-y-auto flex-1 p-5">
                    {type === 'alur' ? (
                        <div className="space-y-5">
                            {ALUR_STEPS.map((channel) => (
                                <div key={channel.channel}>
                                    {/* Channel header */}
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] ${channel.bg} ${channel.color}`}>
                                            <i className={channel.icon} />
                                        </div>
                                        <p className={`text-xs font-bold ${channel.color}`}>{channel.channel}</p>
                                    </div>
                                    {/* Steps */}
                                    <div className="space-y-2 pl-2">
                                        {channel.steps.map((step, i) => (
                                            <div key={i} className="flex items-start gap-3">
                                                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5
                                                    dark:bg-white/[0.06] bg-slate-100 dark:text-slate-400 text-slate-500">
                                                    {i + 1}
                                                </span>
                                                <p className="text-[12px] dark:text-slate-400 text-slate-600 leading-relaxed">{step}</p>
                                            </div>
                                        ))}
                                    </div>
                                    {/* Divider kecuali terakhir */}
                                    {channel !== ALUR_STEPS[ALUR_STEPS.length - 1] && (
                                        <div className="mt-4 border-t dark:border-white/[0.04] border-black/[0.04]" />
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <p className="text-[12px] dark:text-slate-500 text-slate-500 mb-4">
                                Tim PSB siap membantu kamu di jam kerja sekolah. Klik tombol WhatsApp untuk langsung terhubung.
                            </p>
                            {CONTACTS.map((contact) => (
                                <div key={contact.name}
                                    className="flex items-center gap-4 p-4 rounded-xl border
                                        dark:border-white/[0.06] border-black/[0.06]
                                        dark:bg-white/[0.02] bg-slate-50">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${contact.bgColor} ${contact.color}`}>
                                        <i className={`${contact.icon} text-sm`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold dark:text-slate-200 text-slate-700 truncate">
                                            {contact.name}
                                        </p>
                                        <p className="text-[11px] dark:text-slate-500 text-slate-500 truncate">
                                            {contact.role}
                                        </p>
                                    </div>
                                    <a
                                        href={generateWAUrl(contact.phone, contact.name)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold shrink-0
                                            bg-emerald-500 hover:bg-emerald-400 text-white transition-colors duration-150"
                                    >
                                        <i className="fa-brands fa-whatsapp" />
                                        WA
                                    </a>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
