// resources/js/Components/Dashboard/Admin/Index/PaymentBreakdownChart.tsx

import { useEffect, useMemo, useRef } from "react";
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { useTheme } from "@/context/ThemeContext";

type Props = {
    paymentStats: {
        gateway: number;
        transfer: number;
        cash: number;
    };
    paidCount: number;
    totalRevenue: number;
};

const CHANNEL_COLORS = {
    gateway: { label: "Payment Gateway", color: "#8b5cf6", dark: "#7c3aed" },
    transfer: { label: "Transfer Manual", color: "#f59e0b", dark: "#d97706" },
    cash: { label: "Cash / Tunai", color: "#10b981", dark: "#059669" },
};

function formatRupiah(num: number): string {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(num);
}

export default function PaymentBreakdownChart({ paymentStats, paidCount, totalRevenue }: Props) {
    const { theme } = useTheme();
    const isDark = theme === "dark";

    const isFirstRender = useRef(true);
    useEffect(() => {
        isFirstRender.current = false;
    }, []);

    const data = useMemo(() => [
        { name: "Gateway", value: paymentStats.gateway, key: "gateway" },
        { name: "Transfer", value: paymentStats.transfer, key: "transfer" },
        { name: "Tunai", value: paymentStats.cash, key: "cash" },
    ], [paymentStats]);

    const totalTransactions = useMemo(() => paymentStats.gateway + paymentStats.transfer + paymentStats.cash, [paymentStats]);

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl shadow-soft overflow-hidden flex flex-col justify-between">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                        <i className="fa-solid fa-wallet text-emerald-500 text-xs"></i>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-slate-800 dark:text-white">
                            Channel Pembayaran
                        </h3>
                        <p className="text-[11px] text-slate-400">
                            Metode pembayaran transaksi
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        {formatRupiah(totalRevenue)}
                    </p>
                    <p className="text-[10px] text-slate-400">
                        {paidCount} Transaksi Lunas
                    </p>
                </div>
            </div>

            {/* Chart + Legend */}
            <div className="px-5 py-4 flex flex-col sm:flex-row items-center gap-6">
                <div className="w-40 h-40 shrink-0 relative flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Tooltip
                                formatter={(value: any, name: any) => [`${value} Transaksi`, name]}
                                contentStyle={{
                                    backgroundColor: isDark ? "#1e293b" : "#ffffff",
                                    borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
                                    borderRadius: "12px",
                                    fontSize: "12px",
                                }}
                            />
                            <Pie
                                data={data}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                innerRadius={42}
                                outerRadius={64}
                                paddingAngle={4}
                                isAnimationActive={isFirstRender.current}
                                animationDuration={600}
                            >
                                {data.map((entry) => (
                                    <Cell
                                        key={entry.key}
                                        fill={isDark ? CHANNEL_COLORS[entry.key as keyof typeof CHANNEL_COLORS].dark : CHANNEL_COLORS[entry.key as keyof typeof CHANNEL_COLORS].color}
                                    />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-lg font-bold font-display text-slate-800 dark:text-white leading-none">
                            {totalTransactions}
                        </span>
                        <span className="text-[10px] text-slate-400 mt-0.5">Total Trx</span>
                    </div>
                </div>

                {/* Legend list */}
                <div className="flex-1 w-full space-y-2.5">
                    {data.map((item) => {
                        const cfg = CHANNEL_COLORS[item.key as keyof typeof CHANNEL_COLORS];
                        const pct = totalTransactions > 0 ? Math.round((item.value / totalTransactions) * 100) : 0;
                        return (
                            <div key={item.key} className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cfg.color }} />
                                    <span className="text-slate-600 dark:text-slate-300 font-medium">
                                        {cfg.label}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 font-semibold">
                                    <span className="text-slate-800 dark:text-white">{item.value}</span>
                                    <span className="text-[10px] text-slate-400 w-8 text-right">({pct}%)</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
