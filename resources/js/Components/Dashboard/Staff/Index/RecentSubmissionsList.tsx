// resources/js/Components/Dashboard/Staff/Index/RecentSubmissionsList.tsx

import { useEffect } from "react";
import { Link } from "@inertiajs/react";
import { animate, stagger } from "animejs";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type RecentSubmission = {
    id:             number;
    candidate_code: string;
    full_name:      string;
    school_origin:  string;
    admission_wave: string | null;
    created_at:     string;
};

type Props = {
    items:          RecentSubmission[];
    submittedCount: number;
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function RecentSubmissionsList({ items, submittedCount }: Props) {
    useEffect(() => {
        if (items.length === 0) return;
        animate(".recent-row", {
            opacity:    [0, 1],
            translateX: [-12, 0],
            duration:   450,
            delay:      stagger(60, { start: 200 }),
            ease:       "outExpo",
        });
    }, [items]);

    return (
        <div className="bg-white dark:bg-slate-900
                        border border-slate-200 dark:border-white/5
                        rounded-2xl shadow-md overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5
                            border-b border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl shrink-0
                                    bg-gradient-to-br from-amber-500 to-orange-500
                                    flex items-center justify-center
                                    shadow-lg shadow-amber-500/25">
                        <i className="fa-solid fa-inbox text-white text-sm" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-white">
                            Menunggu Verifikasi
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                            {submittedCount > 0
                                ? `${submittedCount} kandidat perlu ditinjau`
                                : "Semua kandidat sudah diproses"}
                        </p>
                    </div>
                </div>

                <Link
                    href="/dashboard/staff/candidates?status=submitted"
                    className="flex items-center gap-1.5 text-xs font-semibold
                               text-emerald-500 hover:text-emerald-400
                               transition-colors group"
                >
                    Lihat semua
                    <i className="fa-solid fa-arrow-right text-[10px]
                                  group-hover:translate-x-0.5 transition-transform" />
                </Link>
            </div>

            {/* Empty state */}
            {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center
                                py-16 text-center px-6">
                    <div className="w-14 h-14 rounded-2xl
                                    bg-slate-100 dark:bg-white/5
                                    flex items-center justify-center mb-3">
                        <i className="fa-solid fa-check-double text-slate-400 text-xl" />
                    </div>
                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                        Tidak ada pengajuan baru
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                        Semua kandidat sudah diproses dengan baik
                    </p>
                </div>
            ) : (
                <ul className="divide-y divide-slate-100 dark:divide-white/5">
                    {items.map((item) => {
                        const initial = item.full_name.charAt(0).toUpperCase();
                        return (
                            <li key={item.id} className="recent-row opacity-0">
                                <Link
                                    href={`/dashboard/staff/candidates/${item.id}`}
                                    onClick={() => {
                                        if (typeof window !== "undefined") {
                                            window.localStorage.setItem("staff:selectedCandidateId", String(item.id));
                                        }
                                    }}
                                    className="flex items-center gap-4 px-6 py-4
                                               hover:bg-slate-50 dark:hover:bg-white/[0.03]
                                               transition-colors duration-150 group"
                                >
                                    {/* Gradient avatar */}
                                    <div
                                        className="w-10 h-10 rounded-xl shrink-0
                                                   bg-gradient-to-br from-emerald-500 to-teal-500
                                                   flex items-center justify-center
                                                   shadow-md shadow-emerald-500/20
                                                   transition-transform duration-200
                                                   group-hover:scale-105 group-hover:rotate-2"
                                    >
                                        <span className="text-sm font-bold text-white">
                                            {initial}
                                        </span>
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold truncate
                                                      text-slate-800 dark:text-slate-100
                                                      group-hover:text-emerald-600 dark:group-hover:text-emerald-400
                                                      transition-colors">
                                            {item.full_name}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400
                                                      truncate mt-0.5">
                                            {item.candidate_code}
                                            {item.school_origin ? ` · ${item.school_origin}` : ""}
                                        </p>
                                    </div>

                                    {/* Meta */}
                                    <div className="hidden sm:flex flex-col items-end gap-1.5 shrink-0">
                                        {item.admission_wave && (
                                            <span className="text-[11px] font-semibold
                                                             text-emerald-600 dark:text-emerald-400
                                                             bg-emerald-500/10 border border-emerald-500/20
                                                             px-2.5 py-1 rounded-lg">
                                                {item.admission_wave}
                                            </span>
                                        )}
                                        <p className="text-[11px] text-slate-400">
                                            {item.created_at}
                                        </p>
                                    </div>

                                    <i className="fa-solid fa-chevron-right text-[10px] shrink-0
                                                  text-slate-300 dark:text-slate-600
                                                  group-hover:text-emerald-500
                                                  group-hover:translate-x-0.5
                                                  transition-all" />
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
