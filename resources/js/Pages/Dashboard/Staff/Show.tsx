import { useEffect, useMemo, useRef, useState } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { animate, stagger } from "animejs";
import Swal from "sweetalert2";
import DashboardSplitLayout from "@/Layouts/DashboardSplitLayout";
import StaffSidebar from "@/Components/Dashboard/Staff/Shared/StaffSidebar";
import type { PageProps } from "@/types";

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

type DocumentItem = {
    id:                number;
    doc_type:          string;
    doc_group:         string | null;
    original_filename: string;
    file_path:         string;
    status:            "pending" | "verified" | "rejected";
    rejection_reason:  string | null;
    verified_by:       string | null;
    verified_at:       string | null;
};

type Guardian = {
    father_name:    string | null;
    father_phone:   string | null;
    mother_name:    string | null;
    mother_phone:   string | null;
    guardian_name:  string | null;
    guardian_phone: string | null;
    no_kk:          string | null;
} | null;

type HealthRecord = {
    blood_type:               string | null;
    rhesus:                   string | null;
    height_cm:                number | null;
    weight_kg:                number | null;
    general_health_condition: string | null;
} | null;

type Props = {
    candidate:     Candidate;
    documents:     DocumentItem[];
    guardian:      Guardian;
    health_record: HealthRecord;
    flash?:        { success?: string; error?: string };
};

type TabId = "identitas" | "dokumen" | "wali" | "kesehatan";

const TABS: { id: TabId; label: string; icon: string }[] = [
    { id: "identitas", label: "Identitas", icon: "fa-solid fa-user" },
    { id: "dokumen",   label: "Dokumen",   icon: "fa-solid fa-file-lines" },
    { id: "wali",      label: "Data Wali", icon: "fa-solid fa-users" },
    { id: "kesehatan", label: "Kesehatan", icon: "fa-solid fa-heart-pulse" },
];

const candidateStatusLabel: Record<Candidate["status"], string> = {
    draft: "Draft",
    submitted: "Menunggu Verifikasi",
    verified: "Terverifikasi",
    accepted: "Diterima",
    rejected: "Ditolak",
};

const candidateStatusClass: Record<Candidate["status"], string> = {
    draft: "bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300",
    submitted: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
    verified: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
    accepted: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
    rejected: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400",
};

const docStatusClass: Record<DocumentItem["status"], string> = {
    pending: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
    verified: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
    rejected: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400",
};

const docStatusLabel: Record<DocumentItem["status"], string> = {
    pending: "Pending",
    verified: "Verified",
    rejected: "Rejected",
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

export default function StaffCandidateShow({ candidate, documents, guardian, health_record, flash }: Props) {
    const { auth } = usePage<PageProps>().props;

    const [activeTab, setActiveTab] = useState<TabId>("identitas");
    const tabContentRef = useRef<HTMLDivElement>(null);

    const [docTarget, setDocTarget] = useState<number | null>(null);
    const [docStatus, setDocStatus] = useState<"verified" | "rejected">("verified");
    const [docReason, setDocReason] = useState("");
    const [docProcessing, setDocProcessing] = useState(false);

    const [candidateStatus, setCandidateStatus] = useState<"accepted" | "rejected">("accepted");
    const [candidateReason, setCandidateReason] = useState("");
    const [candidateProcessing, setCandidateProcessing] = useState(false);

    const selectedDoc = useMemo(
        () => documents.find((d) => d.id === docTarget) ?? null,
        [docTarget, documents]
    );

    const verificationCompletion = useMemo(() => {
        if (documents.length === 0) return 0;
        const done = documents.filter((d) => d.status === "verified").length;
        return Math.round((done / documents.length) * 100);
    }, [documents]);

    useEffect(() => {
        animate(".staff-show-item", {
            opacity: [0, 1],
            translateY: [20, 0],
            duration: 550,
            delay: stagger(70),
            ease: "outExpo",
        });
    }, []);

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
            swalDark.fire({
                icon: "error",
                title: "Gagal",
                text: flash.error,
            });
        }
    }, [flash]);

    const handleTabChange = (tabId: TabId) => {
        if (tabId === activeTab) return;

        const currentIdx = TABS.findIndex((t) => t.id === activeTab);
        const nextIdx = TABS.findIndex((t) => t.id === tabId);
        const dir = nextIdx > currentIdx ? 1 : -1;

        if (tabContentRef.current) {
            animate(tabContentRef.current, {
                opacity: [1, 0],
                translateX: [0, dir * -20],
                duration: 180,
                ease: "inQuad",
            });
        }

        setTimeout(() => {
            setActiveTab(tabId);
            if (tabContentRef.current) {
                animate(tabContentRef.current, {
                    opacity: [0, 1],
                    translateX: [dir * 20, 0],
                    duration: 360,
                    ease: "outExpo",
                });
            }
        }, 190);
    };

    const submitVerifyDocument = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDoc || docProcessing) return;

        if (docStatus === "rejected" && !docReason.trim()) {
            await swalDark.fire({
                icon: "warning",
                title: "Alasan wajib diisi",
                text: "Jika status rejected, alasan penolakan dokumen harus diisi.",
            });
            return;
        }

        const actionLabel = docStatus === "verified" ? "verifikasi" : "reject";
        const confirm = await swalDark.fire({
            title: `Konfirmasi ${actionLabel} dokumen?`,
            text: selectedDoc.original_filename,
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Ya, lanjutkan",
            cancelButtonText: "Batal",
        });

        if (!confirm.isConfirmed) return;

        setDocProcessing(true);
        router.post(
            `/dashboard/staff/documents/${selectedDoc.id}/verify`,
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

        if (candidateStatus === "rejected" && !candidateReason.trim()) {
            await swalDark.fire({
                icon: "warning",
                title: "Alasan wajib diisi",
                text: "Jika status akhir rejected, alasan wajib diisi.",
            });
            return;
        }

        const confirm = await swalDark.fire({
            title: "Ubah status kandidat?",
            text: "Pastikan verifikasi dokumen sudah selesai sebelum status akhir diubah.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Ya, update status",
            cancelButtonText: "Batal",
        });

        if (!confirm.isConfirmed) return;

        setCandidateProcessing(true);
        router.post(
            `/dashboard/staff/candidates/${candidate.id}/status`,
            {
                status: candidateStatus,
                reason: candidateStatus === "rejected" ? candidateReason : undefined,
            },
            {
                preserveScroll: true,
                onFinish: () => setCandidateProcessing(false),
            }
        );
    };

    return (
        <DashboardSplitLayout
            aside={
                <StaffSidebar
                    user={auth.user}
                    candidate={{
                        full_name: candidate.full_name,
                        candidate_code: candidate.candidate_code,
                        status: candidate.status,
                        admission_wave: candidate.admission_wave,
                    }}
                    completion={verificationCompletion}
                    tips={[
                        "Verifikasi dokumen per item agar audit trail jelas.",
                        "Status akhir hanya valid jika kandidat sudah verified.",
                        "Gunakan alasan penolakan yang jelas dan sopan.",
                    ]}
                />
            }
        >
            <Head title="Staff • Detail Kandidat" />

            <div className="space-y-5 px-6 py-6">
                <div className="staff-show-item">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center">
                            <i className="fa-solid fa-user-check text-emerald-500 text-sm"></i>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Candidate Review Center</h1>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                Verifikasi berlapis untuk menjaga kualitas data admission
                            </p>
                        </div>
                    </div>
                </div>

                <div className="staff-show-item flex items-center justify-between gap-3">
                    <div>
                        <p className="text-lg font-display font-bold text-slate-800 dark:text-slate-100">{candidate.full_name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {candidate.candidate_code} · {candidate.nisn ?? "-"} · {candidate.email ?? "-"}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold ${candidateStatusClass[candidate.status]}`}>
                            {candidateStatusLabel[candidate.status]}
                        </span>
                        <Link
                            href="/dashboard/staff/candidates"
                            className="h-11 px-4 rounded-xl border border-slate-200 dark:border-white/10 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-500 transition inline-flex items-center gap-2"
                        >
                            <i className="fa-solid fa-arrow-left text-xs"></i>
                            Kembali
                        </Link>
                    </div>
                </div>

                <div className="staff-show-item">
                    <div className="flex overflow-x-auto rounded-xl border border-black/[0.08] dark:border-content-border bg-slate-50 dark:bg-content-card p-1 gap-1 no-scrollbar">
                        {TABS.map((tab) => {
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => handleTabChange(tab.id)}
                                    className={[
                                        "flex flex-1 min-w-[120px] items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-semibold transition-all",
                                        isActive
                                            ? "bg-emerald-500 text-white"
                                            : "text-slate-500 dark:text-slate-400 hover:bg-black/[0.04] dark:hover:bg-content-muted hover:text-slate-700 dark:hover:text-slate-200",
                                    ].join(" ")}
                                >
                                    <i className={`${tab.icon} text-xs`}></i>
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div
                    ref={tabContentRef}
                    className="staff-show-item rounded-2xl border border-black/[0.07] dark:border-content-border bg-white dark:bg-content-surface p-6"
                >
                    {activeTab === "identitas" && (
                        <div className="grid grid-cols-2 xl:grid-cols-3 gap-5">
                            <Info label="Nama Lengkap" value={candidate.full_name} />
                            <Info label="Kode Kandidat" value={candidate.candidate_code} />
                            <Info label="Email" value={candidate.email} />
                            <Info label="NISN" value={candidate.nisn} />
                            <Info label="NIK" value={candidate.nik} />
                            <Info label="Gender" value={candidate.gender_label} />
                            <Info label="Tempat/Tanggal Lahir" value={`${candidate.place_of_birth ?? "-"} / ${candidate.date_of_birth ?? "-"}`} />
                            <Info label="Asal Sekolah" value={candidate.school_origin} />
                            <Info label="Program Pilihan" value={candidate.program_choice} />
                            <Info label="Gelombang" value={candidate.admission_wave} />
                        </div>
                    )}

                    {activeTab === "dokumen" && (
                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                            <div className="xl:col-span-2 rounded-2xl border border-slate-200 dark:border-white/5 overflow-hidden">
                                <div className="px-5 py-4 border-b border-slate-100 dark:border-white/5">
                                    <p className="text-sm font-semibold text-slate-800 dark:text-white">Daftar Dokumen</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                        {documents.length} dokumen, {documents.filter((d) => d.status === "pending").length} pending review
                                    </p>
                                </div>

                                {documents.length === 0 ? (
                                    <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">Belum ada dokumen tersedia.</div>
                                ) : (
                                    <ul className="divide-y divide-slate-100 dark:divide-white/5">
                                        {documents.map((doc) => (
                                            <li key={doc.id} className="px-5 py-4">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{doc.original_filename}</p>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                            {doc.doc_type} {doc.doc_group ? `· ${doc.doc_group}` : ""}
                                                        </p>
                                                        {doc.rejection_reason && (
                                                            <p className="text-xs text-red-500 mt-1.5">Alasan reject: {doc.rejection_reason}</p>
                                                        )}
                                                        {doc.verified_by && (
                                                            <p className="text-[11px] text-slate-400 mt-1">
                                                                Oleh: {doc.verified_by} {doc.verified_at ? `(${doc.verified_at})` : ""}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold ${docStatusClass[doc.status]}`}>
                                                            {docStatusLabel[doc.status]}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setDocTarget(doc.id);
                                                                setDocStatus(doc.status === "rejected" ? "rejected" : "verified");
                                                                setDocReason(doc.rejection_reason ?? "");
                                                            }}
                                                            className="h-11 px-3 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-500 transition"
                                                        >
                                                            Tinjau
                                                        </button>
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <div className="space-y-5">
                                <form onSubmit={submitVerifyDocument} className="rounded-2xl border border-slate-200 dark:border-white/5 p-5">
                                    <p className="text-sm font-semibold text-slate-800 dark:text-white">Aksi Verifikasi Dokumen</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                        {selectedDoc ? selectedDoc.original_filename : "Pilih dokumen dulu"}
                                    </p>

                                    <div className="mt-4 flex flex-col gap-3">
                                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Status Verifikasi</label>
                                        <select
                                            value={docStatus}
                                            onChange={(e) => setDocStatus(e.target.value as "verified" | "rejected")}
                                            className="h-11 px-3 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
                                        >
                                            <option value="verified">Verified</option>
                                            <option value="rejected">Rejected</option>
                                        </select>

                                        {docStatus === "rejected" && (
                                            <textarea
                                                value={docReason}
                                                onChange={(e) => setDocReason(e.target.value)}
                                                placeholder="Tulis alasan reject dokumen..."
                                                className="w-full min-h-[110px] rounded-xl text-sm p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
                                            />
                                        )}

                                        <button
                                            type="submit"
                                            disabled={!selectedDoc || docProcessing || (docStatus === "rejected" && !docReason.trim())}
                                            className="h-11 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition inline-flex items-center justify-center gap-2"
                                        >
                                            {docProcessing ? <i className="fa-solid fa-spinner fa-spin" /> : <i className="fa-solid fa-check" />}
                                            Simpan Verifikasi
                                        </button>
                                    </div>
                                </form>

                                <form onSubmit={submitCandidateStatus} className="rounded-2xl border border-slate-200 dark:border-white/5 p-5">
                                    <p className="text-sm font-semibold text-slate-800 dark:text-white">Status Akhir Kandidat</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                        Hanya valid jika kandidat sudah verified
                                    </p>

                                    <div className="mt-4 flex flex-col gap-3">
                                        <select
                                            value={candidateStatus}
                                            onChange={(e) => setCandidateStatus(e.target.value as "accepted" | "rejected")}
                                            className="h-11 px-3 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
                                        >
                                            <option value="accepted">Accepted</option>
                                            <option value="rejected">Rejected</option>
                                        </select>

                                        {candidateStatus === "rejected" && (
                                            <textarea
                                                value={candidateReason}
                                                onChange={(e) => setCandidateReason(e.target.value)}
                                                placeholder="Alasan status ditolak..."
                                                className="w-full min-h-[100px] rounded-xl text-sm p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
                                            />
                                        )}

                                        <button
                                            type="submit"
                                            disabled={candidateProcessing || (candidateStatus === "rejected" && !candidateReason.trim())}
                                            className="h-11 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-sm font-semibold transition inline-flex items-center justify-center gap-2"
                                        >
                                            {candidateProcessing ? <i className="fa-solid fa-spinner fa-spin" /> : <i className="fa-solid fa-flag-checkered" />}
                                            Update Status
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {activeTab === "wali" && (
                        <div className="grid grid-cols-2 xl:grid-cols-3 gap-5">
                            <Info label="Nama Ayah" value={guardian?.father_name} />
                            <Info label="No. Ayah" value={guardian?.father_phone} />
                            <Info label="Nama Ibu" value={guardian?.mother_name} />
                            <Info label="No. Ibu" value={guardian?.mother_phone} />
                            <Info label="Nama Wali" value={guardian?.guardian_name} />
                            <Info label="No. Wali" value={guardian?.guardian_phone} />
                            <Info label="Nomor KK" value={guardian?.no_kk} />
                        </div>
                    )}

                    {activeTab === "kesehatan" && (
                        <div className="grid grid-cols-2 xl:grid-cols-3 gap-5">
                            <Info label="Golongan Darah" value={health_record?.blood_type} />
                            <Info label="Rhesus" value={health_record?.rhesus} />
                            <Info label="Tinggi Badan" value={health_record?.height_cm ? `${health_record.height_cm} cm` : "-"} />
                            <Info label="Berat Badan" value={health_record?.weight_kg ? `${health_record.weight_kg} kg` : "-"} />
                            <Info label="Kondisi Kesehatan" value={health_record?.general_health_condition} />
                        </div>
                    )}
                </div>
            </div>
        </DashboardSplitLayout>
    );
}

function Info({ label, value }: { label: string; value?: string | number | null }) {
    return (
        <div>
            <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500">{label}</p>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mt-0.5">{value ?? "-"}</p>
        </div>
    );
}
