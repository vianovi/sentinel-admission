import { Head, Link, router } from "@inertiajs/react";
import { useState } from "react";
import DocumentPaymentSummary from "@/Components/Dashboard/Candidate/Index/DocumentPaymentSummary";
import IdentityHero from "@/Components/Dashboard/Candidate/Index/IdentityHero";
import NextActionPanel from "@/Components/Dashboard/Candidate/Index/NextActionPanel";
import ProgressOverview from "@/Components/Dashboard/Candidate/Index/ProgressOverview";
import StatusTimeline from "@/Components/Dashboard/Candidate/Index/StatusTimeline";
import type { CandidateDashboardData } from "@/Components/Dashboard/Candidate/Index/types";
import RequestStatusBanner from "@/Components/Dashboard/Candidate/Shared/RequestStatusBanner";
import DashboardLayout from "@/Layouts/DashboardLayout";

type Candidate = {
    id: number;
} | null;

type EmailChangeRequest = {
    status: "pending" | "approved" | "rejected";
    current_email: string;
    pending_email: string;
    requested_at: string | null;
    reviewed_by_name: string | null;
    reviewed_at: string | null;
    rejection_reason: string | null;
    can_apply: boolean;
    can_cancel: boolean;
} | null;

type DataChangeRequestResult = {
    field: string;
    field_label: string;
    old_value: string;
    new_value: string;
    reason: string | null;
    status: "approved" | "rejected";
    reviewed_by: number | null;
    reviewed_by_name: string | null;
    reviewed_at: string | null;
    rejection_reason: string | null;
    review_note: string | null;
} | null;

type PendingDataChangeRequest = {
    field: string;
    field_label: string;
    old_value: string;
    new_value: string;
    reason: string | null;
    requested_at: string | null;
} | null;

type Props = {
    candidate: Candidate;
    dashboard: CandidateDashboardData | null;
    email_verified: boolean;
    email_change_request: EmailChangeRequest;
    data_change_request_result: DataChangeRequestResult;
    data_change_request_pending: PendingDataChangeRequest;
    flash?: { success?: string; error?: string };
};

const reviewedByLabel = (name: string | null | undefined): string => name ?? "petugas";

function Alert({ tone, message }: { tone: "success" | "error"; message: string }) {
    const classes = tone === "success"
        ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200"
        : "border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200";
    const icon = tone === "success" ? "fa-solid fa-circle-check" : "fa-solid fa-circle-exclamation";

    return (
        <div className={`flex items-start gap-3 rounded-2xl border px-5 py-4 ${classes}`}>
            <i className={`${icon} mt-0.5 shrink-0`} />
            <p className="text-sm font-semibold">{message}</p>
        </div>
    );
}

export default function CandidateDashboard({
    candidate,
    dashboard,
    email_verified,
    email_change_request,
    data_change_request_result,
    data_change_request_pending,
    flash,
}: Props) {
    const [applyEmailProcessing, setApplyEmailProcessing] = useState(false);

    const handleApplyApprovedEmail = () => {
        setApplyEmailProcessing(true);

        router.post(route("dashboard.profile.email.apply"), {}, {
            preserveScroll: true,
            onFinish: () => setApplyEmailProcessing(false),
        });
    };

    if (!candidate || !dashboard) {
        return (
            <DashboardLayout>
                <Head title="Dashboard Pendaftar" />
                <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-gold/20 bg-gold/10">
                        <i className="fa-solid fa-graduation-cap text-2xl text-gold" />
                    </div>
                    <h1 className="text-lg font-bold text-slate-800 dark:text-white">
                        Belum Ada Data Pendaftaran
                    </h1>
                    <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">
                        Akun ini belum memiliki data kandidat. Silakan mulai pendaftaran dari halaman utama.
                    </p>
                    <Link
                        href="/"
                        className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-gold px-6 py-2.5 text-sm font-bold text-navy shadow-glow transition hover:bg-goldhover"
                    >
                        Ke Halaman Utama
                    </Link>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <Head title="Dashboard Pendaftar" />

            <div className="flex flex-col gap-5 px-4 py-5 sm:px-6 lg:gap-6">
                {flash?.success && <Alert tone="success" message={flash.success} />}
                {flash?.error && <Alert tone="error" message={flash.error} />}

                {!email_verified && (
                    <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 dark:border-amber-500/20 dark:bg-amber-500/10 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-3">
                            <i className="fa-solid fa-circle-info mt-0.5 shrink-0 text-amber-500" />
                            <div>
                                <p className="text-sm font-bold text-amber-800 dark:text-amber-200">Email belum diverifikasi</p>
                                <p className="mt-0.5 text-xs leading-5 text-amber-700 dark:text-amber-300">
                                    Verifikasi email membantu memastikan akun pendaftaranmu aman dan aktif.
                                </p>
                            </div>
                        </div>
                        <Link
                            href="/email/verify"
                            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-amber-600"
                        >
                            Verifikasi Email
                        </Link>
                    </div>
                )}

                {data_change_request_result && (
                    <RequestStatusBanner
                        tone={data_change_request_result.status === "approved" ? "emerald" : "red"}
                        icon={data_change_request_result.status === "approved" ? "fa-solid fa-file-circle-check" : "fa-solid fa-file-circle-xmark"}
                        title={data_change_request_result.status === "approved" ? "Permintaan perubahan data disetujui" : "Permintaan perubahan data ditolak"}
                        description={
                            data_change_request_result.status === "approved"
                                ? `Permintaan perubahan data ${data_change_request_result.field_label.toLowerCase()} disetujui oleh ${reviewedByLabel(data_change_request_result.reviewed_by_name)}. Data kamu sudah diperbarui.`
                                : `Permintaan perubahan data ditolak oleh ${reviewedByLabel(data_change_request_result.reviewed_by_name)}.${data_change_request_result.rejection_reason ? ` Alasan: ${data_change_request_result.rejection_reason}.` : ""}`
                        }
                        meta={data_change_request_result.reviewed_at ? `Ditinjau ${data_change_request_result.reviewed_at}` : null}
                    />
                )}

                {data_change_request_pending && (
                    <RequestStatusBanner
                        tone="blue"
                        icon="fa-solid fa-file-circle-question"
                        title="Permintaan perubahan data sedang ditinjau"
                        description={`Perubahan ${data_change_request_pending.field_label.toLowerCase()} dari "${data_change_request_pending.old_value}" ke "${data_change_request_pending.new_value}" sedang menunggu keputusan panitia.`}
                        meta={data_change_request_pending.requested_at ? `Diajukan ${data_change_request_pending.requested_at}` : null}
                    />
                )}

                {email_change_request && email_change_request.status === "pending" && (
                    <RequestStatusBanner
                        tone="blue"
                        icon="fa-solid fa-envelope-open-text"
                        title="Permintaan perubahan email sedang ditinjau"
                        description={`Email baru ${email_change_request.pending_email} sedang menunggu persetujuan panitia. Login tetap memakai ${email_change_request.current_email} sampai proses selesai.`}
                        meta={email_change_request.requested_at ? `Diajukan ${email_change_request.requested_at}` : null}
                    />
                )}

                {email_change_request && email_change_request.status !== "pending" && (
                    <RequestStatusBanner
                        tone={email_change_request.status === "approved" ? "amber" : "red"}
                        icon={email_change_request.status === "approved" ? "fa-solid fa-envelope-circle-check" : "fa-solid fa-envelope-circle-xmark"}
                        title={email_change_request.status === "approved" ? "Perubahan email siap diterapkan" : "Permintaan perubahan email ditolak"}
                        description={
                            email_change_request.status === "approved"
                                ? `Perubahan email ke ${email_change_request.pending_email} telah disetujui dan diverifikasi manual oleh ${reviewedByLabel(email_change_request.reviewed_by_name)}. Login masih memakai email lama sampai kamu menekan Terapkan Email Baru.`
                                : `Permintaan perubahan email ditolak oleh ${reviewedByLabel(email_change_request.reviewed_by_name)}.${email_change_request.rejection_reason ? ` Alasan: ${email_change_request.rejection_reason}.` : ""}`
                        }
                        meta={email_change_request.reviewed_at ? `Ditinjau ${email_change_request.reviewed_at}` : null}
                        actions={email_change_request.can_apply ? [{
                            label: "Terapkan Email Baru",
                            icon: applyEmailProcessing ? "fa-solid fa-spinner fa-spin" : "fa-solid fa-check",
                            onClick: handleApplyApprovedEmail,
                            disabled: applyEmailProcessing,
                        }] : []}
                    />
                )}

                <IdentityHero identity={dashboard.identity} />
                <NextActionPanel action={dashboard.next_action} />
                <ProgressOverview progress={dashboard.progress} />
                <DocumentPaymentSummary documents={dashboard.documents_summary} payment={dashboard.payment_summary} />
                <StatusTimeline status={dashboard.status_summary} />
            </div>
        </DashboardLayout>
    );
}
