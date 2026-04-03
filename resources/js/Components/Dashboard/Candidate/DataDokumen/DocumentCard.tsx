// resources/js/Components/Dashboard/Candidate/DataDokumen/DocumentCard.tsx

import { useRef, useState, useCallback } from 'react'
import { router }                         from '@inertiajs/react'
import { animate }                        from 'animejs'
import axios                              from 'axios'
import Swal                               from 'sweetalert2'
import FilePreviewModal                   from '@/Components/UI/FilePreviewModal'
import type { DocumentRecord }            from '@/Pages/Dashboard/Candidate/DataDokumen'

// ─── Types ───────────────────────────────────────────────────────────────────

type RequiredLevel = 'required' | 'optional' | 'choose-one'

interface Props {
    docType:        string
    label:          string
    hint:           string
    document:       DocumentRecord | null
    multiple?:      boolean
    requiredLevel?: RequiredLevel
    // Khusus Surat Pernyataan — tampilkan tombol download template
    showTemplate?:  boolean
    templateUrl?:   string
}

// ─── SwalDark ────────────────────────────────────────────────────────────────

const swalDark = Swal.mixin({
    background:         '#0f172a',
    color:              '#e2e8f0',
    confirmButtonColor: '#d4a017',
    cancelButtonColor:  '#334155',
    customClass: {
        popup:         '!rounded-2xl !border !border-white/10',
        title:         '!text-slate-100',
        confirmButton: '!rounded-xl !px-6',
        cancelButton:  '!rounded-xl !px-6',
    },
})

// ─── Required badge config ────────────────────────────────────────────────────

const REQUIRED_CONFIG: Record<RequiredLevel, { label: string; cls: string }> = {
    'required':   { label: 'Wajib',           cls: 'dark:bg-red-500/10 bg-red-50 dark:text-red-400 text-red-500 dark:border-red-500/20 border-red-200' },
    'optional':   { label: 'Opsional',         cls: 'dark:bg-white/[0.05] bg-slate-100 dark:text-slate-500 text-slate-400 dark:border-white/[0.07] border-black/[0.07]' },
    'choose-one': { label: 'Pilih salah satu', cls: 'dark:bg-blue-500/10 bg-blue-50 dark:text-blue-400 text-blue-600 dark:border-blue-500/20 border-blue-200' },
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
    empty:     { dot: 'dark:bg-slate-700 bg-slate-200',           label: 'Belum diupload',       badge: 'dark:bg-white/[0.05] bg-slate-100 dark:text-slate-500 text-slate-400 dark:border-white/[0.07] border-black/[0.07]' },
    uploading: { dot: 'bg-blue-500 animate-pulse',                label: 'Mengupload...',         badge: 'dark:bg-blue-500/10 bg-blue-50 dark:text-blue-400 text-blue-600 dark:border-blue-500/20 border-blue-200' },
    pending:   { dot: 'bg-amber-400',                             label: 'Menunggu verifikasi',   badge: 'dark:bg-amber-500/10 bg-amber-50 dark:text-amber-400 text-amber-600 dark:border-amber-500/20 border-amber-200' },
    verified:  { dot: 'bg-emerald-400',                           label: 'Terverifikasi',         badge: 'dark:bg-emerald-500/10 bg-emerald-50 dark:text-emerald-400 text-emerald-600 dark:border-emerald-500/20 border-emerald-200' },
    rejected:  { dot: 'bg-red-500',                               label: 'Ditolak',               badge: 'dark:bg-red-500/10 bg-red-50 dark:text-red-400 text-red-500 dark:border-red-500/20 border-red-200' },
} as const

// ─── Component ────────────────────────────────────────────────────────────────

export default function DocumentCard({
    docType, label, hint,
    document:     docRecord,
    multiple      = false,
    requiredLevel = 'required',
    showTemplate  = false,
    templateUrl   = '/assets/surat-pernyataan-template.pdf',
}: Props) {
    const [isUploading,    setIsUploading]    = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [isDragOver,     setIsDragOver]     = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)
    const rowRef   = useRef<HTMLDivElement>(null)

    const status = isUploading ? 'uploading' : (docRecord?.status ?? 'empty')
    const cfg    = STATUS_CONFIG[status]
    const reqCfg = REQUIRED_CONFIG[requiredLevel]
    const isLocked = status === 'verified'

    // ── Shake ─────────────────────────────────────────────────────────────────
    const shakeRow = () => {
        if (!rowRef.current) return
        animate(rowRef.current, { translateX: [0, -6, 6, -4, 4, 0], duration: 380, ease: 'outExpo' })
    }

    // ── Upload handler (shared) ────────────────────────────────────────────────
    const handleUpload = useCallback(async (file: File) => {
        const allowed = ['image/jpeg', 'image/png', 'application/pdf']
        if (!allowed.includes(file.type)) {
            shakeRow()
            await swalDark.fire({ icon: 'error', title: 'Format tidak didukung', text: 'Hanya JPEG, PNG, atau PDF.' })
            return
        }
        if (file.size > 5 * 1024 * 1024) {
            shakeRow()
            await swalDark.fire({ icon: 'error', title: 'File terlalu besar', text: 'Maksimum 5MB.' })
            return
        }

        setIsUploading(true)
        setUploadProgress(0)

        const formData = new FormData()
        formData.append('file', file)

        const csrf = window.document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? ''

        try {
            await axios.post(
                route('dashboard.data-dokumen.store', { docType }),
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'X-CSRF-TOKEN': csrf,
                        'Accept':       'application/json',
                    },
                    onUploadProgress: (e) => {
                        if (e.total) setUploadProgress(Math.round((e.loaded * 100) / e.total))
                    },
                }
            )
            router.reload({ only: ['documents', 'achievementDocs', 'completion'] })
            swalDark.fire({
                toast: true, position: 'top-end', icon: 'success',
                title: 'Dokumen berhasil diupload',
                showConfirmButton: false, timer: 3000, timerProgressBar: true,
            })
        } catch (err: any) {
            shakeRow()
            const msg = err?.response?.data?.errors?.file?.[0]
                ?? err?.response?.data?.message
                ?? 'Gagal mengupload. Coba lagi.'
            await swalDark.fire({ icon: 'error', title: 'Upload gagal', text: msg })
        } finally {
            setIsUploading(false)
            setUploadProgress(0)
            if (inputRef.current) inputRef.current.value = ''
        }
    }, [docType])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) handleUpload(file)
    }

    // ── Drag & Drop ───────────────────────────────────────────────────────────
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        if (!isLocked && !isUploading) setIsDragOver(true)
    }, [isLocked, isUploading])

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragOver(false)
    }, [])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragOver(false)
        if (isLocked || isUploading) return
        const file = e.dataTransfer.files[0]
        if (file) handleUpload(file)
    }, [isLocked, isUploading, handleUpload])

    // ── Delete ────────────────────────────────────────────────────────────────
    const handleDelete = async () => {
        if (!docRecord) return
        const result = await swalDark.fire({
            title: 'Hapus dokumen ini?', text: 'Kamu bisa upload ulang kapan saja.',
            icon: 'warning', showCancelButton: true,
            confirmButtonText: 'Ya, hapus', cancelButtonText: 'Batal',
        })
        if (!result.isConfirmed) return
        router.delete(
            route('dashboard.data-dokumen.destroy', { document: docRecord.id }),
            {
                onSuccess: () => swalDark.fire({
                    toast: true, position: 'top-end', icon: 'success',
                    title: 'Dokumen dihapus', showConfirmButton: false, timer: 2500,
                }),
                onError: () => shakeRow(),
            }
        )
    }

    // ─────────────────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────────────────

    return (
        <div
            ref={rowRef}
            className="flex flex-col"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* ── Main Row ─────────────────────────────────────────────── */}
            <div className={[
                'flex items-center gap-3 py-3 transition-all duration-200',
                'border-b dark:border-white/[0.05] border-black/[0.05] last:border-0',
                isDragOver && !isLocked
                    ? 'dark:bg-amber-500/[0.06] bg-amber-50/60 rounded-lg'
                    : '',
            ].join(' ')}>

                {/* Status dot indicator */}
                <div className="flex flex-col items-center gap-1 shrink-0">
                    <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                </div>

                {/* Progress ring — hanya saat uploading */}
                {status === 'uploading' && (
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0
                                    dark:bg-blue-500/10 bg-blue-50 relative">
                        <svg className="w-5 h-5 -rotate-90" viewBox="0 0 20 20">
                            <circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" strokeWidth="2"
                                className="dark:text-blue-500/20 text-blue-200" />
                            <circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" strokeWidth="2"
                                strokeDasharray={`${2 * Math.PI * 7}`}
                                strokeDashoffset={`${2 * Math.PI * 7 * (1 - uploadProgress / 100)}`}
                                strokeLinecap="round"
                                className="text-blue-400 transition-all duration-300" />
                        </svg>
                        <span className="absolute text-[8px] font-bold text-blue-400">{uploadProgress}</span>
                    </div>
                )}

                {/* Label + badge + hint/filename */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[13px] font-medium dark:text-slate-200 text-slate-700 truncate">
                            {label}
                        </p>
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px]
                                         font-medium border shrink-0 ${reqCfg.cls}`}>
                            {reqCfg.label}
                        </span>
                        {/* Status badge — hanya kalau bukan empty */}
                        {status !== 'empty' && (
                            <span className={`hidden sm:inline-flex items-center gap-1 px-2 py-0.5
                                             rounded-full text-[10px] font-medium border ${cfg.badge}`}>
                                {cfg.label}
                            </span>
                        )}
                    </div>

                    {/* Hint / filename / progress bar */}
                    {status === 'uploading' ? (
                        <div className="mt-1.5 h-1 w-full max-w-[180px] rounded-full
                                        dark:bg-white/[0.08] bg-black/[0.07] overflow-hidden">
                            <div className="h-full rounded-full bg-blue-500 transition-all duration-300"
                                 style={{ width: `${uploadProgress}%` }} />
                        </div>
                    ) : docRecord?.original_filename ? (
                        <p className="text-[11px] dark:text-slate-500 text-slate-400 truncate mt-0.5">
                            <i className="fa-solid fa-file text-[9px] mr-1"></i>
                            {docRecord.original_filename}
                        </p>
                    ) : (
                        <p className={`text-[11px] mt-0.5 truncate ${
                            isDragOver
                                ? 'dark:text-amber-400 text-amber-600 font-medium'
                                : 'dark:text-slate-600 text-slate-400'
                        }`}>
                            {isDragOver ? 'Lepas file di sini~' : hint}
                        </p>
                    )}

                    {/* Keterangan khusus Surat Pernyataan */}
                    {showTemplate && status === 'empty' && (
                        <p className="text-[10px] dark:text-slate-600 text-slate-400 mt-1 leading-relaxed">
                            Bisa diserahkan <strong className="dark:text-slate-400 text-slate-500">offline</strong> (tulis tangan saat datang ke sekolah) atau{' '}
                            <strong className="dark:text-slate-400 text-slate-500">online</strong> (unduh template, isi di komputer, tanda tangan digital/materai elektronik)
                        </p>
                    )}
                </div>

                {/* Actions kanan */}
                <div className="flex items-center gap-1.5 shrink-0">

                    {/* Download template — khusus Surat Pernyataan */}
                    {showTemplate && (
                        <a
                            href={templateUrl}
                            download
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg
                                       dark:bg-white/[0.04] bg-slate-100
                                       dark:hover:bg-white/[0.08] hover:bg-slate-200
                                       dark:text-slate-400 text-slate-500
                                       border dark:border-white/[0.07] border-black/[0.07]
                                       text-[11px] font-semibold transition-all duration-150
                                       min-h-[32px]"
                            title="Unduh template surat pernyataan"
                        >
                            <i className="fa-solid fa-file-arrow-down text-[10px]"></i>
                            <span className="hidden sm:inline">Template</span>
                        </a>
                    )}

                    {/* Preview — muncul kalau ada file */}
                    {docRecord && status !== 'uploading' && (
                        <FilePreviewModal
                            serverUrl={route('dashboard.data-dokumen.preview', { document: docRecord.id })}
                            label=""
                        />
                    )}

                    {/* Upload / Ganti — tidak muncul kalau verified atau uploading */}
                    {!isLocked && status !== 'uploading' && (
                        <>
                            <button
                                onClick={() => inputRef.current?.click()}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg
                                           dark:bg-amber-500/10 bg-amber-50
                                           dark:hover:bg-amber-500/20 hover:bg-amber-100
                                           dark:text-amber-400 text-amber-600
                                           border dark:border-amber-500/20 border-amber-200
                                           text-[11px] font-semibold transition-all duration-150
                                           min-h-[32px]"
                            >
                                <i className="fa-solid fa-cloud-arrow-up text-[10px]"></i>
                                <span className="hidden sm:inline">
                                    {docRecord ? 'Ganti' : 'Upload'}
                                </span>
                            </button>
                            <input
                                ref={inputRef}
                                type="file"
                                accept=".jpg,.jpeg,.png,.pdf"
                                className="hidden"
                                onChange={handleFileChange}
                            />
                        </>
                    )}

                    {/* Hapus — tidak kalau verified atau uploading */}
                    {docRecord && !isLocked && status !== 'uploading' && (
                        <button
                            onClick={handleDelete}
                            className="w-8 h-8 flex items-center justify-center rounded-lg
                                       dark:bg-red-500/10 bg-red-50
                                       dark:hover:bg-red-500/20 hover:bg-red-100
                                       dark:text-red-400 text-red-500
                                       border dark:border-red-500/20 border-red-200
                                       transition-all duration-150"
                            title="Hapus dokumen"
                        >
                            <i className="fa-solid fa-trash text-[10px]"></i>
                        </button>
                    )}

                    {/* Download — verified only */}
                    {isLocked && docRecord && (
                        <a
                            href={route('dashboard.data-dokumen.download', { document: docRecord.id })}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg
                                       dark:bg-emerald-500/10 bg-emerald-50
                                       dark:hover:bg-emerald-500/20 hover:bg-emerald-100
                                       dark:text-emerald-400 text-emerald-600
                                       border dark:border-emerald-500/20 border-emerald-200
                                       text-[11px] font-semibold transition-all duration-150
                                       min-h-[32px]"
                        >
                            <i className="fa-solid fa-download text-[10px]"></i>
                            <span className="hidden sm:inline">Unduh</span>
                        </a>
                    )}

                    {/* Lock icon — verified */}
                    {isLocked && (
                        <div className="w-8 h-8 flex items-center justify-center rounded-lg
                                        dark:bg-emerald-500/10 bg-emerald-50
                                        border dark:border-emerald-500/20 border-emerald-200"
                             title="Dokumen telah diverifikasi dan terkunci">
                            <i className="fa-solid fa-lock text-[10px] dark:text-emerald-400 text-emerald-600"></i>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Rejection reason ─────────────────────────────────────── */}
            {status === 'rejected' && docRecord?.rejection_reason && (
                <div className="flex items-start gap-2 py-2 px-1 mb-1">
                    <i className="fa-solid fa-circle-info text-[10px] text-red-400 mt-0.5 shrink-0"></i>
                    <p className="text-[11px] dark:text-red-400/80 text-red-500">
                        {docRecord.rejection_reason}
                    </p>
                </div>
            )}

            {/* ── Drag & drop hint — hanya di empty state, desktop ─────── */}
            {status === 'empty' && !isLocked && (
                <div className={`hidden sm:flex items-center gap-2 pb-2 transition-opacity duration-200 ${
                    isDragOver ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}>
                    <i className="fa-solid fa-hand-point-up text-[9px] dark:text-slate-600 text-slate-300"></i>
                    <span className="text-[10px] dark:text-slate-600 text-slate-400">
                        atau seret & lepas file ke sini
                    </span>
                </div>
            )}
        </div>
    )
}