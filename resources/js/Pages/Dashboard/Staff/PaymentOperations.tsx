import { FormEvent, useEffect, useMemo, useState, type ReactNode } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import Swal from "sweetalert2";
import DashboardLayout from "@/Layouts/DashboardLayout";
import type { PageProps } from "@/types";

type PaymentStatus = "pending" | "paid" | "failed" | "expired" | "cancelled";
type PaymentChannel = "gateway" | "transfer" | "cash";
type ManualStatus = "waiting_proof" | "proof_uploaded" | "verified" | "rejected";
type Tone = "success" | "warning" | "danger" | "primary" | "neutral";

type Option = {
    value: string;
    label: string;
};

type Filters = {
    search: string;
    status: string;
    channel: string;
    wave: string;
    program: string;
    action: string;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type Paginated<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
    links: PaginationLink[];
};

type PaymentRow = {
    id: number;
    order_id: string;
    candidate_code: string;
    candidate: {
        id: number;
        candidate_code: string;
        full_name: string;
        nisn: string | null;
        status: string;
        program_choice: string | null;
        school_origin: string | null;
        email: string | null;
    } | null;
    admission_wave: {
        id: number;
        title: string;
        academic_year: string | null;
        registration_fee: number;
    } | null;
    payment_channel: PaymentChannel;
    channel_label: string;
    status: PaymentStatus;
    status_label: string;
    manual_status: ManualStatus | null;
    manual_status_label: string | null;
    payment_method: string | null;
    midtrans_transaction_id: string | null;
    amounts: {
        base_amount: number;
        fee_amount: number;
        final_amount: number;
    };
    provider: {
        transaction_status: string | null;
        fraud_status: string | null;
        gross_amount: number | null;
        settlement_time: string | null;
        transaction_time: string | null;
        status_code: string | null;
        status_message: string | null;
    };
    proof: {
        original_filename: string | null;
        uploaded_at: string | null;
        attempt: number;
        url: string | null;
    };
    verification: {
        verified_by: string | null;
        verified_at: string | null;
        rejection_reason: string | null;
    };
    paid_at: string | null;
    expired_at: string | null;
    created_at: string | null;
    updated_at: string | null;
    is_expired: boolean;
    can_verify: boolean;
    action_state: {
        key: string;
        label: string;
        tone: Tone;
        description: string;
    };
};

type Props = {
    payments: Paginated<PaymentRow>;
    summary: {
        total: number;
        paid: number;
        pending: number;
        manual_review: number;
        gateway_pending: number;
        failed_or_expired: number;
        paid_amount: number;
    };
    waves: Option[];
    programs: Option[];
    action_options: Option[];
    filters: Filters;
};

const BASE_PATH = "/dashboard/staff/payment-operations";

const STATUS_OPTIONS: Option[] = [
    { value: "", label: "Semua status" },
    { value: "pending", label: "Pending" },
    { value: "paid", label: "Lunas" },
    { value: "failed", label: "Gagal" },
    { value: "expired", label: "Expired" },
    { value: "cancelled", label: "Dibatalkan" },
];

const CHANNEL_OPTIONS: Option[] = [
    { value: "", label: "Semua channel" },
    { value: "gateway", label: "Gateway" },
    { value: "transfer", label: "Transfer" },
    { value: "cash", label: "Cash" },
];

const toneClass: Record<Tone, string> = {
    success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    warning: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    danger: "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300",
    primary: "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300",
    neutral: "border-slate-300 bg-slate-100 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300",
};

const statusTone: Record<PaymentStatus, Tone> = {
    pending: "warning",
    paid: "success",
    failed: "danger",
    expired: "danger",
    cancelled: "neutral",
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

function rupiah(value: number | null | undefined) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(value ?? 0);
}

function buildQuery(filters: Partial<Filters>, page?: number) {
    const query: Record<string, string | number> = {};

    Object.entries(filters).forEach(([key, rawValue]) => {
        const value = String(rawValue ?? "").trim();
        if (value) query[key] = value;
    });

    if (page && page > 1) query.page = page;

    return query;
}

function Pill({ tone, children }: { tone: Tone; children: ReactNode }) {
    return (
        <span className={`inline-flex min-h-7 items-center rounded-md border px-2.5 text-[11px] font-bold ${toneClass[tone]}`}>
            {children}
        </span>
    );
}

function SelectFilter({
    value,
    options,
    onChange,
    label,
}: {
    value: string;
    options: Option[];
    onChange: (value: string) => void;
    label: string;
}) {
    return (
        <label className="min-w-0">
            <span className="sr-only">{label}</span>
            <select
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition focus:border-emerald-500 focus:outline-none dark:border-white/10 dark:bg-slate-900 dark:text-slate-200"
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </label>
    );
}

function SummaryCard({ label, value, sub, icon, tone }: { label: string; value: string; sub?: string; icon: string; tone: Tone }) {
    return (
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900">
            <div className="flex items-start gap-3">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border ${toneClass[tone]}`}>
                    <i className={`${icon} text-sm`} />
                </div>
                <div className="min-w-0">
                    <p className="truncate text-xl font-black leading-none text-slate-900 dark:text-white">{value}</p>
                    <p className="mt-1 truncate text-[11px] font-bold text-slate-500 dark:text-slate-400">{label}</p>
                    {sub ? <p className="mt-1 truncate text-[10px] font-semibold text-slate-400">{sub}</p> : null}
                </div>
            </div>
        </div>
    );
}

function hasMismatch(payment: PaymentRow) {
    return payment.provider.gross_amount !== null
        && Math.round(payment.provider.gross_amount) !== Math.round(payment.amounts.final_amount);
}

export default function StaffPaymentOperations({
    payments,
    summary,
    waves,
    programs,
    action_options,
    filters,
}: Props) {
    const { flash } = usePage<PageProps>().props;
    const [search, setSearch] = useState(filters.search ?? "");
    const [selectedId, setSelectedId] = useState<number | null>(payments.data[0]?.id ?? null);
    const [reviewStatus, setReviewStatus] = useState<"verified" | "rejected">("verified");
    const [reviewReason, setReviewReason] = useState("");
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        setSearch(filters.search ?? "");
    }, [filters.search]);

    useEffect(() => {
        if (payments.data.length === 0) {
            setSelectedId(null);
            return;
        }

        if (!payments.data.some((payment) => payment.id === selectedId)) {
            setSelectedId(payments.data[0].id);
        }
    }, [payments.data, selectedId]);

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

    const selectedPayment = useMemo(
        () => payments.data.find((payment) => payment.id === selectedId) ?? payments.data[0] ?? null,
        [payments.data, selectedId],
    );

    const applyFilter = (patch: Partial<Filters>) => {
        router.get(
            BASE_PATH,
            buildQuery({ ...filters, ...patch }),
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const submitSearch = (event: FormEvent) => {
        event.preventDefault();
        applyFilter({ search });
    };

    const resetFilters = () => {
        setSearch("");
        router.get(BASE_PATH, {}, { preserveState: true, preserveScroll: true, replace: true });
    };

    const submitManualReview = async (event: FormEvent) => {
        event.preventDefault();

        if (!selectedPayment || !selectedPayment.can_verify || processing) return;

        if (reviewStatus === "rejected" && !reviewReason.trim()) {
            await swalDark.fire({
                icon: "warning",
                title: "Alasan wajib diisi",
                text: "Bukti manual yang ditolak harus memiliki alasan penolakan.",
            });
            return;
        }

        const confirmed = await swalDark.fire({
            icon: reviewStatus === "verified" ? "question" : "warning",
            title: reviewStatus === "verified" ? "Validasi pembayaran manual?" : "Tolak bukti pembayaran?",
            text: selectedPayment.order_id,
            showCancelButton: true,
            confirmButtonText: "Ya, lanjutkan",
            cancelButtonText: "Batal",
        });

        if (!confirmed.isConfirmed) return;

        setProcessing(true);
        router.post(
            `/dashboard/staff/payments/${selectedPayment.id}/verify`,
            {
                status: reviewStatus,
                rejection_reason: reviewStatus === "rejected" ? reviewReason : undefined,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setReviewStatus("verified");
                    setReviewReason("");
                },
                onFinish: () => setProcessing(false),
            },
        );
    };

    const hasActiveFilter = Boolean(filters.search || filters.status || filters.channel || filters.wave || filters.program || filters.action);

    return (
        <>
            <Head title="Payment Operations - Staff" />

            <div className="flex flex-col gap-5 pb-8">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900">
                            <i className="fa-solid fa-money-check-dollar text-sm" />
                        </div>
                        <div>
                            <h1 className="font-display text-xl font-bold leading-tight text-slate-900 dark:text-white">
                                Payment Operations
                            </h1>
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                {payments.total.toLocaleString("id-ID")} transaksi pada hasil saat ini
                            </p>
                        </div>
                    </div>
                    <div className="inline-flex min-h-9 items-center gap-2 self-start rounded-md border border-slate-200 bg-white px-3 text-xs font-bold text-slate-500 dark:border-white/10 dark:bg-slate-900 dark:text-slate-400">
                        <i className="fa-solid fa-shield-halved text-[11px]" />
                        Gateway via webhook Midtrans
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
                    <SummaryCard label="Total Transaksi" value={summary.total.toLocaleString("id-ID")} icon="fa-solid fa-receipt" tone="primary" />
                    <SummaryCard label="Lunas" value={summary.paid.toLocaleString("id-ID")} sub={rupiah(summary.paid_amount)} icon="fa-solid fa-circle-check" tone="success" />
                    <SummaryCard label="Pending" value={summary.pending.toLocaleString("id-ID")} icon="fa-solid fa-clock" tone="warning" />
                    <SummaryCard label="Manual Review" value={summary.manual_review.toLocaleString("id-ID")} icon="fa-solid fa-file-invoice" tone="warning" />
                    <SummaryCard label="Gateway Pending" value={summary.gateway_pending.toLocaleString("id-ID")} icon="fa-solid fa-satellite-dish" tone="primary" />
                    <SummaryCard label="Gagal / Expired" value={summary.failed_or_expired.toLocaleString("id-ID")} icon="fa-solid fa-triangle-exclamation" tone="danger" />
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-slate-900">
                    <div className="grid gap-3 xl:grid-cols-[minmax(260px,1.4fr)_repeat(5,minmax(140px,1fr))_auto]">
                        <form onSubmit={submitSearch} className="flex min-w-0 gap-2">
                            <div className="relative min-w-0 flex-1">
                                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                    <i className="fa-solid fa-magnifying-glass text-xs" />
                                </span>
                                <input
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Cari order, kandidat, NISN, transaksi..."
                                    className="h-10 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 transition placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 dark:placeholder:text-slate-500"
                                />
                            </div>
                            <button
                                type="submit"
                                className="inline-flex h-10 items-center justify-center rounded-md bg-slate-900 px-3 text-xs font-bold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                                aria-label="Cari transaksi"
                            >
                                <i className="fa-solid fa-arrow-right" />
                            </button>
                        </form>

                        <SelectFilter label="Status" value={filters.status} options={STATUS_OPTIONS} onChange={(value) => applyFilter({ status: value })} />
                        <SelectFilter label="Channel" value={filters.channel} options={CHANNEL_OPTIONS} onChange={(value) => applyFilter({ channel: value })} />
                        <SelectFilter label="Gelombang" value={filters.wave} options={[{ value: "", label: "Semua gelombang" }, ...waves]} onChange={(value) => applyFilter({ wave: value })} />
                        <SelectFilter label="Program" value={filters.program} options={[{ value: "", label: "Semua program" }, ...programs]} onChange={(value) => applyFilter({ program: value })} />
                        <SelectFilter label="Action" value={filters.action} options={[{ value: "", label: "Semua antrean" }, ...action_options]} onChange={(value) => applyFilter({ action: value })} />

                        {hasActiveFilter ? (
                            <button
                                type="button"
                                onClick={resetFilters}
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-200 px-3 text-xs font-bold text-slate-600 transition hover:border-red-300 hover:text-red-600 dark:border-white/10 dark:text-slate-300"
                            >
                                <i className="fa-solid fa-xmark text-[11px]" />
                                Reset
                            </button>
                        ) : null}
                    </div>
                </div>

                <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
                    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900">
                        <div className="hidden border-b border-slate-100 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/[0.03] xl:grid xl:grid-cols-[minmax(220px,1.15fr)_minmax(210px,1fr)_170px_160px_130px]">
                            {["Kandidat", "Transaksi", "Nominal", "Status", "Aksi"].map((header) => (
                                <p key={header} className="text-[11px] font-bold uppercase text-slate-400 dark:text-slate-500">
                                    {header}
                                </p>
                            ))}
                        </div>

                        {payments.data.length === 0 ? (
                            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 dark:bg-white/5">
                                    <i className="fa-solid fa-receipt text-lg text-slate-400" />
                                </div>
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                    Tidak ada transaksi ditemukan
                                </p>
                                <p className="mt-1 max-w-sm text-xs leading-relaxed text-slate-400">
                                    Ubah filter transaksi untuk melihat data pembayaran lain.
                                </p>
                            </div>
                        ) : (
                            <ul className="divide-y divide-slate-100 dark:divide-white/10">
                                {payments.data.map((payment) => {
                                    const selected = selectedPayment?.id === payment.id;
                                    const candidateHref = payment.candidate
                                        ? `/dashboard/staff/candidates/${payment.candidate.id}`
                                        : "/dashboard/staff/candidates";
                                    const mismatch = hasMismatch(payment);

                                    return (
                                        <li key={payment.id}>
                                            <div
                                                className={[
                                                    "grid gap-4 px-4 py-4 transition xl:grid-cols-[minmax(220px,1.15fr)_minmax(210px,1fr)_170px_160px_130px] xl:items-center",
                                                    selected ? "bg-emerald-50/70 dark:bg-emerald-500/[0.06]" : "hover:bg-slate-50 dark:hover:bg-white/[0.03]",
                                                ].join(" ")}
                                            >
                                                <div className="min-w-0">
                                                    <Link href={candidateHref} className="truncate text-sm font-bold text-slate-900 hover:text-emerald-600 dark:text-white dark:hover:text-emerald-300">
                                                        {payment.candidate?.full_name ?? payment.candidate_code}
                                                    </Link>
                                                    <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                                                        {payment.candidate?.candidate_code ?? payment.candidate_code}
                                                        {payment.candidate?.nisn ? ` - NISN ${payment.candidate.nisn}` : ""}
                                                    </p>
                                                    <p className="mt-0.5 truncate text-xs text-slate-400">
                                                        {payment.admission_wave?.title ?? "Tanpa gelombang"}
                                                        {payment.candidate?.program_choice ? ` - ${payment.candidate.program_choice}` : ""}
                                                    </p>
                                                </div>

                                                <div className="min-w-0">
                                                    <p className="truncate font-mono text-xs font-bold text-slate-700 dark:text-slate-200">
                                                        {payment.order_id}
                                                    </p>
                                                    <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
                                                        {payment.channel_label}
                                                        {payment.payment_method ? ` - ${payment.payment_method}` : ""}
                                                    </p>
                                                    <p className="mt-0.5 truncate font-mono text-[11px] text-slate-400">
                                                        {payment.midtrans_transaction_id ?? payment.provider.transaction_status ?? "Belum ada transaction id"}
                                                    </p>
                                                </div>

                                                <div className="min-w-0">
                                                    <p className="text-sm font-black text-slate-900 dark:text-white">
                                                        {rupiah(payment.amounts.final_amount)}
                                                    </p>
                                                    <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                                                        Base {rupiah(payment.amounts.base_amount)} / Fee {rupiah(payment.amounts.fee_amount)}
                                                    </p>
                                                    {mismatch ? (
                                                        <p className="mt-1 text-[11px] font-bold text-red-600 dark:text-red-300">
                                                            Gross provider {rupiah(payment.provider.gross_amount)}
                                                        </p>
                                                    ) : null}
                                                </div>

                                                <div className="flex flex-wrap items-center gap-2 xl:block xl:space-y-2">
                                                    <Pill tone={statusTone[payment.status]}>{payment.status_label}</Pill>
                                                    <Pill tone={payment.action_state.tone}>{payment.action_state.label}</Pill>
                                                </div>

                                                <div className="flex flex-wrap gap-2 xl:justify-end">
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedId(payment.id)}
                                                        className={[
                                                            "inline-flex min-h-9 items-center gap-2 rounded-md px-3 text-xs font-bold transition",
                                                            selected
                                                                ? "bg-emerald-600 text-white"
                                                                : "border border-slate-200 text-slate-600 hover:border-emerald-400 hover:text-emerald-600 dark:border-white/10 dark:text-slate-300",
                                                        ].join(" ")}
                                                    >
                                                        <i className="fa-solid fa-eye text-[10px]" />
                                                        Detail
                                                    </button>
                                                    <Link
                                                        href={candidateHref}
                                                        className="inline-flex min-h-9 items-center justify-center rounded-md bg-slate-900 px-3 text-xs font-bold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                                                        title="Buka kandidat"
                                                    >
                                                        <i className="fa-solid fa-arrow-right text-[10px]" />
                                                    </Link>
                                                </div>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}

                        <PaymentPagination payments={payments} filters={filters} />
                    </div>

                    <PaymentDetailPanel
                        payment={selectedPayment}
                        reviewStatus={reviewStatus}
                        reviewReason={reviewReason}
                        processing={processing}
                        onReviewStatusChange={setReviewStatus}
                        onReviewReasonChange={setReviewReason}
                        onSubmitManualReview={submitManualReview}
                    />
                </div>
            </div>
        </>
    );
}

function PaymentDetailPanel({
    payment,
    reviewStatus,
    reviewReason,
    processing,
    onReviewStatusChange,
    onReviewReasonChange,
    onSubmitManualReview,
}: {
    payment: PaymentRow | null;
    reviewStatus: "verified" | "rejected";
    reviewReason: string;
    processing: boolean;
    onReviewStatusChange: (value: "verified" | "rejected") => void;
    onReviewReasonChange: (value: string) => void;
    onSubmitManualReview: (event: FormEvent) => void;
}) {
    if (!payment) {
        return (
            <aside className="rounded-lg border border-dashed border-slate-200 bg-white p-6 text-center shadow-sm dark:border-white/10 dark:bg-slate-900">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 dark:bg-white/5">
                    <i className="fa-solid fa-receipt text-lg text-slate-400" />
                </div>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Tidak ada transaksi dipilih</p>
            </aside>
        );
    }

    const candidateHref = payment.candidate
        ? `/dashboard/staff/candidates/${payment.candidate.id}`
        : "/dashboard/staff/candidates";
    const candidatePaymentHref = payment.candidate
        ? `/dashboard/staff/candidates/${payment.candidate.id}/pembayaran`
        : "/dashboard/staff/candidates";
    const isGateway = payment.payment_channel === "gateway";
    const mismatch = hasMismatch(payment);

    return (
        <aside className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900 xl:sticky xl:top-20 xl:self-start">
            <div className="border-b border-slate-100 p-5 dark:border-white/10">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-sm font-black text-slate-900 dark:text-white">Detail Transaksi</p>
                        <p className="mt-1 truncate font-mono text-xs text-slate-500 dark:text-slate-400">{payment.order_id}</p>
                    </div>
                    <Pill tone={payment.action_state.tone}>{payment.action_state.label}</Pill>
                </div>
            </div>

            <div className="space-y-5 p-5">
                <section>
                    <p className="mb-3 text-[11px] font-bold uppercase text-slate-400">Kandidat</p>
                    <div className="space-y-1">
                        <Link href={candidateHref} className="block truncate text-base font-display font-black text-slate-900 hover:text-emerald-600 dark:text-white dark:hover:text-emerald-300">
                            {payment.candidate?.full_name ?? payment.candidate_code}
                        </Link>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            {payment.candidate?.candidate_code ?? payment.candidate_code}
                            {payment.candidate?.email ? ` - ${payment.candidate.email}` : ""}
                        </p>
                        <p className="text-xs text-slate-400">
                            {payment.admission_wave?.title ?? "Tanpa gelombang"}
                            {payment.candidate?.program_choice ? ` - ${payment.candidate.program_choice}` : ""}
                        </p>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                        <Link
                            href={candidateHref}
                            className="inline-flex min-h-9 items-center gap-2 rounded-md border border-slate-200 px-3 text-xs font-bold text-slate-600 transition hover:border-emerald-400 hover:text-emerald-600 dark:border-white/10 dark:text-slate-300"
                        >
                            <i className="fa-solid fa-user text-[10px]" />
                            Profil Kandidat
                        </Link>
                        <Link
                            href={candidatePaymentHref}
                            className="inline-flex min-h-9 items-center gap-2 rounded-md border border-slate-200 px-3 text-xs font-bold text-slate-600 transition hover:border-orange-400 hover:text-orange-600 dark:border-white/10 dark:text-slate-300"
                        >
                            <i className="fa-solid fa-credit-card text-[10px]" />
                            Detail Pembayaran
                        </Link>
                    </div>
                </section>

                <section className="grid grid-cols-2 gap-3">
                    <MiniInfo label="Base" value={rupiah(payment.amounts.base_amount)} />
                    <MiniInfo label="Fee" value={rupiah(payment.amounts.fee_amount)} />
                    <MiniInfo label="Final" value={rupiah(payment.amounts.final_amount)} strong />
                    <MiniInfo label="Provider Gross" value={payment.provider.gross_amount === null ? "-" : rupiah(payment.provider.gross_amount)} warn={mismatch} />
                </section>

                <section>
                    <p className="mb-3 text-[11px] font-bold uppercase text-slate-400">Status Transaksi</p>
                    <div className="grid grid-cols-2 gap-3">
                        <MiniInfo label="Channel" value={payment.channel_label} />
                        <MiniInfo label="Status" value={payment.status_label} />
                        <MiniInfo label="Manual" value={payment.manual_status_label ?? "-"} />
                        <MiniInfo label="Method" value={payment.payment_method ?? "-"} />
                        <MiniInfo label="Paid At" value={payment.paid_at ?? "-"} />
                        <MiniInfo label="Expired At" value={payment.expired_at ?? "-"} />
                    </div>
                </section>

                <section>
                    <p className="mb-3 text-[11px] font-bold uppercase text-slate-400">Midtrans Snapshot</p>
                    <div className="grid grid-cols-2 gap-3">
                        <MiniInfo label="Transaction ID" value={payment.midtrans_transaction_id ?? "-"} mono />
                        <MiniInfo label="Provider Status" value={payment.provider.transaction_status ?? "-"} />
                        <MiniInfo label="Fraud" value={payment.provider.fraud_status ?? "-"} />
                        <MiniInfo label="Settlement" value={payment.provider.settlement_time ?? "-"} />
                    </div>
                    {isGateway ? (
                        <div className="mt-3 rounded-md border border-blue-500/20 bg-blue-500/10 px-3 py-2.5 text-xs leading-5 text-blue-700 dark:text-blue-300">
                            Gateway diproses lewat webhook Midtrans. Staff tidak memvalidasi bukti manual untuk channel ini.
                        </div>
                    ) : null}
                </section>

                {!isGateway ? (
                    <section>
                        <p className="mb-3 text-[11px] font-bold uppercase text-slate-400">Fallback Manual</p>
                        <div className="rounded-md border border-slate-200 p-3 dark:border-white/10">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">
                                        {payment.proof.original_filename ?? "Belum ada bukti"}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                        {payment.proof.uploaded_at ? `${payment.proof.uploaded_at} - percobaan ${payment.proof.attempt}` : "Menunggu kandidat"}
                                    </p>
                                </div>
                                {payment.proof.url ? (
                                    <a
                                        href={payment.proof.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex min-h-9 shrink-0 items-center gap-2 rounded-md border border-orange-200 px-3 text-xs font-bold text-orange-600 transition hover:border-orange-400 hover:bg-orange-50 dark:border-orange-500/20 dark:text-orange-300 dark:hover:bg-orange-500/10"
                                    >
                                        <i className="fa-solid fa-up-right-from-square text-[10px]" />
                                        Bukti
                                    </a>
                                ) : null}
                            </div>
                            {payment.verification.rejection_reason ? (
                                <p className="mt-3 text-xs leading-5 text-red-600 dark:text-red-300">
                                    Alasan terakhir: {payment.verification.rejection_reason}
                                </p>
                            ) : null}
                        </div>

                        {payment.can_verify ? (
                            <form onSubmit={onSubmitManualReview} className="mt-3 space-y-3">
                                <select
                                    value={reviewStatus}
                                    onChange={(event) => onReviewStatusChange(event.target.value as "verified" | "rejected")}
                                    className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition focus:border-orange-500 focus:outline-none dark:border-white/10 dark:bg-slate-900 dark:text-slate-200"
                                >
                                    <option value="verified">Validasi / Lunas</option>
                                    <option value="rejected">Tolak Bukti</option>
                                </select>

                                {reviewStatus === "rejected" ? (
                                    <textarea
                                        value={reviewReason}
                                        onChange={(event) => onReviewReasonChange(event.target.value)}
                                        rows={4}
                                        placeholder="Alasan penolakan..."
                                        className="w-full resize-none rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-700 transition placeholder:text-slate-400 focus:border-orange-500 focus:outline-none dark:border-white/10 dark:bg-slate-900 dark:text-slate-200"
                                    />
                                ) : null}

                                <button
                                    type="submit"
                                    disabled={processing || (reviewStatus === "rejected" && !reviewReason.trim())}
                                    className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md bg-orange-500 px-3 text-sm font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {processing ? (
                                        <>
                                            <i className="fa-solid fa-spinner fa-spin text-xs" />
                                            Menyimpan...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fa-solid fa-check text-xs" />
                                            Simpan Review
                                        </>
                                    )}
                                </button>
                            </form>
                        ) : null}
                    </section>
                ) : null}
            </div>
        </aside>
    );
}

function MiniInfo({ label, value, strong = false, warn = false, mono = false }: { label: string; value: string; strong?: boolean; warn?: boolean; mono?: boolean }) {
    return (
        <div className="min-w-0 rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.03]">
            <p className="text-[10px] font-bold uppercase text-slate-400">{label}</p>
            <p
                className={[
                    "mt-1 truncate text-xs",
                    strong ? "font-black text-slate-900 dark:text-white" : "font-semibold text-slate-700 dark:text-slate-200",
                    warn ? "text-red-600 dark:text-red-300" : "",
                    mono ? "font-mono" : "",
                ].join(" ")}
                title={value}
            >
                {value}
            </p>
        </div>
    );
}

function PaymentPagination({ payments, filters }: { payments: Paginated<PaymentRow>; filters: Filters }) {
    if (payments.last_page <= 1) return null;

    const goToPage = (url: string | null) => {
        if (!url) return;

        const pageValue = new URL(url, "http://localhost").searchParams.get("page");
        const page = pageValue ? Number(pageValue) : 1;

        router.get(
            BASE_PATH,
            buildQuery(filters, Number.isFinite(page) ? page : 1),
            { preserveState: true, preserveScroll: false },
        );
    };

    return (
        <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-400">
                Halaman {payments.current_page} dari {payments.last_page} - {payments.total.toLocaleString("id-ID")} transaksi
            </p>
            <div className="flex flex-wrap gap-1.5">
                {payments.links.map((link, index) => (
                    <button
                        key={`${link.label}-${index}`}
                        type="button"
                        onClick={() => goToPage(link.url)}
                        disabled={!link.url}
                        // eslint-disable-next-line react/no-danger
                        dangerouslySetInnerHTML={{ __html: link.label }}
                        className={[
                            "flex h-9 min-w-9 items-center justify-center rounded-md px-3 text-xs font-bold transition",
                            link.active
                                ? "bg-emerald-500 text-white"
                                : link.url
                                    ? "border border-slate-200 text-slate-600 hover:border-emerald-400 hover:text-emerald-600 dark:border-white/10 dark:text-slate-300"
                                    : "cursor-not-allowed border border-slate-200 text-slate-300 opacity-50 dark:border-white/10 dark:text-slate-600",
                        ].join(" ")}
                    />
                ))}
            </div>
        </div>
    );
}

StaffPaymentOperations.layout = (page: any) => <DashboardLayout>{page}</DashboardLayout>;
