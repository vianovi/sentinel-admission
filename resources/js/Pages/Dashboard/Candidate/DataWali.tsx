// resources/js/Pages/Dashboard/Candidate/DataWali.tsx

import { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import { Head, Link, router, usePage }               from '@inertiajs/react'
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
    { key: 'ibu',             label: 'Ibu',             icon: 'fa-solid fa-person-dress' },
    { key: 'ayah',            label: 'Ayah',            icon: 'fa-solid fa-person' },
    { key: 'wali',            label: 'Wali',            icon: 'fa-solid fa-user-shield' },
    { key: 'profil-keluarga', label: 'Profil Keluarga', icon: 'fa-solid fa-house' },
    { key: 'rangkuman',       label: 'Rangkuman',       icon: 'fa-solid fa-list-check' },
] as const

type WaliTabKey = typeof TABS[number]['key']
type RequiredField = { key: keyof GuardianData; label: string; tab: WaliTabKey }

const PROFILE_REQUIRED_FIELDS: RequiredField[] = [
    { key: 'no_kk', label: 'Nomor KK', tab: 'profil-keluarga' },
    { key: 'income_type', label: 'Tipe penghasilan', tab: 'ibu' },
    { key: 'marital_status', label: 'Status pernikahan orang tua', tab: 'profil-keluarga' },
]

const MOTHER_ALIVE_FIELDS: RequiredField[] = [
    { key: 'mother_status', label: 'Status ibu', tab: 'ibu' },
    { key: 'mother_name', label: 'Nama ibu', tab: 'ibu' },
    { key: 'mother_nik', label: 'NIK ibu', tab: 'ibu' },
    { key: 'mother_place_of_birth', label: 'Tempat lahir ibu', tab: 'ibu' },
    { key: 'mother_date_of_birth', label: 'Tanggal lahir ibu', tab: 'ibu' },
    { key: 'mother_education', label: 'Pendidikan ibu', tab: 'ibu' },
    { key: 'mother_job_ktp', label: 'Pekerjaan KTP ibu', tab: 'ibu' },
    { key: 'mother_job_actual', label: 'Pekerjaan aktual ibu', tab: 'ibu' },
    { key: 'mother_income_range', label: 'Penghasilan ibu/gabungan keluarga', tab: 'ibu' },
    { key: 'mother_phone', label: 'Nomor HP ibu', tab: 'ibu' },
    { key: 'mother_province', label: 'Provinsi ibu', tab: 'ibu' },
    { key: 'mother_city', label: 'Kota/Kabupaten ibu', tab: 'ibu' },
    { key: 'mother_district', label: 'Kecamatan ibu', tab: 'ibu' },
    { key: 'mother_village', label: 'Kelurahan/Desa ibu', tab: 'ibu' },
    { key: 'mother_address', label: 'Alamat ibu', tab: 'ibu' },
    { key: 'mother_postal_code', label: 'Kode pos ibu', tab: 'ibu' },
]

const FATHER_ALIVE_FIELDS: RequiredField[] = [
    { key: 'father_status', label: 'Status ayah', tab: 'ayah' },
    { key: 'father_name', label: 'Nama ayah', tab: 'ayah' },
    { key: 'father_nik', label: 'NIK ayah', tab: 'ayah' },
    { key: 'father_place_of_birth', label: 'Tempat lahir ayah', tab: 'ayah' },
    { key: 'father_date_of_birth', label: 'Tanggal lahir ayah', tab: 'ayah' },
    { key: 'father_education', label: 'Pendidikan ayah', tab: 'ayah' },
    { key: 'father_job_ktp', label: 'Pekerjaan KTP ayah', tab: 'ayah' },
    { key: 'father_job_actual', label: 'Pekerjaan aktual ayah', tab: 'ayah' },
    { key: 'father_phone', label: 'Nomor HP ayah', tab: 'ayah' },
]

const FATHER_INCOME_FIELD: RequiredField = { key: 'father_income_range', label: 'Penghasilan ayah', tab: 'ayah' }

const FATHER_ADDRESS_FIELDS: RequiredField[] = [
    { key: 'father_province', label: 'Provinsi ayah', tab: 'ayah' },
    { key: 'father_city', label: 'Kota/Kabupaten ayah', tab: 'ayah' },
    { key: 'father_district', label: 'Kecamatan ayah', tab: 'ayah' },
    { key: 'father_village', label: 'Kelurahan/Desa ayah', tab: 'ayah' },
    { key: 'father_address', label: 'Alamat ayah', tab: 'ayah' },
    { key: 'father_postal_code', label: 'Kode pos ayah', tab: 'ayah' },
]

const CONDITIONAL_WALI_FIELDS: RequiredField[] = [
    { key: 'guardian_status', label: 'Status wali', tab: 'wali' },
    { key: 'guardian_name', label: 'Nama wali', tab: 'wali' },
    { key: 'guardian_relation', label: 'Hubungan wali', tab: 'wali' },
    { key: 'guardian_nik', label: 'NIK wali', tab: 'wali' },
    { key: 'guardian_place_of_birth', label: 'Tempat lahir wali', tab: 'wali' },
    { key: 'guardian_date_of_birth', label: 'Tanggal lahir wali', tab: 'wali' },
    { key: 'guardian_education', label: 'Pendidikan wali', tab: 'wali' },
    { key: 'guardian_job_ktp', label: 'Pekerjaan KTP wali', tab: 'wali' },
    { key: 'guardian_job_actual', label: 'Pekerjaan aktual wali', tab: 'wali' },
    { key: 'guardian_income_range', label: 'Penghasilan wali', tab: 'wali' },
    { key: 'guardian_phone', label: 'Nomor HP wali', tab: 'wali' },
    { key: 'guardian_province', label: 'Provinsi wali', tab: 'wali' },
    { key: 'guardian_city', label: 'Kota/Kabupaten wali', tab: 'wali' },
    { key: 'guardian_district', label: 'Kecamatan wali', tab: 'wali' },
    { key: 'guardian_village', label: 'Kelurahan/Desa wali', tab: 'wali' },
    { key: 'guardian_address', label: 'Alamat wali', tab: 'wali' },
    { key: 'guardian_postal_code', label: 'Kode pos wali', tab: 'wali' },
]

const isBlank = (value: unknown): boolean => {
    if (value === null || value === undefined) return true
    return typeof value === 'string' ? value.trim() === '' : false
}

const buildRequiredFields = (form: GuardianData, guardianRequired: boolean): RequiredField[] => {
    const fields: RequiredField[] = [
        { key: 'mother_status', label: 'Status ibu', tab: 'ibu' },
        { key: 'father_status', label: 'Status ayah', tab: 'ayah' },
        ...PROFILE_REQUIRED_FIELDS,
    ]

    if (form.mother_status === 'hidup') {
        fields.push(...MOTHER_ALIVE_FIELDS.filter(field => field.key !== 'mother_status'))
    }

    if (form.father_status === 'hidup') {
        fields.push(...FATHER_ALIVE_FIELDS.filter(field => field.key !== 'father_status'))

        if (form.income_type === 'separate') {
            fields.push(FATHER_INCOME_FIELD)
        }

        if (!form.alamat_shared) {
            fields.push(...FATHER_ADDRESS_FIELDS)
        }
    }

    if (guardianRequired) {
        fields.push(...CONDITIONAL_WALI_FIELDS)
    }

    return fields
}

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
        phone_number:        string | null
        family_card_number:  string | null
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
    const guardianRequired = !!form.marital_status && form.marital_status !== 'nikah_tercatat'
    const requiredFields = useMemo(
        () => buildRequiredFields(form, guardianRequired),
        [form, guardianRequired],
    )
    const emptyRequiredFields = requiredFields.filter(field => isBlank(form[field.key]))
    const hasEmptyRequired = emptyRequiredFields.length > 0

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

    useEffect(() => {
        if (form.no_kk || !candidate.family_card_number) return
        setForm(prev => ({ ...prev, no_kk: candidate.family_card_number }))
    }, [candidate.family_card_number, form.no_kk])

    // ── Recalculate completion ────────────────────────────────────────────────
    useEffect(() => {
        const filled = requiredFields.filter(field => !isBlank(form[field.key])).length
        setCompletion(Math.round((filled / requiredFields.length) * 100))
    }, [form, requiredFields])

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
                        'Mulai dari tab Ibu untuk mengatur alamat dan penghasilan keluarga',
                        'Ayah meninggal? Pilih status "Meninggal" — field lain disembunyikan',
                        guardianRequired
                            ? 'Data wali wajib karena status pernikahan orang tua bukan Nikah Tercatat'
                            : 'Wali bersifat opsional tapi sangat disarankan',
                        'Tidak ingin menyebutkan penghasilan? Pilih opsi "Tidak Ingin Memberitahu"',
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
                            const isActive = activeTab === idx
                            const hasMissingInTab = tab.key === 'rangkuman'
                                ? hasEmptyRequired
                                : emptyRequiredFields.some(field => field.tab === tab.key)
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

                                    {hasMissingInTab && !isActive && (
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
                    {activeTab === 0 && <TabIbu            data={form} errors={errors} onChange={handleChange} candidateAddr={candidate} />}
                    {activeTab === 1 && <TabAyah          data={form} errors={errors} onChange={handleChange} candidateAddr={candidate} />}
                    {activeTab === 2 && <TabWali           data={form} errors={errors} onChange={handleChange} candidateAddr={candidate} guardianRequired={guardianRequired} />}
                    {activeTab === 3 && <TabProfilKeluarga data={form} errors={errors} onChange={handleChange} candidateFamilyCardNumber={candidate.family_card_number} />}
                    {activeTab === 4 && (
                        <TabRangkuman
                            data={form}
                            completion={completion}
                            emptyRequiredFields={emptyRequiredFields}
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
                    ) : hasEmptyRequired ? <div /> : (
                        <Link
                            href="/dashboard/data-kesehatan"
                            className="ml-auto flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl
                                       bg-violet-500 hover:bg-violet-400
                                       text-white text-sm font-semibold whitespace-nowrap
                                       transition-all duration-200 active:scale-95 min-h-[44px]"
                        >
                            <span>Halaman Selanjutnya</span>
                            <i className="fa-solid fa-arrow-right text-xs"></i>
                        </Link>
                    )}
                </div>

            </div>
        </DashboardSplitLayout>
    )
}
