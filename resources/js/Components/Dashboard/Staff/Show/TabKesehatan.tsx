import { useEffect, useRef, useState } from "react";
import { animate, stagger } from "animejs";
import FilePreviewModal from "@/Components/UI/FilePreviewModal";
import { EmptyState, InfoField, Pill, SectionTitle } from "./ReadonlyParts";

export type HealthDocument = {
    key: string;
    label: string;
    icon: string;
    is_required: boolean;
    has_file: boolean;
    preview_url: string | null;
};

export type StaffHealthRecord = {
    blood_type: string | null;
    blood_type_label: string;
    rhesus: string | null;
    rhesus_label: string;
    height_cm: number | null;
    weight_kg: number | null;
    bmi: number | null;
    bmi_category: string | null;
    general_health_condition: string | null;
    mental_health_notes: string | null;
    eye_right_type: string | null;
    eye_right_value: number | null;
    eye_right_label: string;
    eye_left_type: string | null;
    eye_left_value: number | null;
    eye_left_label: string;
    eye_condition_since: number | null;
    major_illnesses: string | null;
    last_illness: string | null;
    allergy_food: string | null;
    allergy_medicine: string | null;
    allergy_condition: string | null;
    physical_disabilities: string | null;
    special_notes: string | null;
    parent_concern_notes: string | null;
    completion_percentage: number;
    documents: HealthDocument[];
} | null;

type TabId = "fisik" | "riwayat" | "catatan" | "tim-kesehatan" | "rangkuman";

const TABS: { id: TabId; label: string; icon: string }[] = [
    { id: "fisik", label: "Fisik", icon: "fa-solid fa-heart-pulse" },
    { id: "riwayat", label: "Riwayat", icon: "fa-solid fa-clock-rotate-left" },
    { id: "catatan", label: "Catatan Khusus", icon: "fa-solid fa-note-sticky" },
    { id: "tim-kesehatan", label: "Tim Kesehatan", icon: "fa-solid fa-user-doctor" },
    { id: "rangkuman", label: "Rangkuman", icon: "fa-solid fa-chart-pie" },
];

function TabButton({ tab, active, onClick }: { tab: (typeof TABS)[number]; active: boolean; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={tab.label}
            className={[
                "flex min-h-[44px] min-w-[132px] flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 transition-all duration-200",
                active
                    ? "bg-cyan-500 text-white shadow-sm shadow-cyan-500/20"
                    : "text-slate-500 hover:bg-black/[0.04] hover:text-slate-700 dark:text-slate-400 dark:hover:bg-content-muted dark:hover:text-slate-300",
            ].join(" ")}
        >
            <i className={`${tab.icon} text-xs shrink-0`}></i>
            <span className="whitespace-nowrap text-[11px] font-semibold sm:text-xs">{tab.label}</span>
        </button>
    );
}

function DocumentCard({ document }: { document: HealthDocument }) {
    return (
        <div className="rounded-2xl border border-black/[0.07] bg-white p-4 dark:border-white/[0.07] dark:bg-white/[0.02]">
            <div className="flex items-start gap-3">
                <div className={[
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                    document.has_file ? "bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400" : "bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500",
                ].join(" ")}>
                    <i className={`${document.icon} text-sm`}></i>
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{document.label}</p>
                        {document.is_required && <Pill tone="amber">Wajib</Pill>}
                        <Pill tone={document.has_file ? "blue" : "slate"}>
                            {document.has_file ? "Sudah diunggah" : "Belum diunggah"}
                        </Pill>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                        {document.is_required
                            ? "Berkas ini wajib direspons kandidat di halaman kesehatan."
                            : "Berkas pendukung kesehatan kandidat."}
                    </p>
                </div>
                {document.preview_url && (
                    <FilePreviewModal serverUrl={document.preview_url} label="Lihat" />
                )}
            </div>
        </div>
    );
}

export default function TabKesehatan({ healthRecord }: { healthRecord: StaffHealthRecord }) {
    const [activeTab, setActiveTab] = useState<TabId>("fisik");
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        animate(".staff-health-card", {
            opacity: [0, 1],
            translateY: [14, 0],
            duration: 480,
            delay: stagger(70),
            ease: "outExpo",
        });
    }, []);

    if (!healthRecord) {
        return (
            <EmptyState
                icon="fa-solid fa-heart-pulse"
                title="Data kesehatan belum tersedia"
                description="Kandidat belum mengisi rekam kesehatan."
            />
        );
    }

    const handleTabChange = (nextTab: TabId) => {
        if (nextTab === activeTab) return;

        const currentIdx = TABS.findIndex(tab => tab.id === activeTab);
        const nextIdx = TABS.findIndex(tab => tab.id === nextTab);
        const dir = nextIdx > currentIdx ? 1 : -1;

        if (contentRef.current) {
            animate(contentRef.current, {
                opacity: [1, 0],
                translateX: [0, dir * -22],
                duration: 170,
                ease: "inQuad",
            });
        }

        setTimeout(() => {
            setActiveTab(nextTab);
            if (contentRef.current) {
                animate(contentRef.current, {
                    opacity: [0, 1],
                    translateX: [dir * 22, 0],
                    duration: 360,
                    ease: "outExpo",
                });
            }
        }, 180);
    };

    return (
        <div className="space-y-5">
            <div className="staff-health-card opacity-0 rounded-xl border border-black/[0.08] bg-slate-50 p-1 dark:border-content-border dark:bg-content-card">
                <div className="flex gap-1 overflow-x-auto no-scrollbar">
                {TABS.map(tab => (
                    <TabButton
                        key={tab.id}
                        tab={tab}
                        active={activeTab === tab.id}
                        onClick={() => handleTabChange(tab.id)}
                    />
                ))}
                </div>
                <p className="mt-2 text-center text-[11px] font-semibold tracking-wide text-cyan-600 dark:text-cyan-400 sm:hidden">
                    {TABS.find(tab => tab.id === activeTab)?.label}
                </p>
            </div>

            <div
                ref={contentRef}
                className="staff-health-card opacity-0 rounded-xl border border-cyan-500/10 bg-cyan-50/30 p-4 dark:bg-cyan-500/[0.03] sm:p-5"
            >
                {activeTab === "fisik" && (
                    <div className="space-y-6">
                        <SectionTitle
                            icon="fa-solid fa-heart-pulse"
                            title="Data Fisik"
                            subtitle="Kondisi tubuh, darah, mata, dan catatan kesehatan umum."
                            tone="cyan"
                        />
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                            <InfoField label="Golongan Darah" value={healthRecord.blood_type_label} />
                            <InfoField label="Rhesus" value={healthRecord.rhesus_label} />
                            <InfoField label="Tinggi Badan" value={healthRecord.height_cm ? `${healthRecord.height_cm} cm` : null} />
                            <InfoField label="Berat Badan" value={healthRecord.weight_kg ? `${healthRecord.weight_kg} kg` : null} />
                            <InfoField
                                label="BMI"
                                value={healthRecord.bmi ? `${healthRecord.bmi} (${healthRecord.bmi_category ?? "-"})` : null}
                            />
                            <InfoField label="Kondisi Mata Kanan" value={healthRecord.eye_right_label} />
                            <InfoField label="Kondisi Mata Kiri" value={healthRecord.eye_left_label} />
                            <InfoField label="Kondisi Mata Sejak" value={healthRecord.eye_condition_since?.toString()} />
                            <InfoField label="Kondisi Kesehatan Umum" value={healthRecord.general_health_condition} className="sm:col-span-2 xl:col-span-3" />
                            <InfoField label="Catatan Mental/Kebiasaan" value={healthRecord.mental_health_notes} className="sm:col-span-2 xl:col-span-3" />
                        </div>
                    </div>
                )}

                {activeTab === "riwayat" && (
                    <div className="space-y-6">
                        <SectionTitle
                            icon="fa-solid fa-clock-rotate-left"
                            title="Riwayat Penyakit"
                            subtitle="Riwayat penyakit, alergi, dan kondisi fisik khusus."
                            tone="cyan"
                        />
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <InfoField label="Penyakit Berat Pernah Diderita" value={healthRecord.major_illnesses} />
                            <InfoField label="Sakit Terakhir yang Dialami" value={healthRecord.last_illness} />
                            <InfoField label="Alergi Makanan" value={healthRecord.allergy_food} />
                            <InfoField label="Alergi Obat" value={healthRecord.allergy_medicine} />
                            <InfoField label="Alergi Kondisi/Lingkungan" value={healthRecord.allergy_condition} />
                            <InfoField label="Disabilitas/Kebutuhan Khusus" value={healthRecord.physical_disabilities} />
                        </div>
                    </div>
                )}

                {activeTab === "catatan" && (
                    <div className="space-y-6">
                        <SectionTitle
                            icon="fa-solid fa-note-sticky"
                            title="Catatan Khusus & Dokumen Kesehatan"
                            subtitle="Catatan orang tua dan berkas kesehatan yang diunggah kandidat."
                            tone="cyan"
                        />
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <InfoField label="Catatan Khusus" value={healthRecord.special_notes} />
                            <InfoField label="Keluhan Terkini Orang Tua" value={healthRecord.parent_concern_notes} />
                        </div>
                        <div className="space-y-3">
                            {healthRecord.documents
                                .map(doc => <DocumentCard key={doc.key} document={doc} />)}
                        </div>
                    </div>
                )}

                {activeTab === "tim-kesehatan" && (
                    <EmptyState
                        icon="fa-solid fa-user-doctor"
                        title="Fitur tim kesehatan belum aktif"
                        description="Tab kandidat masih berupa placeholder. Versi staff menampilkan status yang sama agar alurnya konsisten."
                    />
                )}

                {activeTab === "rangkuman" && (
                    <div className="space-y-6">
                        <SectionTitle
                            icon="fa-solid fa-chart-pie"
                            title="Rangkuman Kesehatan"
                            subtitle="Ringkasan cepat untuk validasi awal staff."
                            tone="cyan"
                        />
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                            <InfoField label="Kelengkapan" value={`${healthRecord.completion_percentage}%`} />
                            <InfoField label="Golongan Darah" value={`${healthRecord.blood_type_label} / ${healthRecord.rhesus_label}`} />
                            <InfoField label="BMI" value={healthRecord.bmi ? `${healthRecord.bmi} (${healthRecord.bmi_category ?? "-"})` : null} />
                            <InfoField label="Mata" value={`${healthRecord.eye_right_label} / ${healthRecord.eye_left_label}`} />
                            <InfoField label="Berkas Kesehatan" value={`${healthRecord.documents.filter(doc => doc.has_file).length} dari ${healthRecord.documents.length} berkas`} />
                            <InfoField label="BPJS/JKN" value={healthRecord.documents.find(doc => doc.key === "bpjs-card")?.has_file ? "Sudah diunggah" : "Belum diunggah"} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
