// resources/js/Components/Dashboard/Staff/Candidates/CandidateFilters.tsx

import { useCallback } from "react";
import { router } from "@inertiajs/react";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type Filters = {
    search: string;
    status: string;
    wave:   string;
};

export type Wave = {
    id:    number;
    title: string;
};

type Props = {
    filters: Filters;
    waves:   Wave[];
};

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
    { value: "",          label: "Semua Status" },
    { value: "draft",     label: "Draft" },
    { value: "submitted", label: "Menunggu Verifikasi" },
    { value: "verified",  label: "Terverifikasi" },
    { value: "accepted",  label: "Diterima" },
    { value: "rejected",  label: "Ditolak" },
];

const SELECT_CLASS = `
    h-10 px-3 rounded-xl text-sm
    bg-white dark:bg-slate-900
    border border-slate-200 dark:border-white/10
    text-slate-700 dark:text-slate-200
    focus:outline-none focus:border-emerald-500
    transition-colors cursor-pointer
`.trim();

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function CandidateFilters({ filters, waves }: Props) {
    const applyFilter = useCallback((patch: Partial<Filters>) => {
        router.get(
            "/dashboard/staff/candidates",
            { ...filters, ...patch, page: 1 },
            { preserveState: true, preserveScroll: true, replace: true }
        );
    }, [filters]);

    const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        applyFilter({ search: e.target.value });
    }, [applyFilter]);

    const hasActiveFilter = filters.search || filters.status || filters.wave;

    return (
        <div className="flex flex-col sm:flex-row gap-3">

            {/* Search */}
            <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2
                                 text-slate-400 pointer-events-none">
                    <i className="fa-solid fa-magnifying-glass text-xs" />
                </span>
                <input
                    type="text"
                    placeholder="Cari nama, NISN, atau kode kandidat..."
                    defaultValue={filters.search}
                    onChange={handleSearch}
                    className="w-full h-10 pl-9 pr-4 rounded-xl text-sm
                               bg-white dark:bg-slate-900
                               border border-slate-200 dark:border-white/10
                               text-slate-700 dark:text-slate-200
                               placeholder:text-slate-400 dark:placeholder:text-slate-500
                               focus:outline-none focus:border-emerald-500
                               transition-colors"
                />
            </div>

            {/* Status filter */}
            <select
                value={filters.status}
                onChange={(e) => applyFilter({ status: e.target.value })}
                className={SELECT_CLASS}
            >
                {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>

            {/* Wave filter */}
            <select
                value={filters.wave}
                onChange={(e) => applyFilter({ wave: e.target.value })}
                className={SELECT_CLASS}
            >
                <option value="">Semua Gelombang</option>
                {waves.map((w) => (
                    <option key={w.id} value={String(w.id)}>{w.title}</option>
                ))}
            </select>

            {/* Reset filter */}
            {hasActiveFilter && (
                <button
                    type="button"
                    onClick={() => applyFilter({ search: "", status: "", wave: "" })}
                    className="h-10 px-4 rounded-xl text-sm font-semibold
                               border border-slate-200 dark:border-white/10
                               text-slate-500 dark:text-slate-400
                               hover:border-red-400 hover:text-red-500
                               dark:hover:border-red-500/50 dark:hover:text-red-400
                               transition-colors flex items-center gap-2 shrink-0"
                >
                    <i className="fa-solid fa-xmark text-xs" />
                    Reset
                </button>
            )}
        </div>
    );
}
