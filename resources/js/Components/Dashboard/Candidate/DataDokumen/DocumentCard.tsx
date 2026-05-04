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

// ─── Mime helper ─ deteksi dari nama file asli (punya ekstensi) ───

const mimeFromFilename = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase() ?? ''
    if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg'
    if (ext === 'png')  return 'image/png'
    if (ext === 'webp') return 'image/webp'
    if (ext === 'gif')  return 'image/gif'
    if (ext === 'pdf')  return 'application/pdf'
    return ''
}

// ─── Status config ────────────────────────────────────────────────────────────
// accent  = left border bar color (hardcoded — tidak dynamic string)
// dot     = indicator dot
// badge   = inline badge classes

const STATUS_CONFIG = {
    empty: {
        accent:  'dark:bg-slate-700/50 bg-slate-200/70',
        dot:     'dark:bg-slate-600 bg-slate-300',
        pulse:   false,
        label:   'Belum diupload',
        badge:   'dark:bg-white/[0.04] bg-slate-100 dark:text-slate-500 text-slate-400 dark:border-white/[0.06] border-black/[0.06]',
        iconCls: 'dark:text-slate-600 text-slate-300',
    },
    uploading: {
        accent:  'bg-blue-500',
        dot:     'bg-blue-400',
        pulse:   true,
        label:   'Mengupload...',
        badge:   'dark:bg-blue-500/10 bg-blue-50 dark:text-blue-400 text-blue-600 dark:border-blue-500/20 border-blue-200',
        iconCls: 'text-blue-400',
    },
    pending: {
        accent:  'bg-amber-400',
        dot:     'bg-amber-400',
        pulse:   true,
        label:   'Menunggu verifikasi',
        badge:   'dark:bg-amber-500/10 bg-amber-50 dark:text-amber-400 text-amber-600 dark:border-amber-500/20 border-amber-200',
        iconCls: 'text-amber-400',
    },
    verified: {
        accent:  'bg-emerald-400',
        dot:     'bg-emerald-400',
        pulse:   false,
        label:   'Terverifikasi',
        badge:   'dark:bg-emerald-500/10 bg-emerald-50 dark:text-emerald-400 text-emerald-600 dark:border-emerald-500/20 border-emerald-200',
        iconCls: 'text-emerald-400',
    },
    rejected: {
        accent:  'bg-red-500',
        dot:     'bg-red-500',
        pulse:   false,
        label:   'Ditolak',
        badge:   'dark:bg-red-500/10 bg-red-50 dark:text-red-400 text-red-500 dark:border-red-500/20 border-red-200',
        iconCls: 'text-red-400',
    },
} as const

// ─── Required badge ───────────────────────────────────────────────────────────

const REQUIRED_CONFIG: Record<RequiredLevel, { label: string; cls: string }> = {
    'required':   { label: 'Wajib',           cls: 'dark:bg-red-500/[0.08] bg-red-50 dark:text-red-400 text-red-500 dark:border-red-500/15 border-red-200' },
    'optional':   { label: 'Opsional',         cls: 'dark:bg-white/[0.04] bg-slate-100 dark:text-slate-500 text-slate-400 dark:border-white/[0.06] border-black/[0.06]' },
    'choose-one': { label: 'Pilih salah satu', cls: 'dark:bg-blue-500/[0.08] bg-blue-50 dark:text-blue-400 text-blue-500 dark:border-blue-500/15 border-blue-200' },
}

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
    const [isHovered,      setIsHovered]      = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)
    const rowRef   = useRef<HTMLDivElement>(null)

    const status   = isUploading ? 'uploading' : (docRecord?.status ?? 'empty')
    const cfg      = STATUS_CONFIG[status]
    const reqCfg   = REQUIRED_CONFIG[requiredLevel]
    const isLocked = status === 'verified'
    const isEmpty  = status === 'empty'

    // ── Shake ─────────────────────────────────────────────────────────────────
    const shakeRow = useCallback(() => {
        if (!rowRef.current) return
        animate(rowRef.current, {
            translateX: [0, -5, 5, -3, 3, 0],
            duration:   350,
            ease:       'outExpo',
        })
    }, [])

    // ── Upload ────────────────────────────────────────────────────────────────
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
                title: 'Berhasil diupload!',
                showConfirmButton: false, timer: 2500, timerProgressBar: true,
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
    }, [docType, shakeRow])

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
                    title: 'Dokumen dihapus', showConfirmButton: false, timer: 2000,
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
            className={[
                // Base row — compact, border-bottom separator
                'group relative flex flex-col',
                'border-b dark:border-white/[0.05] border-black/[0.05] last:border-0',
                // Drag over state
                isDragOver && !isLocked
                    ? 'dark:bg-amber-500/[0.05] bg-amber-50/40'
                    : '',
                // Transition untuk semua efek
                'transition-colors duration-200',
            ].join(' ')}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* ── Left accent bar — tipis, 2px, full height ─────────────── */}
            {/* Absolute di sisi kiri, menggantikan dot indicator */}
            <div className={[
                'absolute left-0 top-0 bottom-0 w-[2.5px] rounded-r-full',
                'transition-all duration-300',
                cfg.accent,
                // Hanya muncul di non-empty, atau saat hover/drag
                (isEmpty && !isDragOver && !isHovered)
                    ? 'opacity-0'
                    : 'opacity-100',
            ].join(' ')} />

            {/* ── Main row ──────────────────────────────────────────────── */}
            <div className="flex items-center gap-3 pl-4 pr-3 py-3">

                {/* Status indicator — dot kecil + pulse ring kalau pending/uploading */}
                <div className="relative flex items-center justify-center shrink-0 w-4">
                    {/* Pulse ring — pending / uploading */}
                    {cfg.pulse && (
                        <span className={[
                            'absolute inline-flex w-3.5 h-3.5 rounded-full opacity-40',
                            status === 'uploading' ? 'bg-blue-400 animate-ping' : 'bg-amber-400 animate-ping',
                        ].join(' ')} />
                    )}
                    <span className={`relative inline-flex w-2 h-2 rounded-full ${cfg.dot}`} />
                </div>

                {/* Upload progress ring — compact, hanya saat uploading */}
                {status === 'uploading' && (
                    <div className="relative w-6 h-6 shrink-0">
                        <svg className="w-6 h-6 -rotate-90" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2"
                                className="dark:text-blue-500/20 text-blue-200" />
                            <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2"
                                strokeDasharray={`${2 * Math.PI * 9}`}
                                strokeDashoffset={`${2 * Math.PI * 9 * (1 - uploadProgress / 100)}`}
                                strokeLinecap="round"
                                className="text-blue-400 transition-all duration-300" />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center
                                         text-[7px] font-bold text-blue-400">
                            {uploadProgress}
                        </span>
                    </div>
                )}

                {/* Label + badge + sub-info ─────────────────────────────── */}
                <div className="flex-1 min-w-0">

                    {/* Row 1: label + required badge + status badge */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <p className={[
                            'text-[13px] font-medium truncate transition-colors duration-150',
                            isLocked
                                ? 'dark:text-emerald-300 text-emerald-700'
                                : status === 'rejected'
                                    ? 'dark:text-red-300 text-red-700'
                                    : 'dark:text-slate-200 text-slate-700',
                        ].join(' ')}>
                            {label}
                        </p>

                        {/* Required badge */}
                        <span className={`shrink-0 inline-flex items-center px-1.5 py-px rounded text-[9px]
                                         font-semibold border ${reqCfg.cls}`}>
                            {reqCfg.label}
                        </span>

                        {/* Status badge — visible di sm+, hidden di mobile */}
                        {status !== 'empty' && (
                            <span className={`hidden sm:inline-flex items-center gap-1 px-2 py-px
                                             rounded-full text-[10px] font-medium border shrink-0 ${cfg.badge}`}>
                                {cfg.pulse && (
                                    <span className={[
                                        'w-1 h-1 rounded-full',
                                        status === 'uploading' ? 'bg-blue-400 animate-pulse' : 'bg-amber-400 animate-pulse',
                                    ].join(' ')} />
                                )}
                                {status === 'verified' && <i className="fa-solid fa-check text-[8px]"></i>}
                                {status === 'rejected' && <i className="fa-solid fa-xmark text-[8px]"></i>}
                                {cfg.label}
                            </span>
                        )}
                    </div>

                    {/* Row 2: sub-info — hint / filename / progress bar / drag hint */}
                    <div className="mt-0.5">
                        {status === 'uploading' ? (
                            /* Progress bar — slim, animated */
                            <div className="flex items-center gap-2">
                                <div className="flex-1 max-w-[160px] h-[3px] rounded-full
                                                dark:bg-white/[0.08] bg-black/[0.07] overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-blue-400 transition-all duration-300"
                                        style={{ width: `${uploadProgress}%` }}
                                    />
                                </div>
                                <span className="text-[10px] dark:text-blue-400 text-blue-600 font-medium">
                                    {uploadProgress}%
                                </span>
                            </div>
                        ) : docRecord?.original_filename ? (
                            <p className="text-[11px] dark:text-slate-500 text-slate-400 truncate flex items-center gap-1">
                                <i className="fa-solid fa-paperclip text-[9px] shrink-0"></i>
                                {docRecord.original_filename}
                            </p>
                        ) : (
                            <p className={[
                                'text-[11px] truncate transition-colors duration-150',
                                isDragOver
                                    ? 'dark:text-amber-400 text-amber-500 font-medium'
                                    : 'dark:text-slate-600 text-slate-400',
                            ].join(' ')}>
                                {isDragOver ? '↓ Lepas file di sini' : hint}
                            </p>
                        )}

                        {/* Surat Pernyataan extra hint */}
                        {showTemplate && status === 'empty' && (
                            <p className="text-[10px] dark:text-slate-600 text-slate-400 mt-0.5 leading-relaxed">
                                Bisa <strong className="dark:text-slate-500 text-slate-500">offline</strong> (tulis tangan) atau{' '}
                                <strong className="dark:text-slate-500 text-slate-500">online</strong> (unduh template di bawah)
                            </p>
                        )}
                    </div>
                </div>

                {/* ── Actions kanan ─────────────────────────────────────── */}
                <div className={[
                    'flex items-center gap-1 shrink-0',
                    'transition-opacity duration-150',
                    // Fade in on hover — empty state actions sedikit muted sebelum hover
                    (isEmpty && !isHovered) ? 'opacity-60' : 'opacity-100',
                ].join(' ')}>

                    {/* Download template */}
                    {showTemplate && (
                        <a
                            href={templateUrl}
                            download
                            title="Unduh template"
                            className="flex items-center gap-1 px-2 py-1.5 rounded-lg
                                       dark:bg-white/[0.04] bg-slate-100
                                       dark:hover:bg-white/[0.08] hover:bg-slate-200
                                       dark:text-slate-400 text-slate-500
                                       border dark:border-white/[0.07] border-black/[0.07]
                                       text-[10px] font-semibold transition-all duration-150
                                       min-h-[30px] active:scale-95"
                        >
                            <i className="fa-solid fa-file-arrow-down text-[9px]"></i>
                            <span className="hidden sm:inline">Template</span>
                        </a>
                    )}

                    {/* Preview */}
                    {docRecord && status !== 'uploading' && (
                        <div className="min-h-[30px] flex items-center">
                            <FilePreviewModal
                                serverUrl={route('dashboard.data-dokumen.preview', { document: docRecord.id })}
                                mimeType={mimeFromFilename(docRecord.original_filename)}
                                label=""
                            />
                        </div>
                    )}

                    {/* Upload / Ganti */}
                    {!isLocked && status !== 'uploading' && (
                        <>
                            <button
                                onClick={() => inputRef.current?.click()}
                                className={[
                                    'flex items-center gap-1 px-2.5 py-1.5 rounded-lg',
                                    'text-[10px] font-semibold min-h-[30px]',
                                    'border transition-all duration-150 active:scale-95',
                                    docRecord
                                        // Ganti — subtle
                                        ? 'dark:bg-white/[0.04] bg-white dark:border-white/[0.08] border-black/[0.08] dark:text-slate-400 text-slate-500 dark:hover:bg-white/[0.08] hover:bg-slate-100'
                                        // Upload — amber accent
                                        : 'dark:bg-amber-500/10 bg-amber-50 dark:border-amber-500/20 border-amber-200 dark:text-amber-400 text-amber-600 dark:hover:bg-amber-500/20 hover:bg-amber-100',
                                ].join(' ')}
                            >
                                <i className={`text-[9px] fa-solid ${docRecord ? 'fa-arrow-rotate-left' : 'fa-cloud-arrow-up'}`}></i>
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

                    {/* Hapus */}
                    {docRecord && !isLocked && status !== 'uploading' && (
                        <button
                            onClick={handleDelete}
                            title="Hapus dokumen"
                            className="w-[30px] h-[30px] flex items-center justify-center rounded-lg
                                       dark:bg-red-500/[0.08] bg-red-50
                                       dark:hover:bg-red-500/15 hover:bg-red-100
                                       dark:text-red-400 text-red-500
                                       border dark:border-red-500/15 border-red-200
                                       transition-all duration-150 active:scale-95"
                        >
                            <i className="fa-solid fa-trash-can text-[9px]"></i>
                        </button>
                    )}

                    {/* Download (verified) */}
                    {isLocked && docRecord && (
                        <a
                            href={route('dashboard.data-dokumen.download', { document: docRecord.id })}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg
                                       dark:bg-emerald-500/[0.08] bg-emerald-50
                                       dark:hover:bg-emerald-500/15 hover:bg-emerald-100
                                       dark:text-emerald-400 text-emerald-600
                                       border dark:border-emerald-500/15 border-emerald-200
                                       text-[10px] font-semibold transition-all duration-150
                                       min-h-[30px] active:scale-95"
                        >
                            <i className="fa-solid fa-download text-[9px]"></i>
                            <span className="hidden sm:inline">Unduh</span>
                        </a>
                    )}

                    {/* Lock icon (verified) */}
                    {isLocked && (
                        <div
                            title="Dokumen terverifikasi dan terkunci"
                            className="w-[30px] h-[30px] flex items-center justify-center rounded-lg
                                       dark:bg-emerald-500/[0.08] bg-emerald-50
                                       border dark:border-emerald-500/15 border-emerald-200"
                        >
                            <i className="fa-solid fa-lock text-[9px] dark:text-emerald-400 text-emerald-600"></i>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Rejection reason — inline, compact ────────────────────── */}
            {status === 'rejected' && docRecord?.rejection_reason && (
                <div className="flex items-start gap-1.5 pl-8 pr-3 pb-2.5">
                    <i className="fa-solid fa-circle-info text-[9px] text-red-400 mt-0.5 shrink-0"></i>
                    <p className="text-[11px] dark:text-red-400/70 text-red-500 leading-relaxed">
                        {docRecord.rejection_reason}
                    </p>
                </div>
            )}

            {/* ── Drag & drop overlay hint — desktop only, empty state ──── */}
            {isEmpty && !isLocked && (
                <div className={[
                    'hidden sm:flex items-center gap-1.5 pl-8 pb-2',
                    'transition-all duration-200',
                    isDragOver ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
                ].join(' ')}>
                    <i className="fa-solid fa-arrow-up-from-bracket text-[9px] dark:text-slate-600 text-slate-300"></i>
                    <span className="text-[10px] dark:text-slate-600 text-slate-400">
                        atau seret &amp; lepas file ke sini
                    </span>
                </div>
            )}
        </div>
    )
}