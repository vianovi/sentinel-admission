import { memo, useCallback, useMemo, useState, type ReactNode } from "react";
import { Head, Link } from "@inertiajs/react";
import {
    Area,
    AreaChart,
    CartesianGrid,
    Cell,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    type PieLabelRenderProps,
    type PieSectorDataItem,
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

type PaymentStatusPoint = {
    key: string;
    label: string;
    count: number;
};

type WaveProgramReport = {
    id: string;
    name: string;
    priority: number | null;
    quota_ideal: number | null;
    quota_max: number | null;
    is_open_quota: boolean;
    is_active: boolean;
    total: number;
    quota_filled: number;
    submitted: number;
    verified: number;
    accepted: number;
    paid: number;
    blockers: number;
};

type WaveReport = {
    id: string;
    wave: string;
    academic_year: string | null;
    start_date: string | null;
    end_date: string | null;
    registration_fee: number;
    quota_target: number;
    is_active: boolean;
    total: number;
    quota_filled: number;
    submitted: number;
    verified: number;
    accepted: number;
    paid: number;
    manual_review: number;
    blockers: number;
    verified_unassigned: number;
    programs: WaveProgramReport[];
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
        payment_statuses: PaymentStatusPoint[];
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

type ReportTab = "overview" | "candidates" | "payments" | "actions" | "waves";

type ReportTabItem = {
    key: ReportTab;
    label: string;
    icon: string;
    description: string;
};

type DonutPoint = {
    key: string;
    label: string;
    value: number;
    tone: Tone;
    color: string;
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

const paymentStatusVisuals: Record<string, { tone: Tone; color: string }> = {
    paid: { tone: "success", color: "#10b981" },
    gateway_pending: { tone: "primary", color: "#2563eb" },
    manual_review: { tone: "warning", color: "#f59e0b" },
    manual_waiting: { tone: "neutral", color: "#94a3b8" },
    failed_or_expired: { tone: "danger", color: "#ef4444" },
    other: { tone: "muted", color: "#64748b" },
};

const actionChartLabels: Record<string, string> = {
    data_incomplete: "Data",
    document_review: "Dokumen",
    payment_review: "Payment",
    change_requests: "Perubahan",
    rejected_followup: "Ditolak",
    exam_unassigned: "Sesi ujian",
};

const reportTabs: ReportTabItem[] = [
    {
        key: "overview",
        label: "Ringkasan",
        icon: "fa-solid fa-chart-line",
        description: "Snapshot ritme operasional hari ini.",
    },
    {
        key: "candidates",
        label: "Kandidat",
        icon: "fa-solid fa-users",
        description: "Funnel status dan kesiapan kandidat.",
    },
    {
        key: "payments",
        label: "Pembayaran",
        icon: "fa-solid fa-wallet",
        description: "Komposisi channel dan status transaksi.",
    },
    {
        key: "actions",
        label: "Tindakan",
        icon: "fa-solid fa-triangle-exclamation",
        description: "Beban kerja yang perlu diprioritaskan.",
    },
    {
        key: "waves",
        label: "Gelombang",
        icon: "fa-solid fa-table-list",
        description: "Rekap per gelombang dan program.",
    },
];

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

function dominantPoint(items: DonutPoint[]) {
    return items.reduce<DonutPoint | null>((selected, item) => {
        if (!selected || item.value > selected.value) return item;

        return selected;
    }, null);
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

function TabButton({ tab, active, onSelect }: { tab: ReportTabItem; active: boolean; onSelect: (tab: ReportTab) => void }) {
    return (
        <button
            type="button"
            onClick={() => onSelect(tab.key)}
            className={`flex min-h-12 min-w-[180px] flex-1 items-center gap-3 rounded-lg border px-3 text-left transition ${
                active
                    ? "border-slate-900 bg-slate-900 text-white shadow-sm dark:border-white dark:bg-white dark:text-slate-900"
                    : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-700 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-400/40 dark:hover:text-blue-300"
            }`}
        >
            <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${
                    active
                        ? "bg-white/15 text-white dark:bg-slate-900/10 dark:text-slate-900"
                        : "bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-300"
                }`}
            >
                <i className={`${tab.icon} text-xs`} />
            </span>
            <span className="min-w-0">
                <span className="block text-sm font-black leading-tight">{tab.label}</span>
                <span className={`mt-0.5 block truncate text-[11px] font-semibold ${active ? "text-white/75 dark:text-slate-600" : "text-slate-400 dark:text-slate-500"}`}>
                    {tab.description}
                </span>
            </span>
        </button>
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

function DonutChartPanel({
    title,
    subtitle,
    icon,
    data,
    total,
    emptyLabel,
}: {
    title: string;
    subtitle: string;
    icon: string;
    data: DonutPoint[];
    total: number;
    emptyLabel: string;
}) {
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const visibleData = useMemo(() => data.filter((item) => item.value > 0), [data]);
    const dominant = dominantPoint(visibleData);
    const [isExpanded, setIsExpanded] = useState(false);
    const [activeKey, setActiveKey] = useState<string | null>(null);
    const activePoint = visibleData.find((item) => item.key === activeKey) ?? null;
    const displayPoint = activePoint ?? dominant;
    const displayPercent = displayPoint ? percent(displayPoint.value, total) : 0;
    const mutedSegment = isDark ? "#334155" : "#cbd5e1";

    const handleChartEnter = useCallback(() => setIsExpanded(true), []);
    const handleChartLeave = useCallback(() => {
        setIsExpanded(false);
        setActiveKey(null);
    }, []);
    const handleSegmentEnter = useCallback((_entry: PieSectorDataItem, index: number) => {
        setActiveKey(visibleData[index]?.key ?? null);
    }, [visibleData]);
    const handleLegendEnter = useCallback((key: string) => {
        setIsExpanded(true);
        setActiveKey(key);
    }, []);
    const handleSegmentLeave = useCallback(() => setActiveKey(null), []);

    return (
        <SectionShell title={title} subtitle={subtitle} icon={icon}>
            {visibleData.length > 0 ? (
                <div className="grid gap-4 p-5 lg:grid-cols-[290px_minmax(0,1fr)] lg:items-center">
                    <div
                        className="relative mx-auto h-[280px] w-full max-w-[290px] rounded-md outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
                        onMouseEnter={handleChartEnter}
                        onMouseLeave={handleChartLeave}
                        onFocus={handleChartEnter}
                        onBlur={handleChartLeave}
                        tabIndex={0}
                        aria-label={`${title}: ${displayPoint?.label ?? emptyLabel} ${displayPercent}%`}
                    >
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={visibleData}
                                    dataKey="value"
                                    nameKey="label"
                                    innerRadius={66}
                                    outerRadius={98}
                                    paddingAngle={3}
                                    stroke={isDark ? "#0f172a" : "#ffffff"}
                                    strokeWidth={3}
                                    cornerRadius={5}
                                    label={isExpanded ? renderDonutLabel : false}
                                    labelLine={isExpanded ? { stroke: isDark ? "#64748b" : "#94a3b8", strokeWidth: 1 } : false}
                                    onMouseEnter={handleSegmentEnter}
                                    onMouseLeave={handleSegmentLeave}
                                    isAnimationActive={false}
                                >
                                    {visibleData.map((entry) => {
                                        const isDominant = entry.key === dominant?.key;
                                        const isFocused = entry.key === activeKey;
                                        const fill = activeKey
                                            ? (isFocused ? entry.color : mutedSegment)
                                            : (isExpanded || isDominant ? entry.color : mutedSegment);
                                        const opacity = !isExpanded && !isDominant ? 0.18 : activeKey && !isFocused ? 0.45 : 1;

                                        return <Cell key={entry.key} fill={fill} fillOpacity={opacity} />;
                                    })}
                                </Pie>
                                <Tooltip content={<ChartTooltip isDark={isDark} />} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                            <p className="text-3xl font-black leading-none" style={{ color: activePoint?.color ?? (isDark ? "#f8fafc" : "#0f172a") }}>
                                {displayPercent}%
                            </p>
                            <p className="mt-1 max-w-[110px] truncate text-[11px] font-black uppercase text-slate-500 dark:text-slate-400">
                                {displayPoint?.label ?? "Data"}
                            </p>
                            <p className="mt-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                                {activePoint ? `${number(activePoint.value)} data` : `${number(total)} total`}
                            </p>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        {data.map((item) => (
                            <button
                                key={item.key}
                                type="button"
                                onMouseEnter={() => handleLegendEnter(item.key)}
                                onMouseLeave={handleSegmentLeave}
                                onFocus={() => handleLegendEnter(item.key)}
                                onBlur={handleSegmentLeave}
                                className={`rounded-md border px-3 py-2.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 ${
                                    activeKey && activeKey !== item.key
                                        ? "border-slate-200 opacity-45 dark:border-white/10"
                                        : "border-slate-200 bg-white hover:border-slate-300 dark:border-white/10 dark:bg-slate-900 dark:hover:border-white/20"
                                }`}
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex min-w-0 items-center gap-2">
                                        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                                        <span className="text-xs font-bold leading-4 text-slate-600 dark:text-slate-300">{item.label}</span>
                                    </div>
                                    <span className="text-xs font-black text-slate-900 dark:text-white">{percent(item.value, total)}%</span>
                                </div>
                                <div className="mt-2 flex items-center justify-between gap-3">
                                    <span className="text-xl font-black leading-none text-slate-900 dark:text-white">{number(item.value)}</span>
                                    <span className={`rounded-md border px-2 py-1 text-[10px] font-black ${toneClass[item.tone]}`}>
                                        {number(item.value)}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="flex h-[260px] items-center justify-center p-6 text-center text-sm font-semibold text-slate-500 dark:text-slate-400">
                    {emptyLabel}
                </div>
            )}
        </SectionShell>
    );
}

function renderDonutLabel({ name }: PieLabelRenderProps) {
    return String(name ?? "");
}

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
            subtitle="Line chart ala Morris/Google untuk membaca ritme submission dan transaksi lunas."
            icon="fa-solid fa-chart-line"
        >
            <div className="h-[260px] px-2 pb-4 pt-5">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 8, right: 16, left: -18, bottom: 0 }}>
                        <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" tick={{ fill: axisColor, fontSize: 11, fontWeight: 600 }} tickLine={false} axisLine={false} />
                        <YAxis allowDecimals={false} tick={{ fill: axisColor, fontSize: 11 }} tickLine={false} axisLine={false} />
                        <Tooltip content={<ChartTooltip isDark={isDark} />} />
                        <Line type="monotone" dataKey="submitted" name="Submitted" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 3, fill: "#2563eb", strokeWidth: 0 }} activeDot={{ r: 5 }} isAnimationActive={false} />
                        <Line type="monotone" dataKey="paid" name="Lunas" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3, fill: "#10b981", strokeWidth: 0 }} activeDot={{ r: 5 }} isAnimationActive={false} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </SectionShell>
    );
}

function PaymentChannelChart({ data, total }: { data: PaymentChannelPoint[]; total: number }) {
    const donutData = useMemo<DonutPoint[]>(() => data.map((entry) => ({
        key: entry.channel,
        label: entry.label,
        value: entry.count,
        tone: entry.channel === "gateway" ? "primary" : entry.channel === "transfer" ? "warning" : "success",
        color: paymentChannelColors[entry.channel] ?? "#64748b",
    })), [data]);

    return (
        <DonutChartPanel
            title="Channel Pembayaran"
            subtitle="Komposisi transaksi gateway, transfer, dan cash dengan persentase dominan di tengah chart."
            icon="fa-solid fa-wallet"
            data={donutData}
            total={total}
            emptyLabel="Data payment belum tersedia."
        />
    );
}

function ActionLoadPanel({ buckets, total }: { buckets: BucketStat[]; total: number }) {
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const gridColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)";
    const axisColor = isDark ? "#94a3b8" : "#64748b";
    const areaData = useMemo(() => buckets
        .slice(0, 6)
        .map((bucket, index) => ({
            key: bucket.bucket,
            label: bucket.label,
            chartLabel: actionChartLabels[bucket.bucket] ?? bucket.label,
            value: bucket.count,
            tone: index === 0 ? "warning" : index === 1 ? "danger" : "primary",
            color: ["#f59e0b", "#ef4444", "#2563eb", "#8b5cf6", "#10b981", "#64748b"][index] ?? "#64748b",
        })), [buckets]);

    return (
        <SectionShell
            title="Beban Tindakan"
            subtitle="Area chart untuk membaca profil beban antrean aktif berdasarkan kategori tindakan saat ini."
            icon="fa-solid fa-chart-area"
        >
            {areaData.length > 0 && total > 0 ? (
                <div className="space-y-4 p-5">
                    <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={areaData} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="staffActionLoadFill" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#f97316" stopOpacity={0.34} />
                                        <stop offset="100%" stopColor="#f97316" stopOpacity={0.04} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="chartLabel" tick={{ fill: axisColor, fontSize: 10, fontWeight: 700 }} tickLine={false} axisLine={false} interval={0} />
                                <YAxis allowDecimals={false} tick={{ fill: axisColor, fontSize: 11 }} tickLine={false} axisLine={false} />
                                <Tooltip content={<ChartTooltip isDark={isDark} />} />
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    name="Antrean"
                                    stroke="#f97316"
                                    strokeWidth={2.5}
                                    fill="url(#staffActionLoadFill)"
                                    dot={{ r: 4, fill: "#ffffff", stroke: "#f97316", strokeWidth: 2 }}
                                    activeDot={{ r: 6, fill: "#f97316", stroke: isDark ? "#0f172a" : "#ffffff", strokeWidth: 3 }}
                                    isAnimationActive={false}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                        {areaData.map((item) => (
                            <div key={item.key} className="flex min-h-12 items-start justify-between gap-3 rounded-md border border-slate-200 px-3 py-2.5 dark:border-white/10">
                                <div className="flex min-w-0 items-start gap-2">
                                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                                    <span className="text-xs font-bold leading-4 text-slate-600 dark:text-slate-300">{item.label}</span>
                                </div>
                                <span className="shrink-0 text-xs font-black text-slate-900 dark:text-white">
                                    {number(item.value)} · {percent(item.value, total)}%
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="flex h-[260px] items-center justify-center p-6 text-center text-sm font-semibold text-slate-500 dark:text-slate-400">
                    Tidak ada blocker aktif pada snapshot ini.
                </div>
            )}
        </SectionShell>
    );
}

const waveProgramColors = ["#2563eb", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#64748b"];

function formatDate(value: string | null) {
    if (!value) return "Belum diatur";

    return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${value}T00:00:00`));
}

function resolveWaveStatus(wave: WaveReport): { label: string; tone: Tone; description: string } {
    const now = new Date();
    const startsAt = wave.start_date ? new Date(`${wave.start_date}T00:00:00`) : null;
    const endsAt = wave.end_date ? new Date(`${wave.end_date}T23:59:59`) : null;

    if (!wave.is_active) return { label: "Nonaktif", tone: "neutral", description: "Penerimaan kandidat tidak diaktifkan." };
    if (startsAt && now < startsAt) return { label: "Terjadwal", tone: "primary", description: `Dibuka ${formatDate(wave.start_date)}.` };
    if (endsAt && now > endsAt) return { label: "Selesai", tone: "neutral", description: `Ditutup ${formatDate(wave.end_date)}.` };

    return { label: "Aktif", tone: "success", description: `Berjalan sampai ${formatDate(wave.end_date)}.` };
}

function WaveReportWorkspace({ rows }: { rows: WaveReport[] }) {
    const [selectedWaveId, setSelectedWaveId] = useState<string | null>(rows[0]?.id ?? null);
    const selectedWave = rows.find((wave) => wave.id === selectedWaveId) ?? rows[0] ?? null;
    const waveStatus = selectedWave ? resolveWaveStatus(selectedWave) : null;
    const programDonut = useMemo<DonutPoint[]>(() => selectedWave?.programs.map((program, index) => ({
        key: program.id,
        label: program.name,
        value: program.total,
        tone: program.blockers > 0 ? "warning" : program.is_active ? "success" : "neutral",
        color: waveProgramColors[index % waveProgramColors.length],
    })) ?? [], [selectedWave]);
    const programTotal = programDonut.reduce((sum, program) => sum + program.value, 0);

    if (!selectedWave || !waveStatus) {
        return (
            <section className="rounded-lg border border-slate-200 bg-white p-10 text-center shadow-sm dark:border-white/10 dark:bg-slate-900">
                <i className="fa-solid fa-calendar-xmark text-2xl text-slate-300 dark:text-slate-600" />
                <p className="mt-3 text-sm font-black text-slate-700 dark:text-slate-200">Belum ada gelombang penerimaan.</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Rekap akan tersedia setelah gelombang dibuat oleh admin.</p>
            </section>
        );
    }

    return (
        <div className="grid gap-5 xl:grid-cols-[260px_minmax(0,1fr)]">
            <aside className="self-start rounded-lg border border-slate-200 bg-white p-2 shadow-sm dark:border-white/10 dark:bg-slate-900 xl:sticky xl:top-4">
                <div className="px-3 pb-2 pt-3">
                    <p className="text-[11px] font-black uppercase text-slate-400">Daftar Gelombang</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Pilih konteks rekap yang ingin ditinjau.</p>
                </div>
                <div className="space-y-1">
                    {rows.map((wave) => {
                        const status = resolveWaveStatus(wave);
                        const isSelected = wave.id === selectedWave.id;

                        return (
                            <button
                                key={wave.id}
                                type="button"
                                onClick={() => setSelectedWaveId(wave.id)}
                                className={`w-full rounded-md border px-3 py-3 text-left transition ${
                                    isSelected
                                        ? "border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900"
                                        : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 dark:text-slate-300 dark:hover:border-white/10 dark:hover:bg-white/5"
                                }`}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <span className="line-clamp-2 text-xs font-black leading-5">{wave.wave}</span>
                                    <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${toneBarClass[status.tone]}`} />
                                </div>
                                <div className={`mt-1 flex items-center justify-between gap-2 text-[10px] font-bold ${isSelected ? "text-white/70 dark:text-slate-500" : "text-slate-400"}`}>
                                    <span>{wave.academic_year ?? "Tahun ajaran -"}</span>
                                    <span>{number(wave.total)} kandidat</span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </aside>

            <div className="min-w-0 space-y-5">
                <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <h2 className="text-lg font-black text-slate-900 dark:text-white">{selectedWave.wave}</h2>
                                <span className={`rounded-md border px-2 py-1 text-[10px] font-black ${toneClass[waveStatus.tone]}`}>{waveStatus.label}</span>
                            </div>
                            <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                                {selectedWave.academic_year ?? "Tahun ajaran belum diatur"} · {waveStatus.description}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Link
                                href={`/dashboard/admin/candidates?wave=${selectedWave.id}`}
                                className="inline-flex min-h-10 items-center gap-2 rounded-md border border-slate-200 px-3 text-xs font-black text-slate-600 transition hover:border-blue-300 hover:text-blue-700 dark:border-white/10 dark:text-slate-300"
                            >
                                <i className="fa-solid fa-users text-[11px]" />
                                Lihat Kandidat
                            </Link>
                            <Link
                                href={`/dashboard/admin/payment-recap?wave=${selectedWave.id}`}
                                className="inline-flex min-h-10 items-center gap-2 rounded-md bg-slate-900 px-3 text-xs font-black text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900"
                            >
                                <i className="fa-solid fa-receipt text-[11px]" />
                                Payment Ops
                            </Link>
                        </div>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
                        {[
                            { key: "candidate", label: "Total kandidat", value: selectedWave.total, sub: `${selectedWave.submitted} submitted`, tone: "primary" as Tone },
                            { key: "quota", label: "Kuota terisi", value: selectedWave.quota_filled, sub: `dari ${number(selectedWave.quota_target)} target`, tone: percent(selectedWave.quota_filled, selectedWave.quota_target) >= 90 ? "warning" as Tone : "success" as Tone },
                            { key: "paid", label: "Kandidat lunas", value: selectedWave.paid, sub: `${percent(selectedWave.paid, selectedWave.total)}% dari kandidat`, tone: "success" as Tone },
                            { key: "blocker", label: "Dengan blocker", value: selectedWave.blockers, sub: `${selectedWave.verified_unassigned} verified tanpa sesi`, tone: selectedWave.blockers > 0 ? "danger" as Tone : "neutral" as Tone },
                        ].map((metric) => (
                            <div key={metric.key} className="rounded-md border border-slate-200 px-3 py-3 dark:border-white/10">
                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-[11px] font-black uppercase text-slate-400">{metric.label}</span>
                                    <span className={`h-2.5 w-2.5 rounded-full ${toneBarClass[metric.tone]}`} />
                                </div>
                                <p className="mt-2 text-2xl font-black leading-none text-slate-900 dark:text-white">{number(metric.value)}</p>
                                <p className="mt-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">{metric.sub}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <div className="grid gap-5 2xl:grid-cols-[minmax(420px,1fr)_minmax(320px,0.8fr)]">
                    <DonutChartPanel
                        title="Komposisi Program"
                        subtitle="Arahkan pointer ke chart untuk membuka seluruh komposisi dan fokus per program."
                        icon="fa-solid fa-chart-pie"
                        data={programDonut}
                        total={programTotal}
                        emptyLabel="Belum ada kandidat pada program gelombang ini."
                    />

                    <SectionShell title="Parameter Gelombang" subtitle="Snapshot konfigurasi yang memengaruhi operasi staff." icon="fa-solid fa-calendar-days">
                        <div className="divide-y divide-slate-100 px-5 dark:divide-white/10">
                            {[
                                { key: "period", label: "Periode", value: `${formatDate(selectedWave.start_date)} - ${formatDate(selectedWave.end_date)}`, icon: "fa-solid fa-calendar" },
                                { key: "fee", label: "Biaya pendaftaran", value: rupiah(selectedWave.registration_fee), icon: "fa-solid fa-money-bill" },
                                { key: "manual", label: "Manual review", value: `${number(selectedWave.manual_review)} transaksi`, icon: "fa-solid fa-file-invoice-dollar" },
                                { key: "selection", label: "Kesiapan seleksi", value: `${number(selectedWave.verified)} verified · ${number(selectedWave.verified_unassigned)} tanpa sesi`, icon: "fa-solid fa-clipboard-check" },
                            ].map((item) => (
                                <div key={item.key} className="flex items-start gap-3 py-4">
                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-300">
                                        <i className={`${item.icon} text-[11px]`} />
                                    </span>
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-black uppercase text-slate-400">{item.label}</p>
                                        <p className="mt-1 text-xs font-bold leading-5 text-slate-700 dark:text-slate-200">{item.value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </SectionShell>
                </div>

                <SectionShell title="Kapasitas Program" subtitle="Kuota dan progres operasional per program pada gelombang terpilih." icon="fa-solid fa-list-check">
                    {selectedWave.programs.length > 0 ? (
                        <div className="divide-y divide-slate-100 dark:divide-white/10">
                            {selectedWave.programs.map((program) => {
                                const capacity = program.is_open_quota ? selectedWave.quota_target : (program.quota_max ?? 0);
                                const utilization = percent(program.quota_filled, capacity);

                                return (
                                    <div key={program.id} className="grid gap-4 px-5 py-4 lg:grid-cols-[minmax(180px,0.8fr)_minmax(260px,1.2fr)_minmax(300px,1fr)] lg:items-center">
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="truncate text-sm font-black text-slate-900 dark:text-white">{program.name}</p>
                                                <span className={`rounded-md border px-2 py-0.5 text-[9px] font-black ${program.is_active ? toneClass.success : toneClass.neutral}`}>
                                                    {program.is_active ? "Aktif" : "Tidak aktif"}
                                                </span>
                                            </div>
                                            <p className="mt-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                                {program.is_open_quota ? "Kuota terbuka mengikuti gelombang" : `Ideal ${number(program.quota_ideal ?? 0)} · Maks. ${number(program.quota_max ?? 0)}`}
                                            </p>
                                        </div>
                                        <div>
                                            <div className="mb-1.5 flex items-center justify-between gap-3 text-[11px] font-bold">
                                                <span className="text-slate-500 dark:text-slate-400">Terisi {number(program.quota_filled)}</span>
                                                <span className="text-slate-900 dark:text-white">{capacity > 0 ? `${utilization}%` : "Kuota belum diatur"}</span>
                                            </div>
                                            <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                                                <div className={`h-full rounded-full ${utilization >= 100 ? "bg-red-500" : utilization >= 80 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${Math.min(utilization, 100)}%` }} />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-4 gap-2 text-center">
                                            {[
                                                { key: "total", label: "Total", value: program.total },
                                                { key: "verified", label: "Verified", value: program.verified },
                                                { key: "paid", label: "Lunas", value: program.paid },
                                                { key: "blocker", label: "Blocker", value: program.blockers },
                                            ].map((stat) => (
                                                <div key={stat.key} className="rounded-md bg-slate-50 px-2 py-2 dark:bg-white/[0.04]">
                                                    <p className="text-sm font-black text-slate-900 dark:text-white">{number(stat.value)}</p>
                                                    <p className="mt-0.5 truncate text-[9px] font-black uppercase text-slate-400">{stat.label}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="p-8 text-center text-sm font-semibold text-slate-500 dark:text-slate-400">Belum ada program pada gelombang ini.</div>
                    )}
                </SectionShell>
            </div>
        </div>
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
                href="/dashboard/admin/reports"
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
            href: "/dashboard/admin/payment-recap?action=manual_review",
        },
        {
            key: "failed-payment",
            label: "Payment gagal / expired",
            value: summary.payments.failed_or_expired,
            tone: summary.payments.failed_or_expired > 0 ? "danger" : "success" as Tone,
            href: "/dashboard/admin/payment-recap?action=failed_or_expired",
        },
        {
            key: "document-review",
            label: "Dokumen menunggu review",
            value: summary.candidates.document_review,
            tone: summary.candidates.document_review > 0 ? "warning" : "success" as Tone,
            href: "/dashboard/admin/candidates?action=document_review",
        },
        {
            key: "exam-unassigned",
            label: "Verified tanpa sesi",
            value: summary.selection.verified_unassigned,
            tone: summary.selection.verified_unassigned > 0 ? "danger" : "success" as Tone,
            href: "/dashboard/admin/change-requests?bucket=exam_unassigned",
        },
    ], [summary]);

    return (
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
            <h2 className="text-sm font-black text-slate-900 dark:text-white">Top Perhatian Admin</h2>
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
                        href={`/dashboard/admin/candidates/${candidate.id}`}
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

function OverviewPanel({
    charts,
    summary,
    recentCandidates,
}: {
    charts: Props["charts"];
    summary: Props["summary"];
    recentCandidates: RecentCandidate[];
}) {
    return (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="space-y-5">
                <TrendChart data={charts.trend} />
                <SectionShell
                    title="Kesehatan Operasional"
                    subtitle="Indikator ringkas untuk menentukan area kerja tanpa membuka halaman detail."
                    icon="fa-solid fa-heart-pulse"
                >
                    <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
                        <ProgressRow label="Dokumen pending" value={summary.candidates.document_review} total={summary.candidates.total} tone="warning" />
                        <ProgressRow label="Pembayaran perlu review" value={summary.candidates.payment_review} total={summary.candidates.total} tone="danger" />
                        <ProgressRow label="Perubahan data" value={summary.candidates.change_requests} total={summary.candidates.total} tone="primary" />
                        <ProgressRow label="Verified tanpa sesi" value={summary.candidates.verified_unassigned} total={summary.candidates.total} tone="neutral" />
                        <ProgressRow label="Gateway pending" value={summary.payments.gateway_pending} total={summary.payments.total} tone="primary" />
                        <ProgressRow label="Failed / expired" value={summary.payments.failed_or_expired} total={summary.payments.total} tone="danger" />
                    </div>
                </SectionShell>
            </div>
            <aside className="space-y-5">
                <ExportPanel />
                <RecentActivity candidates={recentCandidates} />
            </aside>
        </div>
    );
}

function CandidateReportPanel({ steps, summary }: { steps: PipelineStep[]; summary: Props["summary"] }) {
    const statusDonut = useMemo<DonutPoint[]>(() => steps.map((step) => ({
        key: step.key,
        label: step.label,
        value: step.value,
        tone: step.tone,
        color: step.tone === "primary" ? "#2563eb" : step.tone === "success" ? "#10b981" : step.tone === "warning" ? "#f59e0b" : step.tone === "danger" ? "#ef4444" : "#94a3b8",
    })), [steps]);

    return (
        <div className="space-y-5">
            <div className="grid gap-5 xl:grid-cols-[minmax(440px,1.15fr)_minmax(320px,0.85fr)]">
                <DonutChartPanel
                    title="Distribusi Status"
                    subtitle="Status terbesar tampil saat idle; arahkan pointer untuk membuka dan memeriksa seluruh komposisi."
                    icon="fa-solid fa-chart-pie"
                    data={statusDonut}
                    total={summary.candidates.total}
                    emptyLabel="Belum ada kandidat untuk direkap."
                />
                <SectionShell
                    title="Kesiapan Kandidat"
                    subtitle="Area kandidat yang masih menahan proses operasional."
                    icon="fa-solid fa-list-check"
                >
                    <div className="space-y-5 p-5">
                        <ProgressRow label="Dokumen pending" value={summary.candidates.document_review} total={summary.candidates.total} tone="warning" />
                        <ProgressRow label="Pembayaran pending" value={summary.candidates.payment_review} total={summary.candidates.total} tone="danger" />
                        <ProgressRow label="Perubahan data" value={summary.candidates.change_requests} total={summary.candidates.total} tone="primary" />
                        <ProgressRow label="Verified tanpa sesi" value={summary.candidates.verified_unassigned} total={summary.candidates.total} tone="neutral" />
                    </div>
                </SectionShell>
            </div>
            <PipelinePanel steps={steps} />
        </div>
    );
}

function PaymentReportPanel({ charts, summary }: { charts: Props["charts"]; summary: Props["summary"] }) {
    const paymentStatus = useMemo<DonutPoint[]>(() => charts.payment_statuses.map((entry) => ({
        key: entry.key,
        label: entry.label,
        value: entry.count,
        tone: paymentStatusVisuals[entry.key]?.tone ?? "neutral",
        color: paymentStatusVisuals[entry.key]?.color ?? "#64748b",
    })), [charts.payment_statuses]);

    return (
        <div className="grid gap-5 xl:grid-cols-2">
            <PaymentChannelChart data={charts.payment_channels} total={summary.payments.total} />
            <DonutChartPanel
                title="Kategori Transaksi"
                subtitle="Kategori eksklusif transaksi agar komposisi dan persentase tetap akurat."
                icon="fa-solid fa-chart-pie"
                data={paymentStatus}
                total={summary.payments.total}
                emptyLabel="Belum ada transaksi pembayaran."
            />
        </div>
    );
}

function ActionReportPanel({ summary }: { summary: Props["summary"] }) {
    return (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
            <ActionLoadPanel buckets={summary.actions.buckets} total={summary.actions.total} />
            <AttentionPanel summary={summary} />
        </div>
    );
}

export default function AdminReports({ summary, charts, wave_reports, recent_candidates, generated_at }: Props) {
    const [activeTab, setActiveTab] = useState<ReportTab>("overview");
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

    const activeTabDescription = reportTabs.find((tab) => tab.key === activeTab)?.description ?? "";

    return (
        <>
            <Head title="Laporan Global Admin" />

            <div className="flex flex-col gap-6 pb-8">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900">
                            <i className="fa-solid fa-chart-line text-sm" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="font-display text-xl font-bold leading-tight text-slate-800 dark:text-white">
                                Rekap Laporan Global Admin
                            </h1>
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                Snapshot lintas kandidat, pembayaran, seleksi, dan tindakan · {generated_at}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Link
                            href="/dashboard/admin/payment-recap"
                            className="inline-flex min-h-10 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-bold text-slate-600 transition hover:border-emerald-400 hover:text-emerald-600 dark:border-white/10 dark:text-slate-300"
                        >
                            <i className="fa-solid fa-money-check-dollar text-xs" />
                            Payment Ops
                        </Link>
                        <Link
                            href="/dashboard/admin/change-requests"
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

                <div className="rounded-lg border border-slate-200 bg-white p-2 shadow-sm dark:border-white/10 dark:bg-slate-900">
                    <div className="flex gap-2 overflow-x-auto pb-1">
                        {reportTabs.map((tab) => (
                            <TabButton key={tab.key} tab={tab} active={activeTab === tab.key} onSelect={setActiveTab} />
                        ))}
                    </div>
                </div>

                <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-500 shadow-sm dark:border-white/10 dark:bg-slate-900 dark:text-slate-400">
                    <span>{activeTabDescription}</span>
                    <span className="shrink-0">Generated {generated_at}</span>
                </div>

                {activeTab === "overview" ? (
                    <OverviewPanel charts={charts} summary={summary} recentCandidates={recent_candidates} />
                ) : null}

                {activeTab === "candidates" ? (
                    <CandidateReportPanel steps={pipelineSteps} summary={summary} />
                ) : null}

                {activeTab === "payments" ? (
                    <PaymentReportPanel charts={charts} summary={summary} />
                ) : null}

                {activeTab === "actions" ? (
                    <ActionReportPanel summary={summary} />
                ) : null}

                {activeTab === "waves" ? (
                    <WaveReportWorkspace rows={wave_reports} />
                ) : null}
            </div>
        </>
    );
}

AdminReports.layout = (page: any) => <DashboardLayout>{page}</DashboardLayout>;
