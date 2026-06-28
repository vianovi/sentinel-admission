import { Head, usePage } from "@inertiajs/react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import CandidateFilters from "@/Components/Dashboard/Staff/Candidates/CandidateFilters";
import CandidateTable from "@/Components/Dashboard/Staff/Candidates/CandidateTable";
import CandidatePagination from "@/Components/Dashboard/Staff/Candidates/CandidatePagination";
import type { Filters, Wave } from "@/Components/Dashboard/Staff/Candidates/CandidateFilters";
import type { CandidateRow } from "@/Components/Dashboard/Staff/Candidates/CandidateTable";
import type { PaginationLink } from "@/Components/Dashboard/Staff/Candidates/CandidatePagination";
import type { PageProps } from "@/types";

type Paginated<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: PaginationLink[];
};

type AdminCandidateRow = CandidateRow & {
    program_choice?: string | null;
};

type Props = {
    candidates: Paginated<AdminCandidateRow>;
    waves: Wave[];
    filters: Filters;
};

export default function AdminCandidates({ candidates, waves, filters }: Props) {
    const { flash } = usePage<PageProps>().props;

    return (
        <DashboardLayout>
            <Head title="Kandidat - Admin" />

            <div className="flex flex-col gap-6 pb-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-orange-500 shadow-lg shadow-rose-500/25">
                            <i className="fa-solid fa-users text-sm text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-display font-bold leading-tight text-slate-800 dark:text-white">
                                Daftar Kandidat
                            </h1>
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                {candidates.total.toLocaleString("id-ID")} kandidat terdaftar untuk monitoring admin
                            </p>
                        </div>
                    </div>

                    <div className="inline-flex items-center gap-2 self-start rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-2.5 text-sm font-semibold text-rose-600 dark:text-rose-300">
                        <i className="fa-solid fa-user-shield text-xs" />
                        Akses Admin
                    </div>
                </div>

                {flash.error && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
                        {flash.error}
                    </div>
                )}

                <CandidateFilters
                    filters={filters}
                    waves={waves}
                    basePath="/dashboard/admin/candidates"
                />

                <CandidateTable
                    candidates={candidates.data}
                    basePath="/dashboard/admin/candidates"
                    selectedCandidateStorageKey="admin:selectedCandidateId"
                />

                <CandidatePagination
                    currentPage={candidates.current_page}
                    lastPage={candidates.last_page}
                    total={candidates.total}
                    links={candidates.links}
                    filters={filters}
                    basePath="/dashboard/admin/candidates"
                />
            </div>
        </DashboardLayout>
    );
}
