/**
 * Tab components for DataDokumen
 * TabIdentitas, TabAkademik, TabPrestasi, TabBantuan, TabBoarding
 */

import { useEffect } from 'react'
import { animate, stagger } from 'animejs'
import DocumentCard from './DocumentCard'
import type { DocumentRecord } from '@/Pages/Dashboard/Candidate/DataDokumen'

// ─── Shared tab props type ────────────────────────────────────

interface TabProps {
    documents:      Record<string, DocumentRecord>
    achievementDocs: Record<string, DocumentRecord[]>
    isTransfer:     boolean
}

// ─── Shared stagger hook ──────────────────────────────────────

function useTabEntrance(selector: string) {
    useEffect(() => {
        animate(selector, {
            opacity:    [0, 1],
            translateY: [16, 0],
            duration:   500,
            delay:      stagger(80),
            ease:       'outExpo',
        })
    }, [])
}

// ─── Section wrapper ──────────────────────────────────────────

function TabSection({ title, description, children }: {
    title:       string
    description: string
    children:    React.ReactNode
}) {
    return (
        <div className="mb-8">
            <div className="mb-4">
                <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">
                    {title}
                </h2>
                <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                    {description}
                </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 doc-card">
                {children}
            </div>
        </div>
    )
}

// =============================================================
// TAB A — Identitas & Kependudukan
// =============================================================

export function TabIdentitas({ documents }: TabProps) {
    useTabEntrance('.doc-card')

    const docs = [
        { type: 'photo_formal',   label: 'Pas Foto Resmi',       hint: 'Untuk kartu peserta & arsip digital' },
        { type: 'birth_certificate', label: 'Akta Kelahiran',     hint: 'Verifikasi identitas resmi' },
        { type: 'family_card',    label: 'Kartu Keluarga (KK)',   hint: 'Verifikasi data keluarga & domisili' },
        { type: 'parent_id_card', label: 'KTP Orang Tua / Wali', hint: 'Legalitas pendaftaran oleh wali' },
    ]

    return (
        <TabSection
            title="Identitas & Kependudukan"
            description="Dokumen yang membuktikan identitas kamu secara hukum negara."
        >
            {docs.map(({ type, label, hint }) => (
                <DocumentCard
                    key={type}
                    docType={type}
                    label={label}
                    hint={hint}
                    document={documents[type] ?? null}
                />
            ))}
        </TabSection>
    )
}

// =============================================================
// TAB B — Akademik
// =============================================================

export function TabAkademik({ documents }: TabProps) {
    useTabEntrance('.doc-card')

    const docs = [
        { type: 'graduation_certificate', label: 'Ijazah / SKL',            hint: 'Bukti kelulusan jenjang sebelumnya' },
        { type: 'report_card',            label: 'Rapor Semester Terakhir',  hint: 'Rekam jejak akademik terkini' },
        { type: 'academic_transcript',    label: 'Transkrip Nilai Lengkap',  hint: 'Gambaran akademik menyeluruh untuk evaluasi' },
    ]

    return (
        <TabSection
            title="Akademik"
            description="Dokumen rekam jejak pendidikanmu dari sekolah sebelumnya."
        >
            {docs.map(({ type, label, hint }) => (
                <DocumentCard
                    key={type}
                    docType={type}
                    label={label}
                    hint={hint}
                    document={documents[type] ?? null}
                />
            ))}
        </TabSection>
    )
}

// =============================================================
// TAB C — Prestasi (multi-upload)
// =============================================================

export function TabPrestasi({ achievementDocs }: TabProps) {
    useTabEntrance('.doc-card')

    const categories = [
        {
            type:  'achievement_academic',
            label: 'Sertifikat Prestasi Akademik',
            hint:  'OSN, olimpiade sains, karya tulis ilmiah, dll',
        },
        {
            type:  'achievement_nonacademic',
            label: 'Sertifikat Prestasi Non-Akademik',
            hint:  'O2SN, FLS2N, olahraga, seni, debat, dll',
        },
        {
            type:  'achievement_religious',
            label: 'Sertifikat Prestasi Keagamaan',
            hint:  'MTQ, tahfidz, lomba keagamaan',
        },
    ]

    return (
        <div>
            <div className="mb-6 rounded-2xl border border-amber-200 dark:border-amber-800/50
                            bg-amber-50 dark:bg-amber-900/20 p-4 doc-card">
                <p className="text-sm text-amber-700 dark:text-amber-400 flex items-start gap-2">
                    <i className="fa-solid fa-circle-info mt-0.5 flex-shrink-0" />
                    Kelompok ini boleh diupload lebih dari satu dokumen. Kamu bisa melampirkan
                    semua sertifikat prestasi yang kamu miliki untuk memperkuat profil seleksimu~
                </p>
            </div>

            {categories.map(({ type, label, hint }) => {
                const existingDocs = achievementDocs[type] ?? []
                return (
                    <div key={type} className="mb-6 doc-card">
                        <div className="mb-3">
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                {label}
                            </p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                                {hint}
                            </p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* Existing docs */}
                            {existingDocs.map((doc) => (
                                <DocumentCard
                                    key={doc.id}
                                    docType={type}
                                    label={`${label} #${existingDocs.indexOf(doc) + 1}`}
                                    hint={doc.original_filename}
                                    document={doc}
                                    multiple
                                />
                            ))}
                            {/* Add new */}
                            <DocumentCard
                                docType={type}
                                label={existingDocs.length > 0 ? `Tambah ${label}` : label}
                                hint="Klik untuk upload sertifikat baru"
                                document={null}
                                multiple
                            />
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

// =============================================================
// TAB D — Bantuan & Afirmasi (welfare — pilih salah satu)
// =============================================================

export function TabBantuan({ documents }: TabProps) {
    useTabEntrance('.doc-card')

    const hasAny = ['kip_card', 'welfare_card', 'poverty_letter']
        .some(t => documents[t] != null)

    const docs = [
        {
            type:  'kip_card',
            label: 'Kartu Indonesia Pintar (KIP)',
            hint:  'Untuk pengusulan PIP — bantuan biaya pendidikan dari pemerintah',
        },
        {
            type:  'welfare_card',
            label: 'Kartu KKS / PKH',
            hint:  'Bukti keluarga penerima program kesejahteraan sosial',
        },
        {
            type:  'poverty_letter',
            label: 'Surat Keterangan Tidak Mampu (SKTM)',
            hint:  'Alternatif jika belum punya KIP/KKS, diurus di kelurahan',
        },
    ]

    return (
        <div>
            {/* Info banner */}
            <div className="mb-6 rounded-2xl border border-blue-200 dark:border-blue-800/50
                            bg-blue-50 dark:bg-blue-900/20 p-4 doc-card">
                <p className="text-sm text-blue-700 dark:text-blue-400 flex items-start gap-2">
                    <i className="fa-solid fa-circle-info mt-0.5 flex-shrink-0" />
                    Kelompok ini bersifat <strong>pilih salah satu</strong> — upload dokumen yang
                    kamu miliki. Jika tidak memiliki ketiganya, bagian ini bisa dilewati.
                </p>
            </div>

            <TabSection
                title="Bantuan & Afirmasi"
                description="Dokumen untuk eligibilitas program bantuan pemerintah (PIP/KIP)."
            >
                {docs.map(({ type, label, hint }) => (
                    <DocumentCard
                        key={type}
                        docType={type}
                        label={label}
                        hint={hint}
                        document={documents[type] ?? null}
                    />
                ))}
            </TabSection>
        </div>
    )
}

// =============================================================
// TAB E — Boarding School (sebagian kondisional)
// =============================================================

export function TabBoarding({ documents, isTransfer }: TabProps) {
    useTabEntrance('.doc-card')

    return (
        <div>
            <TabSection
                title="Administrasi Boarding School"
                description="Dokumen khusus untuk kehidupan di pondok pesantren."
            >
                <DocumentCard
                    docType="parent_statement"
                    label="Surat Pernyataan Orang Tua"
                    hint="Persetujuan & kesanggupan mengikuti tata tertib pondok"
                    document={documents['parent_statement'] ?? null}
                />
                <DocumentCard
                    docType="recommendation_letter"
                    label="Surat Rekomendasi"
                    hint="Dari guru, ustadz, atau kepala sekolah (opsional)"
                    document={documents['recommendation_letter'] ?? null}
                />
            </TabSection>

            {/* Conditional: transfer_letter hanya untuk santri pindahan */}
            {isTransfer && (
                <div className="doc-card">
                    <div className="mb-3 rounded-2xl border border-purple-200 dark:border-purple-800/50
                                    bg-purple-50 dark:bg-purple-900/20 p-3">
                        <p className="text-sm text-purple-700 dark:text-purple-400 flex items-center gap-2">
                            <i className="fa-solid fa-right-left text-xs" />
                            Kamu terdaftar sebagai <strong>santri pindahan</strong>. Surat keterangan pindah diperlukan.
                        </p>
                    </div>
                    <DocumentCard
                        docType="transfer_letter"
                        label="Surat Keterangan Pindah"
                        hint="Wajib dilampirkan karena kamu mendaftar sebagai santri pindahan"
                        document={documents['transfer_letter'] ?? null}
                    />
                </div>
            )}
        </div>
    )
}
