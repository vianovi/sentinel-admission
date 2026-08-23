// resources/js/Components/Dashboard/Candidate/DataDokumen/TabComponents.tsx

import { memo, useEffect, useRef, useState } from 'react'
import { animate, stagger }                   from 'animejs'
import { router }                             from '@inertiajs/react'
import axios                                  from 'axios'
import DocumentCard                           from './DocumentCard'
import type { DocumentRecord }               from '@/Pages/Dashboard/Candidate/DataDokumen'

// ─── Shared tab props ─────────────────────────────────────────────────────────

interface TabProps {
    documents:       Record<string, DocumentRecord>
    achievementDocs: Record<string, DocumentRecord[]>
    isTransfer:      boolean
}

// ─── Shared entrance animation ────────────────────────────────────────────────

function useTabEntrance() {
    useEffect(() => {
        animate('.dok-section', {
            opacity:    [0, 1],
            translateY: [10, 0],
            duration:   400,
            delay:      stagger(70),
            ease:       'outExpo',
        })
    }, [])
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({ icon, title, subtitle, count }: {
    icon:     string
    title:    string
    subtitle: string
    count?:   number
}) {
    return (
        <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl shrink-0
                            dark:bg-amber-500/10 bg-amber-50
                            border dark:border-amber-500/20 border-amber-200
                            flex items-center justify-center">
                <i className={`${icon} text-amber-400 text-sm`}></i>
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold dark:text-white text-slate-800">
                        {title}
                    </h3>
                    {count !== undefined && (
                        <span className="text-[10px] font-semibold px-1.5 py-px rounded-md
                                         dark:bg-white/[0.06] bg-slate-100
                                         dark:text-slate-500 text-slate-400
                                         border dark:border-white/[0.07] border-black/[0.07]">
                            {count}
                        </span>
                    )}
                </div>
                <p className="text-[11px] dark:text-slate-500 text-slate-400 mt-px">
                    {subtitle}
                </p>
            </div>
        </div>
    )
}

// ─── Info Banner ──────────────────────────────────────────────────────────────

function InfoBanner({ color, icon, children }: {
    color:    'blue' | 'amber' | 'emerald'
    icon:     string
    children: React.ReactNode
}) {
    const clsMap = {
        blue:    'dark:border-blue-500/20 border-blue-200 dark:bg-blue-500/[0.05] bg-blue-50 dark:text-blue-300/80 text-blue-700',
        amber:   'dark:border-amber-500/20 border-amber-200 dark:bg-amber-500/[0.05] bg-amber-50 dark:text-amber-300/80 text-amber-700',
        emerald: 'dark:border-emerald-500/20 border-emerald-200 dark:bg-emerald-500/[0.05] bg-emerald-50 dark:text-emerald-300/80 text-emerald-700',
    }
    const iconClsMap = {
        blue:    'text-blue-400',
        amber:   'text-amber-400',
        emerald: 'text-emerald-400',
    }

    return (
        <div className={`flex items-start gap-2.5 p-3 rounded-xl border mb-4 ${clsMap[color]}`}>
            <i className={`${icon} ${iconClsMap[color]} text-xs mt-0.5 shrink-0`}></i>
            <p className="text-[11px] leading-relaxed">{children}</p>
        </div>
    )
}

// ─── DocList — container rows, compact, subtle border ─────────────────────────

function DocList({ children }: { children: React.ReactNode }) {
    return (
        <div className="rounded-xl border overflow-hidden
                        dark:border-white/[0.06] border-black/[0.06]
                        dark:bg-white/[0.015] bg-white">
            {children}
        </div>
    )
}

// ─── AddDocumentRow — tombol tambah dokumen prestasi (compact, dashed style) ──

function AddDocumentRow({ label, docType }: { label: string; docType: string }) {
    const inputRef = useRef<HTMLInputElement>(null)
    const [isDrag, setIsDrag] = useState(false)

    const handleUpload = async (file: File) => {
        const allowed = ['image/jpeg', 'image/png', 'application/pdf']
        if (!allowed.includes(file.type) || file.size > 5 * 1024 * 1024) return
        const formData = new FormData()
        formData.append('file', file)
        const csrf = window.document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? ''
        try {
            await axios.post(route('dashboard.data-dokumen.store', { docType }), formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'X-CSRF-TOKEN': csrf,
                    'Accept':       'application/json',
                },
            })
            router.reload({ only: ['achievementDocs', 'completion'] })
        } catch { /* silent */ }
    }

    return (
        <div
            className={[
                'flex items-center gap-3 px-4 py-3 cursor-pointer',
                'border-t dark:border-white/10 border-black/10',
                'transition-colors duration-150',
                isDrag
                    ? 'dark:bg-amber-500/10 bg-amber-50'
                    : 'dark:hover:bg-white/[0.04] hover:bg-slate-50',
            ].join(' ')}
            onClick={() => inputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setIsDrag(true) }}
            onDragLeave={() => setIsDrag(false)}
            onDrop={e => {
                e.preventDefault()
                setIsDrag(false)
                const f = e.dataTransfer.files[0]
                if (f) handleUpload(f)
            }}
        >
            {/* Plus icon */}
            <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0
                            dark:bg-amber-500/20 bg-amber-100
                            border dark:border-amber-500/30 border-amber-300">
                <i className="fa-solid fa-plus text-amber-500 dark:text-amber-400 text-xs"></i>
            </div>

            <p className="text-xs font-semibold dark:text-slate-200 text-slate-700 flex-1">
                {isDrag ? '↓ Lepaskan file sertifikat di sini' : label}
            </p>

            <span className="text-xs dark:text-slate-400 text-slate-500 font-medium">
                {isDrag ? '' : 'JPG, PNG, PDF · maks. 5MB'}
            </span>

            <input
                ref={inputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                className="hidden"
                onChange={e => {
                    const f = e.target.files?.[0]
                    if (f) handleUpload(f)
                    e.target.value = ''
                }}
            />
        </div>
    )
}

// =============================================================================
// TAB A — Identitas & Kependudukan
// =============================================================================

export const TabIdentitas = memo(function TabIdentitas({ documents }: TabProps) {
    useTabEntrance()

    const docs = [
        { type: 'photo_formal',      label: 'Pas Foto Resmi',       hint: 'Untuk kartu peserta & arsip digital', required: 'required' as const },
        { type: 'birth_certificate', label: 'Akta Kelahiran',        hint: 'Verifikasi identitas resmi',          required: 'required' as const },
        { type: 'family_card',       label: 'Kartu Keluarga (KK)',   hint: 'Verifikasi data keluarga & domisili', required: 'required' as const },
        { type: 'parent_id_card',    label: 'KTP Orang Tua / Wali', hint: 'Legalitas pendaftaran oleh wali',     required: 'required' as const },
    ]

    const uploaded = docs.filter(d => !!documents[d.type]).length

    return (
        <div className="flex flex-col gap-5">
            <section className="dok-section opacity-0">
                <SectionHeader
                    icon="fa-solid fa-id-card"
                    title="Identitas & Kependudukan"
                    subtitle="Dokumen yang membuktikan identitas secara hukum"
                    count={uploaded}
                />
                <DocList>
                    {docs.map(({ type, label, hint, required }) => (
                        <DocumentCard
                            key={type}
                            docType={type}
                            label={label}
                            hint={hint}
                            document={documents[type] ?? null}
                            requiredLevel={required}
                        />
                    ))}
                </DocList>
            </section>
        </div>
    )
})

// =============================================================================
// TAB B — Akademik
// =============================================================================

export const TabAkademik = memo(function TabAkademik({ documents, isTransfer }: TabProps) {
    useTabEntrance()

    const docs = [
        { type: 'graduation_certificate', label: 'Ijazah / SKL',            hint: 'Bukti kelulusan jenjang sebelumnya',          required: 'required' as const },
        { type: 'report_card',            label: 'Rapor Semester Terakhir',  hint: 'Rekam jejak akademik terkini',                required: 'required' as const },
        { type: 'academic_transcript',    label: 'Transkrip Nilai Lengkap',  hint: 'Gambaran akademik menyeluruh untuk evaluasi', required: 'optional' as const },
    ]

    const uploaded = docs.filter(d => !!documents[d.type]).length

    return (
        <div className="flex flex-col gap-5">
            <section className="dok-section opacity-0">
                <SectionHeader
                    icon="fa-solid fa-graduation-cap"
                    title="Akademik"
                    subtitle="Rekam jejak pendidikan dari sekolah sebelumnya"
                    count={uploaded}
                />
                <DocList>
                    {docs.map(({ type, label, hint, required }) => (
                        <DocumentCard
                            key={type}
                            docType={type}
                            label={label}
                            hint={hint}
                            document={documents[type] ?? null}
                            requiredLevel={required}
                        />
                    ))}
                </DocList>
            </section>

            {isTransfer && (
                <section className="dok-section opacity-0">
                    <SectionHeader
                        icon="fa-solid fa-right-left"
                        title="Surat Pindahan"
                        subtitle="Diperlukan karena kamu mendaftar sebagai siswa pindahan"
                    />
                    <InfoBanner color="amber" icon="fa-solid fa-triangle-exclamation">
                        Kamu terdaftar sebagai <strong>siswa pindahan</strong> — surat keterangan pindah wajib dilampirkan.
                    </InfoBanner>
                    <DocList>
                        <DocumentCard
                            docType="transfer_letter"
                            label="Surat Keterangan Pindah"
                            hint="Dari sekolah asal — wajib untuk siswa pindahan"
                            document={documents['transfer_letter'] ?? null}
                        />
                    </DocList>
                </section>
            )}
        </div>
    )
})

// =============================================================================
// TAB C — Prestasi (multi-upload)
// =============================================================================

export const TabPrestasi = memo(function TabPrestasi({ achievementDocs }: TabProps) {
    useTabEntrance()

    const categories = [
        { type: 'achievement_academic',    label: 'Prestasi Akademik',    subtitle: 'OSN, olimpiade sains, karya tulis ilmiah, dll', icon: 'fa-solid fa-flask'             },
        { type: 'achievement_nonacademic', label: 'Prestasi Non-Akademik', subtitle: 'O2SN, FLS2N, olahraga, seni, debat, dll',      icon: 'fa-solid fa-medal'             },
        { type: 'achievement_religious',   label: 'Prestasi Keagamaan',   subtitle: 'MTQ, tahfidz, lomba keagamaan',                 icon: 'fa-solid fa-star-and-crescent' },
    ]

    return (
        <div className="flex flex-col gap-5">
            <div className="dok-section opacity-0">
                <InfoBanner color="blue" icon="fa-solid fa-circle-info">
                    Tiap kategori bisa diupload <strong>lebih dari satu dokumen</strong>.
                    Lampirkan semua sertifikat prestasi yang kamu miliki.
                </InfoBanner>
            </div>

            {categories.map(({ type, label, subtitle, icon }) => {
                const existingDocs = achievementDocs[type] ?? []
                return (
                    <section key={type} className="dok-section opacity-0">
                        <SectionHeader
                            icon={icon}
                            title={label}
                            subtitle={subtitle}
                            count={existingDocs.length}
                        />
                        <DocList>
                            {existingDocs.map((doc, idx) => (
                                <DocumentCard
                                    key={doc.id}
                                    docType={type}
                                    label={`${label} #${idx + 1}`}
                                    hint={doc.original_filename}
                                    document={doc}
                                    multiple
                                    requiredLevel="optional"
                                />
                            ))}
                            <AddDocumentRow
                                label={existingDocs.length > 0 ? `Tambah ${label}` : label}
                                docType={type}
                            />
                        </DocList>
                    </section>
                )
            })}
        </div>
    )
})

// =============================================================================
// TAB D — Bantuan & Afirmasi
// =============================================================================

export const TabBantuan = memo(function TabBantuan({ documents }: TabProps) {
    useTabEntrance()

    const docs = [
        { type: 'kip_card',       label: 'Kartu Indonesia Pintar (KIP)', hint: 'Untuk pengusulan PIP — bantuan biaya pendidikan pemerintah', required: 'choose-one' as const },
        { type: 'welfare_card',   label: 'Kartu KKS / PKH',              hint: 'Bukti keluarga penerima program kesejahteraan sosial',        required: 'choose-one' as const },
        { type: 'poverty_letter', label: 'Surat Keterangan Tidak Mampu', hint: 'Alternatif jika belum punya KIP/KKS — diurus di kelurahan',   required: 'choose-one' as const },
    ]

    const hasAny = docs.some(d => !!documents[d.type])

    return (
        <div className="flex flex-col gap-5">
            <section className="dok-section opacity-0">
                <SectionHeader
                    icon="fa-solid fa-hand-holding-heart"
                    title="Bantuan & Afirmasi"
                    subtitle="Dokumen eligibilitas program bantuan pemerintah (PIP/KIP)"
                />
                <InfoBanner color="blue" icon="fa-solid fa-circle-info">
                    Kelompok ini <strong>pilih salah satu</strong> — upload dokumen yang kamu miliki.
                    Jika tidak ada ketiganya, bagian ini bisa dilewati.
                </InfoBanner>
                {hasAny && (
                    <InfoBanner color="emerald" icon="fa-solid fa-circle-check">
                        Dokumen bantuan sudah dilampirkan. Tim seleksi akan memverifikasi kelayakannya.
                    </InfoBanner>
                )}
                <DocList>
                    {docs.map(({ type, label, hint, required }) => (
                        <DocumentCard
                            key={type}
                            docType={type}
                            label={label}
                            hint={hint}
                            document={documents[type] ?? null}
                            requiredLevel={required}
                        />
                    ))}
                </DocList>
            </section>
        </div>
    )
})

// =============================================================================
// TAB E — Administrasi & Pernyataan
// =============================================================================

export const TabAdministrasi = memo(function TabAdministrasi({ documents }: TabProps) {
    useTabEntrance()

    return (
        <div className="flex flex-col gap-5">
            <section className="dok-section opacity-0">
                <SectionHeader
                    icon="fa-solid fa-file-signature"
                    title="Administrasi & Pernyataan"
                    subtitle="Dokumen administratif kelengkapan pendaftaran"
                />
                <DocList>
                    <DocumentCard
                        docType="parent_statement"
                        label="Surat Pernyataan Orang Tua"
                        hint="Bisa diserahkan offline atau online — lihat keterangan di bawah"
                        document={documents['parent_statement'] ?? null}
                        requiredLevel="required"
                        showTemplate
                        templateUrl="/assets/templates/surat-pernyataan-template.docx"
                    />
                    <DocumentCard
                        docType="recommendation_letter"
                        label="Surat Rekomendasi"
                        hint="Dari guru atau kepala sekolah"
                        document={documents['recommendation_letter'] ?? null}
                        requiredLevel="optional"
                    />
                </DocList>
            </section>
        </div>
    )
})
