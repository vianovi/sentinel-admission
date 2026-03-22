// resources/js/Pages/Dashboard/Candidate/DataWali.tsx

import { useRef, useState, useEffect, useCallback } from 'react'
import { Head, router, usePage } from '@inertiajs/react'
import { animate, stagger } from 'animejs'
import Swal from 'sweetalert2'
import DashboardSplitLayout from '@/Layouts/DashboardSplitLayout'
import CandidateSidebar from '@/Components/Dashboard/Candidate/Shared/CandidateSidebar'
import TabAyah from '@/Components/Dashboard/Candidate/DataWali/TabAyah'
import TabIbu from '@/Components/Dashboard/Candidate/DataWali/TabIbu'
import TabWali from '@/Components/Dashboard/Candidate/DataWali/TabWali'
import TabProfilKeluarga from '@/Components/Dashboard/Candidate/DataWali/TabProfilKeluarga'
import TabRangkuman from '@/Components/Dashboard/Candidate/DataWali/TabRangkuman'
import { GuardianData, CandidateAddress } from '@/Components/Dashboard/Candidate/DataWali/types'

// SwalDark mixin
const swalDark = Swal.mixin({
    background: '#0f172a',
    color: '#e2e8f0',
    confirmButtonColor: '#d4a017',
    cancelButtonColor: '#334155',
    customClass: {
        popup: '!rounded-2xl !border !border-white/10',
        confirmButton: '!rounded-xl !font-semibold',
        cancelButton: '!rounded-xl !font-semibold',
    },
})

// ─── Tab Definitions ──────────────────────────────────────────────────────────

const TABS = [
    { key: 'ayah',            label: 'Ayah',           icon: 'fa-solid fa-person' },
    { key: 'ibu',             label: 'Ibu',            icon: 'fa-solid fa-person-dress' },
    { key: 'wali',            label: 'Wali',           icon: 'fa-solid fa-user-shield' },
    { key: 'profil-keluarga', label: 'Profil Keluarga',icon: 'fa-solid fa-house' },
    { key: 'rangkuman',       label: 'Rangkuman',      icon: 'fa-solid fa-list-check' },
]

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
    guardian:   GuardianData
    completion: number
    user: {
        name:       string
        avatar_url: string | null
        initials:   string
    }
    candidate: CandidateAddress & {
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
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DataWali({ guardian, completion: initialCompletion, user, candidate }: Props) {
    const { errors } = usePage().props as { errors: Record<string, string> }

    const [activeTab, setActiveTab]   = useState(0)
    const [prevTab, setPrevTab]       = useState(0)
    const [form, setForm]             = useState<GuardianData>(guardian)
    const [submitting, setSubmitting] = useState(false)
    const [completion, setCompletion] = useState(initialCompletion)

    const contentRef = useRef<HTMLDivElement>(null)

    // ── Entrance animation ──────────────────────────────────────────────────
    useEffect(() => {
        animate('.wali-card', {
            opacity:    [0, 1],
            translateY: [20, 0],
            duration:   600,
            delay:      stagger(80),
            ease:       'outExpo',
        })
    }, [])

    // ── Recalculate completion (client-side approximation) ──────────────────
    useEffect(() => {
        let score = 0
        const f = form
        const fatherAbsent = f.father_status === 'meninggal' || f.father_status === 'tidak_diketahui'

        if (f.mother_name)         score += 15
        if (f.mother_phone)        score += 10
        if (f.mother_job_ktp)      score += 8
        if (f.mother_income_range) score += 7

        if (fatherAbsent) {
            score += 35
        } else {
            if (f.father_name)         score += 12
            if (f.father_phone)        score += 10
            if (f.father_job_ktp)      score += 7
            if (f.father_income_range) score += 6
        }

        if (f.no_kk)              score += 10
        if (f.marital_status)     score += 5
        if (f.house_ownership)    score += 5
        if (f.family_dependents != null) score += 5

        setCompletion(Math.min(score, 100))
    }, [form])

    // ── Tab switch dengan animasi ───────────────────────────────────────────
    const switchTab = useCallback((nextIndex: number) => {
        if (nextIndex === activeTab) return

        const dir = nextIndex > activeTab ? 1 : -1

        if (contentRef.current) {
            animate(contentRef.current, {
                opacity:    [1, 0],
                translateX: [0, dir * -20],
                duration:   180,
                ease:       'inQuad',
            })
            setTimeout(() => {
                setPrevTab(activeTab)
                setActiveTab(nextIndex)
                if (contentRef.current) {
                    animate(contentRef.current, {
                        opacity:    [0, 1],
                        translateX: [dir * 20, 0],
                        duration:   350,
                        ease:       'outExpo',
                    })
                }
            }, 190)
        } else {
            setPrevTab(activeTab)
            setActiveTab(nextIndex)
        }
    }, [activeTab])

    // ── Field change handler ────────────────────────────────────────────────
    const handleChange = useCallback((field: string, value: unknown) => {
        setForm(prev => ({ ...prev, [field]: value }))
    }, [])

    // ── Submit ──────────────────────────────────────────────────────────────
    const handleSubmit = () => {
        setSubmitting(true)
        router.put(route('dashboard.data-wali.update'), form as unknown as Record<string, string>, {
            preserveScroll: true,
            onSuccess: () => {
                swalDark.fire({
                    icon:  'success',
                    title: 'Data tersimpan!',
                    text:  'Data wali berhasil diperbarui.',
                    timer: 2000,
                    showConfirmButton: false,
                })
            },
            onError: (errs) => {
                // Shake error fields
                animate('.input-error', {
                    translateX: [0, -6, 6, -4, 4, 0],
                    duration:   380,
                    ease:       'outExpo',
                })
                swalDark.fire({
                    icon:  'warning',
                    title: 'Ada yang perlu dilengkapi',
                    text:  'Silakan periksa kembali isian yang ditandai merah.',
                })
            },
            onFinish: () => setSubmitting(false),
        })
    }

    // ── Rangkuman badge ─────────────────────────────────────────────────────
    const rangkumanIndex = TABS.length - 1
    const rangkumanBadge = completion < 100

    // ── Sidebar props ───────────────────────────────────────────────────────
    const sidebarProps = {
        user: {
            name:       user.name,
            avatar_url: user.avatar_url,
            initials:   user.initials,
        },
        candidate: {
            full_name:           candidate.full_name,
            nisn:                candidate.nisn,
            nik:                 candidate.nik,
            gender_label:        candidate.gender_label,
            date_of_birth_label: candidate.date_of_birth_label,
            school_origin:       candidate.school_origin,
            status:              candidate.status,
            program_choice:      candidate.program_choice,
            admission_wave:      candidate.admission_wave,
        },
        completion,
    }

    // ─── Render ──────────────────────────────────────────────────────────────

    return (
        <DashboardSplitLayout aside={<CandidateSidebar {...sidebarProps} />}>
            <Head title="Data Wali" />

            <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6">

                {/* ── Header ────────────────────────────────────────────── */}
                <div className="wali-card">
                    <h1 className="text-xl font-bold text-slate-100">Data Wali</h1>
                    <p className="mt-1 text-sm text-slate-400">
                        Lengkapi data orang tua dan wali untuk keperluan administrasi pendaftaran.
                    </p>
                </div>

                {/* ── Tab Navigation ────────────────────────────────────── */}
                <div className="wali-card">
                    <div className="flex overflow-x-auto rounded-xl border border-content-border bg-content-card p-1 gap-1 scrollbar-hide">
                        {TABS.map((tab, idx) => {
                            const isRangkuman = idx === rangkumanIndex
                            const isActive    = activeTab === idx

                            return (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => switchTab(idx)}
                                    className={[
                                        'relative flex flex-1 items-center justify-center gap-1.5 rounded-lg',
                                        'whitespace-nowrap px-3 py-2 text-xs font-medium transition-all duration-200',
                                        'min-w-[80px]',
                                        isActive
                                            ? 'bg-gold text-navy shadow-sm'
                                            : 'text-slate-400 hover:bg-content-muted hover:text-slate-300',
                                    ].join(' ')}
                                >
                                    <i className={`${tab.icon} text-xs`} />
                                    <span className="hidden sm:inline">{tab.label}</span>
                                    <span className="sm:hidden">{tab.label.split(' ')[0]}</span>

                                    {/* Badge dot untuk Rangkuman */}
                                    {isRangkuman && rangkumanBadge && !isActive && (
                                        <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-amber-400" />
                                    )}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* ── Tab Content ───────────────────────────────────────── */}
                <div
                    ref={contentRef}
                    className="wali-card rounded-xl border border-content-border bg-content-surface p-5 sm:p-6"
                >
                    {activeTab === 0 && (
                        <TabAyah
                            data={form}
                            errors={errors}
                            onChange={handleChange}
                            candidateAddr={candidate}
                        />
                    )}
                    {activeTab === 1 && (
                        <TabIbu
                            data={form}
                            errors={errors}
                            onChange={handleChange}
                            candidateAddr={candidate}
                        />
                    )}
                    {activeTab === 2 && (
                        <TabWali
                            data={form}
                            errors={errors}
                            onChange={handleChange}
                            candidateAddr={candidate}
                        />
                    )}
                    {activeTab === 3 && (
                        <TabProfilKeluarga
                            data={form}
                            errors={errors}
                            onChange={handleChange}
                        />
                    )}
                    {activeTab === 4 && (
                        <TabRangkuman
                            data={form}
                            completion={completion}
                            onGoToTab={switchTab}
                        />
                    )}
                </div>

                {/* ── Action Buttons (sembunyikan di tab Rangkuman) ────── */}
                {activeTab !== rangkumanIndex && (
                    <div className="wali-card flex items-center justify-between gap-4">
                        <button
                            type="button"
                            onClick={() => switchTab(activeTab - 1)}
                            disabled={activeTab === 0}
                            className="flex items-center gap-2 rounded-xl border border-content-border
                                       bg-content-card px-4 py-2.5 text-sm font-medium text-slate-300
                                       transition-all hover:border-gold/40 hover:text-gold
                                       disabled:pointer-events-none disabled:opacity-30"
                        >
                            <i className="fa-solid fa-arrow-left" />
                            Sebelumnya
                        </button>

                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="flex items-center gap-2 rounded-xl bg-gold px-5 py-2.5
                                           text-sm font-semibold text-navy transition-all duration-200
                                           hover:bg-goldhover active:scale-95
                                           disabled:pointer-events-none disabled:opacity-60"
                            >
                                {submitting
                                    ? <><i className="fa-solid fa-spinner fa-spin" /> Menyimpan...</>
                                    : <><i className="fa-solid fa-floppy-disk" /> Simpan</>
                                }
                            </button>

                            {activeTab < TABS.length - 2 && (
                                <button
                                    type="button"
                                    onClick={() => switchTab(activeTab + 1)}
                                    className="flex items-center gap-2 rounded-xl border border-gold/40
                                               bg-gold/5 px-4 py-2.5 text-sm font-medium text-gold
                                               transition-all hover:bg-gold/10"
                                >
                                    Selanjutnya
                                    <i className="fa-solid fa-arrow-right" />
                                </button>
                            )}
                        </div>
                    </div>
                )}

            </div>
        </DashboardSplitLayout>
    )
}