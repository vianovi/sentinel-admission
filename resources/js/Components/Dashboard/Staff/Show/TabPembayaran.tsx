import { useState } from "react";
import { router } from "@inertiajs/react";
import Swal from "sweetalert2";
import { EmptyState, InfoField, Pill, SectionTitle } from "./ReadonlyParts";

export type StaffPayment = {
    id: number;
    order_id: string;
    payment_channel: "gateway" | "transfer" | "cash";
    base_amount: number;
    fee_amount: number;
    final_amount: number;
    payment_method: string | null;
    status: string;
    manual_status: string | null;
    proof_original_filename: string | null;
    proof_uploaded_at: string | null;
    proof_attempt: number;
    proof_url: string | null;
    rejection_reason: string | null;
    verified_by: string | null;
    verified_at: string | null;
    paid_at: string | null;
    expired_at: string | null;
    is_expired: boolean;
    can_verify: boolean;
} | null;

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

const CHANNEL_LABEL: Record<string, string> = {
    gateway: "Payment Gateway",
    transfer: "Transfer Bank",
    cash: "Cash",
};

const MANUAL_STATUS_LABEL: Record<string, string> = {
    waiting_proof: "Menunggu Bukti",
    proof_uploaded: "Menunggu Verifikasi",
    verified: "Terverifikasi",
    rejected: "Ditolak",
};

function formatCurrency(value: number) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(value);
}

function statusTone(status: string): "slate" | "green" | "amber" | "red" | "blue" | "orange" {
    if (status === "paid" || status === "verified") return "green";
    if (status === "proof_uploaded") return "blue";
    if (status === "rejected" || status === "failed" || status === "expired") return "red";
    if (status === "pending" || status === "waiting_proof") return "amber";
    return "slate";
}

type Props = {
    payment: StaffPayment;
    basePath?: string;
};

export default function TabPembayaran({ payment, basePath = "/dashboard/staff" }: Props) {
    const [status, setStatus] = useState<"verified" | "rejected">("verified");
    const [reason, setReason] = useState("");
    const [processing, setProcessing] = useState(false);

    if (!payment) {
        return (
            <EmptyState
                icon="fa-solid fa-credit-card"
                title="Belum ada transaksi pembayaran"
                description="Kandidat belum membuat transaksi pembayaran."
            />
        );
    }

    const submitVerification = async (e: React.FormEvent) => {
        e.preventDefault();
        if (processing || !payment.can_verify) return;

        if (status === "rejected" && !reason.trim()) {
            await swalDark.fire({
                icon: "warning",
                title: "Alasan wajib diisi",
                text: "Jika bukti pembayaran ditolak, alasan penolakan harus diisi.",
            });
            return;
        }

        const result = await swalDark.fire({
            icon: status === "verified" ? "question" : "warning",
            title: status === "verified" ? "Validasi pembayaran?" : "Tolak bukti pembayaran?",
            text: payment.proof_original_filename ?? payment.order_id,
            showCancelButton: true,
            confirmButtonText: "Ya, lanjutkan",
            cancelButtonText: "Batal",
        });

        if (!result.isConfirmed) return;

        setProcessing(true);
        router.post(
            `${basePath}/payments/${payment.id}/verify`,
            {
                status,
                rejection_reason: status === "rejected" ? reason : undefined,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setReason("");
                    setStatus("verified");
                },
                onFinish: () => setProcessing(false),
            }
        );
    };

    return (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="space-y-6 xl:col-span-2">
                <SectionTitle
                    icon="fa-solid fa-credit-card"
                    title="Data Pembayaran"
                    subtitle="Ringkasan transaksi dan status pembayaran kandidat."
                    tone="orange"
                />

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    <InfoField label="Order ID" value={payment.order_id} />
                    <InfoField label="Channel" value={CHANNEL_LABEL[payment.payment_channel] ?? payment.payment_channel} />
                    <InfoField label="Metode Gateway" value={payment.payment_method} />
                    <InfoField label="Nominal Dasar" value={formatCurrency(payment.base_amount)} />
                    <InfoField label="Biaya Gateway" value={formatCurrency(payment.fee_amount)} />
                    <InfoField label="Total Pembayaran" value={formatCurrency(payment.final_amount)} />
                    <InfoField label="Status Pembayaran" value={<Pill tone={statusTone(payment.status)}>{payment.status}</Pill>} />
                    <InfoField
                        label="Status Manual"
                        value={payment.manual_status ? <Pill tone={statusTone(payment.manual_status)}>{MANUAL_STATUS_LABEL[payment.manual_status] ?? payment.manual_status}</Pill> : null}
                    />
                    <InfoField label="Expired At" value={payment.expired_at} />
                    <InfoField label="Paid At" value={payment.paid_at} />
                    <InfoField label="Diverifikasi Oleh" value={payment.verified_by} />
                    <InfoField label="Diverifikasi Pada" value={payment.verified_at} />
                </div>

                <SectionTitle
                    icon="fa-solid fa-receipt"
                    title="Bukti Pembayaran"
                    subtitle="Bukti manual dari kandidat untuk diverifikasi staff."
                    tone="orange"
                />

                <div className="rounded-2xl border border-black/[0.07] bg-white p-5 dark:border-white/[0.07] dark:bg-white/[0.02]">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                                {payment.proof_original_filename ?? "Belum ada bukti pembayaran"}
                            </p>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                {payment.proof_uploaded_at
                                    ? `Diunggah pada ${payment.proof_uploaded_at} - percobaan ${payment.proof_attempt}`
                                    : "Kandidat belum mengunggah bukti pembayaran manual."}
                            </p>
                            {payment.rejection_reason && (
                                <p className="mt-2 text-xs leading-relaxed text-red-500">
                                    Alasan penolakan terakhir: {payment.rejection_reason}
                                </p>
                            )}
                        </div>
                        {payment.proof_url && (
                            <a
                                href={payment.proof_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-orange-200 px-4 text-sm font-semibold text-orange-600 transition hover:border-orange-400 hover:bg-orange-50 dark:border-orange-500/20 dark:text-orange-400 dark:hover:bg-orange-500/10"
                            >
                                <i className="fa-solid fa-up-right-from-square text-xs"></i>
                                Lihat Bukti
                            </a>
                        )}
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <form
                    onSubmit={submitVerification}
                    className="rounded-2xl border border-slate-200 p-5 dark:border-white/5"
                >
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">
                        Validasi Pembayaran
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                        Tersedia setelah kandidat upload bukti manual.
                    </p>

                    {!payment.can_verify && (
                        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 dark:border-amber-500/20 dark:bg-amber-500/10">
                            <p className="text-xs text-amber-700 dark:text-amber-400">
                                Status saat ini belum mengizinkan validasi.
                            </p>
                        </div>
                    )}

                    <div className="mt-4 flex flex-col gap-3">
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value as "verified" | "rejected")}
                            disabled={!payment.can_verify}
                            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 transition-colors focus:border-orange-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200"
                        >
                            <option value="verified">Validasi / Lunas</option>
                            <option value="rejected">Tolak Bukti</option>
                        </select>

                        {status === "rejected" && (
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Tulis alasan penolakan..."
                                rows={4}
                                className="w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700 transition-colors placeholder:text-slate-400 focus:border-orange-500 focus:outline-none dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 dark:placeholder:text-slate-500"
                            />
                        )}

                        <button
                            type="submit"
                            disabled={!payment.can_verify || processing || (status === "rejected" && !reason.trim())}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-orange-500 text-sm font-semibold text-white shadow-sm shadow-orange-500/20 transition-all hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {processing ? (
                                <><i className="fa-solid fa-spinner fa-spin"></i> Menyimpan...</>
                            ) : (
                                <><i className="fa-solid fa-check"></i> Simpan Validasi</>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
