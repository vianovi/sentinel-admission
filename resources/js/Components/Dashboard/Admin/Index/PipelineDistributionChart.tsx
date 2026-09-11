// resources/js/Components/Dashboard/Admin/Index/PipelineDistributionChart.tsx

import { useEffect, useMemo, useRef } from "react";
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

type Props = {
    byStatus: {
        draft: number;
        submitted: number;
        verified: number;
        accepted: number;
        rejected: number;
    };
};

type ChartEntry = {
    status: string;
    count: number;
    fill: string;
    fillDark: string;
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
            <p style={{ color: isDark ? "#94a3b8" : "#64748b" }}>
                {payload[0].value.toLocaleString("id-ID")} kandidat
            </p>
        </div>
    );
}

export default function PipelineDistributionChart({ byStatus }: Props) {
    const { theme } = useTheme();
    const isDark = theme === "dark";

    const isFirstRender = useRef(true);
    useEffect(() => {
        isFirstRender.current = false;
    }, []);

    const data: ChartEntry[] = useMemo(() => [
        { status: "Draft", count: byStatus.draft, fill: "#94a3b8", fillDark: "#64748b" },
        { status: "Submitted", count: byStatus.submitted, fill: "#f59e0b", fillDark: "#d97706" },
        { status: "Verified", count: byStatus.verified, fill: "#3b82f6", fillDark: "#2563eb" },
        { status: "Accepted", count: byStatus.accepted, fill: "#10b981", fillDark: "#059669" },
        { status: "Rejected", count: byStatus.rejected, fill: "#f43f5e", fillDark: "#e11d48" },
    ], [byStatus]);

    const total = useMemo(() => Object.values(byStatus).reduce((a, b) => a + b, 0), [byStatus]);

    const gridColor = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)";
    const axisColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
    const tickColor = isDark ? "#94a3b8" : "#64748b";
    const cursorColor = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)";

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl shadow-soft overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                        <i className="fa-solid fa-chart-column text-violet-500 text-xs"></i>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-slate-800 dark:text-white">
                            Pipeline Status Kandidat
                        </h3>
                        <p className="text-[11px] text-slate-400">
                            Distribusi tahapan pendaftaran live
                        </p>
                    </div>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
                    {total} Total
                </span>
            </div>

            {/* Chart */}
            <div className="px-2 pb-4 pt-3">
                <ResponsiveContainer width="100%" height={230}>
                    <BarChart
                        data={data}
                        margin={{ top: 8, right: 12, left: -20, bottom: 0 }}
                        barCategoryGap="28%"
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
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
                        <Tooltip content={<CustomTooltip isDark={isDark} />} cursor={{ fill: cursorColor, radius: 8 }} />
                        <Bar
                            dataKey="count"
                            radius={[6, 6, 0, 0]}
                            isAnimationActive={isFirstRender.current}
                            animationDuration={600}
                            animationEasing="ease-out"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={isDark ? entry.fillDark : entry.fill} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
