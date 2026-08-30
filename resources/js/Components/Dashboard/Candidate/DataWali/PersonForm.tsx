// resources/js/Components/Dashboard/Candidate/DataWali/PersonForm.tsx

import { useRef }           from 'react'
import Select               from 'react-select'
import { makeSelectStyles } from '@/Components/UI/selectStyles'
import { useTheme }         from '@/context/ThemeContext'
import Field                from '@/Components/UI/Field'
import AddressForm          from './AddressForm'
import {
    GuardianData, CandidateAddress,
    EDUCATION_OPTIONS, INCOME_OPTIONS, STATUS_OPTIONS,
} from './types'

type PersonPrefix = 'father' | 'mother' | 'guardian'

interface Props {
    prefix:        PersonPrefix
    label:         string
    data:          GuardianData
    errors:        Partial<Record<string, string>>
    onChange:      (field: string, value: unknown) => void
    candidateAddr: CandidateAddress
    showIncome:    boolean
    showAddress:   boolean
    isOptional?:   boolean
    showRelation?: boolean
    forceRequired?: boolean
}

// ─── inputCls — adaptive dark/light ──────────────────────────────────────────
function inputCls(hasError = false) {
    return [
        'w-full rounded-lg border px-4 py-2.5 text-sm',
        'dark:bg-content-card bg-white',
        'dark:text-slate-200 text-slate-800',
        'placeholder:dark:text-slate-600 placeholder:text-slate-400',
        'transition-colors duration-200',
        'focus:outline-none focus:ring-2 dark:focus:ring-violet-500/40 focus:ring-violet-500/30',
        hasError
            ? 'border-red-500/60 focus:border-red-500'
            : 'dark:border-content-border border-black/[0.10] dark:focus:border-violet-500/60 focus:border-violet-500/60',
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

// ─── Component ────────────────────────────────────────────────────────────────

export default function PersonForm({
    prefix, label, data, errors, onChange,
    candidateAddr, showIncome, showAddress,
    isOptional = false, showRelation = false, forceRequired = false,
}: Props) {
    // isDark harus dari dalam komponen — tidak bisa module level
    const { theme } = useTheme()
    const isDark    = theme === 'dark'

    const portalProps = (hasError = false) => ({
        styles:           makeSelectStyles(hasError, isDark, '#8b5cf6'),
        menuPortalTarget: typeof document !== 'undefined' ? document.body : undefined,
        menuPosition:     'fixed'  as const,
        menuPlacement:    'auto'   as const,
    })

    const formRef = useRef<HTMLDivElement>(null)

    const get = (field: string) => (data as Record<string, unknown>)[`${prefix}_${field}`]
    const set = (field: string, val: unknown) => onChange(`${prefix}_${field}`, val)
    const err = (field: string) => errors[`${prefix}_${field}`]

    const statusValue = get('status') as string
    const isAbsent    = statusValue === 'meninggal' || statusValue === 'tidak_diketahui'
    const wizardPhone = candidateAddr.phone_number ?? ''

    const required = forceRequired && (prefix === 'guardian' || statusValue === 'hidup')
    const incomeLabel = prefix === 'mother' && data.income_type === 'combined'
        ? 'Penghasilan Gabungan Keluarga'
        : `Penghasilan ${label}`

    // Collapsed state kalau absent
    if (isAbsent) {
        return (
            <div ref={formRef} className="space-y-5">
                <StatusRow prefix={prefix} label={label} get={get} set={set} err={err} />
                <div className="rounded-xl border dark:border-content-border border-black/[0.07]
                                dark:bg-content-muted bg-slate-50 p-4 text-center">
                    <p className="text-sm dark:text-slate-400 text-slate-500">
                        Data {label} tidak ditampilkan karena status telah ditandai sebagai{' '}
                        <span className="font-medium text-gold">
                            {statusValue === 'meninggal' ? 'Meninggal' : 'Tidak Diketahui'}
                        </span>.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div ref={formRef} className="space-y-6">

            {/* ── Status ──────────────────────────────────────────────── */}
            <StatusRow prefix={prefix} label={label} get={get} set={set} err={err} />

            {isOptional && (
                <p className="text-xs dark:text-slate-500 text-slate-400 -mt-2">
                    * Data Wali bersifat opsional, namun sangat disarankan untuk diisi.
                </p>
            )}

            {/* ── Identitas ────────────────────────────────────────────── */}
            <SectionTitle>Identitas</SectionTitle>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label={`Nama Lengkap ${label}`} required={required} error={err('name')}>
                    <input
                        type="text"
                        className={inputCls(!!err('name'))}
                        value={(get('name') as string) ?? ''}
                        onChange={e => set('name', e.target.value)}
                        placeholder={`Nama lengkap ${label.toLowerCase()}`}
                        maxLength={100}
                    />
                </Field>

                {showRelation && (
                    <Field label="Hubungan dengan Anak" required={required} error={err('relation')}>
                        <input
                            type="text"
                            className={inputCls(!!err('relation'))}
                            value={(get('relation') as string) ?? ''}
                            onChange={e => set('relation', e.target.value)}
                            placeholder="cth: Nenek, Paman, Bibi"
                            maxLength={100}
                        />
                    </Field>
                )}

                <Field label="NIK" required={required} error={err('nik')}>
                    <input
                        type="text"
                        className={inputCls(!!err('nik'))}
                        value={(get('nik') as string) ?? ''}
                        onChange={e => set('nik', e.target.value.replace(/\D/g, '').slice(0, 16))}
                        placeholder="16 digit NIK"
                        maxLength={16}
                    />
                </Field>

                <Field label="Tempat Lahir" required={required} error={err('place_of_birth')}>
                    <input
                        type="text"
                        className={inputCls(!!err('place_of_birth'))}
                        value={(get('place_of_birth') as string) ?? ''}
                        onChange={e => set('place_of_birth', e.target.value)}
                        placeholder="Kota tempat lahir"
                        maxLength={100}
                    />
                </Field>

                <Field label="Tanggal Lahir" required={required} error={err('date_of_birth')}>
                    <input
                        type="date"
                        className={inputCls(!!err('date_of_birth'))}
                        value={(get('date_of_birth') as string) ?? ''}
                        onChange={e => set('date_of_birth', e.target.value)}
                    />
                </Field>

                <Field label="Pendidikan Terakhir" required={required} error={err('education')}>
                    <Select
                        options={EDUCATION_OPTIONS}
                        placeholder="Pilih pendidikan..."
                        value={EDUCATION_OPTIONS.find(o => o.value === get('education')) ?? null}
                        onChange={opt => set('education', opt?.value ?? null)}
                        isClearable
                        {...portalProps(!!err('education'))}
                    />
                </Field>
            </div>

            {/* ── Kontak ───────────────────────────────────────────────── */}
            <SectionTitle>Kontak</SectionTitle>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Nomor WhatsApp / HP" required={required} error={err('phone')}>
                    <div className="flex flex-col gap-2 sm:flex-row">
                        <input
                            type="tel"
                            className={inputCls(!!err('phone'))}
                            value={(get('phone') as string) ?? ''}
                            onChange={e => set('phone', e.target.value.replace(/\D/g, '').slice(0, 14))}
                            placeholder="08xxxxxxxxxx"
                            maxLength={14}
                        />
                        {(prefix === 'father' || prefix === 'mother') && wizardPhone && (
                            <button
                                type="button"
                                onClick={() => set('phone', wizardPhone)}
                                className="inline-flex min-h-[44px] w-full shrink-0 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold leading-snug transition sm:w-[190px]
                                           dark:border-content-border border-black/[0.10]
                                           dark:bg-content-card bg-slate-50
                                           dark:text-slate-300 text-slate-600
                                           dark:hover:border-gold/50 hover:border-amber-300"
                                title="Salin nomor WhatsApp dari pendaftaran awal"
                            >
                                <i className="fa-solid fa-copy shrink-0" />
                                <span>No. pre-registration sama? Klik untuk copy</span>
                            </button>
                        )}
                    </div>
                </Field>
            </div>

            {/* ── Pekerjaan & Ekonomi ──────────────────────────────────── */}
            <SectionTitle>Pekerjaan &amp; Ekonomi</SectionTitle>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Pekerjaan (sesuai KTP)" required={required} error={err('job_ktp')}>
                    <input
                        type="text"
                        className={inputCls(!!err('job_ktp'))}
                        value={(get('job_ktp') as string) ?? ''}
                        onChange={e => set('job_ktp', e.target.value)}
                        placeholder="cth: Petani, Wiraswasta, PNS"
                        maxLength={100}
                    />
                </Field>

                <Field label="Pekerjaan Aktual" required={required} hint="Isi jika berbeda dengan KTP" error={err('job_actual')}>
                    <input
                        type="text"
                        className={inputCls(!!err('job_actual'))}
                        value={(get('job_actual') as string) ?? ''}
                        onChange={e => set('job_actual', e.target.value)}
                        placeholder="cth: Freelance, pedagang online"
                        maxLength={100}
                    />
                </Field>

                {showIncome && (
                    <Field
                        label={incomeLabel}
                        required={required}
                        error={err('income_range')}
                    >
                        <Select
                            options={INCOME_OPTIONS}
                            placeholder="Pilih rentang penghasilan..."
                            value={INCOME_OPTIONS.find(o => o.value === get('income_range')) ?? null}
                            onChange={opt => set('income_range', opt?.value ?? null)}
                            isClearable
                            {...portalProps(!!err('income_range'))}
                        />
                    </Field>
                )}

                {!showIncome && prefix === 'father' && data.income_type === 'combined' && (
                    <div className="sm:col-span-2 rounded-lg border
                                    dark:border-content-border border-black/[0.07]
                                    dark:bg-content-muted bg-slate-50 px-4 py-3">
                        <p className="text-sm dark:text-slate-400 text-slate-500">
                            <i className="fa-solid fa-circle-info mr-2 text-gold" />
                            Penghasilan keluarga dicatat sebagai gabungan di Tab Ibu.
                        </p>
                    </div>
                )}
            </div>

            {/* ── Alamat ───────────────────────────────────────────────── */}
            {showAddress && (
                <>
                    <SectionTitle>Alamat Tinggal</SectionTitle>
                    <AddressForm
                        prefix={prefix}
                        data={data}
                        errors={errors}
                        onChange={onChange}
                        candidateAddr={candidateAddr}
                        required={required}
                    />
                </>
            )}

            {!showAddress && prefix === 'father' && data.alamat_shared && (
                <div className="rounded-lg border dark:border-content-border border-black/[0.07]
                                dark:bg-content-muted bg-slate-50 px-4 py-3">
                    <p className="text-sm dark:text-slate-400 text-slate-500">
                        <i className="fa-solid fa-house mr-2 text-gold" />
                        Alamat Ayah sama dengan Ibu. Ubah di Tab Ibu atau aktifkan "Alamat Ayah &amp; Ibu Berbeda".
                    </p>
                </div>
            )}
        </div>
    )
}

// ─── StatusRow ────────────────────────────────────────────────────────────────

function StatusRow({ prefix, label, get, set, err }: {
    prefix: PersonPrefix
    label:  string
    get:    (f: string) => unknown
    set:    (f: string, v: unknown) => void
    err:    (f: string) => string | undefined
}) {
    return (
        <Field label={`Status ${label}`} error={err('status')}>
            <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map(opt => (
                    <button
                        key={opt.value}
                        type="button"
                        onClick={() => set('status', opt.value)}
                        className={[
                            'flex items-center gap-2 rounded-lg border px-4 py-2.5',
                            'text-sm font-medium transition-all duration-200 min-h-[44px]',
                            get('status') === opt.value
                                ? 'border-violet-500 bg-violet-500/10 text-violet-500 dark:text-violet-400 font-semibold'
                                : 'dark:border-content-border border-black/[0.10] dark:bg-content-card bg-slate-50 dark:text-slate-400 text-slate-500 dark:hover:border-violet-500/50 hover:border-violet-300 dark:hover:text-slate-300 hover:text-slate-700',
                        ].join(' ')}
                    >
                        <i className={[
                            'fa-solid text-xs',
                            opt.value === 'hidup'     ? 'fa-heart text-emerald-400' :
                            opt.value === 'meninggal' ? 'fa-circle-minus text-slate-400'   :
                                                        'fa-question text-slate-400',
                        ].join(' ')} />
                        {opt.label}
                    </button>
                ))}
            </div>
        </Field>
    )
}

type PersonPrefix2 = PersonPrefix
export type { PersonPrefix2 as PersonPrefix }
