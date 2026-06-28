// resources/js/Components/Dashboard/Candidate/DataDiri/TabRangkuman.tsx

import { useEffect }        from "react";
import { animate, stagger } from "animejs";
import {
    SummaryActionFooter,
    SummaryEmptyState,
    SummaryStatus,
    SummaryWarning,
    type SummaryMissingGroup,
} from "@/Components/Dashboard/Candidate/Shared/SummaryLayout";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type TabId = "identitas" | "alamat" | "minat" | "program" | "rangkuman";

type EmptyField = { key: string; label: string; tab: TabId };

type FormState = {
    religion:      string;
    phoneNumber:   string;
    email:         string;
    birthCertNo:   string;
    familyCardNo:  string;
    childOrder:    string;
    siblingsCount: string;
    postalCode:    string;
    schoolNpsn:    string;
    certNumber:    string;
    isTransfer:    boolean;
    hobbies:       string;
    ambitions:     string;
    habits:        string;
    extracts:      string[];
    programChoice: string;
    majorChoice:   string;
};

type Props = {
    candidate: {
        full_name:           string;
        nisn:                string;
        nik:                 string;
        gender_label:        string;
        date_of_birth_label: string;
        place_of_birth:      string;
        school_origin:       string;
        address_full:        string;
    };
    formState:           FormState;
    emptyRequiredFields: EmptyField[];
    progressGradient:    string;
    completion:          number;
    submitting:          boolean;
    onNavigateToTab:     (tab: TabId) => void;
    onSubmitAll:         () => void;
};

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS — identik dengan DataKesehatan, warna blue
// ─────────────────────────────────────────────────────────────────────────────

function SummaryCard({ icon, title, onEdit, children }: {
    icon:     string;
    title:    string;
    onEdit:   () => void;
    children: React.ReactNode;
}) {
    return (
        <div className="rangkuman-dd-card opacity-0 rounded-xl border overflow-hidden
                        dark:border-white/[0.07] border-black/[0.07]
                        dark:bg-white/[0.02] bg-white">
            <div className="flex items-center justify-between px-4 py-2.5
                            border-b dark:border-white/[0.06] border-black/[0.06]
                            dark:bg-white/[0.03] bg-slate-50">
                <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md flex items-center justify-center
                                    dark:bg-blue-500/20 bg-blue-50">
                        <i className={`${icon} text-blue-400 text-[10px]`}></i>
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
                               dark:hover:text-blue-400 hover:text-blue-600
                               flex items-center gap-1 transition-colors duration-150"
                >
                    <i className="fa-solid fa-pen-to-square text-[9px]"></i>
                    Edit
                </button>
            </div>
            <div>{children}</div>
        </div>
    );
}

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
    candidate, formState,
    emptyRequiredFields, progressGradient, completion,
    submitting, onNavigateToTab, onSubmitAll,
}: Props) {
    const {
        religion, phoneNumber, email, birthCertNo, familyCardNo,
        childOrder, siblingsCount, postalCode, schoolNpsn, certNumber,
        isTransfer, hobbies, ambitions, habits, extracts,
        programChoice, majorChoice,
    } = formState;

    useEffect(() => {
        animate(".rangkuman-dd-card, .summary-card", {
            opacity:    [0, 1],
            translateY: [12, 0],
            duration:   450,
            delay:      stagger(60),
            ease:       "outExpo",
        });
    }, []);

    const tabLabels: Record<TabId, string> = {
        identitas: "Identitas",
        alamat:    "Alamat & Sekolah",
        minat:     "Minat & Bakat",
        program:   "Program",
        rangkuman: "Rangkuman",
    };

    const emptyByTab = emptyRequiredFields.reduce<Record<string, EmptyField[]>>(
        (acc, f) => { if (!acc[f.tab]) acc[f.tab] = []; acc[f.tab].push(f); return acc; },
        {}
    );
    const missingGroups: SummaryMissingGroup<TabId>[] = (Object.entries(emptyByTab) as [TabId, EmptyField[]][])
        .map(([tab, fields]) => ({
            tab,
            label: tabLabels[tab],
            fields: fields.map(({ key, label }) => ({ key, label })),
        }));

    const isEmpty = !religion && !programChoice && !phoneNumber;
    if (isEmpty) {
        return (
            <SummaryEmptyState
                accent="blue"
                icon="fa-solid fa-id-card"
                title="Data diri belum diisi"
                description="Mulai dari tab"
                actionLabel="Identitas"
                onAction={() => onNavigateToTab("identitas")}
            />
        );
    }

    return (
        <div className="flex flex-col gap-4">

            <SummaryStatus
                accent="blue"
                completion={completion}
                completeMessage="Semua data wajib sudah diisi - data diri lengkap!"
                missingGroups={missingGroups}
                onNavigate={onNavigateToTab}
            />

            {/* ── Grid 2 kolom ──────────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                {/* Identitas */}
                <SummaryCard icon="fa-solid fa-id-card" title="Identitas"
                    onEdit={() => onNavigateToTab("identitas")}>
                    <Row label="Nama lengkap"  value={candidate.full_name} />
                    <Row label="NISN"          value={candidate.nisn} />
                    <Row label="NIK"           value={candidate.nik} />
                    <Row label="Jenis kelamin" value={candidate.gender_label} />
                    <Row label="Tempat lahir"  value={candidate.place_of_birth} />
                    <Row label="Tanggal lahir" value={candidate.date_of_birth_label} />
                    <Row label="Agama"         value={religion} />
                    <Row label="Nomor HP/WA"   value={phoneNumber} />
                    <Row label="Email"         value={email} />
                    <Row label="No. KK"        value={familyCardNo} />
                    <Row label="No. Akta lahir" value={birthCertNo} />
                    <Row label="Anak ke-"      value={childOrder} />
                    <Row label="Jml. saudara"  value={siblingsCount} />
                </SummaryCard>

                {/* Alamat & Sekolah */}
                <SummaryCard icon="fa-solid fa-map-location-dot" title="Alamat & Sekolah"
                    onEdit={() => onNavigateToTab("alamat")}>
                    <Row label="Alamat domisili" value={candidate.address_full} />
                    <Row label="Kode pos"        value={postalCode} />
                    <Row label="Asal sekolah"    value={candidate.school_origin} />
                    <Row label="NPSN sekolah"    value={schoolNpsn} />
                    <Row label="No. ijazah"      value={certNumber} />
                    <div className="flex items-baseline justify-between gap-3 px-4 py-[7px]
                                    border-b dark:border-white/[0.04] border-black/[0.04] last:border-0">
                        <p className="text-[11px] dark:text-slate-500 text-slate-400 shrink-0">
                            Status
                        </p>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full
                            ${isTransfer
                                ? "dark:bg-amber-500/10 bg-amber-50 dark:text-amber-400 text-amber-600 border dark:border-amber-500/20 border-amber-200"
                                : "dark:bg-white/[0.05] bg-slate-100 dark:text-slate-400 text-slate-500 border dark:border-white/[0.07] border-black/[0.07]"
                            }`}>
                            {isTransfer ? "Siswa Pindahan" : "Reguler"}
                        </span>
                    </div>
                </SummaryCard>

                {/* Minat & Bakat */}
                <SummaryCard icon="fa-solid fa-star" title="Minat & Bakat"
                    onEdit={() => onNavigateToTab("minat")}>
                    <Row label="Hobi / Minat"     value={hobbies} />
                    <Row label="Cita-cita"         value={ambitions} />
                    <Row label="Kebiasaan positif" value={habits} />
                    <div className="flex items-start justify-between gap-3 px-4 py-[7px]">
                        <p className="text-[11px] dark:text-slate-500 text-slate-400 shrink-0 mt-0.5">
                            Minat ekskul
                        </p>
                        <div className="flex flex-wrap gap-1 justify-end min-w-0">
                            {extracts.length > 0
                                ? extracts.map(e => (
                                    <span key={e}
                                        className="text-[10px] px-2 py-0.5 rounded-full
                                                   dark:bg-blue-500/10 bg-blue-50
                                                   dark:text-blue-400 text-blue-600
                                                   border dark:border-blue-500/20 border-blue-200">
                                        {e}
                                    </span>
                                ))
                                : <span className="text-[12px] font-medium dark:text-slate-600 text-slate-300 italic">—</span>
                            }
                        </div>
                    </div>
                </SummaryCard>

                {/* Program */}
                <SummaryCard icon="fa-solid fa-graduation-cap" title="Program"
                    onEdit={() => onNavigateToTab("program")}>
                    <Row label="Pilihan program" value={programChoice}
                        valueClass="dark:text-blue-400 text-blue-600 font-semibold" />
                    {majorChoice && <Row label="Pilihan jurusan" value={majorChoice} />}
                </SummaryCard>

            </div>

            <SummaryWarning count={emptyRequiredFields.length} />

            <SummaryActionFooter
                accent="blue"
                title="Simpan Semua Data Diri"
                description="Data dari semua tab akan disimpan sekaligus"
                submitting={submitting}
                onSubmit={onSubmitAll}
            />

        </div>
    );
}
