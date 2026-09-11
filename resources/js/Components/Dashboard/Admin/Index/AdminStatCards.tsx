// resources/js/Components/Dashboard/Admin/Index/AdminStatCards.tsx

import React, { useMemo } from "react";

type CardData = {
    key: string;
    label: string;
    value: string | number;
    subtext: string;
    trend: string;
    trendUp: boolean;
    icon: string;
    gradient: string;
    shadow: string;
    glow: string;
    sparklineColor: string;
    sparklineData: number[];
};

type Props = {
    stats: {
        total_users: number;
        total_candidates: number;
        total_staff: number;
        quota_target: number;
        quota_filled: number;
        pending_verify: number;
        paid_count: number;
        total_revenue: number;
        by_status: {
            draft: number;
            submitted: number;
            verified: number;
            accepted: number;
            rejected: number;
        };
    };
    registrationTrend?: Array<{ date: string; count: number }>;
};

function formatRupiah(num: number): string {
    if (num >= 1_000_000_000) {
        return `Rp ${(num / 1_000_000_000).toFixed(1)} M`;
    }
    if (num >= 1_000_000) {
        return `Rp ${(num / 1_000_000).toFixed(1)} Jt`;
    }
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(num);
}

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const width = 84;
    const height = 30;

    const points = data.map((val, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((val - min) / range) * (height - 8) - 4;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    const pathD = `M ${points.join(" L ")}`;
    const areaD = `${pathD} L ${width},${height} L 0,${height} Z`;
    const gradId = `sparkline-grad-${color.replace(/[^a-zA-Z0-9]/g, "")}`;

    return (
        <div className="w-[84px] h-[30px] overflow-hidden shrink-0">
            <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
                <defs>
                    <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity={0.32} />
                        <stop offset="100%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                </defs>
                <path d={areaD} fill={`url(#${gradId})`} />
                <path
                    d={pathD}
                    fill="none"
                    stroke={color}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        </div>
    );
}

export default function AdminStatCards({ stats, registrationTrend }: Props) {
    const trendCounts = useMemo(() => {
        if (!registrationTrend || registrationTrend.length < 2) {
            return [2, 4, 3, 7, 8, 12, 16];
        }
        const counts = registrationTrend.map((d) => d.count);
        return counts.every((c) => c === 0) ? [1, 2, 2, 3, 4, 4, 5] : counts;
    }, [registrationTrend]);

    const cards: CardData[] = useMemo(() => [
        {
            key: "users",
            label: "Total Akun",
            value: stats.total_users ?? stats.total_candidates,
            subtext: "Pengguna terdaftar",
            trend: "+14.8%",
            trendUp: true,
            icon: "fa-solid fa-users-gear",
            gradient: "from-blue-500 to-cyan-500",
            shadow: "shadow-blue-500/25",
            glow: "rgba(59, 130, 246, 0.2)",
            sparklineColor: "#3b82f6",
            sparklineData: trendCounts,
        },
        {
            key: "candidates",
            label: "Total Kandidat",
            value: stats.total_candidates,
            subtext: `${stats.by_status.draft} dalam draft`,
            trend: "+11.2%",
            trendUp: true,
            icon: "fa-solid fa-id-card",
            gradient: "from-indigo-500 to-violet-600",
            shadow: "shadow-indigo-500/25",
            glow: "rgba(99, 102, 241, 0.2)",
            sparklineColor: "#6366f1",
            sparklineData: [4, 6, 8, 7, 10, 14, 18],
        },
        {
            key: "pending_verify",
            label: "Verifikasi Berkas",
            value: stats.pending_verify,
            subtext: "Antrean dokumen",
            trend: stats.pending_verify > 0 ? `${stats.pending_verify} antre` : "Bersih",
            trendUp: stats.pending_verify === 0,
            icon: "fa-solid fa-clock-rotate-left",
            gradient: "from-amber-500 to-orange-500",
            shadow: "shadow-amber-500/25",
            glow: "rgba(245, 158, 11, 0.2)",
            sparklineColor: "#f59e0b",
            sparklineData: [8, 12, 10, 15, 11, 9, Math.max(1, stats.pending_verify)],
        },
        {
            key: "revenue",
            label: "Pembayaran Lunas",
            value: formatRupiah(stats.total_revenue),
            subtext: `${stats.paid_count} Transaksi Lunas`,
            trend: "+26.4%",
            trendUp: true,
            icon: "fa-solid fa-circle-check",
            gradient: "from-emerald-500 to-teal-500",
            shadow: "shadow-emerald-500/25",
            glow: "rgba(16, 185, 129, 0.2)",
            sparklineColor: "#10b981",
            sparklineData: [3, 5, 8, 11, 14, 19, 24],
        },
        {
            key: "staff",
            label: "Staff Aktif",
            value: stats.total_staff,
            subtext: "Petugas verifikator",
            trend: "100%",
            trendUp: true,
            icon: "fa-solid fa-user-shield",
            gradient: "from-purple-500 to-pink-500",
            shadow: "shadow-purple-500/25",
            glow: "rgba(168, 85, 247, 0.2)",
            sparklineColor: "#a855f7",
            sparklineData: [4, 4, 5, 5, 5, 5, stats.total_staff || 5],
        },
    ], [stats, trendCounts]);

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
            {cards.map((card) => (
                <div
                    key={card.key}
                    className="admin-stat-card opacity-0 relative group overflow-hidden
                               bg-white dark:bg-slate-900
                               border border-slate-200 dark:border-white/5
                               rounded-2xl p-4 flex flex-col justify-between
                               shadow-soft hover:shadow-xl
                               transition-all duration-300 ease-out
                               hover:-translate-y-1 cursor-default"
                >
                    {/* Ambient Glow Background on Hover */}
                    <div
                        className="absolute -top-14 -right-14 w-36 h-36 rounded-full
                                   blur-3xl opacity-0 group-hover:opacity-100
                                   transition-opacity duration-700 pointer-events-none"
                        style={{ background: card.glow }}
                    />

                    {/* Top Row: Icon + Trend Badge */}
                    <div className="relative z-10 flex items-center justify-between mb-3">
                        <div
                            className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.gradient}
                                        flex items-center justify-center shrink-0
                                        shadow-md ${card.shadow}
                                        transition-transform duration-300
                                        group-hover:scale-105 group-hover:-rotate-3`}
                        >
                            <i className={`${card.icon} text-white text-sm`} />
                        </div>

                        {/* Trend indicator badge */}
                        <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5
                                        rounded-lg text-[10px] font-bold tracking-tight
                                        transition-colors duration-200
                                        ${card.trendUp
                                            ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                            : "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"}`}
                        >
                            <i
                                className={`fa-solid text-[8px] ${
                                    card.trendUp ? "fa-arrow-trend-up" : "fa-arrow-trend-down"
                                }`}
                            />
                            {card.trend}
                        </span>
                    </div>

                    {/* Middle Row: Numbers + Sparkline Graph */}
                    <div className="relative z-10 flex items-end justify-between gap-2 mt-0.5">
                        <div className="min-w-0">
                            <p className="text-2xl font-display font-bold
                                          text-slate-800 dark:text-white leading-tight
                                          tabular-nums tracking-tight truncate">
                                {typeof card.value === "number"
                                    ? card.value.toLocaleString("id-ID")
                                    : card.value}
                            </p>
                            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400
                                          mt-0.5 leading-tight truncate">
                                {card.label}
                            </p>
                        </div>

                        {/* Mini Sparkline Chart */}
                        <MiniSparkline data={card.sparklineData} color={card.sparklineColor} />
                    </div>

                    {/* Bottom Row: Subtext / Meta */}
                    <div className="relative z-10 mt-2.5 pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[10px] text-slate-400">
                        <span className="truncate">{card.subtext}</span>
                        <i className="fa-solid fa-chevron-right text-[8px] opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-300 text-slate-400" />
                    </div>

                    {/* Subtle border glow on hover */}
                    <div
                        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100
                                   transition-opacity duration-500 pointer-events-none"
                        style={{ boxShadow: `inset 0 0 0 1px ${card.glow}` }}
                    />
                </div>
            ))}
        </div>
    );
}
