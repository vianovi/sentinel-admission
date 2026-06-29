// resources/js/Components/Dashboard/Candidate/DataWali/TabWali.tsx

import PersonForm from './PersonForm'
import { GuardianData, CandidateAddress } from './types'

interface Props {
    data:          GuardianData
    errors:        Partial<Record<string, string>>
    onChange:      (field: string, value: unknown) => void
    candidateAddr: CandidateAddress
    guardianRequired: boolean
}

export default function TabWali({ data, errors, onChange, candidateAddr, guardianRequired }: Props) {
    return (
        <div className="space-y-6">

            {/* Info banner */}
            <div className="rounded-xl border dark:border-amber-500/20 border-amber-200
                            dark:bg-amber-500/5 bg-amber-50 px-4 py-3">
                <div className="flex items-start gap-3">
                    <i className="fa-solid fa-shield-halved mt-0.5 text-amber-400 shrink-0" />
                    <div>
                        <p className="text-sm font-medium dark:text-amber-300 text-amber-700">
                            Data Wali {guardianRequired ? '(Wajib)' : '(Opsional)'}
                        </p>
                        <p className="mt-1 text-xs dark:text-amber-400/70 text-amber-600/80">
                            {guardianRequired
                                ? 'Karena status pernikahan orang tua bukan Nikah Tercatat, data wali dan alamat wali wajib diisi.'
                                : 'Wali dapat berupa siapapun yang bertanggung jawab atas anak — nenek, paman, bibi, atau orang tua asuh. Pengisian ini tidak wajib, namun sangat disarankan terutama jika anak tinggal terpisah dari orang tua.'
                            }
                        </p>
                    </div>
                </div>
            </div>

            <PersonForm
                prefix="guardian"
                label="Wali"
                data={data}
                errors={errors}
                onChange={onChange}
                candidateAddr={candidateAddr}
                showIncome={true}
                showAddress={true}
                isOptional={!guardianRequired}
                forceRequired={guardianRequired}
                showRelation={true}
            />
        </div>
    )
}
