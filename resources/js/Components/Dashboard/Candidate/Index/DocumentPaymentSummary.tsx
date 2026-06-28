import { Link } from "@inertiajs/react";
import { memo } from "react";
import type { DocumentsSummary, PaymentSummary } from "./types";
import { formatRupiah, stateClasses, stateLabel } from "./ui";

type Props = {
    documents: DocumentsSummary;
    payment: PaymentSummary;
};

function StatPill({ label, value }: { label: string; value: number }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 dark:border-white/[0.08] dark:bg-white/[0.04]">
            <p className="text-lg font-bold text-slate-900 dark:text-white">{value}</p>
            <p className="mt-0.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">{label}</p>
        </div>
    );
}

function DocumentPaymentSummary({ documents, payment }: Props) {
    return (
        <section className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft dark:border-white/[0.08] dark:bg-slate-900 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-500">
                            Dokumen
                        </p>
                        <h2 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                            {documents.uploaded_required}/{documents.total_required} dokumen wajib
                        </h2>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            {documents.total_uploaded} file sudah diunggah untuk proses pendaftaran.
                        </p>
                    </div>
                    <span className={`rounded-lg border px-2.5 py-1 text-xs font-semibold ${stateClasses[documents.state]}`}>
                        {stateLabel(documents.state)}
                    </span>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-2">
                    <StatPill label="Pending" value={documents.pending} />
                    <StatPill label="Valid" value={documents.verified} />
                    <StatPill label="Ditolak" value={documents.rejected} />
                </div>

                {(documents.missing_required_labels.length > 0 || documents.rejected_labels.length > 0) && (
                    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-500/20 dark:bg-amber-500/10">
                        <p className="text-xs font-semibold text-amber-800 dark:text-amber-200">
                            Perlu perhatian
                        </p>
                        {documents.missing_required_labels.length > 0 && (
                            <p className="mt-1 text-xs leading-5 text-amber-700 dark:text-amber-300">
                                Belum upload: {documents.missing_required_labels.slice(0, 4).join(", ")}
                                {documents.missing_required_labels.length > 4 ? "..." : ""}
                            </p>
                        )}
                        {documents.rejected_labels.length > 0 && (
                            <p className="mt-1 text-xs leading-5 text-red-600 dark:text-red-300">
                                Ditolak: {documents.rejected_labels.slice(0, 4).join(", ")}
                                {documents.rejected_labels.length > 4 ? "..." : ""}
                            </p>
                        )}
                    </div>
                )}

                <Link
                    href="/dashboard/data-dokumen"
                    className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-amber-300 hover:text-amber-600 dark:border-white/[0.08] dark:text-slate-200 dark:hover:border-amber-500/40 dark:hover:text-amber-300"
                >
                    <span>Buka Dokumen</span>
                    <i className="fa-solid fa-arrow-right text-xs" />
                </Link>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft dark:border-white/[0.08] dark:bg-slate-900 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-orange-500">
                            Pembayaran
                        </p>
                        <h2 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                            {payment.status_label}
                        </h2>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            {payment.payment_channel_label ?? "Pilih metode pembayaran saat sudah siap."}
                        </p>
                    </div>
                    <span className={`rounded-lg border px-2.5 py-1 text-xs font-semibold ${stateClasses[payment.state]}`}>
                        {stateLabel(payment.state)}
                    </span>
                </div>

                <div className="mt-5 rounded-xl bg-navy p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Nominal</p>
                    <p className="mt-1 text-2xl font-bold text-white">
                        {payment.amount !== null ? formatRupiah(payment.amount) : "-"}
                    </p>
                    <div className="mt-3 grid gap-2 text-xs text-slate-300 sm:grid-cols-2">
                        <span>Bukti: {payment.proof_uploaded ? "Sudah diupload" : "Belum ada"}</span>
                        <span>Manual: {payment.manual_status_label ?? "-"}</span>
                    </div>
                </div>

                {payment.rejection_reason && (
                    <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-500/20 dark:bg-red-500/10">
                        <p className="text-xs font-semibold text-red-700 dark:text-red-200">Catatan penolakan</p>
                        <p className="mt-1 text-xs leading-5 text-red-600 dark:text-red-300">{payment.rejection_reason}</p>
                    </div>
                )}

                <Link
                    href="/dashboard/pembayaran"
                    className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-orange-300 hover:text-orange-600 dark:border-white/[0.08] dark:text-slate-200 dark:hover:border-orange-500/40 dark:hover:text-orange-300"
                >
                    <span>Buka Pembayaran</span>
                    <i className="fa-solid fa-arrow-right text-xs" />
                </Link>
            </div>
        </section>
    );
}

export default memo(DocumentPaymentSummary);
