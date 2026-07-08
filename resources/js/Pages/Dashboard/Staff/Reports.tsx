import { memo, useMemo, type ReactNode } from "react";
import { Head, Link } from "@inertiajs/react";
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { useTheme } from "@/context/ThemeContext";

type Tone = "success" | "warning" | "danger" | "primary" | "neutral" | "muted";

type BucketStat = {
    bucket: string;
    label: string;
    count: number;
};

type TrendPoint = {
    date: string;
    submitted: number;
    paid: number;
};

type PaymentChannelPoint = {
    channel: string;
    label: string;
    count: number;
};

type WaveReport = {
    id: string;
    wave: string;
    academic_year: string | null;
    program: string;
    total: number;
    submitted: number;
    verified: number;
    accepted: number;
    paid: number;
    manual_review: number;
    blockers: number;
    verified_unassigned: number;
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
    charts: {
        trend: TrendPoint[];
        payment_channels: PaymentChannelPoint[];
    };
    wave_reports: WaveReport[];
    recent_candidates: RecentCandidate[];
    generated_at: string;
};

type MetricCard = {
    key: string;
    label: string;
    value: string;
    sub: string;
    icon: string;
    tone: Tone;
};

type PipelineStep = {
    key: string;
    label: string;
    value: number;
    total: number;
    tone: Tone;
};

type ChartTooltipProps = {
    active?: boolean;
    payload?: Array<{ value: number; name?: string; color?: string }>;
    label?: string;
    isDark: boolean;
};

const toneClass: Record<Tone, string> = {
    success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    warning: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    danger: "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300",
    primary: "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300",
    neutral: "border-slate-300 bg-slate-100 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300",
    muted: "border-slate-300 bg-slate-100 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300",
};

const toneBarClass: Record<Tone, string> = {
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    danger: "bg-red-500",
    primary: "bg-blue-500",
    neutral: "bg-slate-400",
    muted: "bg-slate-400",
};

const statusLabel: Record<string, string> = {
    draft: "Draft",
    submitted: "Submitted",
    verified: "Verified",
    accepted: "Diterima",
    rejected: "Ditolak",
};

const paymentChannelColors: Record<string, string> = {
    gateway: "#2563eb",
    transfer: "#f97316",
    cash: "#10b981",
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

function percent(value: number, total: number) {
    if (total <= 0) return 0;

    return Math.round((value / total) * 100);
}

function ChartTooltip({ active, payload, label, isDark }: ChartTooltipProps) {
    if (!active || !payload?.length) return null;

    return (
        <div
            className="rounded-lg border px-3 py-2 text-xs shadow-xl"
            style={{
                backgroundColor: isDark ? "#0f172a" : "#ffffff",
                borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(15,23,42,0.12)",
            }}
        >
            {label ? (
                <p className="mb-1 font-black" style={{ color: isDark ? "#f8fafc" : "#0f172a" }}>
                    {label}
                </p>
            ) : null}
            <div className="space-y-1">
                {payload.map((entry) => (
                    <p key={`${entry.name ?? "series"}-${entry.color ?? "color"}`} style={{ color: entry.color ?? (isDark ? "#cbd5e1" : "#475569") }}>
                        {entry.name ?? "Data"}: <span className="font-black">{number(entry.value)}</span>
                    </p>
                ))}
            </div>
        </div>
    );
}

function SectionShell({ title, subtitle, icon, children, action }: { title: string; subtitle: string; icon: string; children: ReactNode; action?: ReactNode }) {
    return (
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900">
            <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
                        <i className={`${icon} text-xs`} />
                    </div>
                    <div className="min-w-0">
                        <h2 className="text-sm font-black uppercase tracking-wide text-slate-900 dark:text-white">{title}</h2>
                        <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{subtitle}</p>
                    </div>
                </div>
                {action}
            </div>
            {children}
        </section>
    );
}

const MetricCardView = memo(function MetricCardView({ card }: { card: MetricCard }) {
    return (
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900">
            <div className="flex items-start gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md border ${toneClass[card.tone]}`}>
                    <i className={`${card.icon} text-sm`} />
                </div>
                <div className="min-w-0">
                    <p className="text-2xl font-black leading-none text-slate-900 dark:text-white">{card.value}</p>
                    <p className="mt-1 text-xs font-bold text-slate-600 dark:text-slate-300">{card.label}</p>
                    <p className="mt-1 text-[11px] font-medium leading-4 text-slate-500 dark:text-slate-400">{card.sub}</p>
                </div>
            </div>
        </div>
    );
});

function ProgressRow({ label, value, total, tone }: { label: string; value: number; total: number; tone: Tone }) {
    const progress = percent(value, total);

    return (
        <div>
            <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                <span className="min-w-0 font-bold text-slate-600 dark:text-slate-300">{label}</span>
                <span className="shrink-0 font-black text-slate-900 dark:text-white">{number(value)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                <div className={`h-full rounded-full ${toneBarClass[tone]}`} style={{ width: `${progress}%` }} />
            </div>
        </div>
    );
}

function PipelinePanel({ steps }: { steps: PipelineStep[] }) {
    return (
        <SectionShell
            title="Funnel Kandidat"
            subtitle="Alur status kandidat untuk membaca volume pendaftaran tanpa masuk ke workbench kandidat."
            icon="fa-solid fa-route"
        >
            <div className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-5">
                {steps.map((step) => (
                    <div key={step.key} className="rounded-md border border-slate-200 p-3 dark:border-white/10">
                        <div className="flex items-center justify-between gap-2">
                            <span className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border ${toneClass[step.tone]}`}>
                                <span className="h-2 w-2 rounded-full bg-current" />
                            </span>
                            <span className="text-[11px] font-black text-slate-400">{percent(step.value, step.total)}%</span>
                        </div>
                        <p className="mt-3 text-2xl font-black leading-none text-slate-900 dark:text-white">{number(step.value)}</p>
                        <p className="mt-1 text-xs font-bold text-slate-600 dark:text-slate-300">{step.label}</p>
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                            <div className={`h-full rounded-full ${toneBarClass[step.tone]}`} style={{ width: `${percent(step.value, step.total)}%` }} />
                        </div>
                    </div>
                ))}
            </div>
        </SectionShell>
    );
}

function TrendChart({ data }: { data: TrendPoint[] }) {
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const gridColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.06)";
    const axisColor = isDark ? "#94a3b8" : "#64748b";

    return (
        <SectionShell
            title="Trend 14 Hari"
            subtitle="Submission kandidat dan transaksi lunas sebagai sinyal ritme operasional."
            icon="fa-solid fa-chart-line"
        >
            <div className="h-[260px] px-2 pb-4 pt-5">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 8, right: 16, left: -18, bottom: 0 }}>
                        <defs>
                            <linearGradient id="staffReportSubmitted" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#2563eb" stopOpacity={0.2} />
                                <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="staffReportPaid" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#10b981" stopOpacity={0.18} />
                                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" tick={{ fill: axisColor, fontSize: 11, fontWeight: 600 }} tickLine={false} axisLine={false} />
                        <YAxis allowDecimals={false} tick={{ fill: axisColor, fontSize: 11 }} tickLine={false} axisLine={false} />
                        <Tooltip content={<ChartTooltip isDark={isDark} />} />
                        <Area type="monotone" dataKey="submitted" name="Submitted" stroke="#2563eb" strokeWidth={2.5} fill="url(#staffReportSubmitted)" dot={false} activeDot={{ r: 5 }} />
                        <Area type="monotone" dataKey="paid" name="Lunas" stroke="#10b981" strokeWidth={2.5} fill="url(#staffReportPaid)" dot={false} activeDot={{ r: 5 }} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </SectionShell>
    );
}

function PaymentChannelChart({ data, total }: { data: PaymentChannelPoint[]; total: number }) {
    const { theme } = useTheme();
    const isDark = theme === "dark";

    if (total <= 0) {
        return (
            <SectionShell title="Channel Pembayaran" subtitle="Belum ada transaksi yang bisa direkap." icon="fa-solid fa-wallet">
                <div className="flex h-[260px] items-center justify-center p-6 text-center text-sm font-semibold text-slate-500 dark:text-slate-400">
                    Data payment belum tersedia.
                </div>
            </SectionShell>
        );
    }

    return (
        <SectionShell
            title="Channel Pembayaran"
            subtitle="Komposisi transaksi gateway, transfer, dan cash."
            icon="fa-solid fa-wallet"
        >
            <div className="grid gap-4 p-5 lg:grid-cols-[180px_minmax(0,1fr)] lg:items-center">
                <div className="relative h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={data} dataKey="count" nameKey="label" innerRadius={54} outerRadius={82} paddingAngle={3} stroke="none">
                                {data.map((entry) => (
                                    <Cell key={entry.channel} fill={paymentChannelColors[entry.channel] ?? "#64748b"} />
                                ))}
                            </Pie>
                            <Tooltip content={<ChartTooltip isDark={isDark} />} />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                        <p className="text-2xl font-black leading-none text-slate-900 dark:text-white">{number(total)}</p>
                        <p className="mt-1 text-[11px] font-bold text-slate-500 dark:text-slate-400">transaksi</p>
                    </div>
                </div>
                <div className="space-y-3">
                    {data.map((entry) => (
                        <div key={entry.channel} className="flex items-center justify-between gap-3 rounded-md border border-slate-200 px-3 py-2 dark:border-white/10">
                            <div className="flex min-w-0 items-center gap-2">
                                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: paymentChannelColors[entry.channel] ?? "#64748b" }} />
                                <span className="truncate text-xs font-bold text-slate-600 dark:text-slate-300">{entry.label}</span>
                            </div>
                            <span className="shrink-0 text-sm font-black text-slate-900 dark:text-white">{number(entry.count)}</span>
                        </div>
                    ))}
                </div>
            </div>
        </SectionShell>
    );
}

function BlockerChart({ buckets }: { buckets: BucketStat[] }) {
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const visible = buckets.filter((bucket) => bucket.count > 0).slice(0, 6);
    const chartData = visible.map((bucket) => ({
        ...bucket,
        shortLabel: bucket.label.replace("Pembayaran", "Payment").replace("Permintaan", "Req."),
    }));

    return (
        <SectionShell
            title="Beban Tindakan"
            subtitle="Distribusi blocker aktif yang perlu dipantau lintas kandidat."
            icon="fa-solid fa-triangle-exclamation"
        >
            {chartData.length > 0 ? (
                <div className="h-[260px] px-2 pb-4 pt-5">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 20, left: 26, bottom: 4 }}>
                            <CartesianGrid stroke={isDark ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.06)"} strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" allowDecimals={false} tick={{ fill: isDark ? "#94a3b8" : "#64748b", fontSize: 11 }} tickLine={false} axisLine={false} />
                            <YAxis dataKey="shortLabel" type="category" width={90} tick={{ fill: isDark ? "#94a3b8" : "#64748b", fontSize: 10, fontWeight: 700 }} tickLine={false} axisLine={false} />
                            <Tooltip content={<ChartTooltip isDark={isDark} />} />
                            <Bar dataKey="count" name="Jumlah" radius={[0, 8, 8, 0]} fill="#f59e0b" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <div className="flex h-[260px] items-center justify-center p-6 text-center text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                    Tidak ada blocker aktif pada snapshot ini.
                </div>
            )}
        </SectionShell>
    );
}

function WaveReportTable({ rows }: { rows: WaveReport[] }) {
    return (
        <SectionShell
            title="Rekap Gelombang & Program"
            subtitle="Matriks agregat untuk membaca beban operasional tanpa membuka setiap halaman detail."
            icon="fa-solid fa-table-list"
        >
            {rows.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="min-w-[980px] w-full text-left text-sm">
                        <thead className="border-b border-slate-100 bg-slate-50 text-[11px] uppercase text-slate-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-400">
                            <tr>
                                <th className="px-4 py-3 font-black">Gelombang / Program</th>
                                <th className="px-3 py-3 text-right font-black">Total</th>
                                <th className="px-3 py-3 text-right font-black">Submitted</th>
                                <th className="px-3 py-3 text-right font-black">Verified</th>
                                <th className="px-3 py-3 text-right font-black">Paid</th>
                                <th className="px-3 py-3 text-right font-black">Manual Review</th>
                                <th className="px-3 py-3 text-right font-black">Blocker</th>
                                <th className="px-4 py-3 text-right font-black">Verified tanpa Sesi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                            {rows.map((row) => (
                                <tr key={row.id} className="transition hover:bg-slate-50 dark:hover:bg-white/[0.03]">
                                    <td className="px-4 py-4">
                                        <p className="font-black text-slate-900 dark:text-white">{row.wave}</p>
                                        <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                                            {row.program} {row.academic_year ? `- ${row.academic_year}` : ""}
                                        </p>
                                    </td>
                                    <td className="px-3 py-4 text-right font-black text-slate-900 dark:text-white">{number(row.total)}</td>
                                    <td className="px-3 py-4 text-right font-semibold text-slate-600 dark:text-slate-300">{number(row.submitted)}</td>
                                    <td className="px-3 py-4 text-right font-semibold text-blue-700 dark:text-blue-300">{number(row.verified)}</td>
                                    <td className="px-3 py-4 text-right font-semibold text-emerald-700 dark:text-emerald-300">{number(row.paid)}</td>
                                    <td className="px-3 py-4 text-right font-semibold text-amber-700 dark:text-amber-300">{number(row.manual_review)}</td>
                                    <td className="px-3 py-4 text-right font-semibold text-red-700 dark:text-red-300">{number(row.blockers)}</td>
                                    <td className="px-4 py-4 text-right font-semibold text-slate-600 dark:text-slate-300">{number(row.verified_unassigned)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="p-10 text-center text-sm font-semibold text-slate-500 dark:text-slate-400">
                    Belum ada kandidat untuk direkap.
                </div>
            )}
        </SectionShell>
    );
}

function ExportPanel() {
    return (
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
            <div className="mb-4 flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300">
                    <i className="fa-solid fa-download text-sm" />
                </div>
                <div>
                    <h2 className="text-sm font-black text-slate-900 dark:text-white">Export Data</h2>
                    <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                        Slot export disiapkan untuk format final laporan staff.
                    </p>
                </div>
            </div>
            <button
                type="button"
                disabled
                aria-disabled="true"
                className="flex min-h-14 w-full cursor-not-allowed items-center justify-center gap-3 rounded-md border border-dashed border-slate-300 bg-slate-100 px-5 text-sm font-black text-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-slate-500"
            >
                <i className="fa-solid fa-download text-xs" />
                Unduh data
            </button>
            <div className="mt-4 rounded-md border border-amber-500/20 bg-amber-500/10 p-3 text-xs font-semibold leading-5 text-amber-700 dark:text-amber-200">
                Placeholder aktif. Endpoint download dan generator file belum dibuat.
            </div>
            <Link
                href="/dashboard/staff/reports/export-settings"
                className="mt-3 flex min-h-10 w-full items-center justify-center gap-2 rounded-md border border-slate-200 px-3 text-xs font-black text-slate-600 transition hover:border-blue-300 hover:text-blue-700 dark:border-white/10 dark:text-slate-300 dark:hover:border-blue-400/40 dark:hover:text-blue-300"
            >
                <i className="fa-solid fa-sliders text-[11px]" />
                Atur format export
            </Link>
        </section>
    );
}

function AttentionPanel({ summary }: { summary: Props["summary"] }) {
    const rows = useMemo(() => [
        {
            key: "manual-review",
            label: "Bukti pembayaran manual",
            value: summary.payments.manual_review,
            tone: summary.payments.manual_review > 0 ? "warning" : "success" as Tone,
            href: "/dashboard/staff/payment-operations?action=manual_review",
        },
        {
            key: "failed-payment",
            label: "Payment gagal / expired",
            value: summary.payments.failed_or_expired,
            tone: summary.payments.failed_or_expired > 0 ? "danger" : "success" as Tone,
            href: "/dashboard/staff/payment-operations?action=failed_or_expired",
        },
        {
            key: "document-review",
            label: "Dokumen menunggu review",
            value: summary.candidates.document_review,
            tone: summary.candidates.document_review > 0 ? "warning" : "success" as Tone,
            href: "/dashboard/staff/candidates?action=document_review",
        },
        {
            key: "exam-unassigned",
            label: "Verified tanpa sesi",
            value: summary.selection.verified_unassigned,
            tone: summary.selection.verified_unassigned > 0 ? "danger" : "success" as Tone,
            href: "/dashboard/staff/change-requests?bucket=exam_unassigned",
        },
    ], [summary]);

    return (
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
            <h2 className="text-sm font-black text-slate-900 dark:text-white">Top Perhatian Staff</h2>
            <div className="mt-4 space-y-3">
                {rows.map((row) => (
                    <Link
                        key={row.key}
                        href={row.href}
                        className="flex min-h-12 items-center justify-between gap-3 rounded-md border border-slate-200 px-3 py-2 transition hover:border-blue-300 hover:bg-blue-50/60 dark:border-white/10 dark:hover:border-blue-400/30 dark:hover:bg-blue-500/10"
                    >
                        <div className="flex min-w-0 items-center gap-2">
                            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${toneBarClass[row.tone]}`} />
                            <span className="min-w-0 text-xs font-bold text-slate-600 dark:text-slate-300">{row.label}</span>
                        </div>
                        <span className={`shrink-0 rounded-md border px-2 py-1 text-xs font-black ${toneClass[row.tone]}`}>{number(row.value)}</span>
                    </Link>
                ))}
            </div>
        </section>
    );
}

function RecentActivity({ candidates }: { candidates: RecentCandidate[] }) {
    return (
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
            <h2 className="text-sm font-black text-slate-900 dark:text-white">Aktivitas Terbaru</h2>
            <div className="mt-4 space-y-3">
                {candidates.length > 0 ? candidates.slice(0, 4).map((candidate) => (
                    <Link
                        key={candidate.id}
                        href={`/dashboard/staff/candidates/${candidate.id}`}
                        className="block rounded-md border border-slate-200 p-3 transition hover:border-blue-300 hover:bg-blue-50/60 dark:border-white/10 dark:hover:border-blue-400/30 dark:hover:bg-blue-500/10"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <p className="line-clamp-1 text-xs font-black text-slate-900 dark:text-white">{candidate.full_name}</p>
                                <p className="mt-1 line-clamp-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                    {candidate.candidate_code ?? "-"} · {statusLabel[candidate.status] ?? candidate.status}
                                </p>
                            </div>
                            <span className={`shrink-0 rounded-md border px-2 py-1 text-[10px] font-black ${toneClass[candidate.operational.action_needed.tone]}`}>
                                {candidate.operational.action_needed.label}
                            </span>
                        </div>
                    </Link>
                )) : (
                    <div className="rounded-md border border-slate-200 p-4 text-center text-xs font-semibold text-slate-500 dark:border-white/10 dark:text-slate-400">
                        Belum ada aktivitas kandidat.
                    </div>
                )}
            </div>
        </section>
    );
}

export default function StaffReports({ summary, charts, wave_reports, recent_candidates, generated_at }: Props) {
    const candidateTotal = summary.candidates.total;
    const metricCards = useMemo<MetricCard[]>(() => [
        {
            key: "candidate-total",
            label: "Total Kandidat",
            value: number(candidateTotal),
            sub: `${number(summary.candidates.submitted)} submitted, ${number(summary.candidates.verified)} verified`,
            icon: "fa-solid fa-users",
            tone: "primary",
        },
        {
            key: "paid-amount",
            label: "Nominal Lunas",
            value: rupiah(summary.payments.paid_amount),
            sub: `${number(summary.payments.paid)} transaksi lunas dari ${number(summary.payments.total)} total`,
            icon: "fa-solid fa-receipt",
            tone: "success",
        },
        {
            key: "review-load",
            label: "Beban Review",
            value: number(summary.actions.total),
            sub: "Akumulasi blocker aktif dari queue operasional",
            icon: "fa-solid fa-triangle-exclamation",
            tone: summary.actions.total > 0 ? "warning" : "success",
        },
        {
            key: "selection-ready",
            label: "Seleksi Siap",
            value: number(summary.selection.verified_ready),
            sub: `${number(summary.selection.verified_unassigned)} verified belum memiliki sesi`,
            icon: "fa-solid fa-calendar-check",
            tone: summary.selection.verified_unassigned > 0 ? "danger" : "neutral",
        },
    ], [candidateTotal, summary]);

    const pipelineSteps = useMemo<PipelineStep[]>(() => [
        { key: "draft", label: "Draft", value: summary.candidates.draft, total: candidateTotal, tone: "neutral" },
        { key: "submitted", label: "Submitted", value: summary.candidates.submitted, total: candidateTotal, tone: "warning" },
        { key: "verified", label: "Verified", value: summary.candidates.verified, total: candidateTotal, tone: "primary" },
        { key: "accepted", label: "Diterima", value: summary.candidates.accepted, total: candidateTotal, tone: "success" },
        { key: "rejected", label: "Ditolak", value: summary.candidates.rejected, total: candidateTotal, tone: "danger" },
    ], [candidateTotal, summary.candidates]);

    return (
        <DashboardLayout>
            <Head title="Rekap / Laporan — Staff" />

            <div className="flex flex-col gap-6 pb-8">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900">
                            <i className="fa-solid fa-chart-line text-sm" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="font-display text-xl font-bold leading-tight text-slate-800 dark:text-white">
                                Rekap Operasional Staff
                            </h1>
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                Snapshot lintas kandidat, pembayaran, seleksi, dan tindakan · {generated_at}
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
                    {metricCards.map((card) => (
                        <MetricCardView key={card.key} card={card} />
                    ))}
                </div>

                <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_360px]">
                    <div className="space-y-5">
                        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
                            <TrendChart data={charts.trend} />
                            <PaymentChannelChart data={charts.payment_channels} total={summary.payments.total} />
                        </div>

                        <PipelinePanel steps={pipelineSteps} />

                        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.85fr)]">
                            <SectionShell
                                title="Kesehatan Operasional"
                                subtitle="Indikator ringkas untuk melihat area kerja yang perlu diprioritaskan."
                                icon="fa-solid fa-heart-pulse"
                            >
                                <div className="grid gap-4 p-5 md:grid-cols-2">
                                    <ProgressRow label="Dokumen pending" value={summary.candidates.document_review} total={candidateTotal} tone="warning" />
                                    <ProgressRow label="Pembayaran perlu review" value={summary.candidates.payment_review} total={candidateTotal} tone="danger" />
                                    <ProgressRow label="Perubahan data" value={summary.candidates.change_requests} total={candidateTotal} tone="primary" />
                                    <ProgressRow label="Verified tanpa sesi" value={summary.candidates.verified_unassigned} total={candidateTotal} tone="neutral" />
                                    <ProgressRow label="Gateway pending" value={summary.payments.gateway_pending} total={summary.payments.total} tone="primary" />
                                    <ProgressRow label="Failed / expired" value={summary.payments.failed_or_expired} total={summary.payments.total} tone="danger" />
                                </div>
                            </SectionShell>
                            <BlockerChart buckets={summary.actions.buckets} />
                        </div>

                        <WaveReportTable rows={wave_reports} />
                    </div>

                    <aside className="space-y-5 2xl:sticky 2xl:top-20 2xl:self-start">
                        <ExportPanel />
                        <AttentionPanel summary={summary} />
                        <RecentActivity candidates={recent_candidates} />
                    </aside>
                </div>
            </div>
        </DashboardLayout>
    );
}
