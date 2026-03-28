import { useEffect, useRef, useState } from 'react'
import { animate, stagger } from 'animejs'
import DashboardSplitLayout from '@/Layouts/DashboardSplitLayout'
import CandidateSidebar from '@/Components/Dashboard/Candidate/Shared/CandidateSidebar'
import {
    TabIdentitas,
    TabAkademik,
    TabPrestasi,
    TabBantuan,
    TabAdministrasi,
} from '@/Components/Dashboard/Candidate/DataDokumen/TabComponents'

// ─── Types ───────────────────────────────────────────────────

export type DocumentStatus = 'empty' | 'uploading' | 'pending' | 'verified' | 'rejected'

export interface DocumentRecord {
    id:                number
    doc_type:          string
    doc_group:         string
    original_filename: string
    status:            DocumentStatus
    rejection_reason:  string | null
    created_at:        string
    updated_at:        string
}

interface CandidateSnippet {
    full_name:           string
    nisn:                string
    nik:                 string
    gender_label:        string
    date_of_birth_label: string
    school_origin:       string
    status:              string
    program_choice:      string | null
    admission_wave:      { title: string } | null
}

interface Props {
    user:           { name: string; avatar_url: string | null; initials: string }
    candidate:      CandidateSnippet
    documents:      Record<string, DocumentRecord>          // single-upload docs, keyed by doc_type
    achievementDocs: Record<string, DocumentRecord[]>       // multi-upload docs, keyed by doc_type
    isTransfer:     boolean
    completion:     number
}

// ─── Tab definitions ─────────────────────────────────────────

const TABS = [
    { id: 'identity',        label: 'Identitas',      icon: 'fa-id-card' },
    { id: 'academic',        label: 'Akademik',        icon: 'fa-graduation-cap' },
    { id: 'achievement',     label: 'Prestasi',        icon: 'fa-trophy' },
    { id: 'welfare',         label: 'Bantuan',         icon: 'fa-hand-holding-heart' },
    { id: 'administration',  label: 'Administrasi',    icon: 'fa-file-signature' },
] as const

type TabId = typeof TABS[number]['id']

// ─── Component ───────────────────────────────────────────────

export default function DataDokumen({
    user, candidate, documents, achievementDocs, isTransfer, completion
}: Props) {
    const [activeTab, setActiveTab] = useState<TabId>('identity')
    const containerRef              = useRef<HTMLDivElement>(null)

    // Entrance animation on mount
    useEffect(() => {
        animate('.dokumen-tab-btn', {
            opacity:    [0, 1],
            translateY: [10, 0],
            duration:   400,
            delay:      stagger(60),
            ease:       'outExpo',
        })
        animate('.dokumen-content', {
            opacity:    [0, 1],
            translateY: [16, 0],
            duration:   500,
            ease:       'outExpo',
        })
    }, [])

    // Tab transition — keluar dulu (inQuad) baru masuk (outExpo)
    const handleTabChange = (newTab: TabId) => {
        if (newTab === activeTab) return
        if (!containerRef.current) return

        const dir = TABS.findIndex(t => t.id === newTab) > TABS.findIndex(t => t.id === activeTab) ? 1 : -1

        // Phase 1: exit
        animate(containerRef.current, {
            opacity:    [1, 0],
            translateX: [0, dir * -20],
            duration:   180,
            ease:       'inQuad',
        })

        // Phase 2: enter
        setTimeout(() => {
            setActiveTab(newTab)
            if (!containerRef.current) return
            animate(containerRef.current, {
                opacity:    [0, 1],
                translateX: [dir * 20, 0],
                duration:   350,
                ease:       'outExpo',
            })
        }, 190)
    }

    const tabProps = { documents, achievementDocs, isTransfer }

    return (
        <DashboardSplitLayout
            aside={
                <CandidateSidebar
                    user={user}
                    candidate={candidate}
                    completion={completion}
                    tips={[
                        'Upload dokumen lebih awal untuk mempercepat proses seleksi',
                        'Pastikan foto & scan dokumen terbaca dengan jelas',
                        'Format yang diterima: JPEG, PNG, atau PDF (maks. 5MB)',
                    ]}
                />
            }
        >
            <div className="p-4 sm:p-6 lg:p-8">

                {/* Header */}
                <div className="mb-6 dokumen-content">
                    <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                        Dokumen Pendaftaran
                    </h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Lengkapi dokumen untuk mempercepat proses seleksimu~
                    </p>
                </div>

                {/* Overall progress banner */}
                <OverallProgressBanner completion={completion} />

                {/* Tab navigation */}
                <div className="mt-6 flex gap-1 overflow-x-auto pb-1 scrollbar-none dokumen-content">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => handleTabChange(tab.id)}
                            className={[
                                'dokumen-tab-btn flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl',
                                'text-sm font-medium transition-all duration-200',
                                'min-h-[44px]', // touch target minimum 44px
                                activeTab === tab.id
                                    ? 'bg-[var(--content-surface)] text-amber-600 dark:text-amber-400 shadow-sm border border-[var(--content-border)]'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-[var(--content-card)]',
                            ].join(' ')}
                        >
                            <i className={`fa-solid ${tab.icon} text-xs`} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab content */}
                <div ref={containerRef} className="mt-4">
                    {activeTab === 'identity'       && <TabIdentitas      {...tabProps} />}
                    {activeTab === 'academic'       && <TabAkademik       {...tabProps} />}
                    {activeTab === 'achievement'    && <TabPrestasi       {...tabProps} />}
                    {activeTab === 'welfare'        && <TabBantuan        {...tabProps} />}
                    {activeTab === 'administration' && <TabAdministrasi   {...tabProps} />}
                </div>
            </div>
        </DashboardSplitLayout>
    )
}

// ─── Overall Progress Banner ─────────────────────────────────

function OverallProgressBanner({ completion }: { completion: number }) {
    const getGradient = (pct: number): string => {
        if (pct < 50)  return 'linear-gradient(to right, #c0392b, #e74c3c)'
        if (pct < 75)  return 'linear-gradient(to right, #d35400, #f39c12)'
        if (pct < 100) return 'linear-gradient(to right, #2980b9, #7aa2f7)'
        return 'linear-gradient(to right, #1e8449, #27ae60)'
    }

    const getMessage = (pct: number): string => {
        if (pct === 0) return 'Belum ada dokumen yang diupload'
        if (pct < 50)  return 'Baru mulai — yuk lengkapi dokumenmu~'
        if (pct < 75)  return 'Sudah lebih dari setengah jalan!'
        if (pct < 100) return 'Hampir lengkap, sedikit lagi~'
        return 'Semua dokumen sudah diupload!'
    }

    return (
        <div className="dokumen-content rounded-2xl border border-[var(--content-border)] bg-[var(--content-surface)] p-4">
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600 dark:text-slate-400">
                    {getMessage(completion)}
                </span>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {completion}%
                </span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                        width:      `${completion}%`,
                        background: getGradient(completion),
                    }}
                />
            </div>
        </div>
    )
}