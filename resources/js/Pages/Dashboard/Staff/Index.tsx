// resources/js/Pages/Dashboard/Staff/Index.tsx

import { useEffect } from "react";
import { Head, Link, usePage } from "@inertiajs/react";
import { animate, stagger } from "animejs";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { PageProps } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type Stats = {
    total:     number;
    draft:     number;
    submitted: number;
    verified:  number;
    accepted:  number;
    rejected:  number;
};

type RecentSubmission = {
    id:             number;
    candidate_code: string;
    full_name:      string;
    school_origin:  string;
    admission_wave: string | null;
    created_at:     string;
};

type Props = {
    stats:               Stats;
    recent_submissions:  RecentSubmission[];
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const statCards = (stats: Stats) => [
    {
        label:   "Total Kandidat",
        value:   stats.total,
        icon:    "fa-solid fa-users",
        color:   "emerald",
        bg:      "bg-emerald-500/10 dark:bg-emerald-500/10",
        text:    "text-emerald-600 dark:text-emerald-400",
        border:  "border-emerald-500/20",
    },
    {
        label:   "Menunggu Verifikasi",
        value:   stats.submitted,
        icon:    "fa-solid fa-clock",
        color:   "amber",
        bg:      "bg-amber-500/10",
        text:    "text-amber-600 dark:text-amber-400",
        border:  "border-amber-500/20",
    },
    {
        label:   "Terverifikasi",
        value:   stats.verified,
        icon:    "fa-solid fa-shield-check",
        color:   "blue",
        bg:      "bg-blue-500/10",
        text:    "text-blue-600 dark:text-blue-400",
        border:  "border-blue-500/20",
    },
    {
        label:   "Diterima",
        value:   stats.accepted,
        icon:    "fa-solid fa-circle-check",
        color:   "emerald",
        bg:      "bg-emerald-500/10",
        text:    "text-emerald-600 dark:text-emerald-400",
        border:  "border-emerald-500/20",
    },
    {
        label:   "Ditolak",
        value:   stats.rejected,
        icon:    "fa-solid fa-circle-xmark",
        color:   "red",
        bg:      "bg-red-500/10",
        text:    "text-red-500 dark:text-red-400",
        border:  "border-red-500/20",
    },
];

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function StaffIndex({ stats, recent_submissions }: Props) {
    const { auth } = usePage<PageProps>().props;

    useEffect(() => {
        animate(".stat-card", {
            opacity:    [0, 1],
            translateY: [16, 0],
            duration:   500,
            delay:      stagger(70),
            ease:       "outExpo",
        });
        animate(".section-block", {
            opacity:    [0, 1],
            translateY: [20, 0],
            duration:   500,
            delay:      stagger(80, { start: 350 }),
            ease:       "outExpo",
        });
    }, []);

    const cards = statCards(stats);

    return (
        <DashboardLayout>
            <Head title="Dashboard Staff" />

            <div className="flex flex-col gap-6">

                {/* ── Header ───────────────────────────────────────────────── */}
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20
                                    flex items-center justify-center shrink-0">
                        <i className="fa-solid fa-gauge text-emerald-500 text-sm"></i>
                    </div>
                    <div>
                        <h1 className="text-xl font-display font-bold text-slate-800 dark:text-white leading-tight">
                            Dashboard Staff
                        </h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Selamat datang, {auth.user.name}
                        </p>
                    </div>
                </div>

                {/* ── Stats Grid ───────────────────────────────────────────── */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {cards.map((card) => (
                        <div
                            key={card.label}
                            className={`stat-card opacity-0 bg-white dark:bg-slate-900
                                        border border-slate-200 dark:border-white/5
                                        rounded-2xl p-4 flex flex-col gap-3
                                        shadow-soft transition hover:shadow-md`}
                        >
                            <div className={`w-9 h-9 rounded-xl ${card.bg} border ${card.border}
                                            flex items-center justify-center shrink-0`}>
                                <i className={`${card.icon} ${card.text} text-sm`}></i>
                            </div>
                            <div>
                                <p className="text-2xl font-display font-bold text-slate-800 dark:text-white leading-none">
                                    {card.value}
                                </p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-tight">
                                    {card.label}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Recent Submissions ───────────────────────────────────── */}
                <div className="section-block opacity-0 bg-white dark:bg-slate-900
                                border border-slate-200 dark:border-white/5
                                rounded-2xl shadow-soft overflow-hidden">

                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4
                                    border-b border-slate-100 dark:border-white/5">
                        <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20
                                            flex items-center justify-center">
                                <i className="fa-solid fa-clock text-amber-500 text-xs"></i>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-slate-800 dark:text-white">
                                    Menunggu Verifikasi
                                </p>
                                <p className="text-[11px] text-slate-400">
                                    {stats.submitted} kandidat perlu ditinjau
                                </p>
                            </div>
                        </div>
                        <Link
                            href="/dashboard/staff/candidates"
                            className="text-xs font-semibold text-emerald-500 hover:text-emerald-400
                                       transition flex items-center gap-1"
                        >
                            Lihat semua
                            <i className="fa-solid fa-arrow-right text-[10px]"></i>
                        </Link>
                    </div>

                    {/* List */}
                    {recent_submissions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5
                                            flex items-center justify-center mb-3">
                                <i className="fa-solid fa-inbox text-slate-400 text-lg"></i>
                            </div>
                            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                                Tidak ada pengajuan baru
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                                Semua kandidat sudah diproses
                            </p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-slate-100 dark:divide-white/5">
                            {recent_submissions.map((item) => (
                                <li key={item.id}>
                                    <Link
                                        href={`/dashboard/staff/candidates/${item.id}`}
                                        className="flex items-center gap-4 px-5 py-3.5
                                                   hover:bg-slate-50 dark:hover:bg-white/5
                                                   transition group"
                                    >
                                        {/* Avatar initials */}
                                        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20
                                                        flex items-center justify-center shrink-0">
                                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                                {item.full_name.charAt(0).toUpperCase()}
                                            </span>
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate
                                                          group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
                                                {item.full_name}
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                                {item.candidate_code}
                                                {item.school_origin ? ` · ${item.school_origin}` : ""}
                                            </p>
                                        </div>

                                        {/* Meta */}
                                        <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
                                            {item.admission_wave && (
                                                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400
                                                                 bg-emerald-500/10 border border-emerald-500/20
                                                                 px-2 py-0.5 rounded-lg">
                                                    {item.admission_wave}
                                                </span>
                                            )}
                                            <p className="text-[11px] text-slate-400">{item.created_at}</p>
                                        </div>

                                        <i className="fa-solid fa-chevron-right text-[10px] text-slate-300
                                                      dark:text-slate-600 group-hover:text-emerald-500
                                                      group-hover:translate-x-0.5 transition-all shrink-0"></i>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

            </div>
        </DashboardLayout>
    );
}
