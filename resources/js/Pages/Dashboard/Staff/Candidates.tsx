// resources/js/Pages/Dashboard/Staff/Candidates.tsx

import { Head, usePage } from "@inertiajs/react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import CandidateFilters from "@/Components/Dashboard/Staff/Candidates/CandidateFilters";
import CandidateTable from "@/Components/Dashboard/Staff/Candidates/CandidateTable";
import CandidatePagination from "@/Components/Dashboard/Staff/Candidates/CandidatePagination";
import type { Filters, Wave } from "@/Components/Dashboard/Staff/Candidates/CandidateFilters";
import type { CandidateRow } from "@/Components/Dashboard/Staff/Candidates/CandidateTable";
import type { PaginationLink } from "@/Components/Dashboard/Staff/Candidates/CandidatePagination";
import type { PageProps } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type Paginated<T> = {
    data:         T[];
    current_page: number;
    last_page:    number;
    per_page:     number;
    total:        number;
    links:        PaginationLink[];
};

type Props = {
    candidates: Paginated<CandidateRow>;
    waves:      Wave[];
    filters:    Filters;
};

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function StaffCandidates({ candidates, waves, filters }: Props) {
    const { flash } = usePage<PageProps>().props;

    return (
        <DashboardLayout>
            <Head title="Kandidat — Staff" />

            <div className="flex flex-col gap-6 pb-8">

                {/* ── Header ───────────────────────────────────────────────── */}
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl shrink-0
                                    bg-gradient-to-br from-emerald-500 to-teal-500
                                    flex items-center justify-center
                                    shadow-lg shadow-emerald-500/25">
                        <i className="fa-solid fa-users text-white text-sm" />
                    </div>
                    <div>
                        <h1 className="text-xl font-display font-bold
                                       text-slate-800 dark:text-white leading-tight">
                            Daftar Kandidat
                        </h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {candidates.total.toLocaleString("id-ID")} kandidat terdaftar
                        </p>
                    </div>
                </div>

                {flash.error && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
                        {flash.error}
                    </div>
                )}

                {/* ── Filters ──────────────────────────────────────────────── */}
                <CandidateFilters filters={filters} waves={waves} />

                {/* ── Table ────────────────────────────────────────────────── */}
                <CandidateTable candidates={candidates.data} />

                {/* ── Pagination ───────────────────────────────────────────── */}
                <CandidatePagination
                    currentPage={candidates.current_page}
                    lastPage={candidates.last_page}
                    total={candidates.total}
                    links={candidates.links}
                    filters={filters}
                />

            </div>
        </DashboardLayout>
    );
}
