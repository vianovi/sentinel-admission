// resources/js/Components/Dashboard/Staff/Index/StatsGrid.tsx

import { useEffect } from "react";
import { animate, stagger } from "animejs";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type Stats = {
    total:     number;
    draft:     number;
    submitted: number;
    verified:  number;
    accepted:  number;
    rejected:  number;
    pending_transfers?: number;
    exam_ready?: number;
};

type StatCard = {
    label:    string;
    value:    number;
    growth:   string;
    growthUp: boolean;
    icon:     string;
    gradient: string;
    shadow:   string;
    glow:     string;
};

type Props = {
    stats: Stats;
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function buildCards(stats: Stats): StatCard[] {
    return [
        {
            label:    "Total Kandidat",
            value:    stats.total,
            growth:   `${stats.draft} draft`,
            growthUp: true,
            icon:     "fa-solid fa-users",
            gradient: "from-blue-500 to-cyan-500",
            shadow:   "shadow-blue-500/25",
            glow:     "rgba(59, 130, 246, 0.18)",
        },
        {
            label:    "Verifikasi Berkas",
            value:    stats.submitted,
            growth:   "Antrean dokumen",
            growthUp: stats.submitted > 0,
            icon:     "fa-solid fa-file-circle-check",
            gradient: "from-amber-500 to-orange-500",
            shadow:   "shadow-amber-500/25",
            glow:     "rgba(245, 158, 11, 0.18)",
        },
        {
            label:    "Verifikasi Transfer",
            value:    stats.pending_transfers ?? 0,
            growth:   "Bukti bayar masuk",
            growthUp: (stats.pending_transfers ?? 0) > 0,
            icon:     "fa-solid fa-money-bill-transfer",
            gradient: "from-violet-500 to-indigo-500",
            shadow:   "shadow-violet-500/25",
            glow:     "rgba(139, 92, 246, 0.18)",
        },
        {
            label:    "Siap Ujian Seleksi",
            value:    stats.exam_ready ?? stats.verified,
            growth:   `${stats.accepted} lulus`,
            growthUp: true,
            icon:     "fa-solid fa-graduation-cap",
            gradient: "from-emerald-500 to-teal-500",
            shadow:   "shadow-emerald-500/25",
            glow:     "rgba(16, 185, 129, 0.18)",
        },
    ];
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function StatsGrid({ stats }: Props) {
    const cards = buildCards(stats);

    useEffect(() => {
        animate(".staff-stat-card", {
            opacity:    [0, 1],
            translateY: [28, 0],
            scale:      [0.95, 1],
            duration:   600,
            delay:      stagger(90),
            ease:       "outExpo",
        });
    }, []);

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {cards.map((card, i) => (
                <div
                    key={card.label}
                    className="staff-stat-card opacity-0 relative group overflow-hidden
                               bg-white dark:bg-slate-900
                               border border-slate-200 dark:border-white/5
                               rounded-2xl p-5
                               shadow-md hover:shadow-xl
                               transition-all duration-300 ease-out
                               hover:-translate-y-1.5 cursor-default"
                >
                    {/* Ambient glow — appears on hover */}
                    <div
                        className="absolute -top-16 -right-16 w-40 h-40 rounded-full
                                   blur-3xl opacity-0 group-hover:opacity-100
                                   transition-opacity duration-700 pointer-events-none"
                        style={{ background: card.glow }}
                    />

                    {/* Top row: icon + growth badge */}
                    <div className="relative z-10 flex items-start justify-between mb-4">
                        {/* Gradient icon */}
                        <div
                            className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${card.gradient}
                                        flex items-center justify-center shrink-0
                                        shadow-lg ${card.shadow}
                                        transition-transform duration-300
                                        group-hover:scale-110 group-hover:rotate-3`}
                        >
                            <i className={`${card.icon} text-white text-lg`} />
                        </div>

                        {/* Growth badge */}
                        <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1
                                        rounded-xl text-[11px] font-semibold
                                        ${card.growthUp
                                            ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                            : "bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400"}`}
                        >
                            <i
                                className={`fa-solid text-[9px]
                                            ${card.growthUp
                                                ? "fa-arrow-trend-up"
                                                : "fa-arrow-trend-down"}`}
                            />
                            {card.growth}
                        </span>
                    </div>

                    {/* Value + label */}
                    <div className="relative z-10">
                        <p className="text-3xl font-display font-bold
                                      text-slate-800 dark:text-white leading-none
                                      tabular-nums">
                            {card.value.toLocaleString("id-ID")}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400
                                      mt-2 leading-tight">
                            {card.label}
                        </p>
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
