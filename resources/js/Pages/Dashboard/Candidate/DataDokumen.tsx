// resources/js/Pages/Dashboard/Candidate/DataDokumen.tsx

import { useEffect, useRef, useState } from 'react'
import { animate, stagger }            from 'animejs'
import { Head }                        from '@inertiajs/react'
import DashboardSplitLayout            from '@/Layouts/DashboardSplitLayout'
import CandidateSidebar                from '@/Components/Dashboard/Candidate/Shared/CandidateSidebar'
import {
    TabIdentitas, TabAkademik, TabPrestasi,
    TabBantuan, TabAdministrasi,
} from '@/Components/Dashboard/Candidate/DataDokumen/TabComponents'

// ─── Types ────────────────────────────────────────────────────────────────────

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
    user:            { name: string; avatar_url: string | null; initials: string }
    candidate:       CandidateSnippet
    documents:       Record<string, DocumentRecord>
    achievementDocs: Record<string, DocumentRecord[]>
    isTransfer:      boolean
    completion:      number
    gate:            { allowed: boolean; locked: boolean; reason: string | null; reasons: string[] }
}

// ─── Tab definitions ──────────────────────────────────────────────────────────

const TABS = [
    { id: 'identity',       label: 'Identitas',    icon: 'fa-id-card' },
    { id: 'academic',       label: 'Akademik',      icon: 'fa-graduation-cap' },
    { id: 'achievement',    label: 'Prestasi',      icon: 'fa-trophy' },
    { id: 'welfare',        label: 'Bantuan',       icon: 'fa-hand-holding-heart' },
    { id: 'administration', label: 'Administrasi',  icon: 'fa-file-signature' },
] as const

type TabId = typeof TABS[number]['id']

// ─── Component ────────────────────────────────────────────────────────────────

export default function DataDokumen({
    user, candidate, documents, achievementDocs, isTransfer, completion, gate,
}: Props) {
    const [activeTab, setActiveTab] = useState<TabId>('identity')
    const containerRef              = useRef<HTMLDivElement>(null)

    // Entrance animation
    useEffect(() => {
        animate('.dokumen-card', {
            opacity:    [0, 1],
            translateY: [20, 0],
            duration:   600,
            delay:      stagger(80),
            ease:       'outExpo',
        })
    }, [])

    // Tab transition
    const handleTabChange = (newTab: TabId) => {
        if (newTab === activeTab || !containerRef.current) return
        const dir = TABS.findIndex(t => t.id === newTab) > TABS.findIndex(t => t.id === activeTab) ? 1 : -1

        animate(containerRef.current, {
            opacity: [1, 0], translateX: [0, dir * -20],
            duration: 180, ease: 'inQuad',
        })
        setTimeout(() => {
            setActiveTab(newTab)
            if (!containerRef.current) return
            animate(containerRef.current, {
                opacity: [0, 1], translateX: [dir * 20, 0],
                duration: 350, ease: 'outExpo',
            })
        }, 190)
    }

    // Progress gradient
    const progressGradient = (pct: number) => {
        if (pct < 50)  return 'linear-gradient(to right, #c0392b, #e74c3c)'
        if (pct < 75)  return 'linear-gradient(to right, #d35400, #f39c12)'
        if (pct < 100) return 'linear-gradient(to right, #2980b9, #7aa2f7)'
        return 'linear-gradient(to right, #1e8449, #27ae60)'
    }

    const progressMessage = (pct: number) => {
        if (pct === 0)   return 'Belum ada dokumen yang diupload'
        if (pct < 50)    return 'Baru mulai — yuk lengkapi dokumenmu~'
        if (pct < 75)    return 'Sudah lebih dari setengah jalan!'
        if (pct < 100)   return 'Hampir lengkap, sedikit lagi~'
        return 'Semua dokumen sudah diupload!'
    }

    const tabProps = { documents, achievementDocs, isTransfer }

    // ── Warning dot per tab — Opsi A: hitung dari documents prop ──
    // Required docs per group yang belum diupload = warning dot
    const REQUIRED_BY_TAB: Record<string, string[]> = {
        identity:       ['photo_formal', 'birth_certificate', 'family_card', 'parent_id_card'],
        academic:       ['graduation_certificate', 'report_card'],
        achievement:    [], // optional
        welfare:        [], // choose-one, tidak ada yang strictly required
        administration: ['parent_statement'],
    }
    const tabHasWarning = (tabId: string): boolean => {
        if (tabId === 'academic' && isTransfer) {
            if (!documents['transfer_letter']) return true
        }
        return (REQUIRED_BY_TAB[tabId] ?? []).some(
            type => !documents[type] || documents[type].status === 'rejected'
        )
    }

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
            <Head title="Dokumen Pendaftaran" />

            <div className="space-y-5 px-4 py-6 sm:px-6">

                {/* ── Header — template DataKesehatan ──────────────────── */}
                <div className="dokumen-card">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl shrink-0
                                        dark:bg-amber-500/10 bg-amber-50
                                        border dark:border-amber-500/20 border-amber-200
                                        flex items-center justify-center">
                            <i className="fa-solid fa-folder-open text-amber-400 text-sm"></i>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold dark:text-slate-100 text-slate-800">
                                Dokumen Pendaftaran
                            </h1>
                            <p className="text-sm dark:text-slate-400 text-slate-500 mt-0.5">
                                Lengkapi dokumen untuk mempercepat proses seleksimu~
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── Status Kelengkapan — compact ─────────────────────── */}
                <div className="dokumen-card rounded-xl border overflow-hidden
                                dark:border-white/[0.07] border-black/[0.07]
                                dark:bg-white/[0.02] bg-white">
                    <div className="flex items-center gap-2.5 px-4 py-2.5
                                    border-b dark:border-white/[0.06] border-black/[0.06]
                                    dark:bg-white/[0.03] bg-slate-50">
                        <div className="w-5 h-5 rounded-md flex items-center justify-center
                                        dark:bg-amber-500/20 bg-amber-50">
                            <i className="fa-solid fa-circle-check text-amber-400 text-[10px]"></i>
                        </div>
                        <p className="text-[11px] font-semibold dark:text-slate-400 text-slate-500
                                      uppercase tracking-wider flex-1">
                            Status Kelengkapan
                        </p>
                        <span className={`text-xs font-bold ${
                            completion === 100 ? 'dark:text-amber-400 text-amber-600'
                                : completion >= 75 ? 'dark:text-blue-400 text-blue-600'
                                : completion >= 50 ? 'dark:text-amber-400 text-amber-600'
                                : 'dark:text-red-400 text-red-600'
                        }`}>{completion}%</span>
                    </div>
                    <div className="px-4 py-3">
                        <div className="h-1.5 dark:bg-white/[0.05] bg-black/[0.06] rounded-full overflow-hidden mb-2">
                            <div className="h-full rounded-full transition-all duration-700"
                                 style={{ width: `${completion}%`, background: progressGradient(completion) }} />
                        </div>
                        <p className={`text-xs ${
                            completion === 100
                                ? 'dark:text-amber-400 text-amber-600'
                                : 'dark:text-slate-500 text-slate-400'
                        } flex items-center gap-1.5`}>
                            {completion === 100 && <i className="fa-solid fa-circle-check text-[11px]"></i>}
                            {progressMessage(completion)}
                        </p>
                    </div>
                </div>

                {gate?.locked && (
                    <div className="dokumen-card rounded-xl border border-amber-300/60 bg-amber-50 p-4 text-amber-900 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-100">
                        <div className="flex items-start gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-white">
                                <i className="fa-solid fa-lock text-xs" />
                            </div>
                            <div>
                                <p className="text-sm font-bold">Dokumen masih terkunci</p>
                                <p className="mt-1 text-sm leading-relaxed">{gate.reason}</p>
                            </div>
                        </div>
                    </div>
                )}

                {!gate?.locked && (
                    <>
                {/* ── Tab Navigation — icon-only mobile ────────────────── */}
                <div className="dokumen-card">
                    <div className="flex overflow-x-auto rounded-xl
                                    border dark:border-content-border border-black/[0.08]
                                    dark:bg-content-card bg-slate-50
                                    p-1 gap-1 no-scrollbar">
                        {TABS.map((tab) => {
                            const isActive = activeTab === tab.id
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => handleTabChange(tab.id)}
                                    className={[
                                        'relative flex flex-1 items-center justify-center gap-1.5 rounded-lg',
                                        'px-2 py-2 sm:px-3 text-xs font-semibold',
                                        'transition-all duration-200 min-w-[36px] min-h-[36px]',
                                        isActive
                                            ? 'bg-amber-500 text-white shadow-sm'
                                            : 'dark:text-slate-400 text-slate-500 dark:hover:bg-content-muted hover:bg-black/[0.04] dark:hover:text-slate-300 hover:text-slate-700',
                                    ].join(' ')}
                                >
                                    <i className={`fa-solid ${tab.icon} text-xs shrink-0`} />
                                    <span className="hidden sm:inline whitespace-nowrap">{tab.label}</span>
                                    {/* Warning dot — muncul kalau ada required yang belum upload */}
                                    {!isActive && tabHasWarning(tab.id) && (
                                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-400 border-2 dark:border-content-card border-slate-50" />
                                    )}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* ── Tab Content ───────────────────────────────────────── */}
                <div ref={containerRef} className="dokumen-card">
                    {activeTab === 'identity'       && <TabIdentitas    {...tabProps} />}
                    {activeTab === 'academic'       && <TabAkademik     {...tabProps} />}
                    {activeTab === 'achievement'    && <TabPrestasi     {...tabProps} />}
                    {activeTab === 'welfare'        && <TabBantuan      {...tabProps} />}
                    {activeTab === 'administration' && <TabAdministrasi {...tabProps} />}
                </div>
                    </>
                )}

            </div>
        </DashboardSplitLayout>
    )
}
