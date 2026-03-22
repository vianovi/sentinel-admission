// resources/js/Components/Dashboard/Candidate/DataWali/TabWali.tsx

import PersonForm from './PersonForm'
import { GuardianData, CandidateAddress } from './types'

interface Props {
    data:          GuardianData
    errors:        Partial<Record<string, string>>
    onChange:      (field: string, value: unknown) => void
    candidateAddr: CandidateAddress
}

export default function TabWali({ data, errors, onChange, candidateAddr }: Props) {
    const hasAnyData = !!(data.guardian_name || data.guardian_phone || data.guardian_relation)

    return (
        <div className="space-y-6">
            {/* Info banner */}
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
                <div className="flex items-start gap-3">
                    <i className="fa-solid fa-shield-halved mt-0.5 text-amber-400" />
                    <div>
                        <p className="text-sm font-medium text-amber-300">Data Wali (Opsional)</p>
                        <p className="mt-1 text-xs text-amber-400/70">
                            Wali dapat berupa siapapun yang bertanggung jawab atas anak —
                            nenek, paman, bibi, atau orang tua asuh. Pengisian ini tidak wajib,
                            namun sangat disarankan terutama jika anak tinggal terpisah dari orang tua.
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
                isOptional={true}
                showRelation={true}
            />
        </div>
    )
}
