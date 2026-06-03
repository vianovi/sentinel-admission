// resources/js/Components/Dashboard/Staff/Index/StatusDistributionChart.tsx

import { useMemo } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Cell,
    ResponsiveContainer,
} from "recharts";
import { useTheme } from "@/context/ThemeContext";
import type { Stats } from "./StatsGrid";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type Props = {
    stats: Stats;
};

type ChartEntry = {
    status: string;
    count:  number;
    fill:   string;
    fillDark: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// TOOLTIP CUSTOM
// ─────────────────────────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label, isDark }: {
    active?:  boolean;
    payload?: { value: number }[];
    label?:   string;
    isDark:   boolean;
}) {
    if (!active || !payload?.length) return null;
    return (
        <div
            className="rounded-2xl border px-4 py-3 shadow-xl text-xs"
            style={{
                backgroundColor: isDark ? "#1e293b" : "#ffffff",
                borderColor:     isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
            }}
        >
            <p className="font-semibold mb-1" style={{ color: isDark ? "#e2e8f0" : "#1e293b" }}>
                {label}
            </p>
            <p style={{ color: isDark ? "#94a3b8" : "#64748b" }}>
                {payload[0].value.toLocaleString("id-ID")} kandidat
            </p>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// DATA CONFIG
// ─────────────────────────────────────────────────────────────────────────────

function buildChartData(stats: Stats): ChartEntry[] {
    return [
        { status: "Draft",       count: stats.draft,     fill: "#94a3b8", fillDark: "#475569" },
        { status: "Submitted",   count: stats.submitted,  fill: "#fbbf24", fillDark: "#f59e0b" },
        { status: "Verified",    count: stats.verified,   fill: "#60a5fa", fillDark: "#3b82f6" },
        { status: "Accepted",    count: stats.accepted,   fill: "#34d399", fillDark: "#10b981" },
        { status: "Rejected",    count: stats.rejected,   fill: "#f87171", fillDark: "#ef4444" },
    ];
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function StatusDistributionChart({ stats }: Props) {
    const { theme } = useTheme();
    const isDark = theme === "dark";

    const data = useMemo(() => buildChartData(stats), [stats]);

    const gridColor   = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)";
    const axisColor   = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
    const tickColor   = isDark ? "#94a3b8" : "#64748b";
    const cursorColor = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)";

    return (
        <div className="bg-white dark:bg-slate-900
                        border border-slate-200 dark:border-white/5
                        rounded-2xl shadow-md overflow-hidden">

            {/* Header */}
            <div className="flex items-center gap-3 px-6 py-5
                            border-b border-slate-100 dark:border-white/5">
                <div className="w-9 h-9 rounded-xl shrink-0
                                bg-gradient-to-br from-violet-500 to-purple-600
                                flex items-center justify-center
                                shadow-lg shadow-violet-500/25">
                    <i className="fa-solid fa-chart-simple text-white text-sm" />
                </div>
                <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">
                        Distribusi Status
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                        Total {stats.total.toLocaleString("id-ID")} kandidat terdaftar
                    </p>
                </div>
            </div>

            {/* Chart */}
            <div className="px-2 pb-5 pt-4">
                <ResponsiveContainer width="100%" height={260}>
                    <BarChart
                        data={data}
                        margin={{ top: 8, right: 8, left: -22, bottom: 0 }}
                        barCategoryGap="30%"
                    >
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke={gridColor}
                            vertical={false}
                        />
                        <XAxis
                            dataKey="status"
                            tick={{ fill: tickColor, fontSize: 11, fontWeight: 500 }}
                            tickLine={false}
                            axisLine={{ stroke: axisColor }}
                        />
                        <YAxis
                            allowDecimals={false}
                            tick={{ fill: tickColor, fontSize: 11 }}
                            tickLine={false}
                            axisLine={{ stroke: axisColor }}
                        />
                        <Tooltip
                            content={<CustomTooltip isDark={isDark} />}
                            cursor={{ fill: cursorColor, radius: 8 }}
                        />
                        <Bar
                            dataKey="count"
                            radius={[8, 8, 0, 0]}
                            animationDuration={900}
                            animationEasing="ease-out"
                        >
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={isDark ? entry.fillDark : entry.fill}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
