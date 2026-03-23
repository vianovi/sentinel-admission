import { useRef, useState } from 'react'
import { router } from '@inertiajs/react'
import { animate } from 'animejs'
import axios from 'axios'
import Swal from 'sweetalert2'
import type { DocumentRecord } from '@/Pages/Dashboard/Candidate/DataDokumen'

// ─── Types ───────────────────────────────────────────────────

interface Props {
    docType:   string
    label:     string
    hint:      string
    document:  DocumentRecord | null  // null = belum diupload
    multiple?: boolean                // untuk achievement group
}

// ─── swalDark mixin ──────────────────────────────────────────

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

// ─── Component ───────────────────────────────────────────────

export default function DocumentCard({
    docType,
    label,
    hint,
    document: docRecord,   // rename prop → tidak clash dengan window.document
    multiple = false,
}: Props) {
    const [isUploading, setIsUploading]       = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const inputRef = useRef<HTMLInputElement>(null)
    const cardRef  = useRef<HTMLDivElement>(null)

    const status = isUploading ? 'uploading' : (docRecord?.status ?? 'empty')

    // ── Upload handler ────────────────────────────────────────

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // UI validation — UX gate saja, backend tetap validasi ulang
        const allowed = ['image/jpeg', 'image/png', 'application/pdf']
        if (!allowed.includes(file.type)) {
            shakeCard()
            await swalDark.fire({ icon: 'error', title: 'Format tidak didukung', text: 'Hanya JPEG, PNG, atau PDF yang diterima.' })
            return
        }
        if (file.size > 5 * 1024 * 1024) {
            shakeCard()
            await swalDark.fire({ icon: 'error', title: 'File terlalu besar', text: 'Ukuran maksimum 5MB.' })
            return
        }

        setIsUploading(true)
        setUploadProgress(0)

        const formData = new FormData()
        formData.append('file', file)

        // CSRF token dari meta tag — window.document aman di sini (bukan prop)
        const csrf = window.document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute('content') ?? ''

        try {
            await axios.post(
                route('dashboard.data-dokumen.store', { docType }),
                formData,
                {
                    headers: { 'Content-Type': 'multipart/form-data', 'X-CSRF-TOKEN': csrf },
                    onUploadProgress: (e) => {
                        // e.total bisa undefined di beberapa browser — selalu guard
                        if (e.total) setUploadProgress(Math.round((e.loaded * 100) / e.total))
                    },
                }
            )

            // Partial reload — ambil data terbaru tanpa full page reload
            router.reload({ only: ['documents', 'achievementDocs', 'completion'] })

            swalDark.fire({
                toast: true, position: 'top-end', icon: 'success',
                title: 'Dokumen berhasil diupload',
                showConfirmButton: false, timer: 3000, timerProgressBar: true,
            })

        } catch (err: any) {
            shakeCard()
            const msg = err?.response?.data?.errors?.file?.[0]
                ?? 'Gagal mengupload. Silakan coba lagi.'
            await swalDark.fire({ icon: 'error', title: 'Upload gagal', text: msg })
        } finally {
            setIsUploading(false)
            setUploadProgress(0)
            if (inputRef.current) inputRef.current.value = ''
        }
    }

    // ── Delete handler ────────────────────────────────────────

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
                onError: () => shakeCard(),
            }
        )
    }

    // ── Shake animation ───────────────────────────────────────

    const shakeCard = () => {
        if (!cardRef.current) return
        animate(cardRef.current, { translateX: [0, -6, 6, -4, 4, 0], duration: 380, ease: 'outExpo' })
    }

    // ── Status config ─────────────────────────────────────────

    const statusConfig = {
        empty:     { border: 'border-slate-200 dark:border-slate-700',   badge: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400',    label: 'Belum diupload',       icon: 'fa-cloud-arrow-up' },
        uploading: { border: 'border-blue-300 dark:border-blue-700',     badge: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',       label: `Mengupload ${uploadProgress}%`, icon: 'fa-spinner fa-spin' },
        pending:   { border: 'border-amber-300 dark:border-amber-700',   badge: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',   label: 'Menunggu verifikasi',  icon: 'fa-clock' },
        verified:  { border: 'border-emerald-300 dark:border-emerald-700', badge: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400', label: 'Terverifikasi', icon: 'fa-circle-check' },
        rejected:  { border: 'border-red-300 dark:border-red-700',       badge: 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400',           label: 'Ditolak',              icon: 'fa-circle-xmark' },
    }

    const cfg = statusConfig[status]

    // ─────────────────────────────────────────────────────────

    return (
        <div
            ref={cardRef}
            className={`rounded-2xl border bg-[var(--content-surface)] p-4 transition-all duration-300 ${cfg.border}`}
        >
            {/* Header row */}
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{label}</p>
                    <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500 line-clamp-2">{hint}</p>
                </div>
                <span className={`flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.badge}`}>
                    <i className={`fa-solid ${cfg.icon} text-[10px]`} />
                    {cfg.label}
                </span>
            </div>

            {/* Upload progress bar */}
            {status === 'uploading' && (
                <div className="mt-3 h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div className="h-full rounded-full bg-blue-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                </div>
            )}

            {/* Filename */}
            {docRecord && status !== 'uploading' && (
                <p className="mt-2 text-xs text-slate-400 dark:text-slate-500 truncate flex items-center gap-1.5">
                    <i className="fa-solid fa-file text-[10px]" />
                    {docRecord.original_filename}
                </p>
            )}

            {/* Rejection reason */}
            {status === 'rejected' && docRecord?.rejection_reason && (
                <div className="mt-2 rounded-xl bg-red-50 dark:bg-red-900/20 px-3 py-2">
                    <p className="text-xs text-red-600 dark:text-red-400">
                        <i className="fa-solid fa-circle-info mr-1.5" />
                        {docRecord.rejection_reason}
                    </p>
                </div>
            )}

            {/* Actions — tidak tampil saat verified */}
            {status !== 'verified' && (
                <div className="mt-3 flex gap-2">
                    {status !== 'uploading' && (
                        <>
                            <button
                                onClick={() => inputRef.current?.click()}
                                className="flex-1 min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white text-sm font-medium transition-all duration-200"
                            >
                                <i className="fa-solid fa-cloud-arrow-up text-xs" />
                                {docRecord ? 'Ganti' : 'Upload'}
                            </button>
                            <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.pdf" className="hidden" onChange={handleFileChange} />
                        </>
                    )}
                    {docRecord && status !== 'uploading' && (
                        <button
                            onClick={handleDelete}
                            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-500 dark:text-red-400 transition-all duration-200"
                            title="Hapus dokumen"
                        >
                            <i className="fa-solid fa-trash text-xs" />
                        </button>
                    )}
                </div>
            )}

            {/* Verified — download only */}
            {status === 'verified' && docRecord && (
                <div className="mt-3">
                    <a
                        href={route('dashboard.data-dokumen.download', { document: docRecord.id })}
                        className="flex items-center justify-center gap-2 min-h-[44px] rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 text-sm font-medium transition-all duration-200"
                    >
                        <i className="fa-solid fa-download text-xs" />
                        Unduh dokumen
                    </a>
                </div>
            )}
        </div>
    )
}
