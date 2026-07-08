import { Head, Link } from "@inertiajs/react";
import DashboardLayout from "@/Layouts/DashboardLayout";

type Tone = "success" | "warning" | "danger" | "primary" | "neutral" | "muted";

type BucketStat = {
    bucket: string;
    label: string;
    count: number;
};

type RecentCandidate = {
    id: number;
    candidate_code: string | null;
    full_name: string;
    status: string;
    admission_wave: string | null;
    program_choice: string | null;
    updated_at: string | null;
    operational: {
        waiting_side_label: string | null;
        completion_percentage: number;
        verification_percentage: number;
        action_needed: {
            key: string;
            label: string;
            tone: Tone;
            description: string;
            href: string | null;
        };
    };
};

type Props = {
    summary: {
        candidates: {
            total: number;
            draft: number;
            submitted: number;
            document_review: number;
            payment_review: number;
            change_requests: number;
            verified: number;
            verified_unassigned: number;
            accepted: number;
            rejected: number;
        };
        payments: {
            total: number;
            paid: number;
            pending: number;
            manual_review: number;
            gateway_pending: number;
            failed_or_expired: number;
            paid_amount: number;
        };
        actions: {
            total: number;
            buckets: BucketStat[];
        };
        selection: {
            verified_unassigned: number;
            verified_ready: number;
        };
    };
    recent_candidates: RecentCandidate[];
    generated_at: string;
};

const toneClass: Record<Tone, string> = {
    success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    warning: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    danger: "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300",
    primary: "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300",
    neutral: "border-slate-300 bg-slate-100 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300",
    muted: "border-slate-300 bg-slate-100 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300",
};

const statusLabel: Record<string, string> = {
    draft: "Draft",
    submitted: "Submitted",
    verified: "Verified",
    accepted: "Diterima",
    rejected: "Ditolak",
};

function number(value: number) {
    return new Intl.NumberFormat("id-ID").format(value ?? 0);
}

function rupiah(value: number) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(value ?? 0);
}

function StatCard({ label, value, sub, icon, tone }: { label: string; value: string; sub: string; icon: string; tone: Tone }) {
    return (
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900">
            <div className="flex items-start gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md border ${toneClass[tone]}`}>
                    <i className={`${icon} text-sm`} />
                </div>
                <div className="min-w-0">
                    <p className="truncate text-2xl font-black leading-none text-slate-900 dark:text-white">{value}</p>
                    <p className="mt-1 truncate text-xs font-bold text-slate-600 dark:text-slate-300">{label}</p>
                    <p className="mt-1 line-clamp-2 text-[11px] font-medium leading-4 text-slate-500 dark:text-slate-400">{sub}</p>
                </div>
            </div>
        </div>
    );
}

function ProgressRow({ label, value, total, tone }: { label: string; value: number; total: number; tone: Tone }) {
    const percentage = total > 0 ? Math.round((value / total) * 100) : 0;

    return (
        <div>
            <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                <span className="font-bold text-slate-600 dark:text-slate-300">{label}</span>
                <span className="shrink-0 font-black text-slate-900 dark:text-white">{number(value)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                <div className={`h-full rounded-full ${toneClass[tone].includes("emerald") ? "bg-emerald-500" : toneClass[tone].includes("amber") ? "bg-amber-500" : toneClass[tone].includes("red") ? "bg-red-500" : "bg-blue-500"}`} style={{ width: `${percentage}%` }} />
            </div>
        </div>
    );
}

export default function StaffReports({ summary, recent_candidates, generated_at }: Props) {
    const candidateTotal = summary.candidates.total;
    const topActionBuckets = summary.actions.buckets.filter((bucket) => bucket.count > 0).slice(0, 4);

    return (
        <DashboardLayout>
            <Head title="Rekap / Laporan — Staff" />

            <div className="flex flex-col gap-6 pb-8">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900">
                            <i className="fa-solid fa-chart-line text-sm" />
                        </div>
                        <div>
                            <h1 className="font-display text-xl font-bold leading-tight text-slate-800 dark:text-white">
                                Rekap / Laporan
                            </h1>
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                Snapshot operasional staff, diperbarui {generated_at}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Link
                            href="/dashboard/staff/payment-operations"
                            className="inline-flex min-h-10 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-bold text-slate-600 transition hover:border-emerald-400 hover:text-emerald-600 dark:border-white/10 dark:text-slate-300"
                        >
                            <i className="fa-solid fa-money-check-dollar text-xs" />
                            Payment Ops
                        </Link>
                        <Link
                            href="/dashboard/staff/change-requests"
                            className="inline-flex min-h-10 items-center gap-2 rounded-md bg-slate-900 px-3 text-sm font-bold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                        >
                            <i className="fa-solid fa-triangle-exclamation text-xs" />
                            Perlu Tindakan
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        label="Total Kandidat"
                        value={number(candidateTotal)}
                        sub={`${number(summary.candidates.submitted)} submitted, ${number(summary.candidates.verified)} verified`}
                        icon="fa-solid fa-users"
                        tone="primary"
                    />
                    <StatCard
                        label="Pembayaran Lunas"
                        value={number(summary.payments.paid)}
                        sub={`${rupiah(summary.payments.paid_amount)} tercatat lunas`}
                        icon="fa-solid fa-receipt"
                        tone="success"
                    />
                    <StatCard
                        label="Perlu Tindakan"
                        value={number(summary.actions.total)}
                        sub="Akumulasi blocker operasional dari kandidat"
                        icon="fa-solid fa-triangle-exclamation"
                        tone={summary.actions.total > 0 ? "warning" : "success"}
                    />
                    <StatCard
                        label="Seleksi Belum Siap"
                        value={number(summary.selection.verified_unassigned)}
                        sub={`${number(summary.selection.verified_ready)} verified sudah memiliki sesi`}
                        icon="fa-solid fa-calendar-xmark"
                        tone={summary.selection.verified_unassigned > 0 ? "danger" : "neutral"}
                    />
                </div>

                <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
                    <div className="space-y-5">
                        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
                            <div className="mb-5 flex items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-sm font-black uppercase tracking-wide text-slate-800 dark:text-white">Ringkasan Laporan</h2>
                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Distribusi utama untuk candidate, payment, dan selection readiness.</p>
                                </div>
                            </div>
                            <div className="grid gap-5 lg:grid-cols-3">
                                <div className="space-y-4">
                                    <h3 className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">Candidate Pipeline</h3>
                                    <ProgressRow label="Draft" value={summary.candidates.draft} total={candidateTotal} tone="neutral" />
                                    <ProgressRow label="Submitted" value={summary.candidates.submitted} total={candidateTotal} tone="warning" />
                                    <ProgressRow label="Verified" value={summary.candidates.verified} total={candidateTotal} tone="primary" />
                                    <ProgressRow label="Diterima" value={summary.candidates.accepted} total={candidateTotal} tone="success" />
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">Payment</h3>
                                    <ProgressRow label="Pending" value={summary.payments.pending} total={summary.payments.total} tone="warning" />
                                    <ProgressRow label="Manual Review" value={summary.payments.manual_review} total={summary.payments.total} tone="danger" />
                                    <ProgressRow label="Gateway Pending" value={summary.payments.gateway_pending} total={summary.payments.total} tone="primary" />
                                    <ProgressRow label="Gagal / Expired" value={summary.payments.failed_or_expired} total={summary.payments.total} tone="danger" />
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">Operational Blockers</h3>
                                    <ProgressRow label="Dokumen Pending" value={summary.candidates.document_review} total={candidateTotal} tone="warning" />
                                    <ProgressRow label="Pembayaran Review" value={summary.candidates.payment_review} total={candidateTotal} tone="danger" />
                                    <ProgressRow label="Perubahan Data" value={summary.candidates.change_requests} total={candidateTotal} tone="primary" />
                                    <ProgressRow label="Verified tanpa Sesi" value={summary.candidates.verified_unassigned} total={candidateTotal} tone="neutral" />
                                </div>
                            </div>
                        </section>

                        <section className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900">
                            <div className="border-b border-slate-200 p-5 dark:border-white/10">
                                <h2 className="text-sm font-black uppercase tracking-wide text-slate-800 dark:text-white">Aktivitas Kandidat Terbaru</h2>
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Dipakai sebagai preview laporan, bukan daftar kerja utama.</p>
                            </div>
                            <div className="divide-y divide-slate-100 dark:divide-white/10">
                                {recent_candidates.length > 0 ? recent_candidates.map((candidate) => (
                                    <div key={candidate.id} className="grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_180px_140px] md:items-center">
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="truncate text-sm font-black text-slate-900 dark:text-white">{candidate.full_name}</p>
                                                <span className={`inline-flex min-h-6 items-center rounded-md border px-2 text-[10px] font-bold ${toneClass[candidate.operational.action_needed.tone]}`}>
                                                    {candidate.operational.action_needed.label}
                                                </span>
                                            </div>
                                            <p className="mt-1 truncate text-xs font-semibold text-slate-500 dark:text-slate-400">
                                                {candidate.candidate_code ?? "-"} · {candidate.admission_wave ?? "Tanpa gelombang"} · {candidate.program_choice ?? "Program belum dipilih"}
                                            </p>
                                        </div>
                                        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                            <p>Status: <span className="font-black text-slate-700 dark:text-slate-200">{statusLabel[candidate.status] ?? candidate.status}</span></p>
                                            <p>Menunggu: {candidate.operational.waiting_side_label ?? "-"}</p>
                                        </div>
                                        <Link
                                            href={`/dashboard/staff/candidates/${candidate.id}`}
                                            className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md border border-slate-200 px-3 text-xs font-bold text-slate-600 transition hover:border-blue-400 hover:text-blue-600 dark:border-white/10 dark:text-slate-300"
                                        >
                                            <i className="fa-solid fa-arrow-up-right-from-square text-[10px]" />
                                            Buka Profil
                                        </Link>
                                    </div>
                                )) : (
                                    <div className="p-8 text-center text-sm font-semibold text-slate-500 dark:text-slate-400">
                                        Belum ada kandidat untuk ditampilkan.
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>

                    <aside className="space-y-5 xl:sticky xl:top-20 xl:self-start">
                        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
                            <div className="mb-4 flex items-start gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300">
                                    <i className="fa-solid fa-download text-sm" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-black text-slate-900 dark:text-white">Export Data</h2>
                                    <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                                        Slot export sudah disiapkan. Format final akan diisi pada milestone export settings.
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                disabled
                                className="flex min-h-14 w-full cursor-not-allowed items-center justify-center gap-3 rounded-md border border-dashed border-slate-300 bg-slate-100 px-5 text-sm font-black text-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-slate-500"
                            >
                                <i className="fa-solid fa-download text-xs" />
                                Unduh data
                            </button>
                            <div className="mt-4 rounded-md border border-amber-500/20 bg-amber-500/10 p-3 text-xs font-semibold leading-5 text-amber-700 dark:text-amber-200">
                                Placeholder aktif: belum ada endpoint download dan belum ada generator Excel.
                            </div>
                        </section>

                        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
                            <h2 className="text-sm font-black text-slate-900 dark:text-white">Bucket Perlu Tindakan</h2>
                            <div className="mt-4 space-y-3">
                                {topActionBuckets.length > 0 ? topActionBuckets.map((bucket) => (
                                    <div key={bucket.bucket} className="flex items-center justify-between gap-3 rounded-md border border-slate-200 px-3 py-2 dark:border-white/10">
                                        <span className="min-w-0 truncate text-xs font-bold text-slate-600 dark:text-slate-300">{bucket.label}</span>
                                        <span className="shrink-0 text-sm font-black text-slate-900 dark:text-white">{number(bucket.count)}</span>
                                    </div>
                                )) : (
                                    <div className="rounded-md border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                                        Tidak ada bucket tindakan aktif pada snapshot ini.
                                    </div>
                                )}
                            </div>
                        </section>
                    </aside>
                </div>
            </div>
        </DashboardLayout>
    );
}
