// resources/js/Components/Dashboard/Admin/Index/RegistrationTrendChart.tsx

import { useEffect, useMemo, useRef } from "react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { useTheme } from "@/context/ThemeContext";

type Props = {
    data: Array<{ date: string; count: number }>;
};

function CustomTooltip({ active, payload, label, isDark }: {
    active?: boolean;
    payload?: { value: number }[];
    label?: string;
    isDark: boolean;
}) {
    if (!active || !payload?.length) return null;
    return (
        <div
            className="rounded-2xl border px-4 py-3 shadow-xl text-xs"
            style={{
                backgroundColor: isDark ? "#1e293b" : "#ffffff",
                borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
            }}
        >
            <p className="font-semibold mb-1" style={{ color: isDark ? "#e2e8f0" : "#1e293b" }}>
                {label}
            </p>
            <p style={{ color: isDark ? "#818cf8" : "#4f46e5" }}>
                {payload[0].value.toLocaleString("id-ID")} akun baru
            </p>
        </div>
    );
}

export default function RegistrationTrendChart({ data }: Props) {
    const { theme } = useTheme();
    const isDark = theme === "dark";

    const isFirstRender = useRef(true);
    useEffect(() => {
        isFirstRender.current = false;
    }, []);

    const total = useMemo(() => data.reduce((sum, d) => sum + d.count, 0), [data]);

    const gridColor = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)";
    const axisColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
    const tickColor = isDark ? "#94a3b8" : "#64748b";
    const strokeColor = isDark ? "#818cf8" : "#4f46e5";
    const gradStart = isDark ? "rgba(99,102,241,0.25)" : "rgba(99,102,241,0.15)";
    const gradEnd = "rgba(99,102,241,0)";

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl shadow-soft overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                        <i className="fa-solid fa-arrow-trend-up text-indigo-500 text-xs"></i>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-slate-800 dark:text-white">
                            Inflow Pendaftar Baru
                        </h3>
                        <p className="text-[11px] text-slate-400">
                            Aktivitas masuk 7 hari terakhir
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                        {total} Masuk
                    </span>
                </div>
            </div>

            {/* Chart */}
            <div className="px-2 pb-4 pt-3">
                <ResponsiveContainer width="100%" height={230}>
                    <AreaChart
                        data={data}
                        margin={{ top: 8, right: 12, left: -20, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="adminInflowGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={gradStart} />
                                <stop offset="100%" stopColor={gradEnd} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
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
                        <Tooltip content={<CustomTooltip isDark={isDark} />} />
                        <Area
                            type="monotone"
                            dataKey="count"
                            stroke={strokeColor}
                            strokeWidth={2.5}
                            fill="url(#adminInflowGradient)"
                            dot={{ fill: strokeColor, r: 3.5, strokeWidth: 0 }}
                            activeDot={{ r: 5.5, fill: strokeColor, stroke: isDark ? "#0f172a" : "#ffffff", strokeWidth: 2 }}
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
