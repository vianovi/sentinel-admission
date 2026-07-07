// resources/js/Pages/Dashboard/Staff/Candidates.tsx

import { Head, usePage } from "@inertiajs/react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import CandidateFilters from "@/Components/Dashboard/Staff/Candidates/CandidateFilters";
import CandidateTable from "@/Components/Dashboard/Staff/Candidates/CandidateTable";
import CandidatePagination from "@/Components/Dashboard/Staff/Candidates/CandidatePagination";
import type { FilterOption, Filters, Wave } from "@/Components/Dashboard/Staff/Candidates/CandidateFilters";
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
    programs:   FilterOption[];
    action_options: FilterOption[];
    summary: {
        total: number;
        submitted: number;
        document_review: number;
        payment_review: number;
        change_requests: number;
        verified_unassigned: number;
    };
    filters:    Filters;
};

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function StaffCandidates({ candidates, waves, programs, action_options, summary, filters }: Props) {
    const { flash } = usePage<PageProps>().props;
    const summaryCards = [
        { label: "Total Kandidat", value: summary.total, icon: "fa-solid fa-users", tone: "border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-300" },
        { label: "Menunggu Review", value: summary.submitted, icon: "fa-solid fa-clock", tone: "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-300" },
        { label: "Dokumen Pending", value: summary.document_review, icon: "fa-solid fa-file-circle-check", tone: "border-cyan-500/20 bg-cyan-500/10 text-cyan-600 dark:text-cyan-300" },
        { label: "Pembayaran Pending", value: summary.payment_review, icon: "fa-solid fa-money-check-dollar", tone: "border-orange-500/20 bg-orange-500/10 text-orange-600 dark:text-orange-300" },
        { label: "Perubahan Data", value: summary.change_requests, icon: "fa-solid fa-arrows-rotate", tone: "border-violet-500/20 bg-violet-500/10 text-violet-600 dark:text-violet-300" },
        { label: "Verified tanpa Sesi", value: summary.verified_unassigned, icon: "fa-solid fa-calendar-xmark", tone: "border-slate-300 bg-slate-100 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300" },
    ];

    return (
        <DashboardLayout>
            <Head title="Kandidat — Staff" />

            <div className="flex flex-col gap-6 pb-8">

                {/* ── Header ───────────────────────────────────────────────── */}
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900">
                            <i className="fa-solid fa-users text-sm" />
                        </div>
                        <div>
                            <h1 className="font-display text-xl font-bold leading-tight text-slate-800 dark:text-white">
                                Daftar Kandidat
                            </h1>
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                {candidates.total.toLocaleString("id-ID")} kandidat pada hasil saat ini
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        disabled
                        title="Export Excel akan disiapkan pada task reporting terpisah"
                        className="inline-flex min-h-10 cursor-not-allowed items-center gap-2 self-start rounded-md border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-400 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-500"
                    >
                        <i className="fa-solid fa-file-excel text-xs" />
                        Export Excel
                        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-500 dark:bg-white/10 dark:text-slate-400">
                            Soon
                        </span>
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
                    {summaryCards.map((card) => (
                        <div key={card.label} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900">
                            <div className="flex items-center gap-3">
                                <div className={`flex h-9 w-9 items-center justify-center rounded-md border ${card.tone}`}>
                                    <i className={`${card.icon} text-sm`} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xl font-black leading-none text-slate-900 dark:text-white">
                                        {card.value.toLocaleString("id-ID")}
                                    </p>
                                    <p className="mt-1 truncate text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                        {card.label}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {flash.error && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
                        {flash.error}
                    </div>
                )}

                {/* ── Filters ──────────────────────────────────────────────── */}
                <CandidateFilters
                    filters={filters}
                    waves={waves}
                    programs={programs}
                    actionOptions={action_options}
                    basePath="/dashboard/staff/candidates"
                />

                {/* ── Table ────────────────────────────────────────────────── */}
                <CandidateTable
                    candidates={candidates.data}
                    basePath="/dashboard/staff/candidates"
                    selectedCandidateStorageKey="staff:selectedCandidateId"
                />

                {/* ── Pagination ───────────────────────────────────────────── */}
                <CandidatePagination
                    currentPage={candidates.current_page}
                    lastPage={candidates.last_page}
                    total={candidates.total}
                    links={candidates.links}
                    filters={filters}
                    basePath="/dashboard/staff/candidates"
                />

            </div>
        </DashboardLayout>
    );
}
