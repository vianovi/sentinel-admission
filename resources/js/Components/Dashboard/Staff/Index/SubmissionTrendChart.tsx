// resources/js/Components/Dashboard/Staff/Index/SubmissionTrendChart.tsx

import { useEffect, useRef } from "react";
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Area,
    AreaChart,
} from "recharts";
import { useTheme } from "@/context/ThemeContext";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type TrendItem = {
    date:  string;
    count: number;
};

type Props = {
    data: TrendItem[];
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
                {payload[0].value} submission
            </p>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function SubmissionTrendChart({ data }: Props) {
    const { theme } = useTheme();
    const isDark = theme === "dark";

    const isFirstRender = useRef(true);
    useEffect(() => {
        isFirstRender.current = false;
    }, []);

    const gridColor   = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)";
    const axisColor   = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
    const tickColor   = isDark ? "#94a3b8" : "#64748b";
    const strokeColor = isDark ? "#10b981" : "#059669";
    const gradStart   = isDark ? "rgba(16,185,129,0.25)" : "rgba(16,185,129,0.15)";
    const gradEnd     = isDark ? "rgba(16,185,129,0)" : "rgba(16,185,129,0)";

    // Total submissions in range
    const total = data.reduce((sum, d) => sum + d.count, 0);

    // Trend direction
    const first = data[0]?.count ?? 0;
    const last  = data[data.length - 1]?.count ?? 0;
    const isTrendUp = last >= first;

    return (
        <div className="bg-white dark:bg-slate-900
                        border border-slate-200 dark:border-white/5
                        rounded-2xl shadow-md overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5
                            border-b border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl shrink-0
                                    bg-gradient-to-br from-emerald-500 to-teal-500
                                    flex items-center justify-center
                                    shadow-lg shadow-emerald-500/25">
                        <i className="fa-solid fa-chart-line text-white text-sm" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-white">
                            Trend Submission
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                            7 hari terakhir
                        </p>
                    </div>
                </div>

                {/* Summary badge */}
                <div className="text-right">
                    <p className="text-xl font-display font-bold text-slate-800 dark:text-white tabular-nums">
                        {total}
                    </p>
                    <span
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold
                                    ${isTrendUp
                                        ? "text-emerald-500"
                                        : "text-red-500"}`}
                    >
                        <i className={`fa-solid text-[9px]
                                       ${isTrendUp ? "fa-arrow-trend-up" : "fa-arrow-trend-down"}`}
                        />
                        {isTrendUp ? "Naik" : "Turun"}
                    </span>
                </div>
            </div>

            {/* Chart */}
            <div className="px-2 pb-5 pt-4">
                <ResponsiveContainer width="100%" height={260}>
                    <AreaChart
                        data={data}
                        margin={{ top: 8, right: 8, left: -22, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="submissionGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%"   stopColor={gradStart} />
                                <stop offset="100%" stopColor={gradEnd}   />
                            </linearGradient>
                        </defs>

                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke={gridColor}
                            vertical={false}
                        />
                        <XAxis
                            dataKey="date"
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
                            cursor={{ stroke: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }}
                        />
                        <Area
                            type="monotone"
                            dataKey="count"
                            stroke={strokeColor}
                            strokeWidth={2.5}
                            fill="url(#submissionGradient)"
                            dot={{
                                fill:        strokeColor,
                                r:           4,
                                strokeWidth: 0,
                            }}
                            activeDot={{
                                r:           6,
                                fill:        strokeColor,
                                stroke:      isDark ? "#0f172a" : "#ffffff",
                                strokeWidth: 2,
                            }}
                            isAnimationActive={isFirstRender.current}
                            animationDuration={600}
                            animationEasing="ease-out"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
