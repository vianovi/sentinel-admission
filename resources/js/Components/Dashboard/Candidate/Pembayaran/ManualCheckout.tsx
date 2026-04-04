// =============================================================================
// LOKASI FILE: resources/js/Components/Dashboard/Candidate/Pembayaran/ManualCheckout.tsx
// =============================================================================

import { useEffect, useRef, useState } from 'react'
import { animate }                     from 'animejs'

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
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const formatRupiah = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

// Map bank_logo_key ke domain untuk Clearbit logo API
const BANK_DOMAINS: Record<string, string> = {
    bca:     'bca.co.id',
    bri:     'bri.co.id',
    mandiri: 'bankmandiri.co.id',
    bni:     'bni.co.id',
    bsi:     'bankbsi.co.id',
    other:   '',
}

// ─────────────────────────────────────────────────────────────────────────────
// COPY BUTTON
// ─────────────────────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false)

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text)
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
        } catch {
            // fallback
        }
    }

    return (
        <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold
                transition-all duration-200
                dark:bg-white/[0.06] bg-slate-100 dark:text-slate-400 text-slate-500
                dark:hover:bg-white/[0.1] hover:bg-slate-200"
        >
            <i className={`text-[9px] ${copied ? 'fa-solid fa-check dark:text-emerald-400 text-emerald-600' : 'fa-regular fa-copy'}`} />
            {copied ? 'Tersalin!' : 'Salin'}
        </button>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// UPLOAD ZONE
// ─────────────────────────────────────────────────────────────────────────────

function UploadZone({
    payment, onUploadProof, processing
}: {
    payment: Payment
    onUploadProof: (file: File) => void
    processing: boolean
}) {
    const [dragOver, setDragOver] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    const handleFile = (file: File) => {
        if (!file) return
        onUploadProof(file)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setDragOver(false)
        const file = e.dataTransfer.files[0]
        if (file) handleFile(file)
    }

    // Status: proof_uploaded
    if (payment.manual_status === 'proof_uploaded') {
        return (
            <div className="p-4 rounded-xl border dark:border-blue-500/20 border-blue-200
                dark:bg-blue-500/[0.06] bg-blue-50">
                <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0
                        dark:bg-blue-500/20 bg-blue-100 dark:text-blue-400 text-blue-600">
                        <i className="fa-solid fa-clock-rotate-left text-sm" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold dark:text-blue-300 text-blue-700">Menunggu Verifikasi</p>
                        <p className="text-[11px] dark:text-blue-400/70 text-blue-600/70 mt-0.5">
                            Bukti pembayaran sudah diterima. Staff PSB sedang memverifikasi (1×24 jam kerja).
                        </p>
                        {payment.proof_original_filename && (
                            <p className="text-[10px] dark:text-slate-500 text-slate-500 mt-2 font-mono truncate">
                                📎 {payment.proof_original_filename}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    // Status: verified
    if (payment.manual_status === 'verified') {
        return (
            <div className="p-4 rounded-xl border dark:border-emerald-500/20 border-emerald-200
                dark:bg-emerald-500/[0.06] bg-emerald-50">
                <div className="flex items-center gap-3">
                    <i className="fa-solid fa-circle-check dark:text-emerald-400 text-emerald-600 text-xl" />
                    <div>
                        <p className="text-sm font-semibold dark:text-emerald-300 text-emerald-700">Pembayaran Terverifikasi</p>
                        <p className="text-[11px] dark:text-emerald-400/70 text-emerald-600/70 mt-0.5">
                            Bukti pembayaran sudah dikonfirmasi oleh staff PSB.
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    // Status: rejected
    if (payment.manual_status === 'rejected') {
        return (
            <div className="space-y-3">
                <div className="p-4 rounded-xl border dark:border-rose-500/20 border-rose-200
                    dark:bg-rose-500/[0.06] bg-rose-50">
                    <div className="flex items-start gap-3">
                        <i className="fa-solid fa-circle-xmark dark:text-rose-400 text-rose-500 text-lg mt-0.5 shrink-0" />
                        <div>
                            <p className="text-sm font-semibold dark:text-rose-300 text-rose-700">Bukti Ditolak</p>
                            {payment.rejection_reason && (
                                <p className="text-[11px] dark:text-rose-400/80 text-rose-600/80 mt-1 leading-relaxed">
                                    Alasan: {payment.rejection_reason}
                                </p>
                            )}
                            <p className="text-[11px] dark:text-rose-400/60 text-rose-600/60 mt-1">
                                Silakan upload ulang bukti yang sesuai.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Upload ulang */}
                <DropZone
                    dragOver={dragOver}
                    processing={processing}
                    inputRef={inputRef}
                    onDragOver={() => setDragOver(true)}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onFileChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
                    attempt={payment.proof_attempt}
                    isReupload
                />
            </div>
        )
    }

    // Status: waiting_proof (default)
    return (
        <DropZone
            dragOver={dragOver}
            processing={processing}
            inputRef={inputRef}
            onDragOver={() => setDragOver(true)}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onFileChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
            attempt={payment.proof_attempt}
        />
    )
}

function DropZone({
    dragOver, processing, inputRef, onDragOver, onDragLeave, onDrop, onFileChange, attempt, isReupload
}: {
    dragOver:     boolean
    processing:   boolean
    inputRef:     React.RefObject<HTMLInputElement>
    onDragOver:   () => void
    onDragLeave:  () => void
    onDrop:       (e: React.DragEvent) => void
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    attempt:      number
    isReupload?:  boolean
}) {
    return (
        <div
            onDragOver={(e) => { e.preventDefault(); onDragOver() }}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={`relative rounded-xl border-2 border-dashed cursor-pointer
                transition-all duration-200 p-6 text-center
                ${dragOver
                    ? 'dark:border-amber-500/60 border-amber-400 dark:bg-amber-500/[0.08] bg-amber-50'
                    : 'dark:border-white/[0.12] border-black/[0.1] dark:hover:border-white/[0.2] hover:border-black/[0.2]'
                }
                ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            <input
                ref={inputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                className="hidden"
                onChange={onFileChange}
                disabled={processing}
            />
            <div className="flex flex-col items-center gap-2">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center
                    ${dragOver
                        ? 'dark:bg-amber-500/20 bg-amber-100 dark:text-amber-400 text-amber-600'
                        : 'dark:bg-white/[0.06] bg-slate-100 dark:text-slate-500 text-slate-400'
                    }`}>
                    {processing
                        ? <i className="fa-solid fa-spinner fa-spin" />
                        : <i className="fa-solid fa-cloud-arrow-up" />
                    }
                </div>
                <div>
                    <p className="text-sm font-semibold dark:text-slate-300 text-slate-600">
                        {processing ? 'Mengupload...' : dragOver ? 'Lepas untuk upload' : isReupload ? 'Upload Ulang Bukti' : 'Upload Bukti Pembayaran'}
                    </p>
                    <p className="text-[11px] dark:text-slate-500 text-slate-400 mt-0.5">
                        Drag & drop atau klik · JPG, PNG, PDF · Maks. 5MB
                    </p>
                </div>
                {attempt > 0 && (
                    <p className="text-[10px] dark:text-slate-600 text-slate-400">
                        Upload ke-{attempt + 1}
                    </p>
                )}
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
    const containerRef = useRef<HTMLDivElement>(null)
    const isTransfer   = payment.payment_channel === 'transfer'

    const bankDomain   = config?.bank_logo_key ? BANK_DOMAINS[config.bank_logo_key] : ''
    const logoUrl      = bankDomain ? `https://logo.clearbit.com/${bankDomain}` : null
    const [logoError, setLogoError] = useState(false)

    const transferNote = `SPMB ${candidate.candidate_code}`

    useEffect(() => {
        animate(containerRef.current!, {
            opacity:    [0, 1],
            translateX: [30, 0],
            duration:   380,
            ease:       'outExpo',
        })
        animate('.manual-row', {
            opacity:    [0, 1],
            translateX: [12, 0],
            duration:   320,
            delay:      (_, i) => 80 + i * 60,
            ease:       'outExpo',
        })
    }, [])

    return (
        <div ref={containerRef} style={{ opacity: 0 }}>
            {/* Back button */}
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-xs dark:text-slate-400 text-slate-500
                    dark:hover:text-slate-200 hover:text-slate-700 transition-colors duration-150 mb-5 group"
            >
                <i className="fa-solid fa-arrow-left group-hover:-translate-x-0.5 transition-transform duration-150" />
                Ganti Metode Pembayaran
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center
                    dark:bg-blue-500/15 bg-blue-100 dark:text-blue-400 text-blue-600">
                    <i className={isTransfer ? 'fa-solid fa-building-columns' : 'fa-solid fa-school'} />
                </div>
                <div>
                    <p className="text-base font-bold dark:text-slate-100 text-slate-800">
                        {isTransfer ? 'Transfer Bank' : 'Bayar Langsung'}
                    </p>
                    <p className="text-[11px] dark:text-slate-500 text-slate-500">
                        {isTransfer ? 'Upload bukti setelah transfer' : 'Upload kwitansi setelah bayar'}
                    </p>
                </div>
            </div>

            {/* Nominal */}
            <div className="manual-row flex items-center justify-between px-5 py-4 rounded-2xl border mb-4
                dark:border-white/[0.08] border-black/[0.08] dark:bg-white/[0.02] bg-white"
                style={{ opacity: 0 }}>
                <p className="text-xs dark:text-slate-500 text-slate-500">Total Pembayaran</p>
                <p className="text-xl font-bold dark:text-slate-100 text-slate-800">
                    {formatRupiah(payment.final_amount)}
                </p>
            </div>

            {/* Bank info — hanya untuk transfer */}
            {isTransfer && config?.bank_account_number && (
                <div className="manual-row rounded-2xl border dark:border-white/[0.08] border-black/[0.08]
                    dark:bg-white/[0.02] bg-white overflow-hidden mb-4" style={{ opacity: 0 }}>

                    <div className="px-5 py-3 border-b dark:border-white/[0.06] border-black/[0.06]
                        dark:bg-white/[0.02] bg-slate-50/80">
                        <p className="text-[11px] font-bold uppercase tracking-widest dark:text-slate-400 text-slate-500">
                            Rekening Tujuan
                        </p>
                    </div>

                    <div className="px-5 py-4 space-y-3">
                        {/* Bank name + logo */}
                        <div className="flex items-center gap-3">
                            {logoUrl && !logoError ? (
                                <img
                                    src={logoUrl}
                                    alt={config.bank_name ?? ''}
                                    className="h-7 w-auto object-contain rounded"
                                    onError={() => setLogoError(true)}
                                />
                            ) : (
                                <div className="w-8 h-8 rounded-lg dark:bg-blue-500/15 bg-blue-100 flex items-center justify-center">
                                    <i className="fa-solid fa-building-columns dark:text-blue-400 text-blue-600 text-xs" />
                                </div>
                            )}
                            <p className="text-sm font-semibold dark:text-slate-200 text-slate-700">
                                {config.bank_name ?? 'Bank'}
                            </p>
                        </div>

                        {/* Account number */}
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] dark:text-slate-500 text-slate-400 mb-0.5">Nomor Rekening</p>
                                <p className="text-base font-bold font-mono dark:text-slate-100 text-slate-800 tracking-wider">
                                    {config.bank_account_number}
                                </p>
                            </div>
                            <CopyButton text={config.bank_account_number} />
                        </div>

                        {/* Account name */}
                        <div>
                            <p className="text-[10px] dark:text-slate-500 text-slate-400 mb-0.5">Atas Nama</p>
                            <p className="text-sm font-medium dark:text-slate-300 text-slate-700">
                                {config.bank_account_name}
                            </p>
                        </div>

                        {/* Amount */}
                        <div className="flex items-center justify-between pt-1 border-t dark:border-white/[0.06] border-black/[0.06]">
                            <div>
                                <p className="text-[10px] dark:text-slate-500 text-slate-400 mb-0.5">Jumlah Transfer</p>
                                <p className="text-base font-bold dark:text-orange-400 text-orange-600">
                                    {formatRupiah(payment.final_amount)}
                                </p>
                            </div>
                            <CopyButton text={String(payment.final_amount)} />
                        </div>
                    </div>

                    {/* Transfer note */}
                    <div className="px-5 py-3.5 border-t dark:border-white/[0.06] border-black/[0.06]
                        dark:bg-amber-500/[0.05] bg-amber-50/60">
                        <p className="text-[10px] font-bold dark:text-amber-400/80 text-amber-700 uppercase tracking-wider mb-1.5">
                            📝 Wajib isi berita / keterangan transfer:
                        </p>
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-bold font-mono dark:text-amber-300 text-amber-700">
                                {transferNote}
                            </p>
                            <CopyButton text={transferNote} />
                        </div>
                        <p className="text-[10px] dark:text-amber-400/50 text-amber-600/60 mt-1.5 leading-relaxed">
                            Memudahkan pencocokan pembayaran di mutasi rekening sekolah.
                        </p>
                    </div>
                </div>
            )}

            {/* Cash info */}
            {!isTransfer && (
                <div className="manual-row p-4 rounded-2xl border dark:border-white/[0.08] border-black/[0.08]
                    dark:bg-white/[0.02] bg-white mb-4" style={{ opacity: 0 }}>
                    <p className="text-[11px] font-bold dark:text-slate-400 text-slate-500 uppercase tracking-wider mb-2">
                        Informasi Pembayaran Cash
                    </p>
                    <div className="space-y-2">
                        <div className="flex items-start gap-2 text-[12px] dark:text-slate-400 text-slate-600">
                            <i className="fa-solid fa-circle-dot dark:text-slate-600 text-slate-400 mt-1 text-[8px] shrink-0" />
                            Datang ke kantor administrasi sekolah pada jam kerja
                        </div>
                        <div className="flex items-start gap-2 text-[12px] dark:text-slate-400 text-slate-600">
                            <i className="fa-solid fa-circle-dot dark:text-slate-600 text-slate-400 mt-1 text-[8px] shrink-0" />
                            Sebutkan nama dan kode kandidat: <strong className="dark:text-slate-200 text-slate-700 ml-1">{candidate.candidate_code}</strong>
                        </div>
                        <div className="flex items-start gap-2 text-[12px] dark:text-slate-400 text-slate-600">
                            <i className="fa-solid fa-circle-dot dark:text-slate-600 text-slate-400 mt-1 text-[8px] shrink-0" />
                            Minta kwitansi resmi, lalu upload fotonya di bawah
                        </div>
                    </div>
                </div>
            )}

            {/* Upload zone */}
            <div className="manual-row mb-4" style={{ opacity: 0 }}>
                <p className="text-xs font-semibold dark:text-slate-400 text-slate-600 mb-2.5">
                    {isTransfer ? 'Upload Bukti Transfer' : 'Upload Foto Kwitansi'}
                </p>
                <UploadZone
                    payment={payment}
                    onUploadProof={onUploadProof}
                    processing={processing}
                />
            </div>

            {/* WhatsApp konfirmasi — hanya tampil setelah upload */}
            {whatsappUrl && payment.manual_status === 'proof_uploaded' && (
                <div className="manual-row mb-4 p-4 rounded-xl border dark:border-emerald-500/20 border-emerald-200
                    dark:bg-emerald-500/[0.05] bg-emerald-50" style={{ opacity: 0 }}>
                    <p className="text-[11px] dark:text-emerald-400/80 text-emerald-700 font-semibold mb-2">
                        Konfirmasi ke Tim PSB
                    </p>
                    <p className="text-[11px] dark:text-emerald-400/60 text-emerald-600/70 mb-3 leading-relaxed">
                        Percepat verifikasi dengan mengirim konfirmasi langsung ke WhatsApp tim PSB. Pesan sudah disiapkan otomatis — tinggal kirim!
                    </p>
                    <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl
                            bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold
                            transition-colors duration-150"
                    >
                        <i className="fa-brands fa-whatsapp" />
                        Konfirmasi ke {config?.whatsapp_contact_label ?? 'Tim PSB'}
                    </a>
                </div>
            )}

            {/* Cancel */}
            {payment.is_cancellable && payment.manual_status === 'waiting_proof' && (
                <button
                    onClick={onCancel}
                    disabled={cancelling}
                    className="w-full py-2.5 rounded-xl text-xs font-semibold
                        dark:bg-white/[0.04] bg-slate-100 dark:text-slate-400 text-slate-600
                        dark:hover:bg-white/[0.08] hover:bg-slate-200
                        disabled:opacity-50 transition-all duration-150"
                >
                    {cancelling
                        ? <><i className="fa-solid fa-spinner fa-spin mr-1.5" />Membatalkan...</>
                        : 'Batalkan & Ganti Metode'
                    }
                </button>
            )}
        </div>
    )
}
