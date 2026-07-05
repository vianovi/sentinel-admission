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
            <PersonForm
                prefix="father"
                label="Ayah"
                data={data}
                errors={errors}
                onChange={onChange}
                candidateAddr={candidateAddr}
                showIncome={data.income_type === 'separate'}
                showAddress={!data.alamat_shared}
                forceRequired={data.father_status === 'hidup'}
            />
        </div>
    )
}
