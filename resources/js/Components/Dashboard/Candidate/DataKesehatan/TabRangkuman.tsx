// resources/js/Components/Dashboard/Candidate/DataKesehatan/TabRangkuman.tsx

import { useEffect }   from "react";
import { animate, stagger } from "animejs";
import { HealthRecord } from "@/Pages/Dashboard/Candidate/DataKesehatan";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type FormState = {
    bloodType: string; rhesus: string;
    heightCm: string;  weightKg: string;
    generalHealth: string; mentalNotes: string;
    eyeRightType: string;  eyeRightValue: string;
    eyeLeftType: string;   eyeLeftValue: string;
    eyeSince: string;
    majorIllnesses: string;  lastIllness: string;
    allergyFood: string;     allergyMedicine: string;
    allergyCondition: string; physicalDisab: string;
    specialNotes: string;    parentConcern: string;
};

type Props = {
    healthRecord: HealthRecord | null;
    bmi:          number | null;
    bmiCategory:  string | null;
    formState:    FormState;
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const bloodTypeLabel = (v: string) => {
    const map: Record<string, string> = {
        A: "A", B: "B", AB: "AB", O: "O", unknown: "Belum pernah tes",
    };
    return map[v] ?? "—";
};

const rhesusLabel = (v: string) => {
    const map: Record<string, string> = {
        positive: "Positif (+)", negative: "Negatif (−)", unknown: "Belum pernah tes",
    };
    return map[v] ?? "—";
};

const eyeLabel = (type: string, value: string) => {
    if (!type) return "—";
    if (type === "normal")  return "Normal";
    if (type === "unknown") return "Tidak diketahui";
    const v = value ? ` (${value})` : "";
    const map: Record<string, string> = {
        minus: "Minus", plus: "Plus", silinder: "Silinder",
    };
    return (map[type] ?? type) + v;
};

const bmiColor = (bmi: number | null) => {
    if (!bmi) return "dark:text-slate-400 text-slate-500";
    if (bmi < 18.5) return "dark:text-blue-400 text-blue-600";
    if (bmi < 25)   return "dark:text-emerald-400 text-emerald-600";
    if (bmi < 30)   return "dark:text-amber-400 text-amber-600";
    return "dark:text-red-400 text-red-600";
};

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENT: Section card
// ─────────────────────────────────────────────────────────────────────────────

function SummarySection({ icon, title, children }: {
    icon: string; title: string; children: React.ReactNode;
}) {
    return (
        <div className="rangkuman-card opacity-0 rounded-xl border
                         dark:bg-white/[0.02] bg-slate-50
                         dark:border-white/[0.06] border-black/[0.06]
                         overflow-hidden">
            <div className="flex items-center gap-2.5 px-4 py-3
                            dark:border-b dark:border-white/[0.05] border-b border-black/[0.05]">
                <i className={`${icon} text-emerald-400 text-xs`}></i>
                <p className="text-xs font-bold dark:text-slate-300 text-slate-700 uppercase tracking-wider">
                    {title}
                </p>
            </div>
            <div className="p-4">
                {children}
            </div>
        </div>
    );
}

function SummaryRow({ label, value, mono = false }: {
    label: string; value: string | null | undefined; mono?: boolean;
}) {
    return (
        <div className="flex items-start justify-between gap-4 py-1.5
                        border-b dark:border-white/[0.04] border-black/[0.04] last:border-0">
            <p className="text-[11px] dark:text-slate-500 text-slate-400 shrink-0 mt-0.5">
                {label}
            </p>
            <p className={`text-[12px] font-medium dark:text-slate-200 text-slate-700
                          text-right ${mono ? "font-mono" : ""}`}>
                {value || "—"}
            </p>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function TabRangkuman({ healthRecord, bmi, bmiCategory, formState }: Props) {
    const {
        bloodType, rhesus, heightCm, weightKg,
        generalHealth, mentalNotes,
        eyeRightType, eyeRightValue, eyeLeftType, eyeLeftValue, eyeSince,
        majorIllnesses, lastIllness,
        allergyFood, allergyMedicine, allergyCondition, physicalDisab,
        specialNotes, parentConcern,
    } = formState;

    useEffect(() => {
        animate(".rangkuman-card", {
            opacity:    [0, 1],
            translateY: [12, 0],
            duration:   450,
            delay:      stagger(80),
            ease:       "outExpo",
        });
    }, []);

    const isEmpty = !healthRecord && !bloodType && !heightCm;

    if (isEmpty) {
        return (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="w-16 h-16 rounded-2xl dark:bg-emerald-500/10 bg-emerald-50
                                border dark:border-emerald-500/20 border-emerald-200
                                flex items-center justify-center">
                    <i className="fa-solid fa-heart-pulse text-2xl dark:text-emerald-400 text-emerald-500"></i>
                </div>
                <div className="text-center">
                    <p className="text-sm font-semibold dark:text-slate-300 text-slate-600 mb-1">
                        Data kesehatan belum diisi
                    </p>
                    <p className="text-xs dark:text-slate-500 text-slate-400 max-w-xs">
                        Mulai dari tab <strong className="dark:text-emerald-400 text-emerald-600">Fisik</strong> untuk mengisi data kesehatan kamu
                    </p>
                </div>
            </div>
        );
    }

    const eyeNeedsValue = (type: string) =>
        ["minus", "plus", "silinder"].includes(type);
    const eyeConditionFilled = eyeRightType && eyeRightType !== "normal" && eyeRightType !== "unknown"
        || eyeLeftType && eyeLeftType !== "normal" && eyeLeftType !== "unknown";

    return (
        <div className="flex flex-col gap-4">

            {/* ── Data Fisik ─────────────────────────────────────────────── */}
            <SummarySection icon="fa-solid fa-heart-pulse" title="Data Fisik">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6">
                    <SummaryRow label="Golongan Darah" value={bloodTypeLabel(bloodType)} />
                    <SummaryRow label="Rhesus"         value={rhesusLabel(rhesus)} />
                    <SummaryRow label="Tinggi Badan"   value={heightCm ? `${heightCm} cm` : null} />
                    <SummaryRow label="Berat Badan"    value={weightKg ? `${weightKg} kg` : null} />
                    <div className="flex items-start justify-between gap-4 py-1.5
                                    border-b dark:border-white/[0.04] border-black/[0.04] last:border-0 col-span-1">
                        <p className="text-[11px] dark:text-slate-500 text-slate-400 shrink-0 mt-0.5">BMI</p>
                        <p className={`text-[12px] font-bold text-right ${bmiColor(bmi)}`}>
                            {bmi ? `${bmi} — ${bmiCategory}` : "—"}
                        </p>
                    </div>
                </div>

                <div className="mt-3 pt-3 border-t dark:border-white/[0.05] border-black/[0.05] flex flex-col gap-2">
                    <SummaryRow label="Kondisi Kesehatan Umum" value={generalHealth} />
                    {mentalNotes && <SummaryRow label="Catatan Mental" value={mentalNotes} />}
                </div>
            </SummarySection>

            {/* ── Kondisi Mata ───────────────────────────────────────────── */}
            <SummarySection icon="fa-solid fa-eye" title="Kondisi Mata">
                <div className="grid grid-cols-2 gap-x-6">
                    <SummaryRow label="Mata Kanan"
                        value={eyeLabel(eyeRightType, eyeNeedsValue(eyeRightType) ? eyeRightValue : "")} />
                    <SummaryRow label="Mata Kiri"
                        value={eyeLabel(eyeLeftType, eyeNeedsValue(eyeLeftType) ? eyeLeftValue : "")} />
                    {eyeConditionFilled && eyeSince && (
                        <SummaryRow label="Sejak Tahun" value={eyeSince} />
                    )}
                </div>
            </SummarySection>

            {/* ── Riwayat Kesehatan ─────────────────────────────────────── */}
            <SummarySection icon="fa-solid fa-clock-rotate-left" title="Riwayat Kesehatan">
                <div className="flex flex-col">
                    <SummaryRow label="Penyakit Berat"    value={majorIllnesses} />
                    <SummaryRow label="Sakit Terakhir"    value={lastIllness} />
                    <SummaryRow label="Alergi Makanan"    value={allergyFood} />
                    <SummaryRow label="Alergi Obat"       value={allergyMedicine} />
                    <SummaryRow label="Alergi Kondisi"    value={allergyCondition} />
                    <SummaryRow label="Disabilitas Fisik" value={physicalDisab} />
                </div>
            </SummarySection>

            {/* ── Catatan Khusus ─────────────────────────────────────────── */}
            {(specialNotes || parentConcern) && (
                <SummarySection icon="fa-solid fa-note-sticky" title="Catatan Khusus">
                    <div className="flex flex-col">
                        {specialNotes  && <SummaryRow label="Catatan Umum"          value={specialNotes} />}
                        {parentConcern && <SummaryRow label="Keluhan Terkini (Ortu)" value={parentConcern} />}
                    </div>
                </SummarySection>
            )}

            {/* ── Dokumen ────────────────────────────────────────────────── */}
            {healthRecord && (
                <SummarySection icon="fa-solid fa-file-medical" title="Dokumen Kesehatan">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                            { label: "Surat Keterangan Sehat", url: healthRecord.surat_sehat_url },
                            { label: "Kartu BPJS / JKN",       url: healthRecord.bpjs_card_url },
                            { label: "Kartu Vaksin",           url: healthRecord.vaccine_card_url },
                        ].map(doc => (
                            <div key={doc.label}
                                className={`flex items-center gap-2.5 p-3 rounded-xl
                                            border transition-all duration-200
                                            ${doc.url
                                                ? "dark:bg-emerald-500/10 bg-emerald-50 dark:border-emerald-500/20 border-emerald-200"
                                                : "dark:bg-white/[0.02] bg-slate-50 dark:border-white/[0.05] border-black/[0.05]"
                                            }`}
                            >
                                <i className={`fa-solid fa-file-medical text-sm
                                    ${doc.url ? "dark:text-emerald-400 text-emerald-600" : "dark:text-slate-600 text-slate-300"}`}
                                ></i>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[11px] font-medium dark:text-slate-300 text-slate-600 truncate">
                                        {doc.label}
                                    </p>
                                    <p className={`text-[10px] ${doc.url ? "dark:text-emerald-400 text-emerald-600" : "dark:text-slate-600 text-slate-400"}`}>
                                        {doc.url ? "Sudah diunggah" : "Belum diunggah"}
                                    </p>
                                </div>
                                {doc.url && (
                                    <a href={doc.url} target="_blank" rel="noreferrer"
                                        className="text-[10px] dark:text-emerald-400 text-emerald-600 hover:underline shrink-0">
                                        Lihat
                                    </a>
                                )}
                            </div>
                        ))}
                    </div>
                </SummarySection>
            )}

        </div>
    );
}
