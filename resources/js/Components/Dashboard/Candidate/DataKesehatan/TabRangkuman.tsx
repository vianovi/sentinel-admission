// resources/js/Components/Dashboard/Candidate/DataKesehatan/TabRangkuman.tsx

import { useEffect }        from "react";
import { animate, stagger } from "animejs";
import FilePreviewModal      from "@/Components/UI/FilePreviewModal";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
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
    onNavigateToTab:     (tab: TabId) => void;
    onSubmitAll:         () => void;
    submitting:          boolean;
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
    const map: Record<string, string> = { minus: "Minus", plus: "Plus", silinder: "Silinder" };
    return (map[type] ?? type) + v;
};

const eyeNeedsValue = (type: string) => ["minus", "plus", "silinder"].includes(type);

const bmiColor = (bmi: number | null) => {
    if (!bmi) return "dark:text-slate-400 text-slate-500";
    if (bmi < 18.5) return "dark:text-blue-400 text-blue-600";
    if (bmi < 25)   return "dark:text-cyan-400 text-cyan-600";
    if (bmi < 30)   return "dark:text-amber-400 text-amber-600";
    return "dark:text-red-400 text-red-600";
};

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS — layout baru
// ─────────────────────────────────────────────────────────────────────────────

// Card wrapper dengan header subtle
function SummaryCard({ icon, title, onEdit, children }: {
    icon:     string;
    title:    string;
    onEdit:   () => void;
    children: React.ReactNode;
}) {
    return (
        <div className="rangkuman-card opacity-0 rounded-xl border overflow-hidden
                        dark:border-white/[0.07] border-black/[0.07]
                        dark:bg-white/[0.02] bg-white">
            {/* Header — subtle bg biar jelas pemisahnya */}
            <div className="flex items-center justify-between px-4 py-2.5
                            border-b dark:border-white/[0.06] border-black/[0.06]
                            dark:bg-white/[0.03] bg-slate-50">
                <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md flex items-center justify-center
                                    dark:bg-cyan-500/20 bg-cyan-50">
                        <i className={`${icon} text-cyan-400 text-[10px]`}></i>
                    </div>
                    <p className="text-[11px] font-semibold dark:text-slate-400 text-slate-500
                                  uppercase tracking-wider">
                        {title}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onEdit}
                    className="text-[11px] dark:text-slate-500 text-slate-400
                               dark:hover:text-cyan-400 hover:text-cyan-600
                               flex items-center gap-1 transition-colors duration-150"
                >
                    <i className="fa-solid fa-pen-to-square text-[9px]"></i>
                    Edit
                </button>
            </div>
            {/* Rows */}
            <div>{children}</div>
        </div>
    );
}

// Row label:value — rapat, label fixed muted, value bold primary
function Row({ label, value, valueClass }: {
    label:       string;
    value:       string | null | undefined;
    valueClass?: string;
}) {
    return (
        <div className="flex items-baseline justify-between gap-3 px-4 py-[7px]
                        border-b dark:border-white/[0.04] border-black/[0.04] last:border-0">
            <p className="text-[11px] dark:text-slate-500 text-slate-400 shrink-0">
                {label}
            </p>
            <p className={`text-[12px] font-medium text-right break-words min-w-0
                          ${valueClass ?? "dark:text-slate-200 text-slate-700"}
                          ${!value ? "dark:text-slate-600 text-slate-300 italic font-normal" : ""}`}>
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
            delay:      stagger(60),
            ease:       "outExpo",
        });
    }, []);

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
        (acc, f) => { if (!acc[f.tab]) acc[f.tab] = []; acc[f.tab].push(f); return acc; },
        {}
    );

    // Empty state
    const isEmpty = !bloodType && !heightCm && !majorIllnesses;
    if (isEmpty) {
        return (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="w-16 h-16 rounded-2xl dark:bg-cyan-500/10 bg-cyan-50
                                border dark:border-cyan-500/20 border-cyan-200
                                flex items-center justify-center">
                    <i className="fa-solid fa-heart-pulse text-2xl dark:text-cyan-400 text-cyan-500"></i>
                </div>
                <div className="text-center">
                    <p className="text-sm font-semibold dark:text-slate-300 text-slate-600 mb-1">
                        Data kesehatan belum diisi
                    </p>
                    <p className="text-xs dark:text-slate-500 text-slate-400 max-w-xs">
                        Mulai dari tab{" "}
                        <button
                            onClick={() => onNavigateToTab("fisik")}
                            className="dark:text-cyan-400 text-cyan-600 font-semibold hover:underline"
                        >
                            Fisik
                        </button>
                        {" "}untuk mengisi data kesehatan kamu
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">

            {/* ── Status Kelengkapan ────────────────────────────────────── */}
            <div className="rangkuman-card opacity-0 rounded-xl border overflow-hidden
                            dark:border-white/[0.07] border-black/[0.07]
                            dark:bg-white/[0.02] bg-white">
                <div className="flex items-center gap-2.5 px-4 py-2.5
                                border-b dark:border-white/[0.06] border-black/[0.06]
                                dark:bg-white/[0.03] bg-slate-50">
                    <div className="w-5 h-5 rounded-md flex items-center justify-center
                                    dark:bg-cyan-500/20 bg-cyan-50">
                        <i className="fa-solid fa-circle-check text-cyan-400 text-[10px]"></i>
                    </div>
                    <p className="text-[11px] font-semibold dark:text-slate-400 text-slate-500
                                  uppercase tracking-wider flex-1">
                        Status Kelengkapan
                    </p>
                    <span className={`text-xs font-bold ${
                        completion === 100 ? "dark:text-cyan-400 text-cyan-600"
                            : completion >= 75 ? "dark:text-blue-400 text-blue-600"
                            : completion >= 50 ? "dark:text-amber-400 text-amber-600"
                            : "dark:text-red-400 text-red-600"
                    }`}>{completion}%</span>
                </div>
                <div className="p-4">
                    <div className="h-1.5 dark:bg-white/[0.05] bg-black/[0.06] rounded-full overflow-hidden mb-3">
                        <div className="h-full rounded-full transition-all duration-700"
                             style={{ width: `${completion}%`, background: progressGradient }} />
                    </div>
                    {completion === 100 ? (
                        <p className="text-xs dark:text-cyan-400 text-cyan-600 flex items-center gap-1.5">
                            <i className="fa-solid fa-circle-check text-[11px]"></i>
                            Semua data wajib sudah diisi — data kesehatan lengkap!
                        </p>
                    ) : (
                        <div className="flex flex-col gap-2.5">
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
                                                   dark:hover:text-cyan-400 hover:text-cyan-600
                                                   dark:hover:bg-cyan-500/10 hover:bg-cyan-50
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

            {/* ── Grid 2 kolom — card kiri & kanan ─────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                {/* Data Fisik */}
                <SummaryCard icon="fa-solid fa-heart-pulse" title="Data Fisik"
                    onEdit={() => onNavigateToTab("fisik")}>
                    <Row label="Golongan darah" value={bloodTypeLabel(bloodType)} />
                    <Row label="Rhesus"         value={rhesusLabel(rhesus)} />
                    <Row label="Tinggi badan"   value={heightCm ? `${heightCm} cm` : null} />
                    <Row label="Berat badan"    value={weightKg ? `${weightKg} kg` : null} />
                    <Row label="BMI"
                        value={bmi ? `${bmi} — ${bmiCategory}` : null}
                        valueClass={bmiColor(bmi)}
                    />
                    <Row label="Kondisi umum"   value={generalHealth} />
                    {mentalNotes && <Row label="Catatan mental" value={mentalNotes} />}
                </SummaryCard>

                {/* Kondisi Mata */}
                <SummaryCard icon="fa-solid fa-eye" title="Kondisi Mata"
                    onEdit={() => onNavigateToTab("fisik")}>
                    <Row label="Mata kanan"
                        value={eyeLabel(eyeRightType, eyeNeedsValue(eyeRightType) ? eyeRightValue : "")} />
                    <Row label="Mata kiri"
                        value={eyeLabel(eyeLeftType, eyeNeedsValue(eyeLeftType) ? eyeLeftValue : "")} />
                    {eyeConditionFilled && eyeSince && (
                        <Row label="Sejak tahun" value={eyeSince} />
                    )}
                </SummaryCard>

                {/* Riwayat Kesehatan */}
                <SummaryCard icon="fa-solid fa-clock-rotate-left" title="Riwayat Kesehatan"
                    onEdit={() => onNavigateToTab("riwayat")}>
                    <Row label="Penyakit berat"    value={majorIllnesses} />
                    <Row label="Sakit terakhir"    value={lastIllness} />
                    <Row label="Alergi makanan"    value={allergyFood} />
                    <Row label="Alergi obat"       value={allergyMedicine} />
                    <Row label="Alergi kondisi"    value={allergyCondition} />
                    <Row label="Disabilitas fisik" value={physicalDisab} />
                </SummaryCard>

                {/* Catatan Khusus */}
                <SummaryCard icon="fa-solid fa-note-sticky" title="Catatan Khusus"
                    onEdit={() => onNavigateToTab("catatan")}>
                    <Row label="Catatan umum"      value={specialNotes} />
                    <Row label="Keluhan ortu"      value={parentConcern} />

                    {/* Dokumen kesehatan — dengan tombol preview */}
                    {healthRecord && [
                        { label: "Surat sehat", url: healthRecord.surat_sehat_url },
                        { label: "BPJS / JKN",  url: healthRecord.bpjs_card_url },
                        { label: "Kartu vaksin", url: healthRecord.vaccine_card_url },
                    ].map(doc => (
                        <div key={doc.label}
                            className="flex items-center justify-between gap-2 px-4 py-[7px]
                                       border-b dark:border-white/[0.04] border-black/[0.04] last:border-0">
                            <p className="text-[11px] dark:text-slate-500 text-slate-400 shrink-0">
                                {doc.label}
                            </p>
                            <div className="flex items-center gap-2 min-w-0">
                                {doc.url ? (
                                    <>
                                        <span className="text-[11px] font-medium dark:text-cyan-400 text-cyan-600">
                                            <i className="fa-solid fa-circle-check text-[9px] mr-1"></i>
                                            Diunggah
                                        </span>
                                        {/* Preview — akan berfungsi setelah backend fix */}
                                        <FilePreviewModal serverUrl={doc.url} label="Lihat" />
                                    </>
                                ) : (
                                    <span className="text-[11px] dark:text-slate-600 text-slate-300 italic">
                                        Belum
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </SummaryCard>

            </div>

            {/* ── Warning field belum lengkap ───────────────────────────── */}
            {completion < 100 && (
                <div className="rangkuman-card opacity-0 flex items-start gap-2.5 p-3.5 rounded-xl
                                dark:bg-amber-500/[0.08] bg-amber-50
                                border dark:border-amber-500/20 border-amber-200">
                    <i className="fa-solid fa-circle-info text-amber-400 text-xs mt-0.5 shrink-0"></i>
                    <p className="text-[11px] dark:text-amber-300/80 text-amber-700">
                        Masih ada <strong>{emptyRequiredFields.length} field wajib</strong> yang belum diisi.
                        Klik tab di atas untuk melengkapi data yang kurang.
                    </p>
                </div>
            )}

            {/* ── Tombol Kirim Semua ────────────────────────────────────── */}
            <div className="rangkuman-card opacity-0 rounded-xl border
                            dark:border-white/[0.07] border-black/[0.07]
                            dark:bg-white/[0.02] bg-white p-4">
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
                                   bg-cyan-500 hover:bg-cyan-400
                                   text-white text-sm font-semibold shrink-0
                                   transition-all duration-200 active:scale-95
                                   disabled:opacity-60 disabled:cursor-not-allowed
                                   min-h-[44px]"
                    >
                        {submitting
                            ? <><i className="fa-solid fa-spinner fa-spin text-xs"></i> Mengirim...</>
                            : <><i className="fa-solid fa-paper-plane text-xs"></i> Kirim &amp; Selesaikan</>
                        }
                    </button>
                </div>
            </div>

        </div>
    );
}