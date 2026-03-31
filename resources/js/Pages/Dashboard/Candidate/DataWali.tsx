// resources/js/Pages/Dashboard/Candidate/DataWali.tsx

import { useRef, useState, useEffect, useCallback } from 'react'
import { Head, router, usePage }                     from '@inertiajs/react'
import { animate, stagger }                          from 'animejs'
import Swal                                          from 'sweetalert2'
import DashboardSplitLayout                          from '@/Layouts/DashboardSplitLayout'
import CandidateSidebar                              from '@/Components/Dashboard/Candidate/Shared/CandidateSidebar'
import TabAyah                                       from '@/Components/Dashboard/Candidate/DataWali/TabAyah'
import TabIbu                                        from '@/Components/Dashboard/Candidate/DataWali/TabIbu'
import TabWali                                       from '@/Components/Dashboard/Candidate/DataWali/TabWali'
import TabProfilKeluarga                             from '@/Components/Dashboard/Candidate/DataWali/TabProfilKeluarga'
import TabRangkuman                                  from '@/Components/Dashboard/Candidate/DataWali/TabRangkuman'
import { GuardianData, CandidateAddress }            from '@/Components/Dashboard/Candidate/DataWali/types'

// ─── SwalDark ─────────────────────────────────────────────────────────────────

const swalDark = Swal.mixin({
    background:         '#0f172a',
    color:              '#e2e8f0',
    confirmButtonColor: '#d4a017',
    cancelButtonColor:  '#334155',
    customClass: {
        popup:         '!rounded-2xl !border !border-white/10',
        confirmButton: '!rounded-xl !font-semibold',
        cancelButton:  '!rounded-xl !font-semibold',
    },
})

// ─── Tab Definitions ──────────────────────────────────────────────────────────

const TABS = [
    { key: 'ayah',            label: 'Ayah',            icon: 'fa-solid fa-person' },
    { key: 'ibu',             label: 'Ibu',             icon: 'fa-solid fa-person-dress' },
    { key: 'wali',            label: 'Wali',            icon: 'fa-solid fa-user-shield' },
    { key: 'profil-keluarga', label: 'Profil Keluarga', icon: 'fa-solid fa-house' },
    { key: 'rangkuman',       label: 'Rangkuman',       icon: 'fa-solid fa-list-check' },
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

    const [activeTab,  setActiveTab]  = useState(0)
    const [form,       setForm]       = useState<GuardianData>(guardian)
    const [submitting, setSubmitting] = useState(false)
    const [completion, setCompletion] = useState(initialCompletion)

    const contentRef     = useRef<HTMLDivElement>(null)
    const rangkumanIndex = TABS.length - 1
    const isRangkuman    = activeTab === rangkumanIndex

    // ── Entrance animation ────────────────────────────────────────────────────
    useEffect(() => {
        animate('.wali-card', {
            opacity:    [0, 1],
            translateY: [20, 0],
            duration:   600,
            delay:      stagger(80),
            ease:       'outExpo',
        })
    }, [])

    // ── Recalculate completion ────────────────────────────────────────────────
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

        if (f.no_kk)                     score += 10
        if (f.marital_status)            score += 5
        if (f.house_ownership)           score += 5
        if (f.family_dependents != null) score += 5

        setCompletion(Math.min(score, 100))
    }, [form])

    // ── Tab transition ────────────────────────────────────────────────────────
    const switchTab = useCallback((nextIndex: number) => {
        if (nextIndex === activeTab || nextIndex < 0 || nextIndex >= TABS.length) return
        const dir = nextIndex > activeTab ? 1 : -1

        if (contentRef.current) {
            animate(contentRef.current, {
                opacity: [1, 0], translateX: [0, dir * -20],
                duration: 180, ease: 'inQuad',
            })
            setTimeout(() => {
                setActiveTab(nextIndex)
                if (contentRef.current) {
                    animate(contentRef.current, {
                        opacity: [0, 1], translateX: [dir * 20, 0],
                        duration: 350, ease: 'outExpo',
                    })
                }
            }, 190)
        } else {
            setActiveTab(nextIndex)
        }
    }, [activeTab])

    // ── Field change handler ──────────────────────────────────────────────────
    const handleChange = useCallback((field: string, value: unknown) => {
        setForm(prev => ({ ...prev, [field]: value }))
    }, [])

    // ── Submit per-tab + auto next ────────────────────────────────────────────
    const handleSubmit = () => {
        setSubmitting(true)
        router.put(route('dashboard.data-wali.update'), form as unknown as Record<string, string>, {
            preserveScroll: true,
            onSuccess: () => {
                swalDark.fire({
                    toast: true, position: 'top-end', icon: 'success',
                    title: 'Tersimpan!', showConfirmButton: false,
                    timer: 2000, timerProgressBar: true,
                })
                if (activeTab < rangkumanIndex) switchTab(activeTab + 1)
            },
            onError: () => {
                animate('.input-error', {
                    translateX: [0, -6, 6, -4, 4, 0], duration: 380, ease: 'outExpo',
                })
                swalDark.fire({
                    toast: true, position: 'top-end', icon: 'warning',
                    title: 'Data belum terisi',
                    text: 'Lengkapi field yang ditandai merah.',
                    showConfirmButton: false, timer: 3000, timerProgressBar: true,
                })
            },
            onFinish: () => setSubmitting(false),
        })
    }

    // ── Submit semua dari Rangkuman ───────────────────────────────────────────
    const handleSubmitAll = async () => {
        const confirm = await swalDark.fire({
            icon: 'question', title: 'Data sudah sesuai?',
            text: 'Pastikan semua informasi wali sudah benar sebelum dikirim.',
            showCancelButton:  true,
            confirmButtonText: "<i class='fa-solid fa-paper-plane mr-2'></i> Tetap Kirim",
            cancelButtonText:  "<i class='fa-solid fa-arrow-left mr-2'></i> Cek Lagi",
            reverseButtons: true,
        })
        if (!confirm.isConfirmed) return

        setSubmitting(true)
        router.put(route('dashboard.data-wali.update'), form as unknown as Record<string, string>, {
            preserveScroll: true,
            onSuccess: () => {
                swalDark.fire({
                    icon: 'success', title: 'Data Tersimpan!',
                    text: 'Semua data wali telah berhasil dikirim.',
                    confirmButtonText: 'Oke, Terima Kasih!',
                })
            },
            onError: () => {
                swalDark.fire({
                    icon: 'warning', title: 'Ada yang perlu dilengkapi',
                    text: 'Silakan periksa kembali isian yang ditandai merah.',
                })
            },
            onFinish: () => setSubmitting(false),
        })
    }

    // ─────────────────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────────────────

    return (
        <DashboardSplitLayout
            aside={
                <CandidateSidebar
                    user={user}
                    candidate={{
                        full_name:           candidate.full_name,
                        nisn:                candidate.nisn,
                        nik:                 candidate.nik,
                        gender_label:        candidate.gender_label,
                        date_of_birth_label: candidate.date_of_birth_label,
                        school_origin:       candidate.school_origin,
                        status:              candidate.status,
                        program_choice:      candidate.program_choice,
                        admission_wave:      candidate.admission_wave,
                    }}
                    completion={completion}
                    tips={[
                        'Data ibu wajib diisi minimal nama & nomor HP',
                        'Ayah meninggal? Pilih status "Meninggal" — field lain disembunyikan',
                        'Wali bersifat opsional tapi sangat disarankan',
                        'Data ekonomi digunakan untuk seleksi beasiswa',
                    ]}
                />
            }
        >
            <Head title="Data Wali" />

            <div className="space-y-5 px-4 py-6 sm:px-6">

                {/* ── Header ───────────────────────────────────────────────── */}
                <div className="wali-card">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl
                                        dark:bg-violet-500/10 bg-violet-50
                                        border dark:border-violet-500/20 border-violet-200
                                        flex items-center justify-center shrink-0">
                            <i className="fa-solid fa-users text-violet-400 text-sm"></i>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold dark:text-slate-100 text-slate-800">
                                Data Wali
                            </h1>
                            <p className="text-sm dark:text-slate-400 text-slate-500 mt-0.5">
                                Data orang tua &amp; wali untuk keperluan administrasi pendaftaran
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── Tab Navigation — pill style, icon-only di mobile ─────── */}
                <div className="wali-card">
                    <div className="flex overflow-x-auto rounded-xl
                                    border dark:border-content-border border-black/[0.08]
                                    dark:bg-content-card bg-slate-50
                                    p-1 gap-1 no-scrollbar">
                        {TABS.map((tab, idx) => {
                            const isActive       = activeTab === idx
                            const isRangkumanTab = idx === rangkumanIndex
                            return (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => switchTab(idx)}
                                    className={[
                                        'relative flex flex-1 items-center justify-center gap-1.5 rounded-lg',
                                        'px-2 py-2 sm:px-3 text-xs font-semibold',
                                        'transition-all duration-200 min-w-[36px] min-h-[36px]',
                                        isActive
                                            ? 'bg-violet-500 text-white shadow-sm'
                                            : 'dark:text-slate-400 text-slate-500 dark:hover:bg-content-muted hover:bg-black/[0.04] dark:hover:text-slate-300 hover:text-slate-700',
                                    ].join(' ')}
                                >
                                    <i className={`${tab.icon} text-xs shrink-0`} />
                                    <span className="hidden sm:inline whitespace-nowrap">{tab.label}</span>

                                    {isRangkumanTab && completion < 100 && !isActive && (
                                        <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-amber-400" />
                                    )}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* ── Tab Content ───────────────────────────────────────────── */}
                <div
                    ref={contentRef}
                    className="wali-card rounded-xl
                               dark:border dark:border-content-border border border-black/[0.07]
                               dark:bg-content-surface bg-white
                               p-5 sm:p-6 min-h-[420px]"
                >
                    {activeTab === 0 && <TabAyah          data={form} errors={errors} onChange={handleChange} candidateAddr={candidate} />}
                    {activeTab === 1 && <TabIbu            data={form} errors={errors} onChange={handleChange} candidateAddr={candidate} />}
                    {activeTab === 2 && <TabWali           data={form} errors={errors} onChange={handleChange} candidateAddr={candidate} />}
                    {activeTab === 3 && <TabProfilKeluarga data={form} errors={errors} onChange={handleChange} />}
                    {activeTab === 4 && (
                        <TabRangkuman
                            data={form}
                            completion={completion}
                            onGoToTab={switchTab}
                            onSubmitAll={handleSubmitAll}
                            submitting={submitting}
                        />
                    )}
                </div>

                {/* ── Navigasi — Kembali & Simpan & Lanjut ─────────────────── */}
                <div className="wali-card flex items-center justify-between gap-3">
                    {activeTab > 0 ? (
                        <button
                            type="button"
                            onClick={() => switchTab(activeTab - 1)}
                            className="flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl
                                       dark:bg-white/[0.05] bg-slate-100
                                       dark:hover:bg-white/[0.08] hover:bg-slate-200
                                       dark:text-slate-300 text-slate-600
                                       text-sm font-semibold whitespace-nowrap
                                       transition-all duration-200 active:scale-95 min-h-[44px]"
                        >
                            <i className="fa-solid fa-arrow-left text-xs"></i>
                            <span>Kembali</span>
                        </button>
                    ) : <div />}

                    {!isRangkuman ? (
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl
                                       bg-violet-500 hover:bg-violet-400
                                       text-white text-sm font-semibold whitespace-nowrap
                                       transition-all duration-200 active:scale-95
                                       disabled:opacity-60 disabled:cursor-not-allowed min-h-[44px]"
                        >
                            {submitting
                                ? <><i className="fa-solid fa-spinner fa-spin"></i> Menyimpan...</>
                                : activeTab < rangkumanIndex - 1
                                    ? <><i className="fa-solid fa-floppy-disk"></i> Simpan &amp; Lanjut <i className="fa-solid fa-arrow-right text-xs ml-1"></i></>
                                    : <><i className="fa-solid fa-floppy-disk"></i> Simpan Data</>
                            }
                        </button>
                    ) : <div />}
                </div>

            </div>
        </DashboardSplitLayout>
    )
}