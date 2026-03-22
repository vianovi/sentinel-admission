// resources/js/Components/Dashboard/Candidate/DataWali/TabProfilKeluarga.tsx

import Select from 'react-select'
import { makeSelectStyles } from '@/Components/UI/selectStyles'
const selectStyles = makeSelectStyles()
import Field from '@/Components/UI/Field'
import {
    GuardianData,
    MARITAL_OPTIONS, HOUSE_OPTIONS, VEHICLE_OPTIONS,
} from './types'

interface Props {
    data:     GuardianData
    errors:   Partial<Record<string, string>>
    onChange: (field: string, value: unknown) => void
}

export default function TabProfilKeluarga({ data, errors, onChange }: Props) {
    const inputClass = (hasError: boolean) => [
        'w-full rounded-lg border bg-content-card px-4 py-2.5 text-sm text-slate-200',
        'placeholder:text-slate-600 transition-colors duration-200',
        'focus:outline-none focus:ring-2 focus:ring-gold/40',
        hasError
            ? 'border-red-500/60 focus:border-red-500'
            : 'border-content-border focus:border-gold/60',
    ].join(' ')

    return (
        <div className="space-y-6">

            {/* Info */}
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-3">
                <div className="flex items-start gap-3">
                    <i className="fa-solid fa-circle-info mt-0.5 text-blue-400" />
                    <p className="text-xs text-blue-300/80">
                        Data profil keluarga digunakan untuk keperluan administrasi, penentuan
                        beasiswa, zakat, dan bantuan pendidikan. Semua data dijaga kerahasiaannya.
                    </p>
                </div>
            </div>

            {/* ── Administrasi ─────────────────────────────────────────── */}
            <SectionTitle>Administrasi</SectionTitle>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Nomor Kartu Keluarga (KK)" required error={errors.no_kk}>
                    <input
                        type="text"
                        className={inputClass(!!errors.no_kk)}
                        value={data.no_kk ?? ''}
                        onChange={e => onChange('no_kk', e.target.value.replace(/\D/g, '').slice(0, 16))}
                        placeholder="16 digit nomor KK"
                        maxLength={16}
                    />
                </Field>

                <Field label="Status Pernikahan Orang Tua" error={errors.marital_status}>
                    <Select
                        options={MARITAL_OPTIONS}
                        styles={selectStyles}
                        placeholder="Pilih status..."
                        value={MARITAL_OPTIONS.find(o => o.value === data.marital_status) ?? null}
                        onChange={opt => onChange('marital_status', opt?.value ?? null)}
                        isClearable
                    />
                </Field>
            </div>

            {/* ── Email Keluarga ───────────────────────────────────────── */}
            <SectionTitle>Kontak Keluarga</SectionTitle>

            <Field
                label="Email yang Dapat Dihubungi"
                hint="Email Ayah / Ibu / keluarga untuk keperluan komunikasi & lomba"
                required
                error={errors.family_email}
            >
                <input
                    type="email"
                    className={inputClass(!!errors.family_email)}
                    value={data.family_email ?? ''}
                    onChange={e => onChange('family_email', e.target.value)}
                    placeholder="contoh@gmail.com"
                />
                {data.family_email && !data.family_email.endsWith('@gmail.com') && (
                    <p className="mt-1 text-xs text-amber-400">
                        <i className="fa-solid fa-triangle-exclamation mr-1" />
                        Hanya email @gmail.com yang diterima
                    </p>
                )}
            </Field>

            {/* ── Kondisi Ekonomi ──────────────────────────────────────── */}
            <SectionTitle>Kondisi Ekonomi & Aset</SectionTitle>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Status Kepemilikan Rumah" error={errors.house_ownership}>
                    <Select
                        options={HOUSE_OPTIONS}
                        styles={selectStyles}
                        placeholder="Pilih status..."
                        value={HOUSE_OPTIONS.find(o => o.value === data.house_ownership) ?? null}
                        onChange={opt => onChange('house_ownership', opt?.value ?? null)}
                        isClearable
                    />
                </Field>

                <Field label="Kepemilikan Kendaraan" error={errors.vehicle_ownership}>
                    <Select
                        options={VEHICLE_OPTIONS}
                        styles={selectStyles}
                        placeholder="Pilih kendaraan..."
                        value={VEHICLE_OPTIONS.find(o => o.value === data.vehicle_ownership) ?? null}
                        onChange={opt => onChange('vehicle_ownership', opt?.value ?? null)}
                        isClearable
                    />
                </Field>

                <Field
                    label="Jumlah Tanggungan Keluarga"
                    hint="Jumlah orang yang ditanggung secara finansial (termasuk anak ini)"
                    error={errors.family_dependents}
                >
                    <input
                        type="number"
                        className={inputClass(!!errors.family_dependents)}
                        value={data.family_dependents ?? ''}
                        onChange={e => onChange('family_dependents', e.target.value === '' ? null : parseInt(e.target.value))}
                        placeholder="cth: 4"
                        min={0}
                        max={30}
                    />
                </Field>
            </div>
        </div>
    )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-content-border" />
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                {children}
            </span>
            <div className="h-px flex-1 bg-content-border" />
        </div>
    )
}