// resources/js/Components/Dashboard/Candidate/DataWali/PersonForm.tsx

import { useRef } from 'react'
import { animate } from 'animejs'
import Select from 'react-select'
import { selectStyles } from '@/Components/UI/selectStyles'
import Field from '@/Components/UI/Field'
import AddressForm from './AddressForm'
import {
    GuardianData, CandidateAddress,
    EDUCATION_OPTIONS, INCOME_OPTIONS, STATUS_OPTIONS,
} from './types'

type PersonPrefix = 'father' | 'mother' | 'guardian'

interface Props {
    prefix:        PersonPrefix
    label:         string   // "Ayah" | "Ibu" | "Wali"
    data:          GuardianData
    errors:        Partial<Record<string, string>>
    onChange:      (field: string, value: unknown) => void
    candidateAddr: CandidateAddress
    showIncome:    boolean  // false jika combined + bukan ayah
    showAddress:   boolean  // false jika shared + bukan ayah/wali
    isOptional?:   boolean  // true untuk wali
    showRelation?: boolean  // true untuk wali
}

export default function PersonForm({
    prefix, label, data, errors, onChange,
    candidateAddr, showIncome, showAddress,
    isOptional = false, showRelation = false,
}: Props) {

    const formRef = useRef<HTMLDivElement>(null)

    const get = (field: string) => (data as Record<string, unknown>)[`${prefix}_${field}`]
    const set = (field: string, val: unknown) => onChange(`${prefix}_${field}`, val)
    const err = (field: string) => errors[`${prefix}_${field}`]

    const statusValue = get('status') as string
    const isAbsent    = statusValue === 'meninggal' || statusValue === 'tidak_diketahui'

    // Shake animasi untuk field error
    const shakeError = (selector: string) => {
        animate(selector, { translateX: [0, -6, 6, -4, 4, 0], duration: 380, ease: 'outExpo' })
    }

    // Kalau absent, collapse semua field kecuali status
    if (isAbsent && prefix !== 'mother') {
        return (
            <div ref={formRef} className="space-y-5">
                <StatusRow prefix={prefix} label={label} get={get} set={set} err={err} />
                <div className="rounded-xl border border-content-border bg-content-muted p-4 text-center">
                    <p className="text-sm text-slate-400">
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
                <p className="text-xs text-slate-500 -mt-2">
                    * Data Wali bersifat opsional, namun sangat disarankan untuk diisi.
                </p>
            )}

            {/* ── Identitas Dasar ──────────────────────────────────────── */}
            <SectionTitle>Identitas</SectionTitle>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field
                    label={`Nama Lengkap ${label}`}
                    required={prefix === 'mother'}
                    error={err('name')}
                >
                    <input
                        type="text"
                        className={inputClass(!!err('name'))}
                        value={(get('name') as string) ?? ''}
                        onChange={e => set('name', e.target.value)}
                        placeholder={`Nama lengkap ${label.toLowerCase()}`}
                    />
                </Field>

                {showRelation && (
                    <Field label="Hubungan dengan Anak" error={err('relation')}>
                        <input
                            type="text"
                            className={inputClass(!!err('relation'))}
                            value={(get('relation') as string) ?? ''}
                            onChange={e => set('relation', e.target.value)}
                            placeholder="cth: Nenek, Paman, Bibi"
                        />
                    </Field>
                )}

                <Field label="NIK" error={err('nik')}>
                    <input
                        type="text"
                        className={inputClass(!!err('nik'))}
                        value={(get('nik') as string) ?? ''}
                        onChange={e => set('nik', e.target.value.replace(/\D/g, '').slice(0, 16))}
                        placeholder="16 digit NIK"
                        maxLength={16}
                    />
                </Field>

                <Field label="Tempat Lahir" error={err('place_of_birth')}>
                    <input
                        type="text"
                        className={inputClass(!!err('place_of_birth'))}
                        value={(get('place_of_birth') as string) ?? ''}
                        onChange={e => set('place_of_birth', e.target.value)}
                        placeholder="Kota tempat lahir"
                    />
                </Field>

                <Field label="Tanggal Lahir" error={err('date_of_birth')}>
                    <input
                        type="date"
                        className={inputClass(!!err('date_of_birth'))}
                        value={(get('date_of_birth') as string) ?? ''}
                        onChange={e => set('date_of_birth', e.target.value)}
                    />
                </Field>

                <Field label="Pendidikan Terakhir" error={err('education')}>
                    <Select
                        options={EDUCATION_OPTIONS}
                        styles={selectStyles}
                        placeholder="Pilih pendidikan..."
                        value={EDUCATION_OPTIONS.find(o => o.value === get('education')) ?? null}
                        onChange={opt => set('education', opt?.value ?? null)}
                        isClearable
                    />
                </Field>
            </div>

            {/* ── Kontak ───────────────────────────────────────────────── */}
            <SectionTitle>Kontak</SectionTitle>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Nomor WhatsApp / HP" error={err('phone')}>
                    <input
                        type="tel"
                        className={inputClass(!!err('phone'))}
                        value={(get('phone') as string) ?? ''}
                        onChange={e => set('phone', e.target.value)}
                        placeholder="08xxxxxxxxxx"
                    />
                </Field>
            </div>

            {/* ── Pekerjaan & Ekonomi ──────────────────────────────────── */}
            <SectionTitle>Pekerjaan & Ekonomi</SectionTitle>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Pekerjaan (sesuai KTP)" error={err('job_ktp')}>
                    <input
                        type="text"
                        className={inputClass(!!err('job_ktp'))}
                        value={(get('job_ktp') as string) ?? ''}
                        onChange={e => set('job_ktp', e.target.value)}
                        placeholder="cth: Petani, Wiraswasta, PNS"
                    />
                </Field>

                <Field
                    label="Pekerjaan Aktual"
                    hint="Isi jika berbeda dengan KTP"
                    error={err('job_actual')}
                >
                    <input
                        type="text"
                        className={inputClass(!!err('job_actual'))}
                        value={(get('job_actual') as string) ?? ''}
                        onChange={e => set('job_actual', e.target.value)}
                        placeholder="cth: Freelance desainer, pedagang online"
                    />
                </Field>

                {showIncome && (
                    <Field
                        label={`Penghasilan ${prefix === 'father' && data.income_type === 'combined' ? '(Gabungan Keluarga)' : label}`}
                        error={err('income_range')}
                    >
                        <Select
                            options={INCOME_OPTIONS}
                            styles={selectStyles}
                            placeholder="Pilih rentang penghasilan..."
                            value={INCOME_OPTIONS.find(o => o.value === get('income_range')) ?? null}
                            onChange={opt => set('income_range', opt?.value ?? null)}
                            isClearable
                        />
                    </Field>
                )}

                {!showIncome && prefix === 'mother' && data.income_type === 'combined' && (
                    <div className="sm:col-span-2 rounded-lg border border-content-border bg-content-muted px-4 py-3">
                        <p className="text-sm text-slate-400">
                            <i className="fa-solid fa-circle-info mr-2 text-gold" />
                            Penghasilan digabung dengan Ayah. Lihat pengaturan di Tab Ayah.
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
                    />
                </>
            )}

            {!showAddress && prefix === 'mother' && data.alamat_shared && (
                <div className="rounded-lg border border-content-border bg-content-muted px-4 py-3">
                    <p className="text-sm text-slate-400">
                        <i className="fa-solid fa-house mr-2 text-gold" />
                        Alamat sama dengan Ayah. Ubah di Tab Ayah atau aktifkan "Alamat Berbeda".
                    </p>
                </div>
            )}

        </div>
    )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusRow({ prefix, label, get, set, err }: {
    prefix: PersonPrefix
    label: string
    get: (f: string) => unknown
    set: (f: string, v: unknown) => void
    err: (f: string) => string | undefined
}) {
    return (
        <Field label={`Status ${label}`} error={err('status')}>
            <div className="flex flex-wrap gap-3">
                {STATUS_OPTIONS.map(opt => (
                    <button
                        key={opt.value}
                        type="button"
                        onClick={() => set('status', opt.value)}
                        className={[
                            'flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all duration-200',
                            get('status') === opt.value
                                ? 'border-gold bg-gold/10 text-gold'
                                : 'border-content-border bg-content-card text-slate-400 hover:border-gold/50 hover:text-slate-300',
                        ].join(' ')}
                    >
                        <i className={[
                            'fa-solid text-xs',
                            opt.value === 'hidup'           ? 'fa-heart text-emerald-400' :
                            opt.value === 'meninggal'       ? 'fa-cross text-slate-500' :
                                                              'fa-question text-slate-500',
                        ].join(' ')} />
                        {opt.label}
                    </button>
                ))}
            </div>
        </Field>
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

function inputClass(hasError: boolean) {
    return [
        'w-full rounded-lg border bg-content-card px-4 py-2.5 text-sm text-slate-200',
        'placeholder:text-slate-600 transition-colors duration-200',
        'focus:outline-none focus:ring-2 focus:ring-gold/40',
        hasError
            ? 'border-red-500/60 focus:border-red-500'
            : 'border-content-border focus:border-gold/60',
    ].join(' ')
}

type PersonPrefix2 = PersonPrefix  // re-export alias
export type { PersonPrefix2 as PersonPrefix }
