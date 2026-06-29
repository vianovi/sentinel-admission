import { Head, Link } from "@inertiajs/react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { BackLink, EmptyState, PageHeader, StatCard, StatusPill } from "@/Components/Dashboard/Admin/Exam/ExamAdminUi";

type FailureRow = {
    row: number | null;
    question_text?: string | null;
    reasons: string[];
};

type Batch = {
    id: number;
    package_id: number;
    package_title: string | null;
    subject_name: string | null;
    uploaded_by: string | null;
    original_filename: string;
    status: string;
    total_rows: number;
    imported_rows: number;
    failed_rows: number;
    missing_columns: string[];
    failure_report: FailureRow[];
    started_at: string | null;
    finished_at: string | null;
};

type Props = {
    batch: Batch;
};

export default function ExamImportBatchShow({ batch }: Props) {
    const hasFailures = batch.failed_rows > 0 || batch.failure_report.length > 0 || batch.missing_columns.length > 0;
    const isSuccessful = batch.status === "completed" && !hasFailures;

    return (
        <DashboardLayout>
            <Head title={`Import ${batch.original_filename}`} />

            <div className="space-y-5 pb-8">
                <PageHeader
                    title="Laporan Import Soal"
                    description={`${batch.package_title ?? "Tanpa paket"} · ${batch.original_filename}`}
                    icon="fa-solid fa-file-import"
                    actions={
                        <>
                            <BackLink href={`/dashboard/admin/exams/packages/${batch.package_id}`} label="Paket" />
                            <Link href={`/dashboard/admin/exams/packages/${batch.package_id}/imports`} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-bold text-slate-700 hover:border-rose-300 hover:text-rose-500 dark:border-white/10 dark:text-slate-200">
                                <i className="fa-solid fa-clock-rotate-left text-xs" /> Riwayat
                            </Link>
                            <a href="/templates/exam-question-template.xlsx" download className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-rose-500 px-3 text-sm font-bold text-white hover:bg-rose-400">
                                <i className="fa-solid fa-file-arrow-down text-xs" /> Template
                            </a>
                        </>
                    }
                />

                <section className={`rounded-lg border p-4 ${isSuccessful ? "border-emerald-500/20 bg-emerald-500/10" : hasFailures ? "border-amber-500/20 bg-amber-500/10" : "border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900"}`}>
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                                <StatusPill value={batch.status} />
                                <StatusPill value={batch.subject_name ?? "tanpa subject"} />
                            </div>
                            <h2 className="text-base font-black text-slate-900 dark:text-white">
                                {isSuccessful ? "Import selesai tanpa kegagalan" : hasFailures ? "Import selesai dengan catatan" : "Import sedang/baru diproses"}
                            </h2>
                            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Diunggah oleh {batch.uploaded_by ?? "-"} pada {batch.started_at ?? "-"}.</p>
                            <p className="mt-1 text-xs text-slate-500">Selesai: {batch.finished_at ?? "-"}</p>
                            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                                {isSuccessful
                                    ? "Langkah berikutnya: buka paket untuk preview soal, lalu publish paket jika bank soal sudah siap dipakai."
                                    : "Perbaiki baris yang gagal dengan pesan di bawah, simpan sebagai XLSX, lalu import ulang file yang sudah diperbaiki."}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Link href={`/dashboard/admin/exams/packages/${batch.package_id}`} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-slate-900 px-3 text-sm font-bold text-white hover:bg-slate-700 dark:bg-white dark:text-slate-950">
                                <i className="fa-solid fa-box-archive text-xs" /> Buka Paket
                            </Link>
                        </div>
                    </div>
                </section>

                <div className="grid gap-3 md:grid-cols-3">
                    <StatCard label="Baris Dipindai" value={batch.total_rows} icon="fa-solid fa-table-list" tone="text-blue-500" />
                    <StatCard label="Berhasil" value={batch.imported_rows} icon="fa-solid fa-circle-check" tone="text-emerald-500" />
                    <StatCard label="Gagal" value={batch.failed_rows} icon="fa-solid fa-triangle-exclamation" tone="text-red-500" />
                </div>

                {batch.missing_columns.length > 0 ? (
                    <section className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-red-800 dark:text-red-200">
                        <h2 className="text-sm font-bold">Kolom wajib belum lengkap</h2>
                        <div className="mt-3 flex flex-wrap gap-2">
                            {batch.missing_columns.map((column) => (
                                <code key={column} className="rounded-md bg-white/70 px-2 py-1 text-[11px] font-bold text-red-700 dark:bg-red-950/40 dark:text-red-200">
                                    {column}
                                </code>
                            ))}
                        </div>
                    </section>
                ) : null}

                <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
                    <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <h2 className="text-sm font-bold text-slate-900 dark:text-white">Failure Report</h2>
                        <span className="text-xs font-semibold text-slate-500">{batch.failure_report.length.toLocaleString("id-ID")} baris perlu diperiksa</span>
                    </div>

                    {batch.failure_report.length === 0 ? (
                        <EmptyState icon="fa-solid fa-shield-check" title="Tidak ada kegagalan baris" description="Semua baris valid berhasil diproses. Lanjutkan ke halaman paket untuk preview dan publish bila sudah siap." />
                    ) : (
                        <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-white/10">
                            <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-white/10">
                                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-white/5 dark:text-slate-400">
                                    <tr>
                                        <th className="px-4 py-3 text-left">Baris</th>
                                        <th className="px-4 py-3 text-left">Soal</th>
                                        <th className="px-4 py-3 text-left">Alasan</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                                    {batch.failure_report.map((failure, index) => (
                                        <tr key={`${failure.row ?? "file"}-${index}`} className="align-top">
                                            <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{failure.row ?? "-"}</td>
                                            <td className="max-w-md px-4 py-3 text-slate-600 dark:text-slate-300">{failure.question_text || "-"}</td>
                                            <td className="px-4 py-3">
                                                <ul className="space-y-1 text-slate-600 dark:text-slate-300">
                                                    {failure.reasons.map((reason) => (
                                                        <li key={reason} className="flex gap-2">
                                                            <i className="fa-solid fa-circle-exclamation mt-1 text-[10px] text-red-500" />
                                                            <span>{reason}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>
        </DashboardLayout>
    );
}
