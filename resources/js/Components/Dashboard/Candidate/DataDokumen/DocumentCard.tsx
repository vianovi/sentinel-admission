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
    templateUrl   = '/assets/templates/surat-pernyataan-template.docx',
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
            await swalDark.fire({ icon: 'error', title: 'File terlalu besar', text: 'Ukuran file melebihi batas 5MB. Kompres atau perkecil ukuran file terlebih dahulu.' })
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
                    onUploadProgress: (e: { loaded: number; total?: number }) => {
                        if (e.total) setUploadProgress(Math.round((e.loaded * 100) / e.total))
                    },
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                } as any
            )
            router.reload({ only: ['documents', 'achievementDocs', 'completion'] })
            swalDark.fire({
                toast: true, position: 'top-end', icon: 'success',
                title: 'Berhasil diupload!',
                showConfirmButton: false, timer: 2500, timerProgressBar: true,
            })
        } catch (err: any) {
            shakeRow()
            const errorsFile = err?.response?.data?.errors?.file
            const msg = (Array.isArray(errorsFile) ? errorsFile[0] : errorsFile)
                ?? err?.response?.data?.message
                ?? 'Berkas dokumen gagal diunggah. Pastikan format file adalah JPEG, PNG, atau PDF (maks. 5MB), lalu coba lagi.'
            await swalDark.fire({
                icon: 'error',
                title: 'Upload gagal',
                text: msg,
            })
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
                    <div className="flex items-center gap-2 flex-wrap">
                        <p className={[
                            'text-sm font-semibold truncate transition-colors duration-150',
                            isLocked
                                ? 'dark:text-emerald-300 text-emerald-700'
                                : status === 'rejected'
                                    ? 'dark:text-red-400 text-red-600'
                                    : 'dark:text-slate-100 text-slate-800',
                        ].join(' ')}>
                            {label}
                        </p>

                        {/* Required badge */}
                        <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded text-[10px]
                                         font-bold border ${reqCfg.cls}`}>
                            {reqCfg.label}
                        </span>

                        {/* Status badge — visible di sm+, hidden di mobile */}
                        {status !== 'empty' && (
                            <span className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5
                                             rounded-full text-[11px] font-semibold border shrink-0 ${cfg.badge}`}>
                                {cfg.pulse && (
                                    <span className={[
                                        'w-1.5 h-1.5 rounded-full',
                                        status === 'uploading' ? 'bg-blue-400 animate-pulse' : 'bg-amber-400 animate-pulse',
                                    ].join(' ')} />
                                )}
                                {status === 'verified' && <i className="fa-solid fa-check text-[9px]"></i>}
                                {status === 'rejected' && <i className="fa-solid fa-xmark text-[9px]"></i>}
                                {cfg.label}
                            </span>
                        )}
                    </div>

                    {/* Row 2: sub-info — hint / filename / progress bar / drag hint */}
                    <div className="mt-1">
                        {status === 'uploading' ? (
                            /* Progress bar — slim, animated */
                            <div className="flex items-center gap-2">
                                <div className="flex-1 max-w-[180px] h-1.5 rounded-full
                                                dark:bg-white/[0.08] bg-black/[0.07] overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-blue-400 transition-all duration-300"
                                        style={{ width: `${uploadProgress}%` }}
                                    />
                                </div>
                                <span className="text-xs dark:text-blue-400 text-blue-600 font-bold">
                                    {uploadProgress}%
                                </span>
                            </div>
                        ) : docRecord?.original_filename ? (
                            <p className="text-xs dark:text-slate-400 text-slate-600 font-medium truncate flex items-center gap-1.5">
                                <i className="fa-solid fa-paperclip text-[10px] shrink-0 text-slate-400 dark:text-slate-500"></i>
                                {docRecord.original_filename}
                            </p>
                        ) : (
                            <p className={[
                                'text-xs truncate transition-colors duration-150',
                                (isDragOver || isHovered)
                                    ? 'dark:text-amber-300 text-amber-600 font-bold'
                                    : 'dark:text-slate-400 text-slate-600 font-normal',
                            ].join(' ')}>
                                {isDragOver 
                                    ? '↓ Lepas file di sini untuk upload' 
                                    : isHovered 
                                        ? 'Seret & lepas file ke baris ini untuk upload' 
                                        : hint
                                }
                            </p>
                        )}

                        {/* Surat Pernyataan extra hint */}
                        {showTemplate && status === 'empty' && (
                            <p className="text-xs dark:text-slate-400 text-slate-500 mt-1 leading-relaxed">
                                Bisa <strong className="dark:text-slate-300 text-slate-700">offline</strong> (tulis tangan) atau{' '}
                                <strong className="dark:text-slate-300 text-slate-700">online</strong> (unduh template di samping)
                            </p>
                        )}
                    </div>
                </div>

                {/* ── Actions kanan ─────────────────────────────────────── */}
                <div className={[
                    'flex items-center gap-1.5 shrink-0',
                    'transition-opacity duration-150',
                    (isEmpty && !isHovered) ? 'opacity-90 sm:opacity-100' : 'opacity-100',
                ].join(' ')}>

                    {/* Download template */}
                    {showTemplate && (
                        <a
                            href={templateUrl}
                            download
                            title="Unduh template"
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl
                                       dark:bg-white/[0.05] bg-slate-100
                                       dark:hover:bg-white/[0.10] hover:bg-slate-200
                                       dark:text-slate-300 text-slate-700
                                       border dark:border-white/10 border-black/10
                                       text-xs font-bold transition-all duration-150
                                       min-h-[36px] active:scale-95"
                        >
                            <i className="fa-solid fa-file-arrow-down text-xs"></i>
                            <span className="hidden sm:inline">Template</span>
                        </a>
                    )}

                    {/* Preview */}
                    {docRecord && status !== 'uploading' && (
                        <div className="min-h-[36px] flex items-center">
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
                                    'flex items-center gap-1.5 px-3 py-2 rounded-xl',
                                    'text-xs font-bold min-h-[36px]',
                                    'border transition-all duration-150 active:scale-95 shadow-sm',
                                    docRecord
                                        // Ganti — subtle
                                        ? 'dark:bg-white/[0.06] bg-white dark:border-white/10 border-black/10 dark:text-slate-300 text-slate-700 dark:hover:bg-white/10 hover:bg-slate-100'
                                        // Upload — amber accent
                                        : 'dark:bg-amber-500/20 bg-amber-100/80 dark:border-amber-500/40 border-amber-300 dark:text-amber-300 text-amber-800 dark:hover:bg-amber-500/30 hover:bg-amber-200',
                                ].join(' ')}
                            >
                                <i className={`text-xs fa-solid ${docRecord ? 'fa-arrow-rotate-left' : 'fa-cloud-arrow-up'}`}></i>
                                <span>
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
                            className="w-9 h-9 flex items-center justify-center rounded-xl
                                       dark:bg-red-500/10 bg-red-50
                                       dark:hover:bg-red-500/20 hover:bg-red-100
                                       dark:text-red-400 text-red-600
                                       border dark:border-red-500/20 border-red-200
                                       transition-all duration-150 active:scale-95"
                        >
                            <i className="fa-solid fa-trash-can text-xs"></i>
                        </button>
                    )}

                    {/* Download (verified) */}
                    {isLocked && docRecord && (
                        <a
                            href={route('dashboard.data-dokumen.download', { document: docRecord.id })}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl
                                       dark:bg-emerald-500/10 bg-emerald-50
                                       dark:hover:bg-emerald-500/20 hover:bg-emerald-100
                                       dark:text-emerald-400 text-emerald-700
                                       border dark:border-emerald-500/20 border-emerald-200
                                       text-xs font-bold transition-all duration-150
                                       min-h-[36px] active:scale-95"
                        >
                            <i className="fa-solid fa-download text-xs"></i>
                            <span className="hidden sm:inline">Unduh</span>
                        </a>
                    )}

                    {/* Lock icon (verified) */}
                    {isLocked && (
                        <div
                            title="Dokumen terverifikasi dan terkunci"
                            className="w-9 h-9 flex items-center justify-center rounded-xl
                                       dark:bg-emerald-500/10 bg-emerald-50
                                       border dark:border-emerald-500/20 border-emerald-200"
                        >
                            <i className="fa-solid fa-lock text-xs dark:text-emerald-400 text-emerald-700"></i>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Rejection reason — inline ────────────────────── */}
            {status === 'rejected' && docRecord?.rejection_reason && (
                <div className="flex items-start gap-2 pl-9 pr-4 pb-3">
                    <i className="fa-solid fa-circle-info text-xs text-red-500 dark:text-red-400 mt-0.5 shrink-0"></i>
                    <p className="text-xs dark:text-red-400 text-red-600 font-medium leading-relaxed">
                        {docRecord.rejection_reason}
                    </p>
                </div>
            )}
        </div>
    )
}
