// resources/js/Components/Dashboard/Candidate/DataDokumen/TabComponents.tsx

import { useEffect }   from 'react'
import { animate, stagger } from 'animejs'
import DocumentCard    from './DocumentCard'
import type { DocumentRecord } from '@/Pages/Dashboard/Candidate/DataDokumen'

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
            translateY: [12, 0],
            duration:   450,
            delay:      stagger(80),
            ease:       'outExpo',
        })
    }, [])
}

// ─── Section Header — template DataKesehatan ─────────────────────────────────
// icon container w-9 h-9 rounded-xl, bold title, subtitle muted

function SectionHeader({ icon, title, subtitle }: {
    icon:     string
    title:    string
    subtitle: string
}) {
    return (
        <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl shrink-0
                            dark:bg-amber-500/10 bg-amber-50
                            border dark:border-amber-500/20 border-amber-200
                            flex items-center justify-center">
                <i className={`${icon} text-amber-400 text-sm`}></i>
            </div>
            <div>
                <h3 className="text-sm font-bold dark:text-white text-slate-800">
                    {title}
                </h3>
                <p className="text-xs dark:text-slate-500 text-slate-400 mt-0.5">
                    {subtitle}
                </p>
            </div>
        </div>
    )
}

// ─── Info Banner ──────────────────────────────────────────────────────────────

function InfoBanner({ color, icon, children }: {
    color:    'blue' | 'amber'
    icon:     string
    children: React.ReactNode
}) {
    const cls = {
        blue:  'dark:border-blue-500/20 border-blue-200 dark:bg-blue-500/[0.06] bg-blue-50 text-blue-400 dark:text-blue-300/80 text-blue-700',
        amber: 'dark:border-amber-500/20 border-amber-200 dark:bg-amber-500/[0.06] bg-amber-50 text-amber-400 dark:text-amber-300/80 text-amber-700',
    }[color]

    return (
        <div className={`flex items-start gap-2.5 p-3.5 rounded-xl border mb-5 ${cls}`}>
            <i className={`${icon} text-xs mt-0.5 shrink-0`}></i>
            <p className="text-[11px] leading-relaxed">{children}</p>
        </div>
    )
}

// ─── Doc List wrapper — row style ─────────────────────────────────────────────
// Tidak pakai card box lagi — list item style, lebih clean

function DocList({ children }: { children: React.ReactNode }) {
    return (
        <div className="dark:bg-white/[0.02] bg-white rounded-xl
                        border dark:border-white/[0.06] border-black/[0.06]
                        px-4 overflow-hidden">
            {children}
        </div>
    )
}

// =============================================================================
// TAB A — Identitas & Kependudukan
// =============================================================================

export function TabIdentitas({ documents }: TabProps) {
    useTabEntrance()

    const docs = [
        { type: 'photo_formal',      label: 'Pas Foto Resmi',       hint: 'Untuk kartu peserta & arsip digital',   required: 'required'   as const },
        { type: 'birth_certificate', label: 'Akta Kelahiran',        hint: 'Verifikasi identitas resmi',            required: 'required'   as const },
        { type: 'family_card',       label: 'Kartu Keluarga (KK)',   hint: 'Verifikasi data keluarga & domisili',   required: 'required'   as const },
        { type: 'parent_id_card',    label: 'KTP Orang Tua / Wali', hint: 'Legalitas pendaftaran oleh wali',       required: 'required'   as const },
    ]

    return (
        <div className="flex flex-col gap-6">
            <section className="dok-section opacity-0">
                <SectionHeader
                    icon="fa-solid fa-id-card"
                    title="Identitas & Kependudukan"
                    subtitle="Dokumen yang membuktikan identitas secara hukum negara"
                />
                <div className="mt-5">
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
                </div>
            </section>
        </div>
    )
}

// =============================================================================
// TAB B — Akademik
// =============================================================================

export function TabAkademik({ documents, isTransfer }: TabProps) {
    useTabEntrance()

    const docs = [
        { type: 'graduation_certificate', label: 'Ijazah / SKL',            hint: 'Bukti kelulusan jenjang sebelumnya',               required: 'required' as const },
        { type: 'report_card',            label: 'Rapor Semester Terakhir',  hint: 'Rekam jejak akademik terkini',                     required: 'required' as const },
        { type: 'academic_transcript',    label: 'Transkrip Nilai Lengkap',  hint: 'Gambaran akademik menyeluruh untuk evaluasi',       required: 'optional' as const },
    ]

    return (
        <div className="flex flex-col gap-6">
            <section className="dok-section opacity-0">
                <SectionHeader
                    icon="fa-solid fa-graduation-cap"
                    title="Akademik"
                    subtitle="Dokumen rekam jejak pendidikan dari sekolah sebelumnya"
                />
                <div className="mt-5">
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
                </div>
            </section>

            {/* Conditional: transfer_letter */}
            {isTransfer && (
                <section className="dok-section opacity-0">
                    <SectionHeader
                        icon="fa-solid fa-right-left"
                        title="Surat Pindahan"
                        subtitle="Diperlukan karena kamu mendaftar sebagai siswa pindahan"
                    />
                    <div className="mt-5">
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
                    </div>
                </section>
            )}
        </div>
    )
}

// =============================================================================
// TAB C — Prestasi (multi-upload)
// =============================================================================

export function TabPrestasi({ achievementDocs }: TabProps) {
    useTabEntrance()

    const categories = [
        {
            type:     'achievement_academic',
            label:    'Prestasi Akademik',
            subtitle: 'OSN, olimpiade sains, karya tulis ilmiah, dll',
            icon:     'fa-solid fa-flask',
        },
        {
            type:     'achievement_nonacademic',
            label:    'Prestasi Non-Akademik',
            subtitle: 'O2SN, FLS2N, olahraga, seni, debat, dll',
            icon:     'fa-solid fa-medal',
        },
        {
            type:     'achievement_religious',
            label:    'Prestasi Keagamaan',
            subtitle: 'MTQ, tahfidz, lomba keagamaan',
            icon:     'fa-solid fa-star-and-crescent',
        },
    ]

    return (
        <div className="flex flex-col gap-6">
            <InfoBanner color="blue" icon="fa-solid fa-circle-info">
                Kelompok ini boleh diupload <strong>lebih dari satu dokumen</strong>.
                Lampirkan semua sertifikat prestasi yang kamu miliki~
            </InfoBanner>

            {categories.map(({ type, label, subtitle, icon }) => {
                const existingDocs = achievementDocs[type] ?? []
                return (
                    <section key={type} className="dok-section opacity-0">
                        <SectionHeader icon={icon} title={label} subtitle={subtitle} />
                        <div className="mt-5">
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
                                {/* Tambah baru */}
                                <DocumentCard
                                    docType={type}
                                    label={existingDocs.length > 0 ? `Tambah ${label}` : label}
                                    hint="Klik Upload untuk menambah sertifikat"
                                    document={null}
                                    multiple
                                    requiredLevel="optional"
                                />
                            </DocList>
                        </div>
                    </section>
                )
            })}
        </div>
    )
}

// =============================================================================
// TAB D — Bantuan & Afirmasi
// =============================================================================

export function TabBantuan({ documents }: TabProps) {
    useTabEntrance()

    const docs = [
        { type: 'kip_card',      label: 'Kartu Indonesia Pintar (KIP)', hint: 'Untuk pengusulan PIP — bantuan biaya pendidikan dari pemerintah', required: 'choose-one' as const },
        { type: 'welfare_card',  label: 'Kartu KKS / PKH',              hint: 'Bukti keluarga penerima program kesejahteraan sosial',             required: 'choose-one' as const },
        { type: 'poverty_letter',label: 'Surat Keterangan Tidak Mampu', hint: 'Alternatif jika belum punya KIP/KKS — diurus di kelurahan',        required: 'choose-one' as const },
    ]

    return (
        <div className="flex flex-col gap-6">
            <section className="dok-section opacity-0">
                <SectionHeader
                    icon="fa-solid fa-hand-holding-heart"
                    title="Bantuan & Afirmasi"
                    subtitle="Dokumen eligibilitas program bantuan pemerintah (PIP/KIP)"
                />
                <div className="mt-5">
                    <InfoBanner color="blue" icon="fa-solid fa-circle-info">
                        Kelompok ini bersifat <strong>pilih salah satu</strong> — upload dokumen yang kamu miliki.
                        Jika tidak memiliki ketiganya, bagian ini bisa dilewati.
                    </InfoBanner>
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
                </div>
            </section>
        </div>
    )
}

// =============================================================================
// TAB E — Administrasi & Pernyataan
// =============================================================================

export function TabAdministrasi({ documents }: TabProps) {
    useTabEntrance()

    return (
        <div className="flex flex-col gap-6">
            <section className="dok-section opacity-0">
                <SectionHeader
                    icon="fa-solid fa-file-signature"
                    title="Administrasi & Pernyataan"
                    subtitle="Dokumen administratif kelengkapan pendaftaran"
                />
                <div className="mt-5">
                    <DocList>
                        <DocumentCard
                            docType="parent_statement"
                            label="Surat Pernyataan Orang Tua"
                            hint="Bisa diserahkan offline atau online — lihat keterangan di bawah"
                            document={documents['parent_statement'] ?? null}
                            requiredLevel="required"
                            showTemplate
                            templateUrl="/assets/surat-pernyataan-template.docx"
                        />
                        <DocumentCard
                            docType="recommendation_letter"
                            label="Surat Rekomendasi"
                            hint="Dari guru atau kepala sekolah"
                            document={documents['recommendation_letter'] ?? null}
                            requiredLevel="optional"
                        />
                    </DocList>
                </div>
            </section>
        </div>
    )
}