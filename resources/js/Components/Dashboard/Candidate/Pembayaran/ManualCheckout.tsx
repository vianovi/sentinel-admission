// =============================================================================
// LOKASI FILE: resources/js/Components/Dashboard/Candidate/Pembayaran/ManualCheckout.tsx
// =============================================================================

import { useEffect, useRef, useState } from 'react'
import { animate, stagger }            from 'animejs'

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type Payment = {
    id:                       number
    order_id:                 string
    payment_channel:          'transfer' | 'cash'
    final_amount:             number
    status:                   string
    manual_status:            string | null
    proof_original_filename:  string | null
    proof_uploaded_at:        string | null
    proof_attempt:            number
    rejection_reason:         string | null
    can_upload_proof:         boolean
    is_cancellable:           boolean
    is_expired:               boolean
}

type Config = {
    bank_name:              string | null
    bank_account_number:    string | null
    bank_account_name:      string | null
    bank_logo_key:          string | null
    whatsapp_contact_label: string | null
}

type CandidateInfo = {
    full_name:      string
    candidate_code: string
    admission_wave: string | null
}

type Props = {
    payment:       Payment
    candidate:     CandidateInfo
    config:        Config | null
    proofUrl:      string | null
    whatsappUrl:   string | null
    processing:    boolean
    cancelling:    boolean
    onUploadProof: (file: File) => void
    onCancel:      () => void
    onBack:        () => void
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS — Kontak PSB (identik dengan InfoPopup)
// ─────────────────────────────────────────────────────────────────────────────

const PSB_CONTACTS = [
    {
        name:  'Silvia Dewi N.P',
        role:  'Bendahara SPMB',
        desc:  'Konfirmasi & Verifikasi Pembayaran',
        icon:  'fa-solid fa-coins',
        color: '#d4a017',
        bg:    'rgba(212,160,23,0.12)',
        wa:    '6281234567890',
    },
    {
        name:  'Haura Fatimah Azzahra',
        role:  'Sekretariat SPMB',
        desc:  'Informasi Pendaftaran & Dokumen',
        icon:  'fa-solid fa-file-pen',
        color: '#8b5cf6',
        bg:    'rgba(139,92,246,0.12)',
        wa:    '6281234567891',
    },
    {
        name:  'M.Farhan Pratama',
        role:  'Admin SPMB',
        desc:  'Kendala Teknis & Bantuan Umum',
        icon:  'fa-solid fa-headset',
        color: '#3b82f6',
        bg:    'rgba(59,130,246,0.12)',
        wa:    '6281234567892',
    },
]

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const formatRupiah = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

// ─────────────────────────────────────────────────────────────────────────────
// COPY BUTTONS (Optimized for 44px Touch Targets)
// ─────────────────────────────────────────────────────────────────────────────

function InlineCopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false)

    const handle = async () => {
        try {
            await navigator.clipboard.writeText(text)
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
        } catch {}
    }

    return (
        <button
            onClick={handle}
            title="Salin"
            type="button"
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 border backdrop-blur-sm active:scale-90 shadow-sm shrink-0
                ${copied ? 'bg-emerald-500/90 border-emerald-400' : 'bg-white/10 hover:bg-white/20 border-white/20'}`}
        >
            <i
                className={`text-xs ${copied ? 'fa-solid fa-check text-white' : 'fa-regular fa-copy text-white'}`}
                aria-hidden="true"
            />
            <span className="sr-only">Salin teks</span>
        </button>
    )
}

function CopyButton({ text, label }: { text: string; label?: string }) {
    const [copied, setCopied] = useState(false)

    const handle = async () => {
        try {
            await navigator.clipboard.writeText(text)
            setCopied(true)
            setTimeout(() => setCopied(false), 1800)
        } catch {}
    }

    return (
        <button
            onClick={handle}
            type="button"
            className="inline-flex items-center justify-center gap-2 px-4 min-h-11 rounded-xl text-xs font-bold transition-all duration-200
                bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300
                hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 shrink-0"
        >
            <i
                className={`${copied ? 'fa-solid fa-check text-emerald-500' : 'fa-regular fa-copy'} text-[11px]`}
                aria-hidden="true"
            />
            <span>{copied ? 'Tersalin!' : (label ?? 'Salin')}</span>
        </button>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// PSB CONTACT POPUP
// ─────────────────────────────────────────────────────────────────────────────

function ContactPopup({
    isOpen,
    onClose,
    waMessage,
    title = 'Hubungi Tim PSB',
    subtitle = 'Pilih staf yang sesuai dengan kebutuhanmu.',
}: {
    isOpen:    boolean
    onClose:   () => void
    waMessage: string
    title?:    string
    subtitle?: string
}) {
    const panelRef = useRef<HTMLDivElement>(null)

    // keyboard accessibility - tutup dengan Escape
    useEffect(() => {
        if (!isOpen) return
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, onClose])

    useEffect(() => {
        if (!panelRef.current) return
        if (isOpen) {
            animate(panelRef.current, {
                opacity: [0, 1],
                translateY: [12, 0],
                scale: [0.97, 1],
                duration: 250,
                ease: 'outExpo'
            })
        }
    }, [isOpen])

    if (!isOpen) return null

    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            {/* Panel */}
            <div
                ref={panelRef}
                style={{ opacity: 0 }}
                className="relative w-full max-w-md rounded-[1.75rem] overflow-hidden dark:bg-[#0d1424] bg-white shadow-2xl z-10"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b dark:border-white/[0.07] border-black/[0.07]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center dark:bg-emerald-500/15 bg-emerald-100 dark:text-emerald-400 text-emerald-600">
                            <i className="fa-brands fa-whatsapp text-lg" aria-hidden="true" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold dark:text-slate-100 text-slate-800">{title}</h3>
                            <p className="text-[10px] dark:text-slate-500 text-slate-400">{subtitle}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        type="button"
                        aria-label="Tutup dialog"
                        className="w-11 h-11 rounded-full flex items-center justify-center dark:bg-white/[0.06] bg-slate-100 dark:text-slate-400 text-slate-500 dark:hover:bg-white/[0.1] hover:bg-slate-200 transition-colors"
                    >
                        <i className="fa-solid fa-xmark text-sm" aria-hidden="true" />
                    </button>
                </div>

                {/* Deskripsi */}
                <p className="px-6 py-4 text-xs dark:text-slate-400 text-slate-600 leading-relaxed">
                    Tim PSB siap membantu di jam kerja sekolah. Klik tombol WA untuk terhubung langsung.
                </p>

                {/* Contact list */}
                <div className="px-4 pb-6 space-y-2">
                    {PSB_CONTACTS.map((contact) => {
                        const url = `https://wa.me/${contact.wa}?text=${encodeURIComponent(waMessage)}`
                        return (
                            <div
                                key={contact.name}
                                className="flex items-center gap-3 p-3 rounded-2xl dark:bg-white/[0.04] bg-slate-50 border dark:border-white/[0.06] border-black/[0.06]"
                            >
                                {/* Icon */}
                                <div
                                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                                    style={{ background: contact.bg }}
                                >
                                    <i className={`${contact.icon} text-sm`} style={{ color: contact.color }} aria-hidden="true" />
                                </div>
                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold dark:text-slate-200 text-slate-700">
                                        {contact.name}
                                    </p>
                                    <p className="text-[10px] dark:text-slate-400 text-slate-500 font-medium">
                                        {contact.role}
                                    </p>
                                    <p className="text-[10px] dark:text-slate-500 text-slate-400 mt-0.5">{contact.desc}</p>
                                </div>
                                {/* WA button with min-h-11 touch target */}
                                <a
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-1.5 px-4 min-h-11 rounded-xl shrink-0 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold transition-colors duration-150"
                                >
                                    <i className="fa-brands fa-whatsapp text-sm" aria-hidden="true" />
                                    <span>WA</span>
                                </a>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// BSI BANK CARD — teal gradient, nominal putih rata kanan, garis pemisah jelas
// ─────────────────────────────────────────────────────────────────────────────

function BSIBankCard({ config, finalAmount }: { config: Config | null; finalAmount: number }) {
    const accName = config?.bank_account_name ?? 'Yayasan Al-Muntaha'
    const accNum  = config?.bank_account_number ?? ''
    const accFmt  = accNum.replace(/(.{4})/g, '$1 ').trim()
    const bankLogo = `/assets/icons/banks/${config?.bank_logo_key ?? 'BSI'}.webp`

    return (
        <div
            className="relative w-full rounded-[2rem] overflow-hidden p-6 sm:p-8 shadow-xl shadow-teal-900/10 transition-transform hover:scale-[1.01] duration-500"
            style={{ background: 'linear-gradient(135deg, #00A39D 0%, #007671 100%)' }}
        >
            {/* Ambient background decorative elements */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: 'radial-gradient(circle at 80% 0%, rgba(255,255,255,0.08) 0%, transparent 60%)' }}
            />
            <div className="absolute -right-16 -top-16 w-64 h-64 border-[30px] border-white/[0.05] rounded-full pointer-events-none" />
            <div className="absolute right-10 -bottom-20 w-40 h-40 border-[20px] border-white/[0.06] rounded-full pointer-events-none" />

            <div className="relative z-10 flex flex-col gap-6">

                {/* Header: Logo + label */}
                <div className="flex justify-between items-start gap-4">
                    <div className="flex items-center gap-3">
                        <div className="px-2 py-1.5 rounded-lg bg-white/15">
                            {/* Logo bank (Di atas fold: optimized LCP loading) */}
                            <img
                                src={bankLogo}
                                alt={config?.bank_name ?? 'Logo bank'}
                                className="h-7 w-auto object-contain"
                                fetchPriority="high"
                                loading="eager"
                                decoding="async"
                            />
                        </div>
                        <div className="text-left">
                            <p className="text-[10px] font-bold text-teal-200 uppercase tracking-widest leading-tight">Bank Syariah</p>
                            <p className="text-[10px] font-bold text-teal-200 uppercase tracking-widest leading-tight">Indonesia</p>
                        </div>
                    </div>
                    <span
                        className="px-3 py-1.5 rounded-full text-[9px] font-bold text-teal-100 uppercase tracking-[0.15em] shrink-0 bg-black/15 border border-white/10"
                    >
                        Transfer Pembayaran
                    </span>
                </div>

                {/* Nomor Rekening */}
                <div>
                    <p className="text-[10px] text-teal-100/80 font-bold uppercase tracking-widest mb-2">Nomor Rekening</p>
                    <div className="flex items-center gap-3">
                        <p className="text-2xl sm:text-3xl lg:text-[2.25rem] leading-none font-black text-white font-mono tracking-[0.12em] drop-shadow-sm truncate">
                            {accFmt}
                        </p>
                        <InlineCopyButton text={accNum} />
                    </div>
                </div>

                {/* Divider — tebal dan jelas */}
                <div className="border-t-[1.5px] border-white/25" aria-hidden="true" />

                {/* Atas nama + Jumlah — nominal putih rata kanan */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div className="min-w-0">
                        <p className="text-[10px] text-teal-100/80 font-bold uppercase tracking-widest mb-1.5">Atas Nama</p>
                        <p className="text-sm sm:text-base font-bold text-white leading-tight truncate">{accName}</p>
                    </div>
                    <div className="text-left md:text-right">
                        <p className="text-[10px] text-teal-100/80 font-bold uppercase tracking-widest mb-1.5">Jumlah Transfer</p>
                        <div className="flex items-center md:justify-end gap-3">
                            <InlineCopyButton text={String(finalAmount)} />
                            <p className="text-xl sm:text-2xl font-black text-white drop-shadow-sm">
                                {formatRupiah(finalAmount)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// PROOF STATUS BANNER — informatif setelah upload
// ─────────────────────────────────────────────────────────────────────────────

type ProofStatusBannerProps = {
    manualStatus:       string | null
    rejectionReason:    string | null
    proofFilename:      string | null
    proofUploadedAt:    string | null
}

function ProofStatusBanner({ manualStatus, rejectionReason, proofFilename, proofUploadedAt }: ProofStatusBannerProps) {
    if (!manualStatus || manualStatus === 'waiting_proof') return null

    const uploadedDate = proofUploadedAt
        ? new Date(proofUploadedAt).toLocaleDateString('id-ID', {
            day: 'numeric', month: 'long', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
          })
        : null

    const STATUS_CONFIG = {
        proof_uploaded: {
            icon:     'fa-solid fa-clock-rotate-left',
            iconCls:  'dark:text-blue-400 text-blue-600',
            bgCls:    'dark:bg-blue-500/[0.08] bg-blue-50 dark:border-blue-500/20 border-blue-200',
            label:    'Menunggu Verifikasi Staff',
            labelCls: 'dark:text-blue-300 text-blue-700',
            desc:     'Berkas sudah diterima. Staff PSB akan memverifikasi dalam 1×24 jam kerja.',
            descCls:  'dark:text-blue-400/80 text-blue-600/80',
            dot:      'bg-blue-400 animate-pulse',
        },
        verified: {
            icon:     'fa-solid fa-circle-check',
            iconCls:  'dark:text-emerald-400 text-emerald-600',
            bgCls:    'dark:bg-emerald-500/[0.08] bg-emerald-50 dark:border-emerald-500/20 border-emerald-200',
            label:    'Berkas Diverifikasi ✓',
            labelCls: 'dark:text-emerald-300 text-emerald-700',
            desc:     'Staff PSB sudah mengkonfirmasi berkas pembayaranmu. Pembayaran sah.',
            descCls:  'dark:text-emerald-400/80 text-emerald-600/80',
            dot:      'bg-emerald-400',
        },
        rejected: {
            icon:     'fa-solid fa-circle-xmark',
            iconCls:  'dark:text-rose-400 text-rose-500',
            bgCls:    'dark:bg-rose-500/[0.08] bg-rose-50 dark:border-rose-500/20 border-rose-200',
            label:    'Berkas Ditolak',
            labelCls: 'dark:text-rose-300 text-rose-700',
            desc:     rejectionReason ?? 'Berkas tidak valid atau tidak terbaca dengan jelas.',
            descCls:  'dark:text-rose-400/80 text-rose-600/80',
            dot:      'bg-rose-400',
        },
    } as const

    const cfg = STATUS_CONFIG[manualStatus as keyof typeof STATUS_CONFIG]
    if (!cfg) return null

    return (
        <div className={`rounded-2xl border p-5 ${cfg.bgCls}`} aria-live="polite">
            <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="shrink-0 mt-0.5">
                    <i className={`${cfg.icon} text-xl ${cfg.iconCls}`} aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                    {/* Status label + dot */}
                    <div className="flex items-center gap-2 mb-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${cfg.dot}`} />
                        <h4 className={`text-sm font-bold ${cfg.labelCls}`}>{cfg.label}</h4>
                    </div>
                    {/* Desc */}
                    <p className={`text-xs leading-relaxed ${cfg.descCls}`}>{cfg.desc}</p>
                    {/* File info */}
                    {proofFilename && (
                        <div className="flex items-center gap-1.5 mt-3">
                            <i className="fa-solid fa-paperclip text-[11px] dark:text-slate-500 text-slate-400" aria-hidden="true" />
                            <p className="text-[11px] font-mono dark:text-slate-400 text-slate-500 truncate">
                                {proofFilename}
                            </p>
                        </div>
                    )}
                    {/* Upload time */}
                    {uploadedDate && (
                        <p className="text-[10px] dark:text-slate-600 text-slate-400 mt-1.5">
                            Diupload: {uploadedDate}
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// UPLOAD ZONE — preview sebelum upload, animatif, informatif
// ─────────────────────────────────────────────────────────────────────────────

function UploadZone({ payment, onUploadProof, processing }: {
    payment:       Payment
    onUploadProof: (file: File) => void
    processing:    boolean
}) {
    const [dragOver,    setDragOver]    = useState(false)
    const [previewFile, setPreviewFile] = useState<File | null>(null)
    const [previewUrl,  setPreviewUrl]  = useState<string | null>(null)
    const [uploadPct,   setUploadPct]   = useState(0)
    const inputRef = useRef<HTMLInputElement>(null)

    // Buat preview URL saat file dipilih
    const handleFileSelect = (file: File) => {
        if (!file) return
        setPreviewFile(file)
        if (file.type.startsWith('image/')) {
            const url = URL.createObjectURL(file)
            setPreviewUrl(url)
        } else {
            setPreviewUrl(null)
        }
    }

    // Cleanup URL saat unmount
    useEffect(() => {
        return () => { if (previewUrl) URL.revokeObjectURL(previewUrl) }
    }, [previewUrl])

    // Animasi simulasi progress saat processing
    useEffect(() => {
        if (processing) {
            setUploadPct(0)
            const intervals = [
                setTimeout(() => setUploadPct(20), 200),
                setTimeout(() => setUploadPct(45), 600),
                setTimeout(() => setUploadPct(70), 1200),
                setTimeout(() => setUploadPct(88), 2000),
            ]
            return () => intervals.forEach(clearTimeout)
        } else {
            setUploadPct(0)
        }
    }, [processing])

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setDragOver(false)
        const f = e.dataTransfer.files[0]
        if (f) handleFileSelect(f)
    }

    const handleConfirmUpload = () => {
        if (previewFile) onUploadProof(previewFile)
    }

    const handleClearPreview = () => {
        setPreviewFile(null)
        setPreviewUrl(null)
    }

    // ── STATUS: proof_uploaded ───────────────────────────────────────────────
    if (payment.manual_status === 'proof_uploaded') {
        return (
            <div className="w-full rounded-[2rem] bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 p-6 sm:p-8 flex flex-col items-center justify-center text-center shadow-lg" aria-live="polite">
                <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-5 border border-blue-200 dark:border-blue-500/30">
                    <i className="fa-solid fa-clock-rotate-left text-2xl animate-pulse" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-bold text-blue-700 dark:text-blue-300 mb-2">Menunggu Verifikasi</h3>
                <p className="text-sm text-blue-600/80 dark:text-blue-400/80 mb-5 max-w-sm leading-relaxed">
                    Bukti pembayaran sudah diterima. Staff PSB akan memverifikasi dalam waktu <strong>1×24 jam kerja</strong>.
                </p>
                {payment.proof_original_filename && (
                    <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-black/20 rounded-xl border border-blue-200 dark:border-blue-500/20 mb-5">
                        <i className="fa-solid fa-file-invoice text-blue-500" aria-hidden="true" />
                        <span className="text-xs font-mono font-medium text-blue-700 dark:text-blue-300 max-w-[180px] sm:max-w-[240px] truncate">
                            {payment.proof_original_filename}
                        </span>
                    </div>
                )}
                {/* Re-upload option (Accessible trigger target size check) */}
                <button
                    onClick={() => inputRef.current?.click()}
                    type="button"
                    className="min-h-11 px-4 inline-flex items-center justify-center text-xs dark:text-slate-500 text-slate-400 dark:hover:text-slate-300 hover:text-slate-600 underline underline-offset-2 transition-colors"
                >
                    Ganti bukti pembayaran
                </button>
                <input
                    ref={inputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f) }}
                />

                {/* Preview + confirm baru jika file baru dipilih */}
                {previewFile && (
                    <div className="mt-5 w-full">
                        <FilePreview file={previewFile} previewUrl={previewUrl} onClear={handleClearPreview} />
                        <button
                            onClick={handleConfirmUpload}
                            disabled={processing}
                            type="button"
                            className="mt-3 w-full min-h-11 py-3 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-bold text-sm transition-all active:scale-95 disabled:opacity-50"
                        >
                            {processing ? <><i className="fa-solid fa-spinner fa-spin mr-2" />Mengupload...</> : 'Upload Bukti Baru'}
                        </button>
                    </div>
                )}
            </div>
        )
    }

    // ── STATUS: rejected ─────────────────────────────────────────────────────
    if (payment.manual_status === 'rejected') {
        return (
            <div className="space-y-5">
                <div className="w-full rounded-[2rem] bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 p-6 flex items-start gap-4 shadow-sm" aria-live="polite">
                    <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                        <i className="fa-solid fa-triangle-exclamation text-xl" aria-hidden="true" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-rose-700 dark:text-rose-300 mb-1">Bukti Ditolak</h3>
                        <p className="text-sm text-rose-600/80 dark:text-rose-400/80 leading-relaxed mb-1.5">
                            Alasan: <span className="font-semibold">{payment.rejection_reason ?? 'Bukti tidak valid atau buram.'}</span>
                        </p>
                        <p className="text-xs font-semibold text-rose-500">Silakan unggah kembali bukti yang valid.</p>
                    </div>
                </div>

                <DropAreaAndPreview
                    dragOver={dragOver}
                    processing={processing}
                    inputRef={inputRef}
                    previewFile={previewFile}
                    previewUrl={previewUrl}
                    uploadPct={uploadPct}
                    onDragOver={() => setDragOver(true)}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onFileChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f) }}
                    onClear={handleClearPreview}
                    onConfirm={handleConfirmUpload}
                    attempt={payment.proof_attempt}
                    isReupload
                />
            </div>
        )
    }

    // ── DEFAULT: waiting_proof ───────────────────────────────────────────────
    return (
        <DropAreaAndPreview
            dragOver={dragOver}
            processing={processing}
            inputRef={inputRef}
            previewFile={previewFile}
            previewUrl={previewUrl}
            uploadPct={uploadPct}
            onDragOver={() => setDragOver(true)}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onFileChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f) }}
            onClear={handleClearPreview}
            onConfirm={handleConfirmUpload}
            attempt={payment.proof_attempt}
        />
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// FILE PREVIEW
// ─────────────────────────────────────────────────────────────────────────────

function FilePreview({ file, previewUrl, onClear }: { file: File; previewUrl: string | null; onClear: () => void }) {
    const isImage = file.type.startsWith('image/')
    const sizeMB  = (file.size / 1024 / 1024).toFixed(2)

    return (
        <div className="rounded-2xl border dark:border-white/[0.08] border-black/[0.08] dark:bg-white/[0.03] bg-slate-50 overflow-hidden">
            {/* Image preview (Performance: decoding async) */}
            {isImage && previewUrl && (
                <div className="relative w-full h-44 bg-slate-100 dark:bg-slate-800">
                    <img
                        src={previewUrl}
                        alt="Preview unggahan"
                        className="w-full h-full object-contain"
                        decoding="async"
                    />
                </div>
            )}

            {/* File info */}
            <div className="flex items-center gap-3 p-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 dark:bg-blue-500/15 bg-blue-100 dark:text-blue-400 text-blue-600">
                    <i className={`text-base ${isImage ? 'fa-solid fa-image' : 'fa-solid fa-file-pdf'}`} aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold dark:text-slate-200 text-slate-700 truncate">{file.name}</p>
                    <p className="text-[10px] dark:text-slate-500 text-slate-400 mt-1">{sizeMB} MB</p>
                </div>
                {/* Tappable close button target to min 44px (w-11, h-11) */}
                <button
                    onClick={onClear}
                    type="button"
                    aria-label="Batalkan pilihan file"
                    className="w-11 h-11 rounded-full flex items-center justify-center dark:bg-white/[0.06] bg-slate-200 dark:text-slate-400 text-slate-500 dark:hover:bg-rose-500/20 hover:bg-rose-100 dark:hover:text-rose-400 hover:text-rose-500 transition-colors"
                >
                    <i className="fa-solid fa-xmark text-xs" aria-hidden="true" />
                </button>
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// DROP AREA + PREVIEW + CONFIRM
// ─────────────────────────────────────────────────────────────────────────────

function DropAreaAndPreview({ dragOver, processing, inputRef, previewFile, previewUrl, uploadPct, onDragOver, onDragLeave, onDrop, onFileChange, onClear, onConfirm, attempt, isReupload }: {
    dragOver:     boolean
    processing:   boolean
    inputRef:     React.RefObject<HTMLInputElement>
    previewFile:  File | null
    previewUrl:   string | null
    uploadPct:    number
    onDragOver:   () => void
    onDragLeave:  () => void
    onDrop:       (e: React.DragEvent) => void
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    onClear:      () => void
    onConfirm:    () => void
    attempt:      number
    isReupload?:  boolean
}) {
    // Apabila berkas sudah dipilih, tampilkan preview dan opsi konfirmasi
    if (previewFile) {
        return (
            <div className="space-y-4">
                <FilePreview file={previewFile} previewUrl={previewUrl} onClear={onClear} />

                {/* Upload progress bar */}
                {processing && (
                    <div className="p-1" aria-live="polite">
                        <div className="flex justify-between text-[11px] dark:text-slate-400 text-slate-500 mb-2">
                            <span>Mengunggah berkas ke server...</span>
                            <span className="font-bold">{uploadPct}%</span>
                        </div>
                        <div className="h-2.5 rounded-full dark:bg-white/[0.06] bg-slate-200 overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-300"
                                style={{
                                    width: `${uploadPct}%`,
                                    background: 'linear-gradient(to right, #00A39D, #007671)',
                                }}
                            />
                        </div>
                    </div>
                )}

                {/* Action buttons (min-h-11 targets & font sizes optimized) */}
                <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                    <button
                        onClick={onClear}
                        disabled={processing}
                        type="button"
                        className="flex-1 min-h-11 py-2.5 px-4 rounded-xl text-xs font-bold transition-all
                            dark:bg-white/[0.04] bg-slate-100 dark:text-slate-400 text-slate-500
                            dark:hover:bg-white/[0.08] hover:bg-slate-200
                            border dark:border-white/[0.06] border-slate-200 disabled:opacity-50"
                    >
                        <i className="fa-solid fa-rotate-left mr-1.5" aria-hidden="true" />
                        Ganti Berkas
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={processing}
                        type="button"
                        className="flex-[2] min-h-11 py-2.5 px-4 rounded-xl text-xs font-black tracking-wide transition-all
                            bg-[#007671] hover:bg-[#00A39D] text-white hover:shadow-lg hover:shadow-teal-500/10
                            disabled:opacity-50 active:scale-95"
                    >
                        {processing ? (
                            <><i className="fa-solid fa-spinner fa-spin mr-1.5" aria-hidden="true" />Mengupload...</>
                        ) : (
                            <><i className="fa-solid fa-cloud-arrow-up mr-1.5" aria-hidden="true" />Upload Bukti Sekarang</>
                        )}
                    </button>
                </div>
            </div>
        )
    }

    // Drop area default
    return (
        <div
            onDragOver={(e) => { e.preventDefault(); onDragOver() }}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => !processing && inputRef.current?.click()}
            className={`relative w-full rounded-[2rem] border-2 border-dashed p-8 sm:p-10 flex flex-col items-center
                justify-center text-center cursor-pointer transition-all duration-300 shadow-sm
                ${dragOver
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 scale-[1.01]'
                    : 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/20 hover:bg-slate-100 dark:hover:bg-slate-800/40'
                }
                ${processing ? 'opacity-60 cursor-not-allowed' : ''}`}
            role="button"
            tabIndex={0}
            aria-label="Area klik atau seret berkas untuk unggah bukti pembayaran"
            onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault()
                    if (!processing) inputRef.current?.click()
                }
            }}
        >
            <input
                ref={inputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                className="hidden"
                onChange={onFileChange}
                disabled={processing}
            />

            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors
                ${dragOver
                    ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                    : 'bg-slate-200/80 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}
            >
                <i
                    className={`${processing ? 'fa-solid fa-circle-notch fa-spin' : 'fa-solid fa-cloud-arrow-up'} text-2xl`}
                    aria-hidden="true"
                />
            </div>

            <h4 className="text-base sm:text-lg font-bold text-slate-700 dark:text-slate-200 mb-2">
                {processing ? 'Memproses berkas...'
                    : dragOver ? 'Lepaskan Berkas di Sini'
                    : isReupload ? 'Unggah Ulang Bukti Pembayaran'
                    : 'Unggah Bukti Pembayaran'
                }
            </h4>

            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
                Mendukung format <span className="font-semibold">JPG, PNG, atau PDF</span> hingga ukuran maks. 5MB.
            </p>

            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-2.5">
                Pilih berkas untuk meninjau detail sebelum mengirimkan.
            </p>

            {attempt > 0 && (
                <div className="mt-4">
                    <span className="inline-block px-3.5 py-1.5 bg-slate-200 dark:bg-slate-800 rounded-full text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Percobaan ke-{attempt + 1}
                    </span>
                </div>
            )}
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// CASH STEPS — panduan pembayaran cash di tempat
// ─────────────────────────────────────────────────────────────────────────────

function CashSteps({ candidateCode }: { candidateCode: string }) {
    const steps = [
        {
            icon:  'fa-person-walking-arrow-right',
            title: 'Kunjungi Kompleks Sekolah',
            body:  'Kunjungi Al-Muntaha School pada hari kerja (Senin – Jumat, pukul 08.00–15.00 WIB). Setibanya di gerbang, temui <strong>satpam atau penjaga sekolah</strong> dan sampaikan bahwa Anda datang untuk keperluan pembayaran biaya pendaftaran SPMB.',
        },
        {
            icon:  'fa-user-tie',
            title: 'Temui Bagian Administrasi',
            body:  'Setelah diarahkan petugas keamanan, temui staf di ruang administrasi keuangan. Cukup sampaikan <strong>nama lengkap</strong> pendaftar beserta asal sekolah Anda. Petugas akan mencari data pendaftaran Anda dalam sistem.',
        },
        {
            icon:  'fa-money-bill-wave',
            title: 'Selesaikan Pembayaran',
            body:  'Siapkan uang tunai dengan nominal yang sesuai dengan tagihan Anda. Serahkan ke bagian kasir dan pastikan Anda menerima dokumen fisik berupa <strong>kwitansi resmi</strong> bertanda tangan resmi serta stempel basah sekolah.',
        },
        {
            icon:  'fa-camera-retro',
            title: 'Foto & Unggah Kwitansi',
            body:  'Gunakan kamera ponsel Anda untuk memotret kwitansi resmi tersebut secara tegak lurus, jelas, dan terbaca. Unggah hasil foto kwitansi tersebut ke kolom di samping kanan sebagai bukti sah transaksi Anda.',
        },
    ]

    return (
        <div className="rounded-[2rem] bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 overflow-hidden shadow-lg">
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 dark:border-white/[0.07] dark:bg-white/[0.02] bg-slate-50/80 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center dark:bg-emerald-500/15 bg-emerald-100 dark:text-emerald-400 text-emerald-600">
                    <i className="fa-solid fa-list-check text-base" aria-hidden="true" />
                </div>
                <div>
                    <h3 className="text-sm font-bold dark:text-slate-100 text-slate-800">Panduan Pembayaran Cash</h3>
                    <p className="text-[10px] dark:text-slate-500 text-slate-400">Ikuti prosedur pembayaran langkah demi langkah</p>
                </div>
            </div>

            {/* Steps */}
            <div className="divide-y dark:divide-white/[0.05] divide-slate-100">
                {steps.map((step, i) => (
                    <div key={i} className="flex gap-4 px-6 py-5">
                        {/* Number + line */}
                        <div className="flex flex-col items-center shrink-0">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center dark:bg-emerald-500/15 bg-emerald-100 shrink-0">
                                <span className="text-xs font-black dark:text-emerald-400 text-emerald-600">
                                    {i + 1}
                                </span>
                            </div>
                            {i < steps.length - 1 && (
                                <div className="w-px flex-1 mt-2.5 dark:bg-white/[0.06] bg-slate-200" aria-hidden="true" />
                            )}
                        </div>
                        {/* Content */}
                        <div className="flex-1 pb-1">
                            <div className="flex items-center gap-2 mb-2">
                                <i className={`fa-solid ${step.icon} text-xs dark:text-emerald-400 text-emerald-600`} aria-hidden="true" />
                                <h4 className="text-xs sm:text-sm font-bold dark:text-slate-200 text-slate-700">{step.title}</h4>
                            </div>
                            <p
                                className="text-xs dark:text-slate-400 text-slate-600 leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: step.body }}
                            />
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 dark:bg-white/[0.02] bg-slate-50/80 border-t border-slate-100 dark:border-white/[0.05] flex flex-wrap items-center gap-2">
                <i className="fa-solid fa-circle-info text-xs dark:text-slate-500 text-slate-400" aria-hidden="true" />
                <p className="text-[10px] dark:text-slate-500 text-slate-400">
                    Kode unik pendaftaran Anda: <span className="font-mono font-bold dark:text-slate-300 text-slate-600">{candidateCode}</span>
                </p>
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function ManualCheckout({
    payment, candidate, config, proofUrl, whatsappUrl,
    processing, cancelling, onUploadProof, onCancel, onBack,
}: Props) {
    const containerRef   = useRef<HTMLDivElement>(null)
    const isTransfer     = payment.payment_channel === 'transfer'
    const [showContact, setShowContact] = useState(false)

    // Narasi berita transfer lengkap
    const transferNote = `Bayar Pendaftaran ${candidate.admission_wave ?? 'SPMB'} a.n. ${candidate.full_name} kode ${candidate.candidate_code}`

    // WA message untuk popup kontak
    const waMessage = isTransfer
        ? `Halo, saya ${candidate.full_name} (${candidate.candidate_code}) ingin konfirmasi bukti pembayaran transfer untuk pendaftaran ${candidate.admission_wave ?? 'SPMB'}.`
        : `Halo, saya ${candidate.full_name} ingin menanyakan informasi pembayaran cash untuk pendaftaran ${candidate.admission_wave ?? 'SPMB'}.`

    // Label tombol bantuan sesuai channel
    const contactBtnLabel = isTransfer
        ? 'Butuh bantuan mengenai konfirmasi transfer?'
        : 'Ada kendala atau pertanyaan seputar pembayaran?'

    useEffect(() => {
        if (!containerRef.current) return

        // Animasi masuk yang halus tanpa render blocking
        animate(containerRef.current, {
            opacity: [0, 1],
            translateX: [16, 0],
            duration: 400,
            ease: 'outExpo'
        })

        animate('.mc-s', {
            opacity: [0, 1],
            translateY: [12, 0],
            duration: 450,
            delay: stagger(60, { start: 80 }),
            ease: 'outExpo',
        })
    }, [])

    return (
        <>
        <div ref={containerRef} style={{ opacity: 0 }} className="w-full pb-12">

            {/* ── Top Navigation Bar ────────────────────────────────────────── */}
            <div className="flex items-center justify-between mb-8 gap-4">
                <button
                    onClick={onBack}
                    type="button"
                    className="mc-s inline-flex items-center gap-2 px-5 min-h-11 rounded-full
                        bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700
                        text-xs font-bold text-slate-600 dark:text-slate-300
                        hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm group active:scale-95"
                >
                    <i className="fa-solid fa-arrow-left group-hover:-translate-x-1 transition-transform" aria-hidden="true" />
                    <span>Kembali</span>
                </button>

                <div
                    className="mc-s px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest
                        bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20
                        text-emerald-600 dark:text-emerald-400 shrink-0 text-center"
                >
                    {isTransfer ? 'Pembayaran Manual' : 'Pembayaran di Tempat'}
                </div>
            </div>

            {/* ── Responsive 2-Column Grid Layout ───────────────────────────── */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 lg:gap-10">

                {/* ══ KIRI: Instruksi & Informasi Rekening (7 cols) ════════════ */}
                <div className="xl:col-span-7 flex flex-col gap-6">

                    {/* Informasi Header Utama */}
                    <div className="mc-s flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0
                            bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-lg shadow-teal-500/20">
                            <i className={isTransfer ? 'fa-solid fa-money-bill-transfer text-xl' : 'fa-solid fa-cash-register text-xl'} aria-hidden="true" />
                        </div>
                        <div>
                            <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white leading-tight">
                                {isTransfer ? 'Transfer Bank Syariah' : 'Bayar Tunai di Kasir'}
                            </h2>
                            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                                {isTransfer
                                    ? 'Kirimkan pembayaran Anda ke rekening resmi institusi berikut.'
                                    : 'Perhatikan tata cara administrasi pembayaran cash di lingkungan sekolah.'
                                }
                            </p>
                        </div>
                    </div>

                    {isTransfer ? (
                        <>
                            {/* Kartu Informasi Rekening */}
                            <div className="mc-s">
                                <BSIBankCard config={config} finalAmount={payment.final_amount} />
                            </div>

                            {/* Peringatan dan Teks Berita Acara Transfer */}
                            <div className="mc-s rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-5 shadow-sm">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400">
                                        <i className="fa-solid fa-lightbulb text-base" aria-hidden="true" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-bold text-amber-800 dark:text-amber-300 mb-1.5">
                                            Wajib Lampirkan Catatan Berita Acara
                                        </h4>
                                        <p className="text-xs text-amber-700/80 dark:text-amber-400/80 leading-relaxed mb-4">
                                            Salin teks di bawah ini dan tempelkan pada kolom <strong>Berita/Catatan Transfer</strong> di M-Banking Anda agar proses verifikasi berjalan instan.
                                        </p>
                                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between bg-white dark:bg-slate-900/50 border border-amber-200 dark:border-amber-500/20 rounded-xl p-2.5 gap-3">
                                            <p className="text-xs font-bold font-mono text-amber-700 dark:text-amber-400 truncate px-2.5 py-1 select-all">
                                                {transferNote}
                                            </p>
                                            <CopyButton text={transferNote} label="Salin Berita" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Tombol Akses Kontak Bantuan */}
                            <div className="mc-s">
                                <button
                                    onClick={() => setShowContact(true)}
                                    type="button"
                                    className="min-h-11 inline-flex items-center gap-2 text-xs font-semibold dark:text-slate-400 text-slate-500 dark:hover:text-slate-200 hover:text-slate-700 transition-colors duration-150"
                                >
                                    <i className="fa-regular fa-circle-question text-sm" aria-hidden="true" />
                                    <span>{contactBtnLabel}</span>
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Alur Langkah Pembayaran Tunai */}
                            <div className="mc-s">
                                <CashSteps candidateCode={candidate.candidate_code} />
                            </div>

                            {/* Tombol Akses Kontak Bantuan */}
                            <div className="mc-s">
                                <button
                                    onClick={() => setShowContact(true)}
                                    type="button"
                                    className="min-h-11 inline-flex items-center gap-2 text-xs font-semibold dark:text-slate-400 text-slate-500 dark:hover:text-slate-200 hover:text-slate-700 transition-colors duration-150"
                                >
                                    <i className="fa-regular fa-circle-question text-sm" aria-hidden="true" />
                                    <span>{contactBtnLabel}</span>
                                </button>
                            </div>
                        </>
                    )}
                </div>

                {/* ══ KANAN: Unggah Bukti & Aksi Pembatalan (5 cols) ════════════ */}
                <div className="xl:col-span-5 flex flex-col gap-6">

                    {/* Banner Status Bukti Fisik Pembayaran */}
                    {payment.manual_status && payment.manual_status !== 'waiting_proof' && (
                        <div className="mc-s">
                            <ProofStatusBanner
                                manualStatus={payment.manual_status}
                                rejectionReason={payment.rejection_reason}
                                proofFilename={payment.proof_original_filename}
                                proofUploadedAt={payment.proof_uploaded_at}
                            />
                        </div>
                    )}

                    {/* Area Pengunggahan Berkas Digital */}
                    <div className="mc-s bg-white dark:bg-[#0f172a] rounded-[2rem] border border-slate-200 dark:border-white/10 p-6 sm:p-8 shadow-lg flex-1 flex flex-col justify-center">
                        <UploadZone
                            payment={payment}
                            onUploadProof={onUploadProof}
                            processing={processing}
                        />
                    </div>

                    {/* Tombol Pembatalan Transaksi */}
                    {payment.is_cancellable && payment.manual_status === 'waiting_proof' && (
                        <button
                            onClick={onCancel}
                            disabled={cancelling}
                            type="button"
                            className="mc-s w-full min-h-12 py-4 rounded-2xl font-bold text-sm transition-all
                                bg-slate-100 dark:bg-slate-800
                                hover:bg-rose-50 dark:hover:bg-rose-500/10
                                text-slate-500 dark:text-slate-400
                                hover:text-rose-600 dark:hover:text-rose-400
                                border border-slate-200 dark:border-slate-700
                                hover:border-rose-200 dark:hover:border-rose-500/30
                                disabled:opacity-50 active:scale-95"
                        >
                            {cancelling ? (
                                <><i className="fa-solid fa-spinner fa-spin mr-2" aria-hidden="true" />Membatalkan...</>
                            ) : (
                                'Batalkan Transaksi Ini'
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>

        {/* Dialog Informasi Kontak Tim SPMB */}
        <ContactPopup
            isOpen={showContact}
            onClose={() => setShowContact(false)}
            waMessage={waMessage}
            title={isTransfer ? 'Konfirmasi Pembayaran' : 'Tanya Tim PSB'}
            subtitle="Hubungi koordinator layanan pendaftaran kami"
        />
        </>
    )
}