// resources/js/Pages/Dashboard/Staff/Show.tsx

import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { animate, stagger } from "animejs";
import Swal from "sweetalert2";
import DashboardSplitLayout from "@/Layouts/DashboardSplitLayout";
import StaffSidebar from "@/Components/Dashboard/Staff/Shared/StaffSidebar";
import OperationalOverview, { type StaffCandidateOverview } from "@/Components/Dashboard/Staff/Show/OperationalOverview";
import TabDataDiri, { type StaffCandidateData } from "@/Components/Dashboard/Staff/Show/TabDataDiri";
import TabKesehatan, { type StaffHealthRecord } from "@/Components/Dashboard/Staff/Show/TabKesehatan";
import TabWali, { type StaffGuardian } from "@/Components/Dashboard/Staff/Show/TabWali";
import type { DocumentItem } from "@/Components/Dashboard/Staff/Show/TabDokumen";
import type { StaffPayment } from "@/Components/Dashboard/Staff/Show/TabPembayaran";
import type { PageProps } from "@/types";

const TabDokumen = lazy(() => import("@/Components/Dashboard/Staff/Show/TabDokumen"));
const TabPembayaran = lazy(() => import("@/Components/Dashboard/Staff/Show/TabPembayaran"));

type SectionId = "data-diri" | "data-kesehatan" | "data-wali" | "dokumen" | "pembayaran";

type Props = {
    scope?: "staff" | "admin";
    base_path?: string;
    active_section: SectionId;
    candidate: StaffCandidateData;
    overview: StaffCandidateOverview;
    documents: DocumentItem[];
    guardian: StaffGuardian;
    health_record: StaffHealthRecord;
    payment: StaffPayment;
    flash?: { success?: string; error?: string };
};

const SECTION_META: Record<SectionId, { label: string; icon: string; tone: string; description: string }> = {
    "data-diri": {
        label: "Data Diri",
        icon: "fa-solid fa-id-card",
        tone: "from-blue-500 to-sky-500 shadow-blue-500/25",
        description: "Review identitas, alamat, minat, dan pilihan program kandidat.",
    },
    "data-kesehatan": {
        label: "Data Kesehatan",
        icon: "fa-solid fa-heart-pulse",
        tone: "from-cyan-500 to-teal-500 shadow-cyan-500/25",
        description: "Review rekam kesehatan, catatan, dan berkas kesehatan kandidat.",
    },
    "data-wali": {
        label: "Data Wali",
        icon: "fa-solid fa-people-roof",
        tone: "from-violet-500 to-fuchsia-500 shadow-violet-500/25",
        description: "Review data orang tua, wali, dan profil keluarga kandidat.",
    },
    dokumen: {
        label: "Dokumen",
        icon: "fa-solid fa-file-lines",
        tone: "from-amber-500 to-yellow-500 shadow-amber-500/25",
        description: "Preview dan validasi dokumen pendaftaran kandidat.",
    },
    pembayaran: {
        label: "Pembayaran",
        icon: "fa-solid fa-credit-card",
        tone: "from-orange-500 to-rose-500 shadow-orange-500/25",
        description: "Review transaksi dan validasi bukti pembayaran manual.",
    },
};

const CANDIDATE_STATUS_LABEL: Record<StaffCandidateData["status"], string> = {
    draft: "Draft",
    submitted: "Menunggu Verifikasi",
    verified: "Terverifikasi",
    accepted: "Diterima",
    rejected: "Ditolak",
};

const CANDIDATE_STATUS_CLASS: Record<StaffCandidateData["status"], string> = {
    draft: "bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300",
    submitted: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
    verified: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
    accepted: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
    rejected: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400",
};

const swalDark = Swal.mixin({
    background: "#0f172a",
    color: "#e2e8f0",
    confirmButtonColor: "#10b981",
    cancelButtonColor: "#334155",
    customClass: {
        popup: "!rounded-2xl !border !border-white/10",
        confirmButton: "!rounded-xl !px-6",
        cancelButton: "!rounded-xl !px-6",
    },
});

function TabSkeleton() {
    return (
        <div className="animate-pulse space-y-4 p-2">
            <div className="h-4 w-48 rounded-lg bg-slate-200 dark:bg-white/10" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-20 rounded-xl bg-slate-100 dark:bg-white/5" />
                ))}
            </div>
        </div>
    );
}

export default function StaffCandidateShow({
    scope = "staff",
    base_path,
    active_section,
    candidate,
    overview,
    documents,
    guardian,
    health_record,
    payment,
    flash,
}: Props) {
    const { auth } = usePage<PageProps>().props;
    const section = active_section ?? "data-diri";
    const meta = SECTION_META[section];
    const contentRef = useRef<HTMLDivElement>(null);
    const basePath = base_path ?? (scope === "admin" ? "/dashboard/admin" : "/dashboard/staff");
    const selectedCandidateStorageKey = `${scope}:selectedCandidateId`;

    const [docTarget, setDocTarget] = useState<number | null>(null);
    const [docStatus, setDocStatus] = useState<"verified" | "rejected">("verified");
    const [docReason, setDocReason] = useState("");
    const [docProcessing, setDocProcessing] = useState(false);

    const [candidateFinalStatus, setCandidateFinalStatus] = useState<"accepted" | "rejected">("accepted");
    const [candidateReason, setCandidateReason] = useState("");
    const [candidateProcessing, setCandidateProcessing] = useState(false);

    const verificationCompletion = useMemo(() => {
        if (documents.length === 0) return 0;
        const done = documents.filter((d) => d.status === "verified").length;
        return Math.round((done / documents.length) * 100);
    }, [documents]);

    const tips = useMemo(() => {
        if (section === "dokumen") {
            return [
                "Gunakan preview sebelum memutuskan status dokumen.",
                "Reject dokumen harus disertai alasan yang jelas.",
                "Status akhir hanya valid setelah semua dokumen selesai diverifikasi.",
            ];
        }
        if (section === "pembayaran") {
            return [
                "Validasi pembayaran hanya untuk bukti manual yang sudah diunggah.",
                "Pastikan nominal dan identitas pembayaran sesuai kandidat.",
                "Alasan penolakan akan dibaca kandidat saat upload ulang.",
            ];
        }
        return [
            "Halaman ini read-only untuk menjaga audit trail data kandidat.",
            "Validasi status hanya dilakukan pada dokumen dan bukti pembayaran.",
            "Gunakan menu Kandidat di sidebar kiri untuk pindah bagian kandidat ini.",
        ];
    }, [section]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        window.localStorage.setItem(selectedCandidateStorageKey, String(candidate.id));
    }, [candidate.id, selectedCandidateStorageKey]);

    useEffect(() => {
        animate(".staff-show-item", {
            opacity: [0, 1],
            translateY: [20, 0],
            duration: 550,
            delay: stagger(70),
            ease: "outExpo",
        });
    }, [section]);

    useEffect(() => {
        if (contentRef.current) {
            animate(contentRef.current, {
                opacity: [0, 1],
                translateY: [12, 0],
                duration: 360,
                ease: "outExpo",
            });
        }
    }, [section]);

    useEffect(() => {
        if (flash?.success) {
            swalDark.fire({
                toast: true,
                position: "top-end",
                icon: "success",
                title: flash.success,
                showConfirmButton: false,
                timer: 2200,
                timerProgressBar: true,
            });
        }
        if (flash?.error) {
            swalDark.fire({ icon: "error", title: "Gagal", text: flash.error });
        }
    }, [flash]);

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
                icon: "warning",
                title: "Alasan wajib diisi",
                text: "Jika status rejected, alasan penolakan harus diisi.",
            });
            return;
        }

        const confirmed = await swalDark.fire({
            title: docStatus === "verified" ? "Verifikasi dokumen?" : "Reject dokumen?",
            text: selectedDoc.original_filename,
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Ya, lanjutkan",
            cancelButtonText: "Batal",
        });

        if (!confirmed.isConfirmed) return;

        setDocProcessing(true);
        router.post(
            `${basePath}/documents/${selectedDoc.id}/verify`,
            {
                status: docStatus,
                rejection_reason: docStatus === "rejected" ? docReason : undefined,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setDocReason("");
                    setDocTarget(null);
                },
                onFinish: () => setDocProcessing(false),
            }
        );
    };

    const submitCandidateStatus = async (e: React.FormEvent) => {
        e.preventDefault();
        if (candidateProcessing) return;

        if (candidateFinalStatus === "rejected" && !candidateReason.trim()) {
            await swalDark.fire({
                icon: "warning",
                title: "Alasan wajib diisi",
                text: "Jika status akhir rejected, alasan wajib diisi.",
            });
            return;
        }

        const confirmed = await swalDark.fire({
            title: "Ubah status kandidat?",
            text: "Pastikan verifikasi dokumen sudah selesai.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Ya, update status",
            cancelButtonText: "Batal",
        });

        if (!confirmed.isConfirmed) return;

        setCandidateProcessing(true);
        router.post(
            `${basePath}/candidates/${candidate.id}/status`,
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

    const renderSection = () => {
        if (section === "data-diri") {
            return <TabDataDiri candidate={candidate} />;
        }

        if (section === "data-kesehatan") {
            return <TabKesehatan healthRecord={health_record} />;
        }

        if (section === "data-wali") {
            return <TabWali guardian={guardian} />;
        }

        if (section === "dokumen") {
            return (
                <Suspense fallback={<TabSkeleton />}>
                    <TabDokumen
                        documents={documents}
                        docTarget={docTarget}
                        docStatus={docStatus}
                        docReason={docReason}
                        docProcessing={docProcessing}
                        onSelectDoc={handleSelectDoc}
                        onDocStatusChange={setDocStatus}
                        onDocReasonChange={setDocReason}
                        onSubmitDoc={submitVerifyDocument}
                    />
                </Suspense>
            );
        }

        return (
            <Suspense fallback={<TabSkeleton />}>
                <TabPembayaran payment={payment} basePath={basePath} />
            </Suspense>
        );
    };

    return (
        <DashboardSplitLayout
            aside={
                <StaffSidebar
                    user={auth.user}
                    scope={scope}
                    basePath={basePath}
                    candidate={{
                        full_name: candidate.full_name,
                        candidate_code: candidate.candidate_code,
                        status: candidate.status,
                        admission_wave: candidate.admission_wave?.title ?? null,
                    }}
                    completion={verificationCompletion}
                    tips={tips}
                />
            }
        >
            <Head title={`${scope === "admin" ? "Admin" : "Staff"} - ${meta.label}`} />

            <div className="space-y-5 px-4 py-6 sm:px-6">
                <div className="staff-show-item opacity-0 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                            <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold ${CANDIDATE_STATUS_CLASS[candidate.status]}`}>
                                {CANDIDATE_STATUS_LABEL[candidate.status]}
                            </span>
                            <span className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-500 dark:border-white/10 dark:text-slate-300">
                                <i className={`${meta.icon} text-[10px]`} />
                                {meta.label}
                            </span>
                        </div>
                        <h1 className="truncate font-display text-2xl font-black text-slate-900 dark:text-white">
                            {candidate.full_name}
                        </h1>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            {candidate.candidate_code}
                            {candidate.nisn ? ` - NISN ${candidate.nisn}` : ""}
                            {candidate.account_email ? ` - ${candidate.account_email}` : ""}
                        </p>
                        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                            {overview.primary_blocker.description}
                        </p>
                    </div>
                    <Link
                        href={`${basePath}/candidates`}
                        className="inline-flex min-h-10 items-center gap-2 self-start rounded-md border border-slate-200 px-3 text-sm font-bold text-slate-600 transition hover:border-emerald-400 hover:text-emerald-600 dark:border-white/10 dark:text-slate-300"
                    >
                        <i className="fa-solid fa-arrow-left text-xs" />
                        Kembali
                    </Link>
                </div>

                <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
                    <div className="space-y-5">
                        <OperationalOverview overview={overview} />

                        <div
                            ref={contentRef}
                            className="staff-show-item opacity-0 rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:p-6"
                        >
                            <div className="mb-5 flex flex-col gap-3 border-b border-slate-100 pb-4 dark:border-white/10 sm:flex-row sm:items-start sm:justify-between">
                                <div className="flex items-start gap-3">
                                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-gradient-to-br ${meta.tone}`}>
                                        <i className={`${meta.icon} text-sm text-white`} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-slate-900 dark:text-white">{meta.label}</p>
                                        <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{meta.description}</p>
                                    </div>
                                </div>
                            </div>
                            {renderSection()}
                        </div>
                    </div>

                    <CandidateActionRail
                        scope={scope}
                        candidate={candidate}
                        overview={overview}
                        basePath={basePath}
                        finalStatus={candidateFinalStatus}
                        finalReason={candidateReason}
                        processing={candidateProcessing}
                        onFinalStatusChange={setCandidateFinalStatus}
                        onFinalReasonChange={setCandidateReason}
                        onSubmitFinalStatus={submitCandidateStatus}
                    />
                </div>
            </div>
        </DashboardSplitLayout>
    );
}

function CandidateActionRail({
    scope,
    candidate,
    overview,
    basePath,
    finalStatus,
    finalReason,
    processing,
    onFinalStatusChange,
    onFinalReasonChange,
    onSubmitFinalStatus,
}: {
    scope: "staff" | "admin";
    candidate: StaffCandidateData;
    overview: StaffCandidateOverview;
    basePath: string;
    finalStatus: "accepted" | "rejected";
    finalReason: string;
    processing: boolean;
    onFinalStatusChange: (value: "accepted" | "rejected") => void;
    onFinalReasonChange: (value: string) => void;
    onSubmitFinalStatus: (event: React.FormEvent) => void;
}) {
    const statusHref = `${basePath}/candidates/${candidate.id}/status-pendaftaran`;
    const primaryHref = overview.primary_blocker.href ?? statusHref;
    const quickLinks = [
        { label: "Status Pendaftaran", href: statusHref, icon: "fa-solid fa-list-check" },
        ...overview.quick_links,
        ...(scope === "staff"
            ? [{ label: "Payment Ops", href: `/dashboard/staff/payment-operations?search=${candidate.candidate_code}`, icon: "fa-solid fa-money-check-dollar" }]
            : []),
    ]
        .filter((link, index, links) => links.findIndex((item) => item.href === link.href && item.label === link.label) === index)
        .slice(0, 7);
    const finalStatusLabel = CANDIDATE_STATUS_LABEL[candidate.status] ?? candidate.status;

    return (
        <aside className="staff-show-item opacity-0 rounded-lg border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900 xl:sticky xl:top-20 xl:self-start">
            <div className="border-b border-slate-100 p-5 dark:border-white/10">
                <p className="text-sm font-black text-slate-900 dark:text-white">Action Rail</p>
                <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                    Aksi operasional kandidat ini.
                </p>
            </div>

            <div className="space-y-5 p-5">
                <section>
                    <p className="mb-2 text-[11px] font-bold uppercase text-slate-400">Primary Blocker</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                        {overview.primary_blocker.label}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                        {overview.primary_blocker.description}
                    </p>
                    <Link
                        href={primaryHref}
                        className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md bg-slate-900 px-3 text-sm font-bold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                    >
                        <i className="fa-solid fa-arrow-up-right-from-square text-xs" />
                        {overview.primary_blocker.key === "clear" ? "Buka Status" : "Buka Aksi"}
                    </Link>
                </section>

                <section>
                    <p className="mb-2 text-[11px] font-bold uppercase text-slate-400">Workflow Links</p>
                    <div className="grid grid-cols-1 gap-2">
                        {quickLinks.map((link) => (
                            <Link
                                key={`${link.label}-${link.href}`}
                                href={link.href}
                                className="inline-flex min-h-10 items-center gap-2 rounded-md border border-slate-200 px-3 text-xs font-bold text-slate-600 transition hover:border-emerald-400 hover:text-emerald-600 dark:border-white/10 dark:text-slate-300"
                            >
                                <i className={`${link.icon} w-4 text-center text-[11px]`} />
                                <span className="truncate">{link.label}</span>
                            </Link>
                        ))}
                    </div>
                </section>

                <section className="rounded-md border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                    <p className="text-[11px] font-bold uppercase text-slate-400">Keputusan Akhir</p>

                    {candidate.status === "accepted" || candidate.status === "rejected" ? (
                        <div className="mt-3">
                            <span className={`inline-flex rounded-md px-2.5 py-1 text-xs font-bold ${CANDIDATE_STATUS_CLASS[candidate.status]}`}>
                                {finalStatusLabel}
                            </span>
                            <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                                Status akhir kandidat sudah tercatat.
                            </p>
                        </div>
                    ) : candidate.status === "verified" ? (
                        <form onSubmit={onSubmitFinalStatus} className="mt-3 space-y-3">
                            <select
                                value={finalStatus}
                                onChange={(event) => onFinalStatusChange(event.target.value as "accepted" | "rejected")}
                                className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition focus:border-emerald-500 focus:outline-none dark:border-white/10 dark:bg-slate-900 dark:text-slate-200"
                            >
                                <option value="accepted">Diterima</option>
                                <option value="rejected">Ditolak</option>
                            </select>

                            {finalStatus === "rejected" ? (
                                <textarea
                                    value={finalReason}
                                    onChange={(event) => onFinalReasonChange(event.target.value)}
                                    placeholder="Alasan keputusan ditolak..."
                                    rows={4}
                                    className="w-full resize-none rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-700 transition placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none dark:border-white/10 dark:bg-slate-900 dark:text-slate-200"
                                />
                            ) : null}

                            <button
                                type="submit"
                                disabled={processing || (finalStatus === "rejected" && !finalReason.trim())}
                                className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md bg-emerald-600 px-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {processing ? (
                                    <>
                                        <i className="fa-solid fa-spinner fa-spin text-xs" />
                                        Memproses...
                                    </>
                                ) : (
                                    <>
                                        <i className="fa-solid fa-flag-checkered text-xs" />
                                        Simpan Keputusan
                                    </>
                                )}
                            </button>
                        </form>
                    ) : (
                        <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                            Keputusan akhir tersedia setelah kandidat berstatus Terverifikasi.
                        </p>
                    )}
                </section>
            </div>
        </aside>
    );
}
