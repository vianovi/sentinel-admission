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
        wa:    '6281234567890', // nomor WA bendahara
    },
    {
        name:  'Haura Fatimah Azzahra',
        role:  'Sekretariat SPMB',
        desc:  'Informasi Pendaftaran & Dokumen',
        icon:  'fa-solid fa-file-pen',
        color: '#8b5cf6',
        bg:    'rgba(139,92,246,0.12)',
        wa:    '6281234567891', // nomor WA sekretariat
    },
    {
        name:  'M.Farhan Pratama',
        role:  'Admin SPMB',
        desc:  'Kendala Teknis & Bantuan Umum',
        icon:  'fa-solid fa-headset',
        color: '#3b82f6',
        bg:    'rgba(59,130,246,0.12)',
        wa:    '6281234567892', // nomor WA admin
    },
]

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const formatRupiah = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

// ─────────────────────────────────────────────────────────────────────────────
// COPY BUTTONS
// ─────────────────────────────────────────────────────────────────────────────

function InlineCopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false)
    const handle = async () => {
        try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch {}
    }
    return (
        <button onClick={handle} title="Salin"
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 border backdrop-blur-sm active:scale-90 shadow-sm
                ${copied ? 'bg-emerald-500/90 border-emerald-400' : 'bg-white/10 hover:bg-white/20 border-white/20'}`}>
            <i className={`text-[11px] ${copied ? 'fa-solid fa-check text-white' : 'fa-regular fa-copy text-white'}`} />
        </button>
    )
}

function CopyButton({ text, label }: { text: string; label?: string }) {
    const [copied, setCopied] = useState(false)
    const handle = async () => {
        try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800) } catch {}
    }
    return (
        <button onClick={handle}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200
                bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300
                hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95">
            <i className={`${copied ? 'fa-solid fa-check text-emerald-500' : 'fa-regular fa-copy'} text-[10px]`} />
            {copied ? 'Tersalin!' : (label ?? 'Salin')}
        </button>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// PSB CONTACT POPUP — popup 3 kontak identik dengan InfoPopup
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

    useEffect(() => {
        if (!panelRef.current) return
        if (isOpen) {
            animate(panelRef.current, { opacity: [0,1], translateY: [12,0], scale: [0.97,1], duration: 250, ease: 'outExpo' })
        }
    }, [isOpen])

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
            onClick={onClose}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            {/* Panel */}
            <div ref={panelRef} style={{ opacity: 0 }}
                className="relative w-full max-w-md rounded-[1.75rem] overflow-hidden
                    dark:bg-[#0d1424] bg-white shadow-2xl z-10"
                onClick={(e) => e.stopPropagation()}>

                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-6 pb-4
                    border-b dark:border-white/[0.07] border-black/[0.07]">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center
                            dark:bg-emerald-500/15 bg-emerald-100 dark:text-emerald-400 text-emerald-600">
                            <i className="fa-brands fa-whatsapp text-base" />
                        </div>
                        <div>
                            <p className="text-sm font-bold dark:text-slate-100 text-slate-800">{title}</p>
                            <p className="text-[10px] dark:text-slate-500 text-slate-400">{subtitle}</p>
                        </div>
                    </div>
                    <button onClick={onClose}
                        className="w-8 h-8 rounded-full flex items-center justify-center
                            dark:bg-white/[0.06] bg-slate-100 dark:text-slate-400 text-slate-500
                            dark:hover:bg-white/[0.1] hover:bg-slate-200 transition-colors">
                        <i className="fa-solid fa-xmark text-xs" />
                    </button>
                </div>

                {/* Deskripsi */}
                <p className="px-6 py-3 text-xs dark:text-slate-400 text-slate-600 leading-relaxed">
                    Tim PSB siap membantu di jam kerja sekolah. Klik tombol WA untuk terhubung langsung.
                </p>

                {/* Contact list */}
                <div className="px-4 pb-4 space-y-2">
                    {PSB_CONTACTS.map((contact) => {
                        const url = `https://wa.me/${contact.wa}?text=${encodeURIComponent(waMessage)}`
                        return (
                            <div key={contact.name}
                                className="flex items-center gap-3 p-3 rounded-2xl
                                    dark:bg-white/[0.04] bg-slate-50
                                    border dark:border-white/[0.06] border-black/[0.06]">
                                {/* Icon */}
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                                    style={{ background: contact.bg }}>
                                    <i className={`${contact.icon} text-sm`} style={{ color: contact.color }} />
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
                                {/* WA button */}
                                <a href={url} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl shrink-0
                                        bg-emerald-500 hover:bg-emerald-400 text-white text-[11px] font-bold
                                        transition-colors duration-150">
                                    <i className="fa-brands fa-whatsapp text-xs" />
                                    WA
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
        <div className="relative w-full rounded-[2rem] overflow-hidden p-7 sm:p-8 shadow-xl shadow-teal-900/10 transition-transform hover:scale-[1.01] duration-500"
            style={{ background: 'linear-gradient(135deg, #00A39D 0%, #007671 100%)' }}>

            {/* Ambient background */}
            <div className="absolute inset-0 pointer-events-none"
                style={{ background: 'radial-gradient(circle at 80% 0%, rgba(255,255,255,0.08) 0%, transparent 60%)' }} />
            <div className="absolute -right-16 -top-16 w-64 h-64 border-[30px] border-white/[0.05] rounded-full" />
            <div className="absolute right-10 -bottom-20 w-40 h-40 border-[20px] border-white/[0.06] rounded-full" />

            <div className="relative z-10 flex flex-col gap-6">

                {/* Header: Logo + label */}
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                        <div className="px-2 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.15)' }}>
                            <img
                                src={bankLogo}
                                alt={config?.bank_name ?? 'Logo bank'}
                                className="h-7 w-auto object-contain"
                                loading="lazy"
                                decoding="async"
                            />
                        </div>
                        <div className="text-left">
                            <p className="text-[9px] font-bold text-teal-200 uppercase tracking-widest leading-tight">Bank Syariah</p>
                            <p className="text-[9px] font-bold text-teal-200 uppercase tracking-widest leading-tight">Indonesia</p>
                        </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-[9px] font-bold text-teal-100 uppercase tracking-[0.15em]"
                        style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        Transfer Pembayaran
                    </span>
                </div>

                {/* Nomor Rekening */}
                <div>
                    <p className="text-[10px] text-teal-100/80 font-bold uppercase tracking-widest mb-1.5">Nomor Rekening</p>
                    <div className="flex items-center gap-3">
                        <p className="text-3xl sm:text-[2.5rem] leading-none font-black text-white font-mono tracking-[0.15em] drop-shadow-sm">
                            {accFmt}
                        </p>
                        <InlineCopyButton text={accNum} />
                    </div>
                </div>

                {/* Divider — tebal dan jelas */}
                <div style={{ borderTop: '1.5px solid rgba(255,255,255,0.25)' }} />

                {/* Atas nama + Jumlah — nominal putih rata kanan */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-[10px] text-teal-100/80 font-bold uppercase tracking-widest mb-1">Atas Nama</p>
                        <p className="text-sm font-bold text-white leading-tight">{accName}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] text-teal-100/80 font-bold uppercase tracking-widest mb-1">Jumlah Transfer</p>
                        <div className="flex items-center justify-end gap-2">
                            <InlineCopyButton text={String(finalAmount)} />
                            {/* Nominal putih bukan oranye — lebih kalem */}
                            <p className="text-xl font-black text-white drop-shadow-sm">
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
        <div className={`rounded-2xl border p-4 ${cfg.bgCls}`}>
            <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="shrink-0 mt-0.5">
                    <i className={`${cfg.icon} text-lg ${cfg.iconCls}`} />
                </div>
                <div className="flex-1 min-w-0">
                    {/* Status label + dot */}
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
                        <p className={`text-sm font-bold ${cfg.labelCls}`}>{cfg.label}</p>
                    </div>
                    {/* Desc */}
                    <p className={`text-xs leading-relaxed ${cfg.descCls}`}>{cfg.desc}</p>
                    {/* File info */}
                    {proofFilename && (
                        <div className="flex items-center gap-1.5 mt-2">
                            <i className="fa-solid fa-paperclip text-[10px] dark:text-slate-500 text-slate-400" />
                            <p className="text-[10px] font-mono dark:text-slate-400 text-slate-500 truncate">
                                {proofFilename}
                            </p>
                        </div>
                    )}
                    {/* Upload time */}
                    {uploadedDate && (
                        <p className="text-[10px] dark:text-slate-600 text-slate-400 mt-1">
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

    // Fake progress animasi saat processing
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
        e.preventDefault(); setDragOver(false)
        const f = e.dataTransfer.files[0]; if (f) handleFileSelect(f)
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
            <div className="w-full rounded-[2rem] bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 p-8 flex flex-col items-center justify-center text-center shadow-lg">
                <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-5 border border-blue-200 dark:border-blue-500/30">
                    <i className="fa-solid fa-clock-rotate-left text-2xl animate-pulse" />
                </div>
                <h3 className="text-xl font-bold text-blue-700 dark:text-blue-300 mb-2">Menunggu Verifikasi</h3>
                <p className="text-sm text-blue-600/80 dark:text-blue-400/80 mb-5 max-w-sm leading-relaxed">
                    Bukti pembayaran sudah diterima. Staff PSB akan memverifikasi dalam waktu <strong>1×24 jam kerja</strong>.
                </p>
                {payment.proof_original_filename && (
                    <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-black/20 rounded-xl border border-blue-200 dark:border-blue-500/20 mb-4">
                        <i className="fa-solid fa-file-invoice text-blue-500" />
                        <span className="text-xs font-mono font-medium text-blue-700 dark:text-blue-300 max-w-[200px] truncate">
                            {payment.proof_original_filename}
                        </span>
                    </div>
                )}
                {/* Re-upload option */}
                <button onClick={() => inputRef.current?.click()}
                    className="text-[11px] dark:text-slate-500 text-slate-400 dark:hover:text-slate-300 hover:text-slate-600 underline underline-offset-2 transition-colors">
                    Ganti bukti pembayaran
                </button>
                <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.pdf" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f) }} />

                {/* Preview + confirm baru kalau ada file baru dipilih */}
                {previewFile && (
                    <div className="mt-4 w-full">
                        <FilePreview file={previewFile} previewUrl={previewUrl} onClear={handleClearPreview} />
                        <button onClick={handleConfirmUpload} disabled={processing}
                            className="mt-3 w-full py-3 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-bold text-sm transition-all active:scale-95 disabled:opacity-50">
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
                <div className="w-full rounded-[2rem] bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 p-6 flex items-start gap-4 shadow-sm">
                    <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                        <i className="fa-solid fa-triangle-exclamation text-xl" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-rose-700 dark:text-rose-300 mb-1">Bukti Ditolak</h3>
                        <p className="text-sm text-rose-600/80 dark:text-rose-400/80 leading-relaxed mb-1">
                            Alasan: <span className="font-semibold">{payment.rejection_reason ?? 'Bukti tidak valid atau buram.'}</span>
                        </p>
                        <p className="text-xs font-medium text-rose-500/80">Upload ulang bukti yang sesuai.</p>
                    </div>
                </div>

                <DropAreaAndPreview
                    dragOver={dragOver} processing={processing} inputRef={inputRef}
                    previewFile={previewFile} previewUrl={previewUrl} uploadPct={uploadPct}
                    onDragOver={() => setDragOver(true)} onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onFileChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f) }}
                    onClear={handleClearPreview}
                    onConfirm={handleConfirmUpload}
                    attempt={payment.proof_attempt} isReupload
                />
            </div>
        )
    }

    // ── DEFAULT: waiting_proof ───────────────────────────────────────────────
    return (
        <DropAreaAndPreview
            dragOver={dragOver} processing={processing} inputRef={inputRef}
            previewFile={previewFile} previewUrl={previewUrl} uploadPct={uploadPct}
            onDragOver={() => setDragOver(true)} onDragLeave={() => setDragOver(false)}
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
            {/* Image preview */}
            {isImage && previewUrl && (
                <div className="relative w-full h-40 bg-slate-100 dark:bg-slate-800">
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                </div>
            )}

            {/* File info */}
            <div className="flex items-center gap-3 p-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0
                    dark:bg-blue-500/15 bg-blue-100 dark:text-blue-400 text-blue-600">
                    <i className={`text-sm ${isImage ? 'fa-solid fa-image' : 'fa-solid fa-file-pdf'}`} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold dark:text-slate-200 text-slate-700 truncate">{file.name}</p>
                    <p className="text-[10px] dark:text-slate-500 text-slate-400 mt-0.5">{sizeMB} MB</p>
                </div>
                <button onClick={onClear}
                    className="w-7 h-7 rounded-full flex items-center justify-center
                        dark:bg-white/[0.06] bg-slate-200 dark:text-slate-400 text-slate-500
                        dark:hover:bg-rose-500/20 hover:bg-rose-100 dark:hover:text-rose-400 hover:text-rose-500
                        transition-colors">
                    <i className="fa-solid fa-xmark text-[10px]" />
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
    // Kalau ada file yang sudah dipilih → tampil preview + confirm button
    if (previewFile) {
        return (
            <div className="space-y-3">
                <FilePreview file={previewFile} previewUrl={previewUrl} onClear={onClear} />

                {/* Upload progress bar */}
                {processing && (
                    <div>
                        <div className="flex justify-between text-[10px] dark:text-slate-400 text-slate-500 mb-1.5">
                            <span>Mengupload ke server...</span>
                            <span>{uploadPct}%</span>
                        </div>
                        <div className="h-2 rounded-full dark:bg-white/[0.06] bg-slate-200 overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-500"
                                style={{
                                    width: `${uploadPct}%`,
                                    background: 'linear-gradient(to right, #2980b9, #7aa2f7)',
                                }} />
                        </div>
                    </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-2">
                    <button onClick={onClear} disabled={processing}
                        className="flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all
                            dark:bg-white/[0.04] bg-slate-100 dark:text-slate-400 text-slate-500
                            dark:hover:bg-white/[0.08] hover:bg-slate-200
                            border dark:border-white/[0.06] border-slate-200 disabled:opacity-50">
                        <i className="fa-solid fa-rotate-left mr-1.5" />
                        Ganti File
                    </button>
                    <button onClick={onConfirm} disabled={processing}
                        className="flex-[2] py-2.5 rounded-xl text-xs font-bold transition-all
                            bg-blue-500 hover:bg-blue-400 text-white
                            shadow-md shadow-blue-500/20 disabled:opacity-50 active:scale-95">
                        {processing
                            ? <><i className="fa-solid fa-spinner fa-spin mr-1.5" />Mengupload...</>
                            : <><i className="fa-solid fa-cloud-arrow-up mr-1.5" />Upload Bukti Ini</>
                        }
                    </button>
                </div>
            </div>
        )
    }

    // Drop area default
    return (
        <div onDragOver={(e) => { e.preventDefault(); onDragOver() }}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => !processing && inputRef.current?.click()}
            className={`relative w-full rounded-[2rem] border-2 border-dashed p-10 flex flex-col items-center
                justify-center text-center cursor-pointer transition-all duration-300 shadow-sm
                ${dragOver ? 'border-amber-500 bg-amber-50 dark:bg-amber-500/10 scale-[1.02]'
                    : 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800'}
                ${processing ? 'opacity-60 cursor-not-allowed' : ''}`}>
            <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.pdf"
                className="hidden" onChange={onFileChange} disabled={processing} />
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors
                ${dragOver ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                <i className={`${processing ? 'fa-solid fa-circle-notch fa-spin' : 'fa-solid fa-cloud-arrow-up'} text-2xl`} />
            </div>
            <h4 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-2">
                {processing ? 'Memproses...'
                    : dragOver ? 'Lepas File di Sini'
                    : isReupload ? 'Upload Ulang Bukti'
                    : 'Upload Bukti Pembayaran'
                }
            </h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
                Format: <span className="font-semibold">JPG, PNG, PDF</span> · Maks. 5MB
            </p>
            <p className="text-xs dark:text-slate-500 text-slate-400 mt-2">
                Pilih file dulu — review sebelum upload
            </p>
            {attempt > 0 && (
                <p className="mt-4 inline-block px-3 py-1 bg-slate-200 dark:bg-slate-700 rounded-full
                    text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    Percobaan ke-{attempt + 1}
                </p>
            )}
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// CASH STEPS — narasi detail dan natural
// ─────────────────────────────────────────────────────────────────────────────

function CashSteps({ candidateCode }: { candidateCode: string }) {
    const steps = [
        {
            icon:  'fa-person-walking-arrow-right',
            title: 'Datang ke Sekolah',
            body:  'Kunjungi Al-Muntaha School pada hari kerja (Senin – Jumat, pukul 08.00–15.00 WIB). Setibanya di gerbang, temui <strong>satpam atau penjaga</strong> dan sampaikan bahwa kamu datang untuk keperluan <strong>pembayaran biaya pendaftaran SPMB</strong>. Petugas akan mengarahkanmu ke bagian yang tepat.',
        },
        {
            icon:  'fa-user-tie',
            title: 'Temui Staf Administrasi',
            body:  'Setelah diarahkan, temui staf atau karyawan di ruang administrasi. Sampaikan <strong>nama lengkap</strong> dan <strong>asal sekolah</strong> kamu serta niat untuk menyelesaikan pembayaran SPMB. Tidak perlu menyebut kode kandidat di tahap ini — staf akan mencari data kamu berdasarkan nama.',
        },
        {
            icon:  'fa-money-bill-wave',
            title: 'Serahkan Pembayaran',
            body:  'Siapkan uang tunai <strong>pas sesuai nominal</strong> yang tertera (Rp 300.000 atau sesuai gelombangmu). Serahkan kepada petugas yang bertugas. Pastikan kamu menerima <strong>kwitansi resmi</strong> bertanda tangan dan stempel sekolah sebagai bukti pembayaran yang sah.',
        },
        {
            icon:  'fa-camera-retro',
            title: 'Foto & Upload Kwitansi',
            body:  'Foto kwitansi resmi yang kamu terima dengan jelas dan pastikan terbaca seluruh isinya. Kembali ke halaman ini dan upload foto tersebut pada kolom upload di samping. Setelah diverifikasi staff, status pendaftaranmu akan berubah otomatis.',
        },
    ]

    return (
        <div className="rounded-[2rem] bg-white dark:bg-slate-900/80 backdrop-blur-xl
            border border-slate-200 dark:border-white/10 overflow-hidden shadow-lg">
            {/* Header */}
            <div className="px-7 py-5 border-b border-slate-100 dark:border-white/[0.07]
                dark:bg-white/[0.02] bg-slate-50/80 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center
                    dark:bg-emerald-500/15 bg-emerald-100 dark:text-emerald-400 text-emerald-600">
                    <i className="fa-solid fa-list-check text-sm" />
                </div>
                <div>
                    <p className="text-sm font-bold dark:text-slate-100 text-slate-800">Panduan Pembayaran Cash</p>
                    <p className="text-[10px] dark:text-slate-500 text-slate-400">Ikuti langkah berikut dengan urut</p>
                </div>
            </div>

            {/* Steps */}
            <div className="divide-y dark:divide-white/[0.05] divide-slate-100">
                {steps.map((step, i) => (
                    <div key={i} className="flex gap-4 px-7 py-5">
                        {/* Number + line */}
                        <div className="flex flex-col items-center shrink-0">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center
                                dark:bg-emerald-500/15 bg-emerald-100 shrink-0">
                                <span className="text-xs font-black dark:text-emerald-400 text-emerald-600">
                                    {i + 1}
                                </span>
                            </div>
                            {i < steps.length - 1 && (
                                <div className="w-px flex-1 mt-2 dark:bg-white/[0.06] bg-slate-200" />
                            )}
                        </div>
                        {/* Content */}
                        <div className="flex-1 pb-1">
                            <div className="flex items-center gap-2 mb-2">
                                <i className={`fa-solid ${step.icon} text-xs dark:text-emerald-400 text-emerald-600`} />
                                <p className="text-sm font-bold dark:text-slate-200 text-slate-700">{step.title}</p>
                            </div>
                            <p className="text-xs dark:text-slate-400 text-slate-600 leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: step.body }} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="px-7 py-4 dark:bg-white/[0.02] bg-slate-50/80
                border-t border-slate-100 dark:border-white/[0.05]
                flex items-center gap-2">
                <i className="fa-solid fa-circle-info text-xs dark:text-slate-500 text-slate-400" />
                <p className="text-[10px] dark:text-slate-500 text-slate-400">
                    Kode kandidatmu: <span className="font-mono font-bold dark:text-slate-300 text-slate-600">{candidateCode}</span> — simpan baik-baik
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
        ? 'Butuh bantuan konfirmasi?'
        : 'Ada pertanyaan seputar pembayaran?'

    useEffect(() => {
        if (!containerRef.current) return
        animate(containerRef.current, { opacity: [0,1], translateX: [20,0], duration: 400, ease: 'outExpo' })
        animate('.mc-s', {
            opacity: [0,1], translateY: [15,0],
            duration: 450, delay: stagger(70, { start: 100 }), ease: 'outExpo',
        })
    }, [])

    return (
        <>
        <div ref={containerRef} style={{ opacity: 0 }} className="w-full pb-8">

            {/* ── Top Bar ───────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between mb-8">
                <button onClick={onBack}
                    className="mc-s inline-flex items-center gap-2 px-4 py-2 rounded-full
                        bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700
                        text-xs font-bold text-slate-600 dark:text-slate-300
                        hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm group">
                    <i className="fa-solid fa-arrow-left group-hover:-translate-x-1 transition-transform" />
                    Kembali
                </button>

                <div className="mc-s px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest
                    bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20
                    text-emerald-600 dark:text-emerald-400">
                    {isTransfer ? 'Pembayaran Manual' : 'Pembayaran di Tempat'}
                </div>
            </div>

            {/* ── 2-Column Layout ───────────────────────────────────────────── */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 lg:gap-10">

                {/* ══ KIRI: Instruksi + Bank (7 cols) ══════════════════════ */}
                <div className="xl:col-span-7 flex flex-col gap-6">

                    {/* Header kiri */}
                    <div className="mc-s flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0
                            bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-lg shadow-teal-500/20">
                            <i className={isTransfer ? 'fa-solid fa-money-bill-transfer text-xl' : 'fa-solid fa-cash-register text-xl'} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                                {isTransfer ? 'Transfer Bank' : 'Bayar Langsung (Cash)'}
                            </h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                {isTransfer
                                    ? 'Selesaikan pembayaran ke rekening resmi di bawah ini.'
                                    : 'Ikuti panduan berikut untuk menyelesaikan pembayaran.'
                                }
                            </p>
                        </div>
                    </div>

                    {isTransfer ? (
                        <>
                            {/* BSI Card */}
                            <div className="mc-s">
                                <BSIBankCard config={config} finalAmount={payment.final_amount} />
                            </div>

                            {/* Transfer note */}
                            <div className="mc-s rounded-2xl bg-amber-50 dark:bg-amber-500/10
                                border border-amber-200 dark:border-amber-500/20 p-5 shadow-sm">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5
                                        bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400">
                                        <i className="fa-solid fa-lightbulb text-base" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-bold text-amber-800 dark:text-amber-300 mb-1.5">
                                            Wajib Cantumkan Berita Transfer
                                        </h4>
                                        <p className="text-xs text-amber-700/80 dark:text-amber-400/80 leading-relaxed mb-3">
                                            Isi kolom <strong>Berita / Keterangan Transfer</strong> di aplikasi bank dengan teks di bawah agar pembayaran cepat dikonfirmasi.
                                        </p>
                                        <div className="flex items-center justify-between
                                            bg-white dark:bg-slate-900/50
                                            border border-amber-200 dark:border-amber-500/20
                                            rounded-xl px-4 py-2.5 gap-3">
                                            <p className="text-xs font-bold font-mono text-amber-700 dark:text-amber-400 truncate">
                                                {transferNote}
                                            </p>
                                            <CopyButton text={transferNote} label="Salin" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Tombol bantuan kontak */}
                            <div className="mc-s">
                                <button onClick={() => setShowContact(true)}
                                    className="inline-flex items-center gap-2 text-xs
                                        dark:text-slate-500 text-slate-400
                                        dark:hover:text-slate-200 hover:text-slate-600
                                        transition-colors duration-150">
                                    <i className="fa-regular fa-circle-question" />
                                    {contactBtnLabel}
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Cash steps */}
                            <div className="mc-s">
                                <CashSteps candidateCode={candidate.candidate_code} />
                            </div>

                            {/* Tombol bantuan kontak */}
                            <div className="mc-s">
                                <button onClick={() => setShowContact(true)}
                                    className="inline-flex items-center gap-2 text-xs
                                        dark:text-slate-500 text-slate-400
                                        dark:hover:text-slate-200 hover:text-slate-600
                                        transition-colors duration-150">
                                    <i className="fa-regular fa-circle-question" />
                                    {contactBtnLabel}
                                </button>
                            </div>
                        </>
                    )}
                </div>

                {/* ══ KANAN: Upload + Actions (5 cols) ═════════════════════ */}
                <div className="xl:col-span-5 flex flex-col gap-6">

                    {/* Status berkas — muncul kalau sudah ada upload */}
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

                    {/* Upload box */}
                    <div className="mc-s bg-white dark:bg-slate-900/80 backdrop-blur-xl
                        rounded-[2rem] border border-slate-200 dark:border-white/10
                        p-6 sm:p-8 shadow-lg flex-1 flex flex-col justify-center">
                        <UploadZone
                            payment={payment}
                            onUploadProof={onUploadProof}
                            processing={processing}
                        />
                    </div>

                    {/* Batalkan */}
                    {payment.is_cancellable && payment.manual_status === 'waiting_proof' && (
                        <button onClick={onCancel} disabled={cancelling}
                            className="mc-s w-full py-4 rounded-2xl font-bold text-sm transition-all
                                bg-slate-100 dark:bg-slate-800
                                hover:bg-rose-50 dark:hover:bg-rose-500/10
                                text-slate-500 dark:text-slate-400
                                hover:text-rose-600 dark:hover:text-rose-400
                                border border-slate-200 dark:border-slate-700
                                hover:border-rose-200 dark:hover:border-rose-500/30
                                disabled:opacity-50">
                            {cancelling
                                ? <><i className="fa-solid fa-spinner fa-spin mr-2" />Membatalkan...</>
                                : 'Batalkan Transaksi Ini'
                            }
                        </button>
                    )}
                </div>
            </div>
        </div>

        {/* Contact Popup */}
        <ContactPopup
            isOpen={showContact}
            onClose={() => setShowContact(false)}
            waMessage={waMessage}
            title={isTransfer ? 'Konfirmasi Pembayaran' : 'Tanya Tim PSB'}
            subtitle="Pilih staf yang sesuai dengan kebutuhanmu."
        />
        </>
    )
}
