// resources/js/Components/Dashboard/Candidate/DataWali/TabIbu.tsx

import PersonForm from './PersonForm'
import { GuardianData, CandidateAddress } from './types'

interface Props {
    data:          GuardianData
    errors:        Partial<Record<string, string>>
    onChange:      (field: string, value: unknown) => void
    candidateAddr: CandidateAddress
}

export default function TabIbu({ data, errors, onChange, candidateAddr }: Props) {
    return (
        <PersonForm
            prefix="mother"
            label="Ibu"
            data={data}
            errors={errors}
            onChange={onChange}
            candidateAddr={candidateAddr}
            showIncome={data.income_type === 'separate'}
            showAddress={!data.alamat_shared}
        />
    )
}
