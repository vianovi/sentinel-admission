// resources/js/Pages/Dashboard/Candidate/DataKesehatan.tsx

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
// ─────────────────────────────────────────────────────────────────────────────

const TABS = [
    { id: "rangkuman",     label: "Rangkuman",     icon: "fa-solid fa-chart-pie" },
    { id: "fisik",         label: "Fisik",          icon: "fa-solid fa-heart-pulse" },
    { id: "riwayat",       label: "Riwayat",        icon: "fa-solid fa-clock-rotate-left" },
    { id: "catatan",       label: "Catatan Khusus", icon: "fa-solid fa-note-sticky" },
    { id: "tim-kesehatan", label: "Tim Kesehatan",  icon: "fa-solid fa-user-doctor" },
] as const;

type TabId = typeof TABS[number]["id"];

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
    const [activeTab, setActiveTab]   = useState<TabId>("rangkuman");
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors]         = useState<Record<string, string>>({});
    const tabContentRef               = useRef<HTMLDivElement>(null);
    const headerRef                   = useRef<HTMLDivElement>(null);

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

    // ── Completion realtime ───────────────────────────────────────────────────
    const requiredFields = [
        bloodType, rhesus, heightCm, weightKg, generalHealth,
        eyeRightType, eyeLeftType,
        majorIllnesses, lastIllness,
        allergyFood, allergyMedicine, allergyCondition,
        physicalDisab,
    ];
    const completion = Math.round(
        (requiredFields.filter(Boolean).length / requiredFields.length) * 100
    );

    // ── Entrance animation ────────────────────────────────────────────────────
    useEffect(() => {
        animate(".health-header-item", {
            opacity:    [0, 1],
            translateY: [16, 0],
            duration:   500,
            delay:      stagger(70),
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
                // Auto-navigate ke tab yang punya error
                const fisikFields    = ["blood_type","rhesus","height_cm","weight_kg",
                                        "general_health_condition","eye_right_type","eye_left_type"];
                const riwayatFields  = ["major_illnesses","last_illness","allergy_food",
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
    // RENDER
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

            <div className="p-4 sm:p-6 max-w-3xl mx-auto">

                {/* ── Header ───────────────────────────────────────────────── */}
                <div className="mb-6">
                    <div className="health-header-item opacity-0 flex items-center gap-3 mb-4">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20
                                        flex items-center justify-center shrink-0">
                            <i className="fa-solid fa-heart-pulse text-emerald-400 text-sm"></i>
                        </div>
                        <div>
                            <h1 className="text-lg font-display font-bold
                                           dark:text-white text-slate-800 leading-tight">
                                Data Kesehatan
                            </h1>
                            <p className="text-xs dark:text-slate-500 text-slate-400 mt-0.5">
                                Rekam medis &amp; kondisi kesehatan kandidat
                            </p>
                        </div>
                    </div>

                    {/* Progress bar mini */}
                    <div className="health-header-item opacity-0">
                        <div className="flex items-center justify-between mb-1.5">
                            <p className="text-[11px] dark:text-slate-500 text-slate-400">
                                Kelengkapan data kesehatan
                            </p>
                            <p className="text-[11px] font-bold dark:text-emerald-400 text-emerald-600">
                                {completion}%
                            </p>
                        </div>
                        <div className="h-1 dark:bg-white/[0.05] bg-black/[0.06] rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-700"
                                style={{
                                    width: `${completion}%`,
                                    background: completion < 50
                                        ? "linear-gradient(to right, #c0392b, #e74c3c)"
                                        : completion < 75
                                            ? "linear-gradient(to right, #d35400, #f39c12)"
                                            : completion < 100
                                                ? "linear-gradient(to right, #059669, #34d399)"
                                                : "linear-gradient(to right, #1e8449, #27ae60)",
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* ── Tab nav ───────────────────────────────────────────────── */}
                <div className="health-header-item opacity-0 mb-5">
                    <div className="flex gap-1 overflow-x-auto no-scrollbar
                                    dark:bg-white/[0.03] bg-black/[0.04]
                                    rounded-2xl p-1
                                    border dark:border-white/[0.06] border-black/[0.06]">
                        {TABS.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => handleTabChange(tab.id)}
                                className={`
                                    flex items-center gap-2 px-3 py-2 rounded-xl
                                    text-xs font-semibold whitespace-nowrap shrink-0
                                    transition-all duration-200 min-h-[44px]
                                    ${activeTab === tab.id
                                        ? "dark:bg-emerald-500/15 bg-emerald-50 dark:text-emerald-400 text-emerald-700 border dark:border-emerald-500/20 border-emerald-200 shadow-sm"
                                        : "dark:text-slate-500 text-slate-400 dark:hover:text-slate-300 hover:text-slate-600 dark:hover:bg-white/[0.04] hover:bg-black/[0.03]"
                                    }
                                `}
                            >
                                <i className={`${tab.icon} text-[11px]`}></i>
                                {/* Mobile: hanya kata pertama */}
                                <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
                                <span className="hidden sm:inline">{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Tab content ───────────────────────────────────────────── */}
                <div
                    ref={tabContentRef}
                    className="dark:bg-content-card bg-white
                               border dark:border-content-border border-black/[0.07]
                               rounded-2xl p-5 sm:p-6 min-h-[420px]"
                >
                    {activeTab === "rangkuman" && (
                        <TabRangkuman
                            healthRecord={healthRecord}
                            bmi={bmi}
                            bmiCategory={bmiCategory}
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
                </div>

                {/* ── Submit — hanya muncul di tab form ────────────────────── */}
                {(activeTab === "fisik" || activeTab === "riwayat" || activeTab === "catatan") && (
                    <div className="mt-4 flex justify-end">
                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="flex items-center gap-2 px-6 py-3 rounded-xl
                                       bg-emerald-500 hover:bg-emerald-400
                                       text-white text-sm font-semibold
                                       transition-all duration-200
                                       disabled:opacity-60 disabled:cursor-not-allowed
                                       shadow-sm min-h-[44px]"
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