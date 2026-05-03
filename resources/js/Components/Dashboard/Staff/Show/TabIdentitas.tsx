// resources/js/Components/Dashboard/Staff/Show/TabIdentitas.tsx

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type Candidate = {
    full_name:      string;
    candidate_code: string;
    email:          string | null;
    nisn:           string | null;
    nik:            string | null;
    gender_label:   string | null;
    place_of_birth: string | null;
    date_of_birth:  string | null;
    school_origin:  string | null;
    program_choice: string | null;
    admission_wave: string | null;
};

type Props = {
    candidate: Candidate;
};

// ─────────────────────────────────────────────────────────────────────────────
// INFO FIELD
// ─────────────────────────────────────────────────────────────────────────────

function InfoField({ label, value }: { label: string; value?: string | null }) {
    return (
        <div className="flex flex-col gap-1">
            <p className="text-[10px] uppercase tracking-widest font-semibold
                          text-slate-400 dark:text-slate-500">
                {label}
            </p>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {value ?? "—"}
            </p>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function TabIdentitas({ candidate }: Props) {
    const ttl = [candidate.place_of_birth, candidate.date_of_birth]
        .filter(Boolean)
        .join(" / ") || null;

    return (
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-5">
            <InfoField label="Nama Lengkap"     value={candidate.full_name} />
            <InfoField label="Kode Kandidat"    value={candidate.candidate_code} />
            <InfoField label="Email"            value={candidate.email} />
            <InfoField label="NISN"             value={candidate.nisn} />
            <InfoField label="NIK"              value={candidate.nik} />
            <InfoField label="Jenis Kelamin"    value={candidate.gender_label} />
            <InfoField label="Tempat / Tgl Lahir" value={ttl} />
            <InfoField label="Asal Sekolah"     value={candidate.school_origin} />
            <InfoField label="Program Pilihan"  value={candidate.program_choice} />
            <InfoField label="Gelombang"        value={candidate.admission_wave} />
        </div>
    );
}
