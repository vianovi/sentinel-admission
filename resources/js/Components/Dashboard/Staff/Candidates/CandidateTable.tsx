// resources/js/Components/Dashboard/Staff/Candidates/CandidateTable.tsx

import { useEffect } from "react";
import { Link } from "@inertiajs/react";
import { animate, stagger } from "animejs";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type CandidateRow = {
    id:             number;
    candidate_code: string;
    full_name:      string;
    nisn:           string;
    gender_label:   string;
    school_origin:  string;
    status:         "draft" | "submitted" | "verified" | "accepted" | "rejected";
    admission_wave: string | null;
    doc_count:      number;
    doc_pending:    number;
    created_at:     string;
};

type Props = {
    candidates: CandidateRow[];
};

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<CandidateRow["status"], { label: string; bg: string; text: string }> = {
    draft:     { label: "Draft",               bg: "bg-slate-100 dark:bg-white/5",         text: "text-slate-500 dark:text-slate-400"   },
    submitted: { label: "Menunggu Verifikasi", bg: "bg-amber-50 dark:bg-amber-500/10",     text: "text-amber-600 dark:text-amber-400"   },
    verified:  { label: "Terverifikasi",       bg: "bg-blue-50 dark:bg-blue-500/10",       text: "text-blue-600 dark:text-blue-400"     },
    accepted:  { label: "Diterima",            bg: "bg-emerald-50 dark:bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400" },
    rejected:  { label: "Ditolak",            bg: "bg-red-50 dark:bg-red-500/10",         text: "text-red-500 dark:text-red-400"       },
};

const TABLE_HEADERS = ["Kandidat", "Gelombang", "Status", "Dokumen", "Tanggal", ""];

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function CandidateTable({ candidates }: Props) {
    useEffect(() => {
        if (candidates.length === 0) return;
        animate(".candidate-row", {
            opacity:    [0, 1],
            translateY: [10, 0],
            duration:   400,
            delay:      stagger(40),
            ease:       "outExpo",
        });
    }, [candidates]);

    if (candidates.length === 0) {
        return (
            <div className="bg-white dark:bg-slate-900
                            border border-slate-200 dark:border-white/5
                            rounded-2xl shadow-md overflow-hidden">
                <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-white/5
                                    flex items-center justify-center mb-3">
                        <i className="fa-solid fa-users text-slate-400 text-xl" />
                    </div>
                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                        Tidak ada kandidat ditemukan
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                        Coba ubah filter atau kata kunci pencarian
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-900
                        border border-slate-200 dark:border-white/5
                        rounded-2xl shadow-md overflow-hidden">

            {/* Desktop table header */}
            <div className="hidden lg:grid
                            grid-cols-[1fr_140px_160px_110px_90px_48px]
                            px-5 py-3.5
                            border-b border-slate-100 dark:border-white/5
                            bg-slate-50 dark:bg-white/[0.02]">
                {TABLE_HEADERS.map((h, i) => (
                    <p key={i} className="text-[11px] font-semibold uppercase tracking-wider
                                          text-slate-400 dark:text-slate-500">
                        {h}
                    </p>
                ))}
            </div>

            {/* Rows */}
            <ul className="divide-y divide-slate-100 dark:divide-white/5">
                {candidates.map((c) => {
                    const cfg = STATUS_CONFIG[c.status] ?? STATUS_CONFIG.draft;
                    const initial = c.full_name.charAt(0).toUpperCase();

                    return (
                        <li key={c.id} className="candidate-row opacity-0">
                            <Link
                                href={`/dashboard/staff/candidates/${c.id}`}
                                className="flex flex-col lg:grid
                                           lg:grid-cols-[1fr_140px_160px_110px_90px_48px]
                                           items-start lg:items-center
                                           gap-2 lg:gap-0
                                           px-5 py-4
                                           hover:bg-slate-50 dark:hover:bg-white/[0.03]
                                           transition-colors duration-150 group"
                            >
                                {/* Kandidat info */}
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-9 h-9 rounded-xl shrink-0
                                                    bg-gradient-to-br from-emerald-500 to-teal-500
                                                    flex items-center justify-center
                                                    shadow-sm shadow-emerald-500/20
                                                    transition-transform duration-200
                                                    group-hover:scale-105 group-hover:rotate-2">
                                        <span className="text-xs font-bold text-white">
                                            {initial}
                                        </span>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold truncate
                                                      text-slate-800 dark:text-slate-100
                                                      group-hover:text-emerald-600 dark:group-hover:text-emerald-400
                                                      transition-colors">
                                            {c.full_name}
                                        </p>
                                        <p className="text-xs text-slate-400 truncate mt-0.5">
                                            {c.candidate_code} · {c.gender_label}
                                            {c.school_origin ? ` · ${c.school_origin}` : ""}
                                        </p>
                                    </div>
                                </div>

                                {/* Gelombang */}
                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate hidden lg:block">
                                    {c.admission_wave ?? "—"}
                                </p>

                                {/* Status badge */}
                                <div>
                                    <span className={`inline-flex items-center px-2.5 py-1
                                                      rounded-lg text-[11px] font-semibold
                                                      ${cfg.bg} ${cfg.text}`}>
                                        {cfg.label}
                                    </span>
                                </div>

                                {/* Dokumen */}
                                <div className="hidden lg:flex items-center gap-1.5">
                                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                                        {c.doc_count}
                                    </span>
                                    {c.doc_pending > 0 && (
                                        <span className="text-[11px] font-semibold
                                                         text-amber-600 dark:text-amber-400
                                                         bg-amber-50 dark:bg-amber-500/10
                                                         px-1.5 py-0.5 rounded-lg">
                                            {c.doc_pending} pending
                                        </span>
                                    )}
                                </div>

                                {/* Tanggal */}
                                <p className="hidden lg:block text-xs text-slate-400">
                                    {c.created_at}
                                </p>

                                {/* Arrow */}
                                <div className="hidden lg:flex justify-end">
                                    <i className="fa-solid fa-chevron-right text-[10px]
                                                  text-slate-300 dark:text-slate-600
                                                  group-hover:text-emerald-500
                                                  group-hover:translate-x-0.5
                                                  transition-all" />
                                </div>
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
