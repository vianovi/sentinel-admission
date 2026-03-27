// resources/js/Components/Dashboard/Candidate/DataKesehatan/TabRangkuman.tsx

import { useEffect }        from "react";
import { animate, stagger } from "animejs";
import FilePreviewModal      from "@/Components/UI/FilePreviewModal";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES — semua lokal, tidak import dari page
// ─────────────────────────────────────────────────────────────────────────────

type TabId = "fisik" | "riwayat" | "catatan" | "tim-kesehatan" | "rangkuman";

type EmptyField = { key: string; label: string; tab: TabId };

type HealthRecord = {
    surat_sehat_url:  string | null;
    bpjs_card_url:    string | null;
    vaccine_card_url: string | null;
};

type FormState = {
    bloodType:        string; rhesus:           string;
    heightCm:         string; weightKg:         string;
    generalHealth:    string; mentalNotes:       string;
    eyeRightType:     string; eyeRightValue:     string;
    eyeLeftType:      string; eyeLeftValue:      string;
    eyeSince:         string;
    majorIllnesses:   string; lastIllness:       string;
    allergyFood:      string; allergyMedicine:   string;
    allergyCondition: string; physicalDisab:     string;
    specialNotes:     string; parentConcern:     string;
};

type Props = {
    healthRecord:        HealthRecord | null;
    bmi:                 number | null;
    bmiCategory:         string | null;
    formState:           FormState;
    emptyRequiredFields: EmptyField[];
    progressGradient:    string;
    completion:          number;
    submitting:          boolean;
    onNavigateToTab:     (tab: TabId) => void;
    onSubmitAll:         () => void;
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
// SUB-COMPONENTS
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
                            border-b dark:border-white/[0.05] border-black/[0.05]">
                <i className={`${icon} text-emerald-400 text-xs`}></i>
                <p className="text-xs font-bold dark:text-slate-300 text-slate-700 uppercase tracking-wider">
                    {title}
                </p>
            </div>
            <div className="p-4">{children}</div>
        </div>
    );
}

function SummaryRow({ label, value }: {
    label: string; value: string | null | undefined;
}) {
    return (
        <div className="flex items-start justify-between gap-4 py-1.5
                        border-b dark:border-white/[0.04] border-black/[0.04] last:border-0">
            <p className="text-[11px] dark:text-slate-500 text-slate-400 shrink-0 mt-0.5">
                {label}
            </p>
            <p className="text-[12px] font-medium dark:text-slate-200 text-slate-700 text-right">
                {value || "—"}
            </p>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function TabRangkuman({
    healthRecord, bmi, bmiCategory, formState,
    emptyRequiredFields, progressGradient, completion,
    submitting, onNavigateToTab, onSubmitAll,
}: Props) {
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

    const isEmpty = !bloodType && !heightCm && !majorIllnesses;

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
                        Mulai dari tab{" "}
                        <button
                            onClick={() => onNavigateToTab("fisik")}
                            className="dark:text-emerald-400 text-emerald-600 font-semibold hover:underline"
                        >
                            Fisik
                        </button>
                        {" "}untuk mengisi data kesehatan kamu
                    </p>
                </div>
            </div>
        );
    }

    const eyeNeedsValue = (type: string) =>
        ["minus", "plus", "silinder"].includes(type);

    const eyeConditionFilled =
        (eyeRightType && eyeRightType !== "normal" && eyeRightType !== "unknown") ||
        (eyeLeftType  && eyeLeftType  !== "normal" && eyeLeftType  !== "unknown");

    const tabLabels: Record<TabId, string> = {
        fisik:           "Fisik",
        riwayat:         "Riwayat",
        catatan:         "Catatan Khusus",
        "tim-kesehatan": "Tim Kesehatan",
        rangkuman:       "Rangkuman",
    };

    const emptyByTab = emptyRequiredFields.reduce<Record<string, EmptyField[]>>(
        (acc, f) => {
            if (!acc[f.tab]) acc[f.tab] = [];
            acc[f.tab].push(f);
            return acc;
        },
        {}
    );

    return (
        <div className="flex flex-col gap-4">

            {/* ── Status Kelengkapan ─────────────────────────────────────── */}
            <div className="rangkuman-card opacity-0 rounded-xl border overflow-hidden
                            dark:bg-white/[0.02] bg-slate-50
                            dark:border-white/[0.06] border-black/[0.06]">
                <div className="flex items-center gap-2.5 px-4 py-3
                                border-b dark:border-white/[0.05] border-black/[0.05]">
                    <i className="fa-solid fa-circle-check text-emerald-400 text-xs"></i>
                    <p className="text-xs font-bold dark:text-slate-300 text-slate-700 uppercase tracking-wider">
                        Status Kelengkapan
                    </p>
                    <span className={`ml-auto text-xs font-bold ${
                        completion === 100
                            ? "dark:text-emerald-400 text-emerald-600"
                            : completion >= 75
                                ? "dark:text-blue-400 text-blue-600"
                                : completion >= 50
                                    ? "dark:text-amber-400 text-amber-600"
                                    : "dark:text-red-400 text-red-600"
                    }`}>
                        {completion}%
                    </span>
                </div>
                <div className="p-4">
                    <div className="h-1.5 dark:bg-white/[0.05] bg-black/[0.06] rounded-full overflow-hidden mb-4">
                        <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${completion}%`, background: progressGradient }}
                        />
                    </div>

                    {completion === 100 ? (
                        <div className="flex items-center gap-2 text-xs
                                        dark:text-emerald-400 text-emerald-600">
                            <i className="fa-solid fa-circle-check text-[11px]"></i>
                            Semua data wajib sudah diisi — data kesehatan lengkap!
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            <p className="text-xs dark:text-slate-400 text-slate-500">
                                {emptyRequiredFields.length} field wajib belum diisi:
                            </p>
                            {(Object.entries(emptyByTab) as [TabId, EmptyField[]][]).map(([tab, fields]) => (
                                <div key={tab} className="flex items-start gap-3">
                                    <button
                                        onClick={() => onNavigateToTab(tab)}
                                        className="shrink-0 text-[10px] font-semibold px-2.5 py-1 rounded-lg
                                                   dark:bg-white/[0.05] bg-black/[0.05]
                                                   dark:text-slate-400 text-slate-500
                                                   dark:hover:text-emerald-400 hover:text-emerald-600
                                                   dark:hover:bg-emerald-500/10 hover:bg-emerald-50
                                                   border dark:border-white/[0.07] border-black/[0.07]
                                                   transition-all duration-150 min-h-[28px]"
                                    >
                                        <i className="fa-solid fa-arrow-right text-[9px] mr-1"></i>
                                        {tabLabels[tab]}
                                    </button>
                                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                                        {fields.map(f => (
                                            <span key={f.key}
                                                className="text-[10px] px-2 py-0.5 rounded-full
                                                           dark:bg-amber-500/10 bg-amber-50
                                                           dark:text-amber-400 text-amber-600
                                                           border dark:border-amber-500/20 border-amber-200">
                                                {f.label}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

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

            {/* ── Dokumen Kesehatan ──────────────────────────────────────── */}
            {healthRecord && (
                <SummarySection icon="fa-solid fa-file-medical" title="Dokumen Kesehatan">
                    <div className="flex flex-col">
                        {[
                            { label: "Surat Keterangan Sehat", url: healthRecord.surat_sehat_url },
                            { label: "Kartu BPJS / JKN",       url: healthRecord.bpjs_card_url },
                            { label: "Kartu Vaksin",           url: healthRecord.vaccine_card_url },
                        ].map(doc => (
                            <div key={doc.label}
                                className="flex items-center justify-between gap-3 py-2.5
                                           border-b dark:border-white/[0.04] border-black/[0.04] last:border-0">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <i className={`fa-solid fa-file-medical text-xs shrink-0
                                        ${doc.url
                                            ? "dark:text-emerald-400 text-emerald-600"
                                            : "dark:text-slate-600 text-slate-300"
                                        }`} />
                                    <div className="min-w-0">
                                        <p className="text-[11px] font-medium dark:text-slate-300 text-slate-600 truncate">
                                            {doc.label}
                                        </p>
                                        <p className={`text-[10px] ${
                                            doc.url
                                                ? "dark:text-emerald-400 text-emerald-600"
                                                : "dark:text-slate-600 text-slate-400"
                                        }`}>
                                            {doc.url ? "Sudah diunggah" : "Belum diunggah"}
                                        </p>
                                    </div>
                                </div>
                                {doc.url && (
                                    <FilePreviewModal serverUrl={doc.url} label="Lihat" />
                                )}
                            </div>
                        ))}
                    </div>
                </SummarySection>
            )}

            {/* ── Tombol Kirim & Selesaikan ─────────────────────────────── */}
            <div className="rangkuman-card opacity-0 pt-2">
                {completion < 100 && (
                    <div className="flex items-start gap-2.5 p-3.5 rounded-xl mb-4
                                    dark:bg-amber-500/[0.08] bg-amber-50
                                    border dark:border-amber-500/20 border-amber-200">
                        <i className="fa-solid fa-circle-info text-amber-400 text-xs mt-0.5 shrink-0"></i>
                        <p className="text-[11px] dark:text-amber-300/80 text-amber-700">
                            Masih ada <strong>{emptyRequiredFields.length} field wajib</strong> yang belum diisi.
                            Kamu tetap bisa menyimpan, namun data belum dianggap lengkap.
                        </p>
                    </div>
                )}

                <div className="flex items-center justify-between gap-4">
                    <div>
                        <p className="text-xs font-semibold dark:text-slate-300 text-slate-700">
                            Simpan Semua Data Kesehatan
                        </p>
                        <p className="text-[11px] dark:text-slate-500 text-slate-400 mt-0.5">
                            Data dari semua tab akan disimpan sekaligus
                        </p>
                    </div>
                    <button
                        onClick={onSubmitAll}
                        disabled={submitting}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl
                                   bg-emerald-500 hover:bg-emerald-400
                                   text-white text-sm font-semibold shrink-0
                                   transition-all duration-200 active:scale-95
                                   disabled:opacity-60 disabled:cursor-not-allowed
                                   min-h-[44px]"
                    >
                        {submitting
                            ? <><i className="fa-solid fa-spinner fa-spin text-xs"></i> Menyimpan...</>
                            : <><i className="fa-solid fa-paper-plane text-xs"></i> Kirim & Selesaikan</>
                        }
                    </button>
                </div>
            </div>

        </div>
    );
}