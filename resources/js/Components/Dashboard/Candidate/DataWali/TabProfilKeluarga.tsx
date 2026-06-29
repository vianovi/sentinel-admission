// resources/js/Components/Dashboard/Candidate/DataWali/TabProfilKeluarga.tsx

import Select               from 'react-select'
import { makeSelectStyles } from '@/Components/UI/selectStyles'
import { useTheme }         from '@/context/ThemeContext'
import Field                from '@/Components/UI/Field'
import {
    GuardianData,
    MARITAL_OPTIONS, HOUSE_OPTIONS, VEHICLE_OPTIONS,
} from './types'

interface Props {
    data:                      GuardianData
    errors:                    Partial<Record<string, string>>
    onChange:                  (field: string, value: unknown) => void
    candidateFamilyCardNumber: string | null
}

function inputCls(hasError = false) {
    return [
        'w-full rounded-lg border px-4 py-2.5 text-sm',
        'dark:bg-content-card bg-white',
        'dark:text-slate-200 text-slate-800',
        'placeholder:dark:text-slate-600 placeholder:text-slate-400',
        'transition-colors duration-200',
        'focus:outline-none focus:ring-2 dark:focus:ring-gold/40 focus:ring-amber-300/50',
        hasError
            ? 'border-red-500/60 focus:border-red-500'
            : 'dark:border-content-border border-black/[0.10] dark:focus:border-gold/60 focus:border-amber-400/60',
    ].join(' ')
}

function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex items-center gap-3">
            <div className="h-px flex-1 dark:bg-content-border bg-black/[0.07]" />
            <span className="text-xs font-semibold uppercase tracking-widest dark:text-slate-500 text-slate-400">
                {children}
            </span>
            <div className="h-px flex-1 dark:bg-content-border bg-black/[0.07]" />
        </div>
    )
}

export default function TabProfilKeluarga({ data, errors, onChange, candidateFamilyCardNumber }: Props) {
    // isDark harus dari dalam komponen — tidak bisa module level
    const { theme } = useTheme()
    const isDark    = theme === 'dark'

    const portalProps = (hasError = false) => ({
        styles:           makeSelectStyles(hasError, isDark),
        menuPortalTarget: typeof document !== 'undefined' ? document.body : undefined,
        menuPosition:     'fixed'  as const,
        menuPlacement:    'auto'   as const,
    })

    return (
        <div className="space-y-6">

            {/* Info */}
            <div className="rounded-xl border dark:border-blue-500/20 border-blue-200
                            dark:bg-blue-500/5 bg-blue-50 px-4 py-3">
                <div className="flex items-start gap-3">
                    <i className="fa-solid fa-circle-info mt-0.5 text-blue-400" />
                    <p className="text-xs dark:text-blue-300/80 text-blue-700">
                        Data profil keluarga digunakan untuk keperluan administrasi, penentuan
                        beasiswa, zakat, dan bantuan pendidikan. Semua data dijaga kerahasiaannya.
                    </p>
                </div>
            </div>

            {/* ── Administrasi ─────────────────────────────────────────── */}
            <SectionTitle>Administrasi</SectionTitle>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Nomor Kartu Keluarga (KK)" required error={errors.no_kk}>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            className={inputCls(!!errors.no_kk)}
                            value={data.no_kk ?? ''}
                            onChange={e => onChange('no_kk', e.target.value.replace(/\D/g, '').slice(0, 16))}
                            placeholder="16 digit nomor KK"
                            maxLength={16}
                        />
                        {candidateFamilyCardNumber && (
                            <button
                                type="button"
                                onClick={() => onChange('no_kk', candidateFamilyCardNumber)}
                                className="inline-flex h-[44px] shrink-0 items-center justify-center rounded-lg border px-3 text-xs font-semibold transition
                                           dark:border-content-border border-black/[0.10]
                                           dark:bg-content-card bg-slate-50
                                           dark:text-slate-300 text-slate-600
                                           dark:hover:border-gold/50 hover:border-amber-300"
                                title="Salin nomor KK dari Data Diri"
                            >
                                <i className="fa-solid fa-copy" />
                            </button>
                        )}
                    </div>
                </Field>

                <Field label="Status Pernikahan Orang Tua" required error={errors.marital_status}>
                    <Select
                        options={MARITAL_OPTIONS}
                        placeholder="Pilih status..."
                        value={MARITAL_OPTIONS.find(o => o.value === data.marital_status) ?? null}
                        onChange={opt => onChange('marital_status', opt?.value ?? null)}
                        isClearable
                        {...portalProps(!!errors.marital_status)}
                    />
                </Field>
            </div>

            {/* ── Kontak Keluarga ──────────────────────────────────────── */}
            <SectionTitle>Kontak Keluarga</SectionTitle>

            <Field
                label="Email yang Dapat Dihubungi"
                hint="Opsional. Email Ayah / Ibu / keluarga untuk keperluan komunikasi"
                error={errors.family_email}
            >
                <input
                    type="email"
                    className={inputCls(!!errors.family_email)}
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
            <SectionTitle>Kondisi Ekonomi &amp; Aset</SectionTitle>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Status Kepemilikan Rumah" error={errors.house_ownership}>
                    <Select
                        options={HOUSE_OPTIONS}
                        placeholder="Pilih status..."
                        value={HOUSE_OPTIONS.find(o => o.value === data.house_ownership) ?? null}
                        onChange={opt => onChange('house_ownership', opt?.value ?? null)}
                        isClearable
                        {...portalProps(!!errors.house_ownership)}
                    />
                </Field>

                <Field label="Kepemilikan Kendaraan" error={errors.vehicle_ownership}>
                    <Select
                        options={VEHICLE_OPTIONS}
                        placeholder="Pilih kendaraan..."
                        value={VEHICLE_OPTIONS.find(o => o.value === data.vehicle_ownership) ?? null}
                        onChange={opt => onChange('vehicle_ownership', opt?.value ?? null)}
                        isClearable
                        {...portalProps(!!errors.vehicle_ownership)}
                    />
                </Field>

                <Field
                    label="Jumlah Tanggungan Keluarga"
                    hint="Jumlah orang yang ditanggung secara finansial (termasuk anak ini)"
                    error={errors.family_dependents}
                >
                    <input
                        type="number"
                        className={inputCls(!!errors.family_dependents)}
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
