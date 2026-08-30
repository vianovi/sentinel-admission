import { useEffect } from "react";
import { Head, Link } from "@inertiajs/react";
import { animate, stagger } from "animejs";
import DashboardLayout from "@/Layouts/DashboardLayout";
import GoldPageHeader from "@/Components/Dashboard/Candidate/Panel/GoldPageHeader";
import GoldStatCard from "@/Components/Dashboard/Candidate/Panel/GoldStatCard";
import StatusPill, { type PillTone } from "@/Components/Dashboard/Candidate/Panel/StatusPill";
import EmptyState from "@/Components/Dashboard/Candidate/Panel/EmptyState";

type PaymentTone = "success" | "warning" | "danger" | "neutral";

type PaymentRow = {
    id: number;
    order_id: string;
    payment_channel: "gateway" | "transfer" | "cash";
    payment_channel_label: string;
    payment_method: string | null;
    base_amount: number | null;
    fee_amount: number | null;
    final_amount: number | null;
    status: string;
    status_label: string;
    manual_status_label: string | null;
    proof_original_filename: string | null;
    proof_uploaded_at: string | null;
    proof_attempt: number | null;
    bank_name: string | null;
    account_name: string | null;
    transfer_date: string | null;
    verified_at: string | null;
    rejection_reason: string | null;
    paid_at: string | null;
    expired_at: string | null;
    created_at: string | null;
    updated_at: string | null;
    tone: PaymentTone;
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

type Props = {
    summary: {
        total_transactions: number;
        paid_transactions: number;
        pending_transactions: number;
        rejected_transactions: number;
        paid_amount: number;
        latest: PaymentRow | null;
    };
    payments: Paginated<PaymentRow>;
};

const rupiah = (value: number | null): string => {
    if (value === null) return "-";

    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(value);
};

const toneMap: Record<PaymentTone, PillTone> = {
    success: "success",
    warning: "warning",
    danger: "danger",
    neutral: "neutral",
};

const cleanLabel = (label: string): string => label.replace("&laquo;", "‹").replace("&raquo;", "›");

export default function CandidatePaymentHistory({ summary, payments }: Props) {
    useEffect(() => {
        animate(".candidate-panel-entry", {
            opacity: [0, 1],
            translateY: [14, 0],
            duration: 520,
            delay: stagger(45),
            ease: "outExpo",
        });
    }, [payments.current_page]);

    return (
        <>
            <Head title="Riwayat Pembayaran" />

            <div className="flex flex-col gap-5 pb-8">
                <GoldPageHeader
                    eyebrow="Payment Ledger"
                    title="Riwayat Pembayaran"
                    description="Rekam transaksi pembayaran pendaftaran yang aman dibaca kandidat, termasuk status bukti, nominal, dan catatan penolakan jika ada."
                    icon="fa-solid fa-receipt"
                    action={{ label: "Buka Pembayaran", href: "/dashboard/pembayaran", icon: "fa-solid fa-credit-card" }}
                />

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <GoldStatCard label="Total Transaksi" value={String(summary.total_transactions)} icon="fa-solid fa-file-invoice" />
                    <GoldStatCard label="Transaksi Lunas" value={String(summary.paid_transactions)} icon="fa-solid fa-circle-check" />
                    <GoldStatCard label="Menunggu" value={String(summary.pending_transactions)} icon="fa-solid fa-hourglass-half" />
                    <GoldStatCard label="Total Lunas" value={rupiah(summary.paid_amount)} icon="fa-solid fa-money-bill-wave" />
                </section>

                {payments.data.length === 0 ? (
                    <EmptyState
                        icon="fa-solid fa-receipt"
                        title="Belum ada riwayat pembayaran"
                        description="Transaksi akan muncul di sini setelah kamu membuat pembayaran dari halaman Pembayaran."
                        actionLabel="Buka Pembayaran"
                        actionHref="/dashboard/pembayaran"
                    />
                ) : (
                    <section className="candidate-panel-entry overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900">
                        <div className="border-b border-slate-200 px-5 py-4 dark:border-white/10">
                            <h2 className="text-lg font-display font-bold text-slate-900 dark:text-white">Daftar Transaksi</h2>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{payments.total} transaksi tercatat untuk akun ini.</p>
                        </div>

                        <div className="divide-y divide-slate-200 dark:divide-white/10">
                            {payments.data.map((payment) => (
                                <article key={payment.id} className="p-5 transition hover:bg-slate-50 dark:hover:bg-white/[0.03]">
                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <StatusPill tone={toneMap[payment.tone]} label={payment.status_label} />
                                                {payment.manual_status_label && <StatusPill tone="gold" label={payment.manual_status_label} />}
                                            </div>
                                            <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">{payment.order_id}</h3>
                                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                {payment.payment_channel_label}
                                                {payment.payment_method ? ` - ${payment.payment_method}` : ""}
                                                {payment.created_at ? ` - Dibuat ${payment.created_at}` : ""}
                                            </p>
                                        </div>
                                        <div className="text-left lg:text-right">
                                            <p className="text-xl font-black text-slate-900 dark:text-white">{rupiah(payment.final_amount)}</p>
                                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                Biaya admin {rupiah(payment.fee_amount)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                                        <Info
                                            label="Bukti"
                                            value={payment.payment_channel === "gateway"
                                                ? "Tidak diperlukan"
                                                : payment.proof_original_filename ?? "Belum ada"}
                                        />
                                        <Info
                                            label="Upload Bukti"
                                            value={payment.payment_channel === "gateway"
                                                ? "Otomatis via gateway"
                                                : payment.proof_uploaded_at ?? "-"}
                                        />
                                        <Info label="Verifikasi" value={payment.verified_at ?? payment.paid_at ?? "-"} />
                                    </div>

                                    {payment.rejection_reason && (
                                        <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-200">
                                            <span className="font-bold">Alasan penolakan:</span> {payment.rejection_reason}
                                        </div>
                                    )}
                                </article>
                            ))}
                        </div>

                        {payments.last_page > 1 && (
                            <div className="flex flex-wrap items-center justify-center gap-2 border-t border-slate-200 px-5 py-4 dark:border-white/10">
                                {payments.links.map((link, index) => (
                                    link.url ? (
                                        <Link
                                            key={`${link.label}-${index}`}
                                            href={link.url}
                                            className={`inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg px-3 text-xs font-bold transition ${
                                                link.active
                                                    ? "bg-gold text-navy"
                                                    : "border border-slate-200 text-slate-600 hover:border-gold hover:text-amber-700 dark:border-white/10 dark:text-slate-300 dark:hover:text-gold"
                                            }`}
                                        >
                                            {cleanLabel(link.label)}
                                        </Link>
                                    ) : (
                                        <span
                                            key={`${link.label}-${index}`}
                                            className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-300 dark:border-white/10 dark:text-slate-600"
                                        >
                                            {cleanLabel(link.label)}
                                        </span>
                                    )
                                ))}
                            </div>
                        )}
                    </section>
                )}
            </div>
        </>
    );
}

function Info({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/[0.03]">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
            <p className="mt-1 truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{value}</p>
        </div>
    );
}

CandidatePaymentHistory.layout = (page: any) => <DashboardLayout>{page}</DashboardLayout>;
