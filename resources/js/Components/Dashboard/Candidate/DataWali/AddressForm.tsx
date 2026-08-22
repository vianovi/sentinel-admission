// resources/js/Components/Dashboard/Candidate/DataWali/AddressForm.tsx

import Field from '@/Components/UI/Field'
import { GuardianData, CandidateAddress } from './types'

interface Props {
    prefix:        'father' | 'mother' | 'guardian'
    data:          GuardianData
    errors:        Partial<Record<string, string>>
    onChange:      (field: string, value: unknown) => void
    candidateAddr: CandidateAddress
    required?:     boolean
}

// inputCls — adaptive dark/light, konsisten dengan PersonForm & TabProfilKeluarga
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

export default function AddressForm({ prefix, data, errors, onChange, candidateAddr, required = false }: Props) {
    const get = (field: string) => (data as Record<string, unknown>)[`${prefix}_${field}`]
    const set = (field: string, val: unknown) => onChange(`${prefix}_${field}`, val)
    const err = (field: string) => errors[`${prefix}_${field}`]

    const hasAnyAddress = candidateAddr.province || candidateAddr.city || candidateAddr.address

    const copyFromCandidate = () => {
        onChange(`${prefix}_province`,    candidateAddr.province)
        onChange(`${prefix}_city`,        candidateAddr.city)
        onChange(`${prefix}_district`,    candidateAddr.district)
        onChange(`${prefix}_village`,     candidateAddr.village)
        onChange(`${prefix}_address`,     candidateAddr.address)
        onChange(`${prefix}_postal_code`, candidateAddr.postal_code)
    }

    return (
        <div className="space-y-4">
            {/* Tombol salin alamat kandidat */}
            {hasAnyAddress && (
                <button
                    type="button"
                    onClick={copyFromCandidate}
                    className="flex items-center gap-2 rounded-lg border border-gold/40 bg-gold/5
                               px-3 py-2.5 text-xs font-medium text-gold
                               transition-all duration-200 hover:bg-gold/10 hover:border-gold/60
                               min-h-[44px]"
                >
                    <i className="fa-solid fa-copy text-xs" />
                    Salin alamat dari data kandidat ({candidateAddr.full_name})
                </button>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Provinsi" required={required} error={err('province')}>
                    <input
                        type="text"
                        className={inputCls(!!err('province'))}
                        value={(get('province') as string) ?? ''}
                        onChange={e => set('province', e.target.value)}
                        placeholder="cth: Jawa Tengah"
                        maxLength={100}
                    />
                </Field>

                <Field label="Kota / Kabupaten" required={required} error={err('city')}>
                    <input
                        type="text"
                        className={inputCls(!!err('city'))}
                        value={(get('city') as string) ?? ''}
                        onChange={e => set('city', e.target.value)}
                        placeholder="cth: Kota Semarang"
                        maxLength={100}
                    />
                </Field>

                <Field label="Kecamatan" required={required} error={err('district')}>
                    <input
                        type="text"
                        className={inputCls(!!err('district'))}
                        value={(get('district') as string) ?? ''}
                        onChange={e => set('district', e.target.value)}
                        placeholder="cth: Banyumanik"
                        maxLength={100}
                    />
                </Field>

                <Field label="Kelurahan / Desa" required={required} error={err('village')}>
                    <input
                        type="text"
                        className={inputCls(!!err('village'))}
                        value={(get('village') as string) ?? ''}
                        onChange={e => set('village', e.target.value)}
                        placeholder="cth: Pudakpayung"
                        maxLength={100}
                    />
                </Field>

                <Field label="Kode Pos" required={required} error={err('postal_code')}>
                    <input
                        type="text"
                        className={inputCls(!!err('postal_code'))}
                        value={(get('postal_code') as string) ?? ''}
                        onChange={e => set('postal_code', e.target.value.replace(/\D/g, '').slice(0, 5))}
                        placeholder="5 digit kode pos"
                        maxLength={5}
                    />
                </Field>
            </div>

            <Field label="Alamat Lengkap" required={required} error={err('address')}>
                <textarea
                    className={`${inputCls(!!err('address'))} min-h-[80px] resize-none`}
                    value={(get('address') as string) ?? ''}
                    onChange={e => set('address', e.target.value)}
                    placeholder="Jalan, nomor rumah, RT/RW, dsb."
                    rows={3}
                    maxLength={500}
                />
            </Field>
        </div>
    )
}
