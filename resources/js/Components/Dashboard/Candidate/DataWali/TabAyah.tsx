// resources/js/Components/Dashboard/Candidate/DataWali/TabAyah.tsx

import PersonForm from './PersonForm'
import { GuardianData, CandidateAddress } from './types'

interface Props {
    data:          GuardianData
    errors:        Partial<Record<string, string>>
    onChange:      (field: string, value: unknown) => void
    candidateAddr: CandidateAddress
}

export default function TabAyah({ data, errors, onChange, candidateAddr }: Props) {
    return (
        <div className="space-y-6">
            {/* ── Toggle Penghasilan Gabungan ─────────────────────────── */}
            <div className="flex items-center justify-between rounded-xl border border-content-border bg-content-card px-4 py-3">
                <div>
                    <p className="text-sm font-medium text-slate-200">Penghasilan Gabungan Keluarga</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Aktifkan jika Ayah & Ibu bekerja bersama (cth: pedagang keluarga)
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => onChange('income_type', data.income_type === 'combined' ? 'separate' : 'combined')}
                    className={[
                        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none',
                        data.income_type === 'combined' ? 'bg-gold' : 'bg-slate-700',
                    ].join(' ')}
                >
                    <span className={[
                        'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-300',
                        data.income_type === 'combined' ? 'translate-x-6' : 'translate-x-1',
                    ].join(' ')} />
                </button>
            </div>

            {/* ── Toggle Alamat Berbeda ───────────────────────────────── */}
            <div className="flex items-center justify-between rounded-xl border border-content-border bg-content-card px-4 py-3">
                <div>
                    <p className="text-sm font-medium text-slate-200">Alamat Ayah & Ibu Berbeda</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Aktifkan jika Ayah & Ibu tinggal di tempat yang berbeda
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => onChange('alamat_shared', !data.alamat_shared)}
                    className={[
                        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none',
                        !data.alamat_shared ? 'bg-gold' : 'bg-slate-700',
                    ].join(' ')}
                >
                    <span className={[
                        'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-300',
                        !data.alamat_shared ? 'translate-x-6' : 'translate-x-1',
                    ].join(' ')} />
                </button>
            </div>

            {/* ── Form Ayah ──────────────────────────────────────────── */}
            <PersonForm
                prefix="father"
                label="Ayah"
                data={data}
                errors={errors}
                onChange={onChange}
                candidateAddr={candidateAddr}
                showIncome={true}
                showAddress={true}
            />
        </div>
    )
}
