// resources/js/Components/Dashboard/Staff/Show/TabWali.tsx

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type Guardian = {
    father_name:    string | null;
    father_phone:   string | null;
    mother_name:    string | null;
    mother_phone:   string | null;
    guardian_name:  string | null;
    guardian_phone: string | null;
    no_kk:          string | null;
} | null;

type Props = {
    guardian: Guardian;
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

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function TabWali({ guardian }: Props) {
    if (!guardian) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5
                                flex items-center justify-center mb-3">
                    <i className="fa-solid fa-people-roof text-slate-400 text-lg" />
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    Data wali belum tersedia
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Ayah */}
            <div>
                <p className="text-xs font-semibold uppercase tracking-widest
                              text-slate-400 dark:text-slate-500 mb-3">
                    Data Ayah
                </p>
                <div className="grid grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-4">
                    <InfoField label="Nama Ayah"   value={guardian.father_name} />
                    <InfoField label="No. Telepon" value={guardian.father_phone} />
                </div>
            </div>

            <div className="border-t border-slate-100 dark:border-white/5" />

            {/* Ibu */}
            <div>
                <p className="text-xs font-semibold uppercase tracking-widest
                              text-slate-400 dark:text-slate-500 mb-3">
                    Data Ibu
                </p>
                <div className="grid grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-4">
                    <InfoField label="Nama Ibu"    value={guardian.mother_name} />
                    <InfoField label="No. Telepon" value={guardian.mother_phone} />
                </div>
            </div>

            {/* Wali (optional) */}
            {(guardian.guardian_name || guardian.guardian_phone) && (
                <>
                    <div className="border-t border-slate-100 dark:border-white/5" />
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-widest
                                      text-slate-400 dark:text-slate-500 mb-3">
                            Data Wali
                        </p>
                        <div className="grid grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-4">
                            <InfoField label="Nama Wali"  value={guardian.guardian_name} />
                            <InfoField label="No. Telepon" value={guardian.guardian_phone} />
                        </div>
                    </div>
                </>
            )}

            <div className="border-t border-slate-100 dark:border-white/5" />

            <InfoField label="Nomor Kartu Keluarga" value={guardian.no_kk} />
        </div>
    );
}
