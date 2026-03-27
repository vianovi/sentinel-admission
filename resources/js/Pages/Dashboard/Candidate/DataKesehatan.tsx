// resources/js/Pages/Dashboard/Candidate/DataKesehatan.tsx

// ─────────────────────────────────────────────────────────────────────────────
// KRITERIA AUTO-SUBMITTED (untuk CandidateObserver)
// Field berikut WAJIB diisi agar status kandidat bisa berubah ke "submitted":
//
// Tab Fisik:
//   - blood_type               (required)
//   - rhesus                   (required)
//   - height_cm                (required)
//   - weight_kg                (required)
//   - general_health_condition (required)
//   - eye_right_type           (required)
//   - eye_left_type            (required)
//
// Tab Riwayat:
//   - major_illnesses          (required)
//   - last_illness             (required)
//   - allergy_food             (required)
//   - allergy_medicine         (required)
//   - allergy_condition        (required)
//   - physical_disabilities    (required)
//
// Field OPSIONAL (tidak masuk kriteria submitted):
//   - mental_health_notes
//   - eye_right_value / eye_left_value / eye_condition_since
//   - special_notes / parent_concern_notes
//   - surat_sehat / bpjs_card / vaccine_card (upload dokumen)
//   - chronic_disease_doc
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState }  from "react";
import { animate, stagger }             from "animejs";
import { Head, router }                 from "@inertiajs/react";
import Swal                             from "sweetalert2";
import DashboardSplitLayout             from "@/Layouts/DashboardSplitLayout";
import CandidateSidebar                 from "@/Components/Dashboard/Candidate/Shared/CandidateSidebar";
import TabRangkuman                     from "@/Components/Dashboard/Candidate/DataKesehatan/TabRangkuman";
import TabFisik                         from "@/Components/Dashboard/Candidate/DataKesehatan/TabFisik";
import TabRiwayat                       from "@/Components/Dashboard/Candidate/DataKesehatan/TabRiwayat";
import TabCatatanKhusus                 from "@/Components/Dashboard/Candidate/DataKesehatan/TabCatatanKhusus";
import TabTimKesehatan                  from "@/Components/Dashboard/Candidate/DataKesehatan/TabTimKesehatan";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type HealthRecord = {
    blood_type:               string | null;
    blood_type_label:         string;
    rhesus:                   string | null;
    rhesus_label:             string;
    height_cm:                number | null;
    weight_kg:                number | null;
    bmi:                      number | null;
    bmi_category:             string | null;
    general_health_condition: string | null;
    mental_health_notes:      string | null;
    eye_right_type:           string | null;
    eye_right_value:          number | null;
    eye_right_label:          string;
    eye_left_type:            string | null;
    eye_left_value:           number | null;
    eye_left_label:           string;
    eye_condition_since:      number | null;
    major_illnesses:          string | null;
    last_illness:             string | null;
    allergy_food:             string | null;
    allergy_medicine:         string | null;
    allergy_condition:        string | null;
    physical_disabilities:    string | null;
    chronic_disease_doc_url:  string | null;
    special_notes:            string | null;
    parent_concern_notes:     string | null;
    surat_sehat_url:          string | null;
    bpjs_card_url:            string | null;
    vaccine_card_url:         string | null;
    is_complete:              boolean;
    completion_percentage:    number;
};

export type EmptyField = { key: string; label: string; tab: TabId };

type Props = {
    healthRecord: HealthRecord | null;
    flash?:       { success?: string; error?: string };
    user: {
        name:       string;
        avatar_url: string | null;
        initials:   string;
    };
    candidate: {
        full_name:           string;
        nisn:                string;
        nik:                 string;
        gender_label:        string;
        date_of_birth_label: string;
        school_origin:       string;
        status:              string;
        program_choice:      string | null;
        admission_wave:      { title: string } | null;
    };
};

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// Urutan: Fisik → Riwayat → Catatan Khusus → Tim Kesehatan → Rangkuman
// Default: fisik — Rangkuman di paling kanan sebagai reward tab
// ─────────────────────────────────────────────────────────────────────────────

const TABS = [
    { id: "fisik",         label: "Fisik",          icon: "fa-solid fa-heart-pulse" },
    { id: "riwayat",       label: "Riwayat",        icon: "fa-solid fa-clock-rotate-left" },
    { id: "catatan",       label: "Catatan Khusus", icon: "fa-solid fa-note-sticky" },
    { id: "tim-kesehatan", label: "Tim Kesehatan",  icon: "fa-solid fa-user-doctor" },
    { id: "rangkuman",     label: "Rangkuman",      icon: "fa-solid fa-chart-pie" },
] as const;

type TabId = typeof TABS[number]["id"];

const REQUIRED_FIELDS: EmptyField[] = [
    { key: "bloodType",        label: "Golongan Darah",          tab: "fisik" },
    { key: "rhesus",           label: "Rhesus",                  tab: "fisik" },
    { key: "heightCm",         label: "Tinggi Badan",            tab: "fisik" },
    { key: "weightKg",         label: "Berat Badan",             tab: "fisik" },
    { key: "generalHealth",    label: "Kondisi Kesehatan Umum",  tab: "fisik" },
    { key: "eyeRightType",     label: "Kondisi Mata Kanan",      tab: "fisik" },
    { key: "eyeLeftType",      label: "Kondisi Mata Kiri",       tab: "fisik" },
    { key: "majorIllnesses",   label: "Riwayat Penyakit Berat",  tab: "riwayat" },
    { key: "lastIllness",      label: "Sakit Terakhir",          tab: "riwayat" },
    { key: "allergyFood",      label: "Alergi Makanan",          tab: "riwayat" },
    { key: "allergyMedicine",  label: "Alergi Obat",             tab: "riwayat" },
    { key: "allergyCondition", label: "Alergi Kondisi",          tab: "riwayat" },
    { key: "physicalDisab",    label: "Disabilitas Fisik",       tab: "riwayat" },
];

const swalDark = Swal.mixin({
    background:          "#0f172a",
    color:               "#e2e8f0",
    confirmButtonColor:  "#d4a017",
    cancelButtonColor:   "#334155",
    customClass: {
        popup:         "!rounded-2xl !border !border-white/10",
        confirmButton: "!rounded-xl !font-semibold",
        cancelButton:  "!rounded-xl !font-semibold",
    },
});

// ─────────────────────────────────────────────────────────────────────────────
// PAGE COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function DataKesehatan({ healthRecord, flash, user, candidate }: Props) {
    const [activeTab, setActiveTab]   = useState<TabId>("fisik");
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors]         = useState<Record<string, string>>({});
    const tabContentRef               = useRef<HTMLDivElement>(null);

    // ── Form state — Tab Fisik ────────────────────────────────────────────────
    const [bloodType,     setBloodType]     = useState(healthRecord?.blood_type                ?? "");
    const [rhesus,        setRhesus]        = useState(healthRecord?.rhesus                    ?? "");
    const [heightCm,      setHeightCm]      = useState(String(healthRecord?.height_cm          ?? ""));
    const [weightKg,      setWeightKg]      = useState(String(healthRecord?.weight_kg          ?? ""));
    const [generalHealth, setGeneralHealth] = useState(healthRecord?.general_health_condition  ?? "");
    const [mentalNotes,   setMentalNotes]   = useState(healthRecord?.mental_health_notes       ?? "");
    const [eyeRightType,  setEyeRightType]  = useState(healthRecord?.eye_right_type            ?? "");
    const [eyeRightValue, setEyeRightValue] = useState(String(healthRecord?.eye_right_value    ?? ""));
    const [eyeLeftType,   setEyeLeftType]   = useState(healthRecord?.eye_left_type             ?? "");
    const [eyeLeftValue,  setEyeLeftValue]  = useState(String(healthRecord?.eye_left_value     ?? ""));
    const [eyeSince,      setEyeSince]      = useState(String(healthRecord?.eye_condition_since ?? ""));

    // ── Form state — Tab Riwayat ──────────────────────────────────────────────
    const [majorIllnesses,   setMajorIllnesses]   = useState(healthRecord?.major_illnesses       ?? "");
    const [lastIllness,      setLastIllness]       = useState(healthRecord?.last_illness          ?? "");
    const [allergyFood,      setAllergyFood]       = useState(healthRecord?.allergy_food          ?? "");
    const [allergyMedicine,  setAllergyMedicine]   = useState(healthRecord?.allergy_medicine      ?? "");
    const [allergyCondition, setAllergyCondition]  = useState(healthRecord?.allergy_condition     ?? "");
    const [physicalDisab,    setPhysicalDisab]     = useState(healthRecord?.physical_disabilities ?? "");

    // ── Form state — Tab Catatan Khusus ───────────────────────────────────────
    const [specialNotes,  setSpecialNotes]  = useState(healthRecord?.special_notes        ?? "");
    const [parentConcern, setParentConcern] = useState(healthRecord?.parent_concern_notes ?? "");

    // ── BMI realtime ──────────────────────────────────────────────────────────
    const bmi = (() => {
        const h = parseFloat(heightCm);
        const w = parseFloat(weightKg);
        if (!h || !w || h < 50) return null;
        return Math.round((w / ((h / 100) ** 2)) * 10) / 10;
    })();

    const bmiCategory = (() => {
        if (!bmi) return null;
        if (bmi < 18.5) return "Kurus";
        if (bmi < 25)   return "Normal";
        if (bmi < 30)   return "Gemuk";
        return "Obesitas";
    })();

    // ── Completion & empty fields ─────────────────────────────────────────────
    const formSnapshot: Record<string, string> = {
        bloodType, rhesus, heightCm, weightKg, generalHealth,
        eyeRightType, eyeLeftType,
        majorIllnesses, lastIllness,
        allergyFood, allergyMedicine, allergyCondition,
        physicalDisab,
    };

    const emptyRequiredFields = REQUIRED_FIELDS.filter(f => !formSnapshot[f.key]);
    const hasEmptyRequired    = emptyRequiredFields.length > 0;
    const completion          = Math.round(
        ((REQUIRED_FIELDS.length - emptyRequiredFields.length) / REQUIRED_FIELDS.length) * 100
    );

    const progressGradient = (() => {
        if (completion < 50)  return "linear-gradient(to right, #c0392b, #e74c3c)";
        if (completion < 75)  return "linear-gradient(to right, #d35400, #f39c12)";
        if (completion < 100) return "linear-gradient(to right, #2980b9, #7aa2f7)";
        return "linear-gradient(to right, #1e8449, #27ae60)";
    })();

    // ── Entrance animation ────────────────────────────────────────────────────
    useEffect(() => {
        animate(".kesehatan-card", {
            opacity:    [0, 1],
            translateY: [20, 0],
            duration:   600,
            delay:      stagger(80),
            ease:       "outExpo",
        });
    }, []);

    // ── Flash messages ────────────────────────────────────────────────────────
    useEffect(() => {
        if (flash?.success) {
            swalDark.fire({
                icon:  "success",
                title: "Tersimpan!",
                text:  flash.success,
                timer: 2500,
                showConfirmButton: false,
            });
        }
        if (flash?.error) {
            swalDark.fire({ icon: "error", title: "Gagal", text: flash.error });
        }
    }, [flash]);

    // ── Tab transition ────────────────────────────────────────────────────────
    const handleTabChange = (tabId: TabId) => {
        if (tabId === activeTab) return;

        const currentIdx = TABS.findIndex(t => t.id === activeTab);
        const nextIdx    = TABS.findIndex(t => t.id === tabId);
        const dir        = nextIdx > currentIdx ? 1 : -1;

        if (tabContentRef.current) {
            animate(tabContentRef.current, {
                opacity:    [1, 0],
                translateX: [0, dir * -20],
                duration:   180,
                ease:       "inQuad",
            });
        }

        setTimeout(() => {
            setActiveTab(tabId);
            if (tabContentRef.current) {
                animate(tabContentRef.current, {
                    opacity:    [0, 1],
                    translateX: [dir * 20, 0],
                    duration:   350,
                    ease:       "outExpo",
                });
            }
        }, 190);
    };

    // ── Validate field ────────────────────────────────────────────────────────
    const validateField = (field: string, value: string) => {
        const newErrors = { ...errors };
        if (field === "height_cm") {
            const v = parseInt(value);
            if (!value) newErrors.height_cm = "Tinggi badan wajib diisi.";
            else if (v < 50 || v > 250) newErrors.height_cm = "Tinggi badan harus 50–250 cm.";
            else delete newErrors.height_cm;
        }
        if (field === "weight_kg") {
            const v = parseInt(value);
            if (!value) newErrors.weight_kg = "Berat badan wajib diisi.";
            else if (v < 10 || v > 300) newErrors.weight_kg = "Berat badan harus 10–300 kg.";
            else delete newErrors.weight_kg;
        }
        if (field === "eye_condition_since") {
            const v = parseInt(value);
            if (value && (v < 1990 || v > new Date().getFullYear())) {
                newErrors.eye_condition_since = "Tahun tidak valid.";
            } else {
                delete newErrors.eye_condition_since;
            }
        }
        setErrors(newErrors);
    };

    // ── Submit ────────────────────────────────────────────────────────────────
    const handleSubmit = () => {
        setSubmitting(true);
        setErrors({});

        router.post(route("dashboard.data-kesehatan.save"), {
            blood_type:               bloodType,
            rhesus,
            height_cm:                heightCm,
            weight_kg:                weightKg,
            general_health_condition: generalHealth,
            mental_health_notes:      mentalNotes       || null,
            eye_right_type:           eyeRightType,
            eye_right_value:          eyeRightValue      || null,
            eye_left_type:            eyeLeftType,
            eye_left_value:           eyeLeftValue       || null,
            eye_condition_since:      eyeSince           || null,
            major_illnesses:          majorIllnesses,
            last_illness:             lastIllness,
            allergy_food:             allergyFood,
            allergy_medicine:         allergyMedicine,
            allergy_condition:        allergyCondition,
            physical_disabilities:    physicalDisab,
            special_notes:            specialNotes       || null,
            parent_concern_notes:     parentConcern      || null,
        }, {
            onError: (errs) => {
                setErrors(errs);
                setSubmitting(false);
                animate(".input-error", {
                    translateX: [0, -6, 6, -4, 4, 0],
                    duration:   380,
                    ease:       "outExpo",
                });
                const fisikFields   = ["blood_type","rhesus","height_cm","weight_kg",
                                       "general_health_condition","eye_right_type","eye_left_type"];
                const riwayatFields = ["major_illnesses","last_illness","allergy_food",
                                       "allergy_medicine","allergy_condition","physical_disabilities"];
                const errKeys = Object.keys(errs);
                if      (errKeys.some(k => fisikFields.includes(k)))   handleTabChange("fisik");
                else if (errKeys.some(k => riwayatFields.includes(k))) handleTabChange("riwayat");
                else handleTabChange("catatan");
            },
            onSuccess: () => setSubmitting(false),
            preserveScroll: true,
        });
    };

    // ─────────────────────────────────────────────────────────────────────────
    // RENDER — mengikuti pola DataWali persis:
    // Header naked → tab pill container → content card → action buttons
    // ─────────────────────────────────────────────────────────────────────────

    return (
        <DashboardSplitLayout
            aside={
                <CandidateSidebar
                    user={user}
                    candidate={candidate}
                    completion={completion}
                    tips={[
                        "Isi sesuai kondisi saat ini, bukan diagnosis lama",
                        "Pilih 'Belum pernah tes' jika tidak tahu golongan darah",
                        "Semua field wajib — tulis 'Tidak Ada' jika memang tidak ada",
                        "Upload dokumen bisa dilakukan kapan saja setelah data tersimpan",
                    ]}
                />
            }
        >
            <Head title="Data Kesehatan" />

            <div className="space-y-5 px-4 py-6 sm:px-6">

                {/* ── Header — naked, tidak ada card/box ───────────────────── */}
                <div className="kesehatan-card">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl
                                        dark:bg-emerald-500/10 bg-emerald-50
                                        border dark:border-emerald-500/20 border-emerald-200
                                        flex items-center justify-center shrink-0">
                            <i className="fa-solid fa-heart-pulse text-emerald-400 text-sm"></i>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold dark:text-slate-100 text-slate-800">
                                Data Kesehatan
                            </h1>
                            <p className="text-sm dark:text-slate-400 text-slate-500 mt-0.5">
                                Rekam medis &amp; kondisi kesehatan kandidat
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── Tab navigation — pill style persis seperti DataWali ───── */}
                <div className="kesehatan-card">
                    <div className="flex overflow-x-auto rounded-xl
                                    border dark:border-content-border border-black/[0.08]
                                    dark:bg-content-card bg-slate-50
                                    p-1 gap-1 no-scrollbar">
                        {TABS.map((tab) => {
                            const isActive    = activeTab === tab.id;
                            const isRangkuman = tab.id === "rangkuman";
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => handleTabChange(tab.id)}
                                    className={[
                                        "relative flex flex-1 items-center justify-center gap-1.5 rounded-lg",
                                        "whitespace-nowrap px-3 py-2 text-xs font-semibold",
                                        "transition-all duration-200 min-w-[72px] min-h-[36px]",
                                        isActive
                                            ? "dark:bg-emerald-500 bg-emerald-500 text-white shadow-sm"
                                            : "dark:text-slate-400 text-slate-500 dark:hover:bg-content-muted hover:bg-black/[0.04] dark:hover:text-slate-300 hover:text-slate-700",
                                    ].join(" ")}
                                >
                                    <i className={`${tab.icon} text-xs`} />
                                    <span className="hidden sm:inline">{tab.label}</span>
                                    <span className="sm:hidden">{tab.label.split(" ")[0]}</span>

                                    {/* Dot amber — hanya di Rangkuman kalau ada field kosong */}
                                    {isRangkuman && hasEmptyRequired && !isActive && (
                                        <span className="absolute -right-0.5 -top-0.5
                                                         h-2 w-2 rounded-full bg-amber-400" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ── Tab content ───────────────────────────────────────────── */}
                <div
                    ref={tabContentRef}
                    className="kesehatan-card rounded-xl
                               dark:border dark:border-content-border border border-black/[0.07]
                               dark:bg-content-surface bg-white
                               p-5 sm:p-6 min-h-[420px]"
                >
                    {activeTab === "fisik" && (
                        <TabFisik
                            bloodType={bloodType}           setBloodType={setBloodType}
                            rhesus={rhesus}                 setRhesus={setRhesus}
                            heightCm={heightCm}             setHeightCm={setHeightCm}
                            weightKg={weightKg}             setWeightKg={setWeightKg}
                            bmi={bmi}                       bmiCategory={bmiCategory}
                            generalHealth={generalHealth}   setGeneralHealth={setGeneralHealth}
                            mentalNotes={mentalNotes}        setMentalNotes={setMentalNotes}
                            eyeRightType={eyeRightType}     setEyeRightType={setEyeRightType}
                            eyeRightValue={eyeRightValue}   setEyeRightValue={setEyeRightValue}
                            eyeLeftType={eyeLeftType}       setEyeLeftType={setEyeLeftType}
                            eyeLeftValue={eyeLeftValue}     setEyeLeftValue={setEyeLeftValue}
                            eyeSince={eyeSince}             setEyeSince={setEyeSince}
                            errors={errors}
                            validateField={validateField}
                        />
                    )}

                    {activeTab === "riwayat" && (
                        <TabRiwayat
                            majorIllnesses={majorIllnesses}     setMajorIllnesses={setMajorIllnesses}
                            lastIllness={lastIllness}            setLastIllness={setLastIllness}
                            allergyFood={allergyFood}             setAllergyFood={setAllergyFood}
                            allergyMedicine={allergyMedicine}     setAllergyMedicine={setAllergyMedicine}
                            allergyCondition={allergyCondition}   setAllergyCondition={setAllergyCondition}
                            physicalDisab={physicalDisab}         setPhysicalDisab={setPhysicalDisab}
                            chronicDocUrl={healthRecord?.chronic_disease_doc_url ?? null}
                            errors={errors}
                        />
                    )}

                    {activeTab === "catatan" && (
                        <TabCatatanKhusus
                            specialNotes={specialNotes}     setSpecialNotes={setSpecialNotes}
                            parentConcern={parentConcern}   setParentConcern={setParentConcern}
                            suratSehatUrl={healthRecord?.surat_sehat_url   ?? null}
                            bpjsCardUrl={healthRecord?.bpjs_card_url       ?? null}
                            vaccineCardUrl={healthRecord?.vaccine_card_url ?? null}
                        />
                    )}

                    {activeTab === "tim-kesehatan" && (
                        <TabTimKesehatan />
                    )}

                    {activeTab === "rangkuman" && (
                        <TabRangkuman
                            key="rangkuman-live"
                            healthRecord={healthRecord}
                            bmi={bmi}
                            bmiCategory={bmiCategory}
                            emptyRequiredFields={emptyRequiredFields}
                            progressGradient={progressGradient}
                            completion={completion}
                            onNavigateToTab={handleTabChange}
                            formState={{
                                bloodType, rhesus, heightCm, weightKg,
                                generalHealth, mentalNotes,
                                eyeRightType, eyeRightValue,
                                eyeLeftType, eyeLeftValue, eyeSince,
                                majorIllnesses, lastIllness,
                                allergyFood, allergyMedicine, allergyCondition,
                                physicalDisab, specialNotes, parentConcern,
                            }}
                        />
                    )}
                </div>

                {/* ── Submit — hanya di tab form ────────────────────────────── */}
                {(activeTab === "fisik" || activeTab === "riwayat" || activeTab === "catatan") && (
                    <div className="kesehatan-card flex justify-end">
                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-xl
                                       bg-emerald-500 hover:bg-emerald-400
                                       text-white text-sm font-semibold
                                       transition-all duration-200 active:scale-95
                                       disabled:opacity-60 disabled:cursor-not-allowed
                                       min-h-[44px]"
                        >
                            {submitting
                                ? <><i className="fa-solid fa-spinner fa-spin"></i> Menyimpan...</>
                                : <><i className="fa-solid fa-floppy-disk"></i> Simpan Data Kesehatan</>
                            }
                        </button>
                    </div>
                )}

            </div>
        </DashboardSplitLayout>
    );
}