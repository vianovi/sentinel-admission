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
// HARDCODED CONTACTS — edit variabel di sini untuk ganti kontak
// Gunakan format internasional tanpa + untuk nomor WA (628xxxxxxxxx)
// ─────────────────────────────────────────────────────────────────────────────

const CONTACT_BENDAHARA_NAMA   = 'Silvia Dewi N.P • Bendahara SPMB'
const CONTACT_BENDAHARA_TELEPON = '6281234567890'

const CONTACT_SEKRETARIS_NAMA   = 'Haura Fatimah Azzahra • Sekertariat SPMB'
const CONTACT_SEKRETARIS_TELEPON = '6281234567891'

const CONTACT_ADMIN_NAMA   = 'M.Farhan Pratama• Admin SPMB'
const CONTACT_ADMIN_TELEPON = '6281234567892'

// ─────────────────────────────────────────────────────────────────────────────
// DERIVED DATA — jangan edit bagian ini
// ─────────────────────────────────────────────────────────────────────────────

const CONTACTS = [
    {
        name:    CONTACT_BENDAHARA_NAMA,
        role:    'Konfirmasi & Verifikasi Pembayaran',
        phone:   CONTACT_BENDAHARA_TELEPON,
        icon:    'fa-solid fa-coins',
        color:   'dark:text-amber-400 text-amber-600',
        bgColor: 'dark:bg-amber-500/10 bg-amber-50',
    },
    {
        name:    CONTACT_SEKRETARIS_NAMA,
        role:    'Informasi Pendaftaran & Dokumen',
        phone:   CONTACT_SEKRETARIS_TELEPON,
        icon:    'fa-solid fa-file-signature',
        color:   'dark:text-blue-400 text-blue-600',
        bgColor: 'dark:bg-blue-500/10 bg-blue-50',
    },
    {
        name:    CONTACT_ADMIN_NAMA,
        role:    'Kendala Teknis & Bantuan Umum',
        phone:   CONTACT_ADMIN_TELEPON,
        icon:    'fa-solid fa-headset',
        color:   'dark:text-violet-400 text-violet-600',
        bgColor: 'dark:bg-violet-500/10 bg-violet-50',
    },
]

// Alur pembayaran — layout horizontal per channel
const ALUR_CHANNELS = [
    {
        channel: 'Gateway',
        icon:    'fa-solid fa-bolt',
        color:   'dark:text-orange-400 text-orange-600',
        bg:      'dark:bg-orange-500/10 bg-orange-50',
        border:  'dark:border-orange-500/20 border-orange-200',
        steps:   [
            'Pilih "Bayar via Gateway"',
            'Klik "Bayar Sekarang"',
            'Pilih metode di popup Midtrans',
            'Selesaikan pembayaran',
            'Status otomatis "Lunas"',
        ],
    },
    {
        channel: 'Transfer Bank',
        icon:    'fa-solid fa-building-columns',
        color:   'dark:text-blue-400 text-blue-600',
        bg:      'dark:bg-blue-500/10 bg-blue-50',
        border:  'dark:border-blue-500/20 border-blue-200',
        steps:   [
            'Pilih "Transfer Bank"',
            'Catat nomor rekening & berita',
            'Transfer sesuai nominal',
            'Upload bukti transfer',
            'Konfirmasi ke tim PSB via WA',
            'Tunggu verifikasi staff',
        ],
    },
    {
        channel: 'Cash',
        icon:    'fa-solid fa-school',
        color:   'dark:text-emerald-400 text-emerald-600',
        bg:      'dark:bg-emerald-500/10 bg-emerald-50',
        border:  'dark:border-emerald-500/20 border-emerald-200',
        steps:   [
            'Pilih "Bayar Langsung"',
            'Datang ke kantor sekolah',
            'Bayar ke petugas PSB',
            'Minta kwitansi resmi',
            'Upload foto kwitansi',
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
        return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
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
                className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl border overflow-hidden
                    dark:border-white/[0.08] border-black/[0.08]
                    dark:bg-[#0d1424] bg-white"
                style={{ opacity: 0 }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b
                    dark:border-white/[0.06] border-black/[0.06] shrink-0">
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
                            dark:bg-white/[0.05] bg-slate-100
                            dark:hover:bg-white/[0.1] hover:bg-slate-200
                            dark:text-slate-400 text-slate-500 transition-colors duration-150"
                    >
                        <i className="fa-solid fa-xmark text-xs" />
                    </button>
                </div>

                {/* Body — scrollable */}
                <div className="overflow-y-auto flex-1 p-5">
                    {type === 'alur' ? (
                        // ── Layout HORIZONTAL — 3 kolom samping-samping ──
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {ALUR_CHANNELS.map((ch) => (
                                <div key={ch.channel}
                                    className={`rounded-xl border p-4 ${ch.border} dark:bg-white/[0.02] bg-slate-50/60`}>

                                    {/* Channel header */}
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] ${ch.bg} ${ch.color} shrink-0`}>
                                            <i className={ch.icon} />
                                        </div>
                                        <p className={`text-xs font-bold ${ch.color}`}>{ch.channel}</p>
                                    </div>

                                    {/* Steps vertikal dalam kolom */}
                                    <div className="space-y-2.5">
                                        {ch.steps.map((step, i) => (
                                            <div key={i} className="flex items-start gap-2.5">
                                                <span className="w-5 h-5 rounded-full flex items-center justify-center
                                                    text-[10px] font-bold shrink-0 mt-0.5
                                                    dark:bg-white/[0.06] bg-white dark:text-slate-400 text-slate-500
                                                    border dark:border-white/[0.06] border-black/[0.06]">
                                                    {i + 1}
                                                </span>
                                                <p className="text-[11px] dark:text-slate-400 text-slate-600 leading-snug">
                                                    {step}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        // ── Bantuan — kontak staf ──
                        <div className="space-y-3">
                            <p className="text-[12px] dark:text-slate-500 text-slate-500 mb-4">
                                Tim PSB siap membantu di jam kerja sekolah. Klik tombol WhatsApp untuk terhubung langsung.
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
                                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl
                                            text-xs font-semibold shrink-0
                                            bg-emerald-500 hover:bg-emerald-400 text-white
                                            transition-colors duration-150"
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