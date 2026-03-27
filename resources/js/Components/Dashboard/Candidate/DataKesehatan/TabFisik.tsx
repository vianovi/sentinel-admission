// resources/js/Components/Dashboard/Candidate/DataKesehatan/TabFisik.tsx

import { useEffect }            from "react";
import { animate, stagger }     from "animejs";
import Select                   from "react-select";
import Field, { inputCls, textareaCls } from "@/Components/UI/Field";
import { makeSelectStyles }     from "@/Components/UI/selectStyles";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type Props = {
    bloodType:    string; setBloodType:    (v: string) => void;
    rhesus:       string; setRhesus:       (v: string) => void;
    heightCm:     string; setHeightCm:     (v: string) => void;
    weightKg:     string; setWeightKg:     (v: string) => void;
    bmi:          number | null;
    bmiCategory:  string | null;
    generalHealth:  string; setGeneralHealth:  (v: string) => void;
    mentalNotes:    string; setMentalNotes:    (v: string) => void;
    eyeRightType:   string; setEyeRightType:   (v: string) => void;
    eyeRightValue:  string; setEyeRightValue:  (v: string) => void;
    eyeLeftType:    string; setEyeLeftType:    (v: string) => void;
    eyeLeftValue:   string; setEyeLeftValue:   (v: string) => void;
    eyeSince:       string; setEyeSince:       (v: string) => void;
    errors:         Record<string, string>;
    validateField:  (field: string, value: string) => void;
    clearError:     (field: string) => void;
};

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const BLOOD_TYPE_OPTIONS = [
    { value: "A",       label: "A" },
    { value: "B",       label: "B" },
    { value: "AB",      label: "AB" },
    { value: "O",       label: "O" },
    { value: "unknown", label: "Belum pernah tes" },
];

const RHESUS_OPTIONS = [
    { value: "positive", label: "Positif (+)" },
    { value: "negative", label: "Negatif (−)" },
    { value: "unknown",  label: "Belum pernah tes" },
];

const EYE_TYPE_OPTIONS = [
    { value: "normal",   label: "Normal" },
    { value: "minus",    label: "Minus" },
    { value: "plus",     label: "Plus" },
    { value: "silinder", label: "Silinder" },
    { value: "unknown",  label: "Tidak diketahui" },
];

const BMI_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
    Kurus:    { color: "dark:text-blue-400 text-blue-600",       bg: "dark:bg-blue-500/10 bg-blue-50",       border: "dark:border-blue-500/20 border-blue-200" },
    Normal:   { color: "dark:text-emerald-400 text-emerald-600", bg: "dark:bg-emerald-500/10 bg-emerald-50", border: "dark:border-emerald-500/20 border-emerald-200" },
    Gemuk:    { color: "dark:text-amber-400 text-amber-600",     bg: "dark:bg-amber-500/10 bg-amber-50",     border: "dark:border-amber-500/20 border-amber-200" },
    Obesitas: { color: "dark:text-red-400 text-red-600",         bg: "dark:bg-red-500/10 bg-red-50",         border: "dark:border-red-500/20 border-red-200" },
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const eyeNeedsValue = (type: string) =>
    ["minus", "plus", "silinder"].includes(type);

const eyeHasAbnormality = (rightType: string, leftType: string) =>
    eyeNeedsValue(rightType) || eyeNeedsValue(leftType);

// Portal props — dropdown tidak terpotong oleh parent overflow
// hasError: pass true agar border dropdown ikut merah saat error
const portalProps = (hasError = false) => ({
    styles:           makeSelectStyles(hasError),
    menuPortalTarget: typeof document !== "undefined" ? document.body : undefined,
    menuPosition:     "fixed" as const,
    menuPlacement:    "auto" as const,
});

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function TabFisik({
    bloodType, setBloodType,
    rhesus, setRhesus,
    heightCm, setHeightCm,
    weightKg, setWeightKg,
    bmi, bmiCategory,
    generalHealth, setGeneralHealth,
    mentalNotes, setMentalNotes,
    eyeRightType, setEyeRightType,
    eyeRightValue, setEyeRightValue,
    eyeLeftType, setEyeLeftType,
    eyeLeftValue, setEyeLeftValue,
    eyeSince, setEyeSince,
    errors, validateField, clearError,
}: Props) {

    useEffect(() => {
        animate(".fisik-section", {
            opacity:    [0, 1],
            translateY: [12, 0],
            duration:   450,
            delay:      stagger(80),
            ease:       "outExpo",
        });
    }, []);

    const bmiConf = bmiCategory ? BMI_CONFIG[bmiCategory] : null;

    return (
        <div className="flex flex-col gap-8">

            {/* ── Golongan Darah & Rhesus ───────────────────────────────── */}
            <section className="fisik-section opacity-0">
                <h3 className="text-sm font-display font-bold dark:text-white text-slate-800
                                flex items-center gap-2 mb-1">
                    <i className="fa-solid fa-droplet text-emerald-400 text-xs"></i>
                    Golongan Darah
                </h3>
                <p className="text-xs dark:text-slate-500 text-slate-400 mb-5">
                    Pilih "Belum pernah tes" jika tidak tahu
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Field label="Golongan Darah" error={errors.blood_type} required>
                        <Select
                            options={BLOOD_TYPE_OPTIONS}
                            value={BLOOD_TYPE_OPTIONS.find(o => o.value === bloodType) ?? null}
                            onChange={opt => {
                                setBloodType(opt?.value ?? "");
                                clearError("blood_type");
                            }}
                            placeholder="Pilih golongan darah..."
                            isSearchable={false}
                            {...portalProps(!!errors.blood_type)}
                        />
                    </Field>

                    <Field label="Rhesus" error={errors.rhesus} required>
                        <Select
                            options={RHESUS_OPTIONS}
                            value={RHESUS_OPTIONS.find(o => o.value === rhesus) ?? null}
                            onChange={opt => {
                                setRhesus(opt?.value ?? "");
                                clearError("rhesus");
                            }}
                            placeholder="Pilih rhesus..."
                            isSearchable={false}
                            {...portalProps(!!errors.rhesus)}
                        />
                    </Field>
                </div>
            </section>

            <div className="border-t dark:border-white/[0.06] border-black/[0.06]"></div>

            {/* ── Tinggi, Berat & BMI ───────────────────────────────────── */}
            <section className="fisik-section opacity-0">
                <h3 className="text-sm font-display font-bold dark:text-white text-slate-800
                                flex items-center gap-2 mb-5">
                    <i className="fa-solid fa-weight-scale text-emerald-400 text-xs"></i>
                    Pengukuran Tubuh
                </h3>

                <div className="grid grid-cols-2 gap-4 mb-4">
                    <Field label="Tinggi Badan" error={errors.height_cm} required hint="Satuan: cm">
                        <div className="relative">
                            <input
                                value={heightCm}
                                onChange={e => {
                                    setHeightCm(e.target.value.replace(/\D/g, "").slice(0, 3));
                                    if (e.target.value) clearError("height_cm");
                                }}
                                onBlur={e => validateField("height_cm", e.target.value)}
                                inputMode="numeric"
                                placeholder="Contoh: 158"
                                className={`${inputCls(errors.height_cm)} pr-10`}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2
                                             text-[11px] dark:text-slate-500 text-slate-400 font-medium">
                                cm
                            </span>
                        </div>
                    </Field>

                    <Field label="Berat Badan" error={errors.weight_kg} required hint="Satuan: kg">
                        <div className="relative">
                            <input
                                value={weightKg}
                                onChange={e => {
                                    setWeightKg(e.target.value.replace(/\D/g, "").slice(0, 3));
                                    if (e.target.value) clearError("weight_kg");
                                }}
                                onBlur={e => validateField("weight_kg", e.target.value)}
                                inputMode="numeric"
                                placeholder="Contoh: 52"
                                className={`${inputCls(errors.weight_kg)} pr-10`}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2
                                             text-[11px] dark:text-slate-500 text-slate-400 font-medium">
                                kg
                            </span>
                        </div>
                    </Field>
                </div>

                {/* BMI Card — realtime */}
                {bmi && bmiConf ? (
                    <div className={`flex items-center gap-4 p-4 rounded-xl border
                                    ${bmiConf.bg} ${bmiConf.border} transition-all duration-500`}>
                        <div className="flex flex-col items-center justify-center
                                        w-16 h-16 rounded-xl dark:bg-white/[0.06] bg-white
                                        border dark:border-white/[0.08] border-black/[0.08]
                                        shrink-0">
                            <p className={`text-xl font-bold leading-none ${bmiConf.color}`}>
                                {bmi}
                            </p>
                            <p className="text-[9px] dark:text-slate-500 text-slate-400 mt-0.5 uppercase tracking-wider">
                                BMI
                            </p>
                        </div>
                        <div>
                            <p className={`text-sm font-bold ${bmiConf.color}`}>
                                {bmiCategory}
                            </p>
                            <p className="text-xs dark:text-slate-400 text-slate-500 mt-0.5">
                                {bmiCategory === "Normal"
                                    ? "Berat badan ideal — pertahankan pola hidup sehat"
                                    : bmiCategory === "Kurus"
                                        ? "Dianjurkan menambah asupan nutrisi bergizi"
                                        : bmiCategory === "Gemuk"
                                            ? "Dianjurkan meningkatkan aktivitas fisik"
                                            : "Konsultasikan dengan tenaga medis"
                                }
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-3 p-4 rounded-xl
                                    dark:bg-white/[0.02] bg-slate-50
                                    border dark:border-white/[0.05] border-black/[0.05]">
                        <i className="fa-solid fa-calculator dark:text-slate-600 text-slate-300 text-lg"></i>
                        <p className="text-xs dark:text-slate-500 text-slate-400">
                            Isi tinggi &amp; berat badan untuk kalkulasi BMI otomatis
                        </p>
                    </div>
                )}
            </section>

            <div className="border-t dark:border-white/[0.06] border-black/[0.06]"></div>

            {/* ── Kondisi Kesehatan Umum ────────────────────────────────── */}
            <section className="fisik-section opacity-0">
                <h3 className="text-sm font-display font-bold dark:text-white text-slate-800
                                flex items-center gap-2 mb-1">
                    <i className="fa-solid fa-stethoscope text-emerald-400 text-xs"></i>
                    Kondisi Kesehatan Umum
                </h3>
                <p className="text-xs dark:text-slate-500 text-slate-400 mb-5">
                    Deskripsikan kondisi fisik &amp; pola hidup secara keseluruhan saat ini
                </p>

                <div className="flex flex-col gap-5">
                    <Field label="Kondisi Kesehatan Umum" error={errors.general_health_condition}
                        required hint="Contoh: Sehat, aktif berolahraga 3x seminggu, tidak ada keluhan">
                        <textarea
                            value={generalHealth}
                            onChange={e => {
                                setGeneralHealth(e.target.value);
                                if (e.target.value) clearError("general_health_condition");
                            }}
                            rows={3}
                            placeholder="Jelaskan kondisi kesehatan fisik dan pola hidup saat ini..."
                            className={textareaCls(errors.general_health_condition)}
                        />
                    </Field>

                    <Field label="Kondisi Mental"
                        hint="Opsional — kondisi yang dapat mempengaruhi kesehatan (stres, kecemasan, dll)">
                        <textarea
                            value={mentalNotes}
                            onChange={e => setMentalNotes(e.target.value)}
                            rows={2}
                            placeholder="Tulis 'Tidak Ada' jika tidak ada catatan mental khusus..."
                            className={textareaCls()}
                        />
                    </Field>
                </div>
            </section>

            <div className="border-t dark:border-white/[0.06] border-black/[0.06]"></div>

            {/* ── Kondisi Mata ──────────────────────────────────────────── */}
            <section className="fisik-section opacity-0">
                <h3 className="text-sm font-display font-bold dark:text-white text-slate-800
                                flex items-center gap-2 mb-1">
                    <i className="fa-solid fa-eye text-emerald-400 text-xs"></i>
                    Kondisi Mata
                </h3>
                <p className="text-xs dark:text-slate-500 text-slate-400 mb-5">
                    Pilih "Normal" jika tidak ada gangguan penglihatan
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Mata kanan */}
                    <div className="flex flex-col gap-3">
                        <Field label="Mata Kanan — Kondisi" error={errors.eye_right_type} required>
                            <Select
                                options={EYE_TYPE_OPTIONS}
                                value={EYE_TYPE_OPTIONS.find(o => o.value === eyeRightType) ?? null}
                                onChange={opt => {
                                    setEyeRightType(opt?.value ?? "");
                                    if (!eyeNeedsValue(opt?.value ?? "")) setEyeRightValue("");
                                    clearError("eye_right_type");
                                }}
                                placeholder="Pilih kondisi..."
                                isSearchable={false}
                                {...portalProps(!!errors.eye_right_type)}
                            />
                        </Field>
                        {eyeNeedsValue(eyeRightType) && (
                            <Field label="Nilai" hint="Contoh: 2.50 (tanpa tanda minus/plus)">
                                <input
                                    value={eyeRightValue}
                                    onChange={e => setEyeRightValue(e.target.value)}
                                    inputMode="decimal"
                                    placeholder="Contoh: 2.50"
                                    className={inputCls()}
                                />
                            </Field>
                        )}
                    </div>

                    {/* Mata kiri */}
                    <div className="flex flex-col gap-3">
                        <Field label="Mata Kiri — Kondisi" error={errors.eye_left_type} required>
                            <Select
                                options={EYE_TYPE_OPTIONS}
                                value={EYE_TYPE_OPTIONS.find(o => o.value === eyeLeftType) ?? null}
                                onChange={opt => {
                                    setEyeLeftType(opt?.value ?? "");
                                    if (!eyeNeedsValue(opt?.value ?? "")) setEyeLeftValue("");
                                    clearError("eye_left_type");
                                }}
                                placeholder="Pilih kondisi..."
                                isSearchable={false}
                                {...portalProps(!!errors.eye_left_type)}
                            />
                        </Field>
                        {eyeNeedsValue(eyeLeftType) && (
                            <Field label="Nilai" hint="Contoh: 1.75 (tanpa tanda minus/plus)">
                                <input
                                    value={eyeLeftValue}
                                    onChange={e => setEyeLeftValue(e.target.value)}
                                    inputMode="decimal"
                                    placeholder="Contoh: 1.75"
                                    className={inputCls()}
                                />
                            </Field>
                        )}
                    </div>
                </div>

                {/* Sejak kapan — hanya muncul jika ada abnormalitas */}
                {eyeHasAbnormality(eyeRightType, eyeLeftType) && (
                    <div className="mt-4">
                        <Field label="Kondisi Mata Sejak Tahun" error={errors.eye_condition_since}
                            hint="Tahun mulai terdeteksi gangguan penglihatan">
                            <input
                                value={eyeSince}
                                onChange={e => {
                                    setEyeSince(e.target.value.replace(/\D/g, "").slice(0, 4));
                                    if (e.target.value) clearError("eye_condition_since");
                                }}
                                onBlur={e => validateField("eye_condition_since", e.target.value)}
                                inputMode="numeric"
                                placeholder={`Contoh: ${new Date().getFullYear() - 3}`}
                                className={inputCls(errors.eye_condition_since)}
                            />
                        </Field>
                    </div>
                )}
            </section>

        </div>
    );
}