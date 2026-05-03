// resources/js/Pages/Dashboard/Staff/Show.tsx

import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { animate, stagger } from "animejs";
import Swal from "sweetalert2";
import DashboardSplitLayout from "@/Layouts/DashboardSplitLayout";
import StaffSidebar from "@/Components/Dashboard/Staff/Shared/StaffSidebar";
import TabIdentitas from "@/Components/Dashboard/Staff/Show/TabIdentitas";
import TabWali from "@/Components/Dashboard/Staff/Show/TabWali";
import TabKesehatan from "@/Components/Dashboard/Staff/Show/TabKesehatan";
import type { Guardian } from "@/Components/Dashboard/Staff/Show/TabWali";
import type { HealthRecord } from "@/Components/Dashboard/Staff/Show/TabKesehatan";
import type { DocumentItem } from "@/Components/Dashboard/Staff/Show/TabDokumen";
import type { PageProps } from "@/types";

// ── Lazy load TabDokumen (form-heavy, tidak perlu eager) ─────────────────────
const TabDokumen = lazy(() => import("@/Components/Dashboard/Staff/Show/TabDokumen"));

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type Candidate = {
    id:             number;
    candidate_code: string;
    full_name:      string;
    nisn:           string | null;
    nik:            string | null;
    gender_label:   string | null;
    place_of_birth: string | null;
    date_of_birth:  string | null;
    school_origin:  string | null;
    status:         "draft" | "submitted" | "verified" | "accepted" | "rejected";
    program_choice: string | null;
    email:          string | null;
    admission_wave: string | null;
};

type Props = {
    candidate:     Candidate;
    documents:     DocumentItem[];
    guardian:      Guardian;
    health_record: HealthRecord;
    flash?:        { success?: string; error?: string };
};

type TabId = "identitas" | "dokumen" | "wali" | "kesehatan";

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const TABS: { id: TabId; label: string; icon: string }[] = [
    { id: "identitas", label: "Identitas", icon: "fa-solid fa-user" },
    { id: "dokumen",   label: "Dokumen",   icon: "fa-solid fa-file-lines" },
    { id: "wali",      label: "Data Wali", icon: "fa-solid fa-users" },
    { id: "kesehatan", label: "Kesehatan", icon: "fa-solid fa-heart-pulse" },
];

const CANDIDATE_STATUS_LABEL: Record<Candidate["status"], string> = {
    draft:     "Draft",
    submitted: "Menunggu Verifikasi",
    verified:  "Terverifikasi",
    accepted:  "Diterima",
    rejected:  "Ditolak",
};

const CANDIDATE_STATUS_CLASS: Record<Candidate["status"], string> = {
    draft:     "bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300",
    submitted: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
    verified:  "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
    accepted:  "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
    rejected:  "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400",
};

// ─────────────────────────────────────────────────────────────────────────────
// SWAL CONFIG
// ─────────────────────────────────────────────────────────────────────────────

const swalDark = Swal.mixin({
    background: "#0f172a",
    color:      "#e2e8f0",
    confirmButtonColor: "#10b981",
    cancelButtonColor:  "#334155",
    customClass: {
        popup:         "!rounded-2xl !border !border-white/10",
        confirmButton: "!rounded-xl !px-6",
        cancelButton:  "!rounded-xl !px-6",
    },
});

// ─────────────────────────────────────────────────────────────────────────────
// TAB SKELETON (Suspense fallback)
// ─────────────────────────────────────────────────────────────────────────────

function TabSkeleton() {
    return (
        <div className="animate-pulse space-y-4 p-2">
            <div className="h-4 w-48 rounded-lg bg-slate-200 dark:bg-white/10" />
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                        <div className="h-2.5 w-20 rounded bg-slate-100 dark:bg-white/5" />
                        <div className="h-4 w-32 rounded bg-slate-200 dark:bg-white/10" />
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function StaffCandidateShow({
    candidate,
    documents,
    guardian,
    health_record,
    flash,
}: Props) {
    const { auth } = usePage<PageProps>().props;

    // ── Tab state ────────────────────────────────────────────────────────────
    const [activeTab, setActiveTab] = useState<TabId>("identitas");
    const tabContentRef = useRef<HTMLDivElement>(null);

    // ── Document verify state ────────────────────────────────────────────────
    const [docTarget, setDocTarget]       = useState<number | null>(null);
    const [docStatus, setDocStatus]       = useState<"verified" | "rejected">("verified");
    const [docReason, setDocReason]       = useState("");
    const [docProcessing, setDocProcessing] = useState(false);

    // ── Candidate final status state ─────────────────────────────────────────
    const [candidateFinalStatus, setCandidateFinalStatus] = useState<"accepted" | "rejected">("accepted");
    const [candidateReason, setCandidateReason]           = useState("");
    const [candidateProcessing, setCandidateProcessing]   = useState(false);

    // ── Computed ─────────────────────────────────────────────────────────────
    const verificationCompletion = useMemo(() => {
        if (documents.length === 0) return 0;
        const done = documents.filter((d) => d.status === "verified").length;
        return Math.round((done / documents.length) * 100);
    }, [documents]);

    // ── Entrance animation ───────────────────────────────────────────────────
    useEffect(() => {
        animate(".staff-show-item", {
            opacity:    [0, 1],
            translateY: [20, 0],
            duration:   550,
            delay:      stagger(70),
            ease:       "outExpo",
        });
    }, []);

    // ── Flash handler ────────────────────────────────────────────────────────
    useEffect(() => {
        if (flash?.success) {
            swalDark.fire({
                toast:             true,
                position:          "top-end",
                icon:              "success",
                title:             flash.success,
                showConfirmButton: false,
                timer:             2200,
                timerProgressBar:  true,
            });
        }
        if (flash?.error) {
            swalDark.fire({ icon: "error", title: "Gagal", text: flash.error });
        }
    }, [flash]);

    // ── Tab transition ───────────────────────────────────────────────────────
    const handleTabChange = (tabId: TabId) => {
        if (tabId === activeTab) return;

        const currentIdx = TABS.findIndex((t) => t.id === activeTab);
        const nextIdx    = TABS.findIndex((t) => t.id === tabId);
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
                    duration:   360,
                    ease:       "outExpo",
                });
            }
        }, 190);
    };

    // ── Document verify handler ───────────────────────────────────────────────
    const handleSelectDoc = (
        id: number,
        currentStatus: "pending" | "verified" | "rejected",
        reason: string | null,
    ) => {
        setDocTarget(id);
        setDocStatus(currentStatus === "rejected" ? "rejected" : "verified");
        setDocReason(reason ?? "");
    };

    const submitVerifyDocument = async (e: React.FormEvent) => {
        e.preventDefault();
        const selectedDoc = documents.find((d) => d.id === docTarget);
        if (!selectedDoc || docProcessing) return;

        if (docStatus === "rejected" && !docReason.trim()) {
            await swalDark.fire({
                icon:  "warning",
                title: "Alasan wajib diisi",
                text:  "Jika status rejected, alasan penolakan harus diisi.",
            });
            return;
        }

        const actionLabel = docStatus === "verified" ? "verifikasi" : "reject";
        const confirmed = await swalDark.fire({
            title:             `Konfirmasi ${actionLabel} dokumen?`,
            text:              selectedDoc.original_filename,
            icon:              "question",
            showCancelButton:  true,
            confirmButtonText: "Ya, lanjutkan",
            cancelButtonText:  "Batal",
        });
        if (!confirmed.isConfirmed) return;

        setDocProcessing(true);
        router.post(
            `/dashboard/staff/documents/${selectedDoc.id}/verify`,
            {
                status:           docStatus,
                rejection_reason: docStatus === "rejected" ? docReason : undefined,
            },
            {
                preserveScroll: true,
                onSuccess: () => { setDocReason(""); setDocTarget(null); },
                onFinish:  () => setDocProcessing(false),
            }
        );
    };

    // ── Candidate final status handler ────────────────────────────────────────
    const submitCandidateStatus = async (e: React.FormEvent) => {
        e.preventDefault();
        if (candidateProcessing) return;

        if (candidateFinalStatus === "rejected" && !candidateReason.trim()) {
            await swalDark.fire({
                icon:  "warning",
                title: "Alasan wajib diisi",
                text:  "Jika status akhir rejected, alasan wajib diisi.",
            });
            return;
        }

        const confirmed = await swalDark.fire({
            title:             "Ubah status kandidat?",
            text:              "Pastikan verifikasi dokumen sudah selesai.",
            icon:              "warning",
            showCancelButton:  true,
            confirmButtonText: "Ya, update status",
            cancelButtonText:  "Batal",
        });
        if (!confirmed.isConfirmed) return;

        setCandidateProcessing(true);
        router.post(
            `/dashboard/staff/candidates/${candidate.id}/status`,
            {
                status: candidateFinalStatus,
                reason: candidateFinalStatus === "rejected" ? candidateReason : undefined,
            },
            {
                preserveScroll: true,
                onFinish: () => setCandidateProcessing(false),
            }
        );
    };

    // ─────────────────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────────────────

    return (
        <DashboardSplitLayout
            aside={
                <StaffSidebar
                    user={auth.user}
                    candidate={{
                        full_name:      candidate.full_name,
                        candidate_code: candidate.candidate_code,
                        status:         candidate.status,
                        admission_wave: candidate.admission_wave,
                    }}
                    completion={verificationCompletion}
                    tips={[
                        "Verifikasi dokumen satu per satu untuk audit trail yang jelas.",
                        "Status akhir hanya valid setelah kandidat berstatus verified.",
                        "Gunakan alasan penolakan yang jelas dan sopan untuk kandidat.",
                    ]}
                />
            }
        >
            <Head title="Staff · Detail Kandidat" />

            <div className="space-y-5 px-6 py-6">

                {/* ── Page header ──────────────────────────────────────────── */}
                <div className="staff-show-item opacity-0 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl shrink-0
                                    bg-gradient-to-br from-emerald-500 to-teal-500
                                    flex items-center justify-center
                                    shadow-lg shadow-emerald-500/25">
                        <i className="fa-solid fa-user-check text-white text-sm" />
                    </div>
                    <div>
                        <h1 className="text-xl font-display font-bold
                                       text-slate-800 dark:text-white leading-tight">
                            Candidate Review
                        </h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Verifikasi berlapis untuk kualitas data admission
                        </p>
                    </div>
                </div>

                {/* ── Candidate summary bar ────────────────────────────────── */}
                <div className="staff-show-item opacity-0
                                flex items-center justify-between gap-3 flex-wrap">
                    <div>
                        <p className="text-lg font-display font-bold
                                      text-slate-800 dark:text-slate-100">
                            {candidate.full_name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {candidate.candidate_code}
                            {candidate.nisn   ? ` · ${candidate.nisn}` : ""}
                            {candidate.email  ? ` · ${candidate.email}` : ""}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-3 py-1.5
                                          rounded-xl text-xs font-semibold
                                          ${CANDIDATE_STATUS_CLASS[candidate.status]}`}>
                            {CANDIDATE_STATUS_LABEL[candidate.status]}
                        </span>
                        <Link
                            href="/dashboard/staff/candidates"
                            className="h-11 px-4 rounded-xl
                                       border border-slate-200 dark:border-white/10
                                       text-sm font-semibold
                                       text-slate-600 dark:text-slate-300
                                       hover:border-emerald-500 hover:text-emerald-500
                                       transition-colors inline-flex items-center gap-2"
                        >
                            <i className="fa-solid fa-arrow-left text-xs" />
                            Kembali
                        </Link>
                    </div>
                </div>

                {/* ── Tab bar ──────────────────────────────────────────────── */}
                <div className="staff-show-item opacity-0">
                    <div className="flex overflow-x-auto rounded-xl
                                    border border-black/[0.08] dark:border-content-border
                                    bg-slate-50 dark:bg-content-card
                                    p-1 gap-1 no-scrollbar">
                        {TABS.map((tab) => {
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => handleTabChange(tab.id)}
                                    className={[
                                        "flex flex-1 min-w-[110px] items-center justify-center",
                                        "gap-2 rounded-lg px-3 py-2.5 text-xs font-semibold",
                                        "transition-all duration-200",
                                        isActive
                                            ? "bg-emerald-500 text-white shadow-sm"
                                            : "text-slate-500 dark:text-slate-400 hover:bg-black/[0.04] dark:hover:bg-content-muted hover:text-slate-700 dark:hover:text-slate-200",
                                    ].join(" ")}
                                >
                                    <i className={`${tab.icon} text-xs`} />
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ── Tab content ──────────────────────────────────────────── */}
                <div
                    ref={tabContentRef}
                    className="staff-show-item opacity-0
                               rounded-2xl border border-black/[0.07] dark:border-content-border
                               bg-white dark:bg-content-surface p-6"
                >
                    {activeTab === "identitas" && (
                        <TabIdentitas candidate={candidate} />
                    )}

                    {activeTab === "dokumen" && (
                        <Suspense fallback={<TabSkeleton />}>
                            <TabDokumen
                                documents={documents}
                                candidateStatus={candidate.status}
                                docTarget={docTarget}
                                docStatus={docStatus}
                                docReason={docReason}
                                docProcessing={docProcessing}
                                candidateFinalStatus={candidateFinalStatus}
                                candidateReason={candidateReason}
                                candidateProcessing={candidateProcessing}
                                onSelectDoc={handleSelectDoc}
                                onDocStatusChange={setDocStatus}
                                onDocReasonChange={setDocReason}
                                onSubmitDoc={submitVerifyDocument}
                                onCandidateStatusChange={setCandidateFinalStatus}
                                onCandidateReasonChange={setCandidateReason}
                                onSubmitCandidateStatus={submitCandidateStatus}
                            />
                        </Suspense>
                    )}

                    {activeTab === "wali" && (
                        <TabWali guardian={guardian} />
                    )}

                    {activeTab === "kesehatan" && (
                        <TabKesehatan healthRecord={health_record} />
                    )}
                </div>

            </div>
        </DashboardSplitLayout>
    );
}