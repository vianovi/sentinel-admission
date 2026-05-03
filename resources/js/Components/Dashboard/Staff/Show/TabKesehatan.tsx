// resources/js/Components/Dashboard/Staff/Show/TabKesehatan.tsx

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type HealthRecord = {
    blood_type:               string | null;
    rhesus:                   string | null;
    height_cm:                number | null;
    weight_kg:                number | null;
    general_health_condition: string | null;
} | null;

type Props = {
    healthRecord: HealthRecord;
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
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

function getBmiCategory(bmi: number): { label: string; color: string } {
    if (bmi < 18.5) return { label: "Kurus",         color: "text-blue-500" };
    if (bmi < 25)   return { label: "Normal",         color: "text-emerald-500" };
    if (bmi < 30)   return { label: "Kelebihan berat", color: "text-amber-500" };
    return             { label: "Obesitas",           color: "text-red-500" };
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function TabKesehatan({ healthRecord }: Props) {
    if (!healthRecord) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5
                                flex items-center justify-center mb-3">
                    <i className="fa-solid fa-heart-pulse text-slate-400 text-lg" />
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    Data kesehatan belum tersedia
                </p>
            </div>
        );
    }

    // Compute BMI
    const bmi = (healthRecord.height_cm && healthRecord.weight_kg)
        ? (healthRecord.weight_kg / Math.pow(healthRecord.height_cm / 100, 2))
        : null;

    const bmiCategory = bmi ? getBmiCategory(bmi) : null;

    return (
        <div className="space-y-6">
            {/* Darah */}
            <div>
                <p className="text-xs font-semibold uppercase tracking-widest
                              text-slate-400 dark:text-slate-500 mb-3">
                    Data Darah
                </p>
                <div className="grid grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-4">
                    <InfoField label="Golongan Darah" value={healthRecord.blood_type} />
                    <InfoField label="Rhesus"         value={healthRecord.rhesus} />
                </div>
            </div>

            <div className="border-t border-slate-100 dark:border-white/5" />

            {/* Fisik */}
            <div>
                <p className="text-xs font-semibold uppercase tracking-widest
                              text-slate-400 dark:text-slate-500 mb-3">
                    Data Fisik
                </p>
                <div className="grid grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-4">
                    <InfoField
                        label="Tinggi Badan"
                        value={healthRecord.height_cm ? `${healthRecord.height_cm} cm` : null}
                    />
                    <InfoField
                        label="Berat Badan"
                        value={healthRecord.weight_kg ? `${healthRecord.weight_kg} kg` : null}
                    />
                    {bmi && bmiCategory && (
                        <div className="flex flex-col gap-1">
                            <p className="text-[10px] uppercase tracking-widest font-semibold
                                          text-slate-400 dark:text-slate-500">
                                BMI
                            </p>
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                {bmi.toFixed(1)}{" "}
                                <span className={`text-xs font-semibold ${bmiCategory.color}`}>
                                    ({bmiCategory.label})
                                </span>
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <div className="border-t border-slate-100 dark:border-white/5" />

            {/* Kondisi umum */}
            <div>
                <p className="text-xs font-semibold uppercase tracking-widest
                              text-slate-400 dark:text-slate-500 mb-3">
                    Kondisi Umum
                </p>
                <InfoField
                    label="Kondisi Kesehatan Umum"
                    value={healthRecord.general_health_condition}
                />
            </div>
        </div>
    );
}
