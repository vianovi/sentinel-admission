// resources/js/Components/Dashboard/Candidate/DataWali/TabRangkuman.tsx

import { useEffect } from 'react'
import { animate, stagger } from 'animejs'
import {
    GuardianData,
    EDUCATION_LABELS, INCOME_LABELS, STATUS_LABELS,
    MARITAL_LABELS, HOUSE_LABELS, VEHICLE_LABELS,
    EducationLevel, IncomeRange,
} from './types'

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
    data:        GuardianData
    completion:  number
    onGoToTab:   (index: number) => void
    onSubmitAll: () => void
    submitting:  boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const progressGradient = (pct: number) => {
    if (pct < 50)  return 'linear-gradient(to right, #c0392b, #e74c3c)'
    if (pct < 75)  return 'linear-gradient(to right, #d35400, #f39c12)'
    if (pct < 100) return 'linear-gradient(to right, #2980b9, #7aa2f7)'
    return 'linear-gradient(to right, #1e8449, #27ae60)'
}

const progressColor = (pct: number) => {
    if (pct === 100) return 'dark:text-violet-400 text-violet-600'
    if (pct >= 75)   return 'dark:text-blue-400 text-blue-600'
    if (pct >= 50)   return 'dark:text-amber-400 text-amber-600'
    return 'dark:text-red-400 text-red-600'
}

function formatTTL(place: string | null, date: string | null) {
    if (!place && !date) return null
    const parts = []
    if (place) parts.push(place)
    if (date)  parts.push(new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }))
    return parts.join(', ')
}

function formatAlamat(prefix: 'father' | 'mother' | 'guardian', data: GuardianData) {
    const d = data as Record<string, unknown>
    const parts = [
        d[`${prefix}_address`], d[`${prefix}_village`],
        d[`${prefix}_district`], d[`${prefix}_city`],
        d[`${prefix}_province`], d[`${prefix}_postal_code`],
    ].filter(Boolean)
    return parts.length ? parts.join(', ') : null
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS — identik dengan DataKesehatan, warna violet
// ─────────────────────────────────────────────────────────────────────────────

function SummaryCard({ icon, title, onEdit, badge, children }: {
    icon:     string
    title:    string
    onEdit:   () => void
    badge?:   string
    children: React.ReactNode
}) {
    return (
        <div className="rangkuman-wali-card opacity-0 rounded-xl border overflow-hidden
                        dark:border-white/[0.07] border-black/[0.07]
                        dark:bg-white/[0.02] bg-white">
            <div className="flex items-center justify-between px-4 py-2.5
                            border-b dark:border-white/[0.06] border-black/[0.06]
                            dark:bg-white/[0.03] bg-slate-50">
                <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md flex items-center justify-center
                                    dark:bg-violet-500/20 bg-violet-50">
                        <i className={`${icon} text-violet-400 text-[10px]`}></i>
                    </div>
                    <p className="text-[11px] font-semibold dark:text-slate-400 text-slate-500
                                  uppercase tracking-wider">
                        {title}
                    </p>
                    {badge && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full
                                         dark:bg-white/[0.06] bg-slate-100
                                         dark:text-slate-400 text-slate-500
                                         border dark:border-white/[0.08] border-black/[0.07]">
                            {badge}
                        </span>
                    )}
                </div>
                <button
                    type="button"
                    onClick={onEdit}
                    className="text-[11px] dark:text-slate-500 text-slate-400
                               dark:hover:text-violet-400 hover:text-violet-600
                               flex items-center gap-1 transition-colors duration-150"
                >
                    <i className="fa-solid fa-pen-to-square text-[9px]"></i>
                    Edit
                </button>
            </div>
            <div>{children}</div>
        </div>
    )
}

function Row({ label, value, valueClass }: {
    label:       string
    value:       string | null | undefined
    valueClass?: string
}) {
    return (
        <div className="flex items-baseline justify-between gap-3 px-4 py-[7px]
                        border-b dark:border-white/[0.04] border-black/[0.04] last:border-0">
            <p className="text-[11px] dark:text-slate-500 text-slate-400 shrink-0">
                {label}
            </p>
            <p className={`text-[12px] font-medium text-right break-words min-w-0
                          ${valueClass ?? 'dark:text-slate-200 text-slate-700'}
                          ${!value ? 'dark:text-slate-600 text-slate-300 italic font-normal' : ''}`}>
                {value || '—'}
            </p>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function TabRangkuman({ data, completion, onGoToTab, onSubmitAll, submitting }: Props) {

    useEffect(() => {
        animate('.rangkuman-wali-card', {
            opacity:    [0, 1],
            translateY: [12, 0],
            duration:   450,
            delay:      stagger(60),
            ease:       'outExpo',
        })
    }, [])

    const isEmpty = !data.mother_name && !data.father_name && !data.no_kk
    if (isEmpty) {
        return (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="w-16 h-16 rounded-2xl dark:bg-violet-500/10 bg-violet-50
                                border dark:border-violet-500/20 border-violet-200
                                flex items-center justify-center">
                    <i className="fa-solid fa-users text-2xl dark:text-violet-400 text-violet-500"></i>
                </div>
                <div className="text-center">
                    <p className="text-sm font-semibold dark:text-slate-300 text-slate-600 mb-1">
                        Data wali belum diisi
                    </p>
                    <p className="text-xs dark:text-slate-500 text-slate-400 max-w-xs">
                        Mulai dari tab{' '}
                        <button
                            onClick={() => onGoToTab(1)}
                            className="dark:text-violet-400 text-violet-600 font-semibold hover:underline"
                        >
                            Ibu
                        </button>
                        {' '}untuk mengisi data wali
                    </p>
                </div>
            </div>
        )
    }

    const fatherAbsent = data.father_status !== 'hidup'

    return (
        <div className="flex flex-col gap-4">

            {/* ── Status Kelengkapan ────────────────────────────────────── */}
            <div className="rangkuman-wali-card opacity-0 rounded-xl border overflow-hidden
                            dark:border-white/[0.07] border-black/[0.07]
                            dark:bg-white/[0.02] bg-white">
                <div className="flex items-center gap-2.5 px-4 py-2.5
                                border-b dark:border-white/[0.06] border-black/[0.06]
                                dark:bg-white/[0.03] bg-slate-50">
                    <div className="w-5 h-5 rounded-md flex items-center justify-center
                                    dark:bg-violet-500/20 bg-violet-50">
                        <i className="fa-solid fa-circle-check text-violet-400 text-[10px]"></i>
                    </div>
                    <p className="text-[11px] font-semibold dark:text-slate-400 text-slate-500
                                  uppercase tracking-wider flex-1">
                        Status Kelengkapan
                    </p>
                    <span className={`text-xs font-bold ${progressColor(completion)}`}>
                        {completion}%
                    </span>
                </div>
                <div className="p-4">
                    <div className="h-1.5 dark:bg-white/[0.05] bg-black/[0.06] rounded-full overflow-hidden mb-3">
                        <div className="h-full rounded-full transition-all duration-700"
                             style={{ width: `${completion}%`, background: progressGradient(completion) }} />
                    </div>
                    {completion === 100 ? (
                        <p className="text-xs dark:text-violet-400 text-violet-600 flex items-center gap-1.5">
                            <i className="fa-solid fa-circle-check text-[11px]"></i>
                            Semua data wajib sudah diisi — data wali lengkap!
                        </p>
                    ) : (
                        <p className="text-xs dark:text-slate-500 text-slate-400">
                            Lengkapi data yang masih kosong di tab masing-masing
                        </p>
                    )}
                </div>
            </div>

            {/* ── Grid 2 kolom ──────────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                {/* Data Ibu */}
                <SummaryCard icon="fa-solid fa-person-dress" title="Data Ibu"
                    onEdit={() => onGoToTab(1)}>
                    <Row label="Nama"            value={data.mother_name} />
                    <Row label="Status"          value={STATUS_LABELS[data.mother_status]} />
                    <Row label="NIK"             value={data.mother_nik} />
                    <Row label="TTL"             value={formatTTL(data.mother_place_of_birth, data.mother_date_of_birth)} />
                    <Row label="Pendidikan"      value={data.mother_education ? EDUCATION_LABELS[data.mother_education as EducationLevel] : null} />
                    <Row label="Pekerjaan (KTP)" value={data.mother_job_ktp} />
                    <Row label="Pekerjaan aktual" value={data.mother_job_actual} />
                    <Row label="Penghasilan"     value={
                        data.income_type === 'combined'
                            ? 'Gabungan dengan Ayah'
                            : data.mother_income_range
                                ? INCOME_LABELS[data.mother_income_range as IncomeRange]
                                : null
                    } />
                    <Row label="No. HP"          value={data.mother_phone} />
                    <Row label="Alamat"          value={formatAlamat('mother', data)} />
                </SummaryCard>

                {/* Data Ayah */}
                <SummaryCard icon="fa-solid fa-person" title="Data Ayah"
                    onEdit={() => onGoToTab(0)}
                    badge={fatherAbsent ? STATUS_LABELS[data.father_status] : undefined}>
                    {fatherAbsent ? (
                        <div className="px-4 py-4">
                            <p className="text-[12px] dark:text-slate-500 text-slate-400 italic">
                                Status ayah: {STATUS_LABELS[data.father_status]}
                            </p>
                        </div>
                    ) : (
                        <>
                            <Row label="Nama"             value={data.father_name} />
                            <Row label="NIK"              value={data.father_nik} />
                            <Row label="TTL"              value={formatTTL(data.father_place_of_birth, data.father_date_of_birth)} />
                            <Row label="Pendidikan"       value={data.father_education ? EDUCATION_LABELS[data.father_education as EducationLevel] : null} />
                            <Row label="Pekerjaan (KTP)"  value={data.father_job_ktp} />
                            <Row label="Pekerjaan aktual" value={data.father_job_actual} />
                            <Row label="Penghasilan"      value={
                                data.father_income_range
                                    ? `${INCOME_LABELS[data.father_income_range as IncomeRange]}${data.income_type === 'combined' ? ' (Gabungan)' : ''}`
                                    : null
                            } />
                            <Row label="No. HP"           value={data.father_phone} />
                            <Row label="Alamat"           value={data.alamat_shared ? 'Sama dengan Ibu' : formatAlamat('father', data)} />
                        </>
                    )}
                </SummaryCard>

                {/* Profil Keluarga */}
                <SummaryCard icon="fa-solid fa-house" title="Profil Keluarga"
                    onEdit={() => onGoToTab(3)}>
                    <Row label="No. KK"             value={data.no_kk} />
                    <Row label="Email keluarga"     value={data.family_email} />
                    <Row label="Status pernikahan"  value={data.marital_status ? MARITAL_LABELS[data.marital_status] : null} />
                    <Row label="Kepemilikan rumah"  value={data.house_ownership ? HOUSE_LABELS[data.house_ownership] : null} />
                    <Row label="Kendaraan"          value={data.vehicle_ownership ? VEHICLE_LABELS[data.vehicle_ownership] : null} />
                    <Row label="Jml. tanggungan"    value={data.family_dependents != null ? `${data.family_dependents} orang` : null} />
                </SummaryCard>

                {/* Data Wali — hanya tampil kalau ada */}
                {data.guardian_name ? (
                    <SummaryCard icon="fa-solid fa-user-shield" title="Data Wali"
                        onEdit={() => onGoToTab(2)}>
                        <Row label="Nama"       value={data.guardian_name} />
                        <Row label="Hubungan"   value={data.guardian_relation} />
                        <Row label="No. HP"     value={data.guardian_phone} />
                        <Row label="Alamat"     value={formatAlamat('guardian', data)} />
                    </SummaryCard>
                ) : (
                    /* Placeholder kalau wali kosong */
                    <SummaryCard icon="fa-solid fa-user-shield" title="Data Wali"
                        onEdit={() => onGoToTab(2)}>
                        <div className="px-4 py-4 flex items-center gap-2">
                            <i className="fa-solid fa-circle-info text-[10px] dark:text-slate-600 text-slate-300"></i>
                            <p className="text-[11px] dark:text-slate-500 text-slate-400 italic">
                                Data wali tidak diisi — opsional
                            </p>
                        </div>
                    </SummaryCard>
                )}

            </div>

            {/* ── Tombol Kirim Semua ────────────────────────────────────── */}
            <div className="rangkuman-wali-card opacity-0 rounded-xl border
                            dark:border-white/[0.07] border-black/[0.07]
                            dark:bg-white/[0.02] bg-white p-4">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <p className="text-xs font-semibold dark:text-slate-300 text-slate-700">
                            Simpan Semua Data Wali
                        </p>
                        <p className="text-[11px] dark:text-slate-500 text-slate-400 mt-0.5">
                            Data dari semua tab akan disimpan sekaligus
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onSubmitAll}
                        disabled={submitting}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl
                                   bg-violet-500 hover:bg-violet-400
                                   text-white text-sm font-semibold shrink-0
                                   transition-all duration-200 active:scale-95
                                   disabled:opacity-60 disabled:cursor-not-allowed
                                   min-h-[44px]"
                    >
                        {submitting
                            ? <><i className="fa-solid fa-spinner fa-spin text-xs" /> Mengirim...</>
                            : <><i className="fa-solid fa-paper-plane text-xs" /> Kirim &amp; Selesaikan</>
                        }
                    </button>
                </div>
            </div>

        </div>
    )
}