// resources/js/Components/Dashboard/Candidate/DataWali/TabRangkuman.tsx

import {
    GuardianData,
    EDUCATION_LABELS, INCOME_LABELS, STATUS_LABELS,
    MARITAL_LABELS, HOUSE_LABELS, VEHICLE_LABELS,
    EducationLevel, IncomeRange,
} from './types'

interface Props {
    data:         GuardianData
    completion:   number
    onGoToTab:    (index: number) => void
}

export default function TabRangkuman({ data, completion, onGoToTab }: Props) {
    const isEmpty = !data.mother_name && !data.father_name && !data.no_kk

    if (isEmpty) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl
                                border border-content-border bg-content-card">
                    <i className="fa-solid fa-users text-2xl text-slate-600" />
                </div>
                <h3 className="mb-2 text-base font-semibold text-slate-300">
                    Data Wali Belum Diisi
                </h3>
                <p className="mb-6 max-w-xs text-sm text-slate-500">
                    Mulai dari Tab Ibu untuk mengisi data wali. Data yang lengkap
                    membantu proses seleksi dan program beasiswa.
                </p>
                <button
                    type="button"
                    onClick={() => onGoToTab(1)} // Tab Ibu = index 1
                    className="flex items-center gap-2 rounded-xl bg-gold px-5 py-2.5
                               text-sm font-semibold text-navy transition-all duration-200
                               hover:bg-goldhover active:scale-95"
                >
                    <i className="fa-solid fa-arrow-right" />
                    Mulai dari Tab Ibu
                </button>
            </div>
        )
    }

    return (
        <div className="space-y-6">

            {/* ── Progress Bar ─────────────────────────────────────────── */}
            <div className="rounded-xl border border-content-border bg-content-card p-4">
                <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-300">Kelengkapan Data Wali</span>
                    <span className="text-sm font-bold text-gold">{completion}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                    <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                            width: `${completion}%`,
                            background: completion < 50
                                ? 'linear-gradient(to right, #c0392b, #e74c3c)'
                                : completion < 75
                                ? 'linear-gradient(to right, #d35400, #f39c12)'
                                : completion < 100
                                ? 'linear-gradient(to right, #2980b9, #7aa2f7)'
                                : 'linear-gradient(to right, #1e8449, #27ae60)',
                        }}
                    />
                </div>
            </div>

            {/* ── Data Ibu ─────────────────────────────────────────────── */}
            <RangkumanCard
                title="Data Ibu"
                icon="fa-solid fa-person-dress"
                iconColor="text-pink-400"
                onEdit={() => onGoToTab(1)}
            >
                <InfoRow label="Nama" value={data.mother_name} />
                <InfoRow label="Status" value={STATUS_LABELS[data.mother_status]} />
                <InfoRow label="NIK" value={data.mother_nik} />
                <InfoRow label="TTL" value={formatTTL(data.mother_place_of_birth, data.mother_date_of_birth)} />
                <InfoRow label="Pendidikan" value={data.mother_education ? EDUCATION_LABELS[data.mother_education as EducationLevel] : null} />
                <InfoRow label="Pekerjaan (KTP)" value={data.mother_job_ktp} />
                <InfoRow label="Pekerjaan Aktual" value={data.mother_job_actual} />
                <InfoRow label="Penghasilan" value={
                    data.income_type === 'combined'
                        ? 'Gabungan dengan Ayah'
                        : data.mother_income_range
                            ? INCOME_LABELS[data.mother_income_range as IncomeRange]
                            : null
                } />
                <InfoRow label="No. HP" value={data.mother_phone} />
                <InfoRow label="Alamat" value={formatAlamat('mother', data)} />
            </RangkumanCard>

            {/* ── Data Ayah ─────────────────────────────────────────────── */}
            <RangkumanCard
                title="Data Ayah"
                icon="fa-solid fa-person"
                iconColor="text-blue-400"
                onEdit={() => onGoToTab(0)}
                badge={
                    data.father_status !== 'hidup'
                        ? STATUS_LABELS[data.father_status]
                        : undefined
                }
            >
                {data.father_status !== 'hidup' ? (
                    <p className="text-sm text-slate-500 italic">
                        Status ayah: {STATUS_LABELS[data.father_status]}
                    </p>
                ) : (
                    <>
                        <InfoRow label="Nama" value={data.father_name} />
                        <InfoRow label="NIK" value={data.father_nik} />
                        <InfoRow label="TTL" value={formatTTL(data.father_place_of_birth, data.father_date_of_birth)} />
                        <InfoRow label="Pendidikan" value={data.father_education ? EDUCATION_LABELS[data.father_education as EducationLevel] : null} />
                        <InfoRow label="Pekerjaan (KTP)" value={data.father_job_ktp} />
                        <InfoRow label="Pekerjaan Aktual" value={data.father_job_actual} />
                        <InfoRow label="Penghasilan" value={
                            data.father_income_range
                                ? `${INCOME_LABELS[data.father_income_range as IncomeRange]}${data.income_type === 'combined' ? ' (Gabungan)' : ''}`
                                : null
                        } />
                        <InfoRow label="No. HP" value={data.father_phone} />
                        <InfoRow label="Alamat" value={
                            data.alamat_shared ? 'Sama dengan Ibu' : formatAlamat('father', data)
                        } />
                    </>
                )}
            </RangkumanCard>

            {/* ── Data Wali (hanya tampil kalau ada data) ──────────────── */}
            {data.guardian_name && (
                <RangkumanCard
                    title="Data Wali"
                    icon="fa-solid fa-user-shield"
                    iconColor="text-amber-400"
                    onEdit={() => onGoToTab(2)}
                >
                    <InfoRow label="Nama" value={data.guardian_name} />
                    <InfoRow label="Hubungan" value={data.guardian_relation} />
                    <InfoRow label="No. HP" value={data.guardian_phone} />
                    <InfoRow label="Alamat" value={formatAlamat('guardian', data)} />
                </RangkumanCard>
            )}

            {/* ── Profil Keluarga ───────────────────────────────────────── */}
            <RangkumanCard
                title="Profil Keluarga"
                icon="fa-solid fa-house"
                iconColor="text-emerald-400"
                onEdit={() => onGoToTab(3)}
            >
                <InfoRow label="No. KK" value={data.no_kk} />
                <InfoRow label="Email Keluarga" value={data.family_email} />
                <InfoRow label="Status Pernikahan" value={data.marital_status ? MARITAL_LABELS[data.marital_status] : null} />
                <InfoRow label="Kepemilikan Rumah" value={data.house_ownership ? HOUSE_LABELS[data.house_ownership] : null} />
                <InfoRow label="Kendaraan" value={data.vehicle_ownership ? VEHICLE_LABELS[data.vehicle_ownership] : null} />
                <InfoRow label="Jumlah Tanggungan" value={data.family_dependents != null ? `${data.family_dependents} orang` : null} />
            </RangkumanCard>

        </div>
    )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function RangkumanCard({ title, icon, iconColor, onEdit, badge, children }: {
    title: string
    icon: string
    iconColor: string
    onEdit: () => void
    badge?: string
    children: React.ReactNode
}) {
    return (
        <div className="overflow-hidden rounded-xl border border-content-border bg-content-card">
            <div className="flex items-center justify-between border-b border-content-border px-4 py-3">
                <div className="flex items-center gap-2">
                    <i className={`${icon} ${iconColor} text-sm`} />
                    <span className="text-sm font-semibold text-slate-200">{title}</span>
                    {badge && (
                        <span className="rounded-full bg-slate-700 px-2 py-0.5 text-xs text-slate-400">
                            {badge}
                        </span>
                    )}
                </div>
                <button
                    type="button"
                    onClick={onEdit}
                    className="text-xs text-gold transition-colors hover:text-goldhover"
                >
                    <i className="fa-solid fa-pen-to-square mr-1" />
                    Edit
                </button>
            </div>
            <div className="divide-y divide-content-border">
                {children}
            </div>
        </div>
    )
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
    return (
        <div className="flex items-start gap-4 px-4 py-2.5">
            <span className="w-36 shrink-0 text-xs text-slate-500">{label}</span>
            <span className={`text-sm ${value ? 'text-slate-200' : 'italic text-slate-600'}`}>
                {value || 'Belum diisi'}
            </span>
        </div>
    )
}

function formatTTL(place: string | null, date: string | null) {
    if (!place && !date) return null
    const parts = []
    if (place) parts.push(place)
    if (date) parts.push(new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }))
    return parts.join(', ')
}

function formatAlamat(prefix: 'father' | 'mother' | 'guardian', data: GuardianData) {
    const d = data as Record<string, unknown>
    const parts = [
        d[`${prefix}_address`],
        d[`${prefix}_village`],
        d[`${prefix}_district`],
        d[`${prefix}_city`],
        d[`${prefix}_province`],
        d[`${prefix}_postal_code`],
    ].filter(Boolean)
    return parts.length ? parts.join(', ') : null
}
