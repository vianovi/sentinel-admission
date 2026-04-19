// resources/js/Pages/Dashboard/Staff/Candidates.tsx

import { useEffect, useCallback } from "react";
import { Head, Link, router } from "@inertiajs/react";
import { animate, stagger } from "animejs";
import DashboardLayout from "@/Layouts/DashboardLayout";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type Candidate = {
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

type Wave = {
    id:    number;
    title: string;
};

type PaginationLink = {
    url:    string | null;
    label:  string;
    active: boolean;
};

type Paginated<T> = {
    data:          T[];
    current_page:  number;
    last_page:     number;
    per_page:      number;
    total:         number;
    links:         PaginationLink[];
};

type Filters = {
    search: string;
    status: string;
    wave:   string;
};

type Props = {
    candidates: Paginated<Candidate>;
    waves:      Wave[];
    filters:    Filters;
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
    draft:     { label: "Draft",                bg: "bg-slate-100 dark:bg-white/5",       text: "text-slate-500 dark:text-slate-400" },
    submitted: { label: "Menunggu Verifikasi",  bg: "bg-amber-50 dark:bg-amber-500/10",   text: "text-amber-600 dark:text-amber-400" },
    verified:  { label: "Terverifikasi",        bg: "bg-blue-50 dark:bg-blue-500/10",     text: "text-blue-600 dark:text-blue-400" },
    accepted:  { label: "Diterima",             bg: "bg-emerald-50 dark:bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400" },
    rejected:  { label: "Ditolak",              bg: "bg-red-50 dark:bg-red-500/10",       text: "text-red-500 dark:text-red-400" },
};

const statusOptions = [
    { value: "",          label: "Semua Status" },
    { value: "draft",     label: "Draft" },
    { value: "submitted", label: "Menunggu Verifikasi" },
    { value: "verified",  label: "Terverifikasi" },
    { value: "accepted",  label: "Diterima" },
    { value: "rejected",  label: "Ditolak" },
];

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function StaffCandidates({ candidates, waves, filters }: Props) {

    useEffect(() => {
        if (candidates.data.length === 0) return;
        animate(".candidate-row", {
            opacity:    [0, 1],
            translateY: [10, 0],
            duration:   400,
            delay:      stagger(40),
            ease:       "outExpo",
        });
    }, [candidates.data]);

    // ── Filter handlers — semua via backend ──────────────────────────────────
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

    const handlePage = (url: string | null) => {
        if (!url) return;
        router.get(url, {}, { preserveState: true, preserveScroll: false });
    };

    const cfg = (status: string) => statusConfig[status] ?? statusConfig.draft;

    return (
        <DashboardLayout>
            <Head title="Kandidat — Staff" />

            <div className="flex flex-col gap-6">

                {/* ── Header ───────────────────────────────────────────────── */}
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20
                                        flex items-center justify-center shrink-0">
                            <i className="fa-solid fa-users text-emerald-500 text-sm"></i>
                        </div>
                        <div>
                            <h1 className="text-xl font-display font-bold text-slate-800 dark:text-white leading-tight">
                                Daftar Kandidat
                            </h1>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                {candidates.total} kandidat terdaftar
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── Filters ──────────────────────────────────────────────── */}
                <div className="flex flex-col sm:flex-row gap-3">

                    {/* Search */}
                    <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                            <i className="fa-solid fa-magnifying-glass text-xs"></i>
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
                                       transition"
                        />
                    </div>

                    {/* Status filter */}
                    <select
                        value={filters.status}
                        onChange={(e) => applyFilter({ status: e.target.value })}
                        className="h-10 px-3 rounded-xl text-sm
                                   bg-white dark:bg-slate-900
                                   border border-slate-200 dark:border-white/10
                                   text-slate-700 dark:text-slate-200
                                   focus:outline-none focus:border-emerald-500
                                   transition"
                    >
                        {statusOptions.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                    </select>

                    {/* Wave filter */}
                    <select
                        value={filters.wave}
                        onChange={(e) => applyFilter({ wave: e.target.value })}
                        className="h-10 px-3 rounded-xl text-sm
                                   bg-white dark:bg-slate-900
                                   border border-slate-200 dark:border-white/10
                                   text-slate-700 dark:text-slate-200
                                   focus:outline-none focus:border-emerald-500
                                   transition"
                    >
                        <option value="">Semua Gelombang</option>
                        {waves.map((w) => (
                            <option key={w.id} value={String(w.id)}>{w.title}</option>
                        ))}
                    </select>
                </div>

                {/* ── Table ────────────────────────────────────────────────── */}
                <div className="bg-white dark:bg-slate-900
                                border border-slate-200 dark:border-white/5
                                rounded-2xl shadow-soft overflow-hidden">

                    {candidates.data.length === 0 ? (

                        /* Empty state */
                        <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5
                                            flex items-center justify-center mb-3">
                                <i className="fa-solid fa-users text-slate-400 text-lg"></i>
                            </div>
                            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                                Tidak ada kandidat ditemukan
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                                Coba ubah filter atau kata kunci pencarian
                            </p>
                        </div>

                    ) : (
                        <>
                            {/* Desktop table header */}
                            <div className="hidden lg:grid grid-cols-[1fr_140px_120px_100px_80px_48px]
                                            px-5 py-3 border-b border-slate-100 dark:border-white/5">
                                {["Kandidat", "Gelombang", "Status", "Dokumen", "Tanggal", ""].map((h) => (
                                    <p key={h} className="text-[11px] font-semibold uppercase tracking-wide
                                                          text-slate-400 dark:text-slate-500">
                                        {h}
                                    </p>
                                ))}
                            </div>

                            {/* Rows */}
                            <ul className="divide-y divide-slate-100 dark:divide-white/5">
                                {candidates.data.map((c) => (
                                    <li key={c.id} className="candidate-row opacity-0">
                                        <Link
                                            href={`/dashboard/staff/candidates/${c.id}`}
                                            className="flex flex-col lg:grid
                                                       lg:grid-cols-[1fr_140px_120px_100px_80px_48px]
                                                       items-start lg:items-center
                                                       gap-2 lg:gap-0
                                                       px-5 py-4
                                                       hover:bg-slate-50 dark:hover:bg-white/5
                                                       transition group"
                                        >
                                            {/* Kandidat info */}
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-9 h-9 rounded-xl bg-emerald-500/10
                                                                border border-emerald-500/20
                                                                flex items-center justify-center shrink-0">
                                                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                                        {c.full_name.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100
                                                                  truncate group-hover:text-emerald-600
                                                                  dark:group-hover:text-emerald-400 transition">
                                                        {c.full_name}
                                                    </p>
                                                    <p className="text-xs text-slate-400 truncate mt-0.5">
                                                        {c.candidate_code} · {c.gender_label}
                                                        {c.school_origin ? ` · ${c.school_origin}` : ""}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Gelombang */}
                                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate
                                                          lg:block hidden">
                                                {c.admission_wave ?? "—"}
                                            </p>

                                            {/* Status */}
                                            <div>
                                                <span className={`inline-flex items-center px-2.5 py-1
                                                                  rounded-lg text-[11px] font-semibold
                                                                  ${cfg(c.status).bg} ${cfg(c.status).text}`}>
                                                    {cfg(c.status).label}
                                                </span>
                                            </div>

                                            {/* Dokumen */}
                                            <div className="hidden lg:flex items-center gap-1.5">
                                                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                                                    {c.doc_count}
                                                </span>
                                                {c.doc_pending > 0 && (
                                                    <span className="text-[11px] font-semibold text-amber-500
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
                                                              transition-all"></i>
                                            </div>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}
                </div>

                {/* ── Pagination ───────────────────────────────────────────── */}
                {candidates.last_page > 1 && (
                    <div className="flex items-center justify-between gap-4">
                        <p className="text-xs text-slate-400">
                            Halaman {candidates.current_page} dari {candidates.last_page}
                            {" "}· {candidates.total} total
                        </p>
                        <div className="flex items-center gap-1.5">
                            {candidates.links.map((link, i) => (
                                <button
                                    key={i}
                                    onClick={() => handlePage(link.url)}
                                    disabled={!link.url}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                    className={`min-w-[36px] h-9 px-3 rounded-xl text-xs font-semibold
                                                transition flex items-center justify-center
                                                ${link.active
                                                    ? "bg-emerald-500 text-white shadow-sm"
                                                    : link.url
                                                        ? "bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-500"
                                                        : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-300 dark:text-slate-600 cursor-not-allowed opacity-50"
                                                }`}
                                />
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </DashboardLayout>
    );
}
