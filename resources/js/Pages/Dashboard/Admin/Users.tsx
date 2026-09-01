import React, { useEffect, useState, type ReactNode } from "react";
import { Head, router } from "@inertiajs/react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import Pagination from "@/Components/Dashboard/Admin/Users/UserPagination";
import UserStatCards from "@/Components/Dashboard/Admin/Users/UserStatCards";
import UserCharts from "@/Components/Dashboard/Admin/Users/UserCharts";
import UserFilters from "@/Components/Dashboard/Admin/Users/UserFilters";
import UserTable from "@/Components/Dashboard/Admin/Users/UserTable";

type UserData = {
    id: number;
    identifier: string;
    name: string;
    email: string;
    role: string;
    whatsapp_number: string | null;
    is_active: boolean;
    account_status: string;
    program_choice: string | null;
    created_at: string;
};

type Props = {
    users: {
        data: UserData[];
        links: any[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
    };
    filters: Record<string, string>;
    programChoices: string[];
    stats: {
        total: number;
        active: number;
        suspended: number;
        pending_verification: number;
        role_distribution: { candidate: number; student: number; staff: number; admin: number };
        registration_trend: { month: string; total: number }[];
    };
    flash: { success?: string; error?: string };
};

export default function Users({ users, filters = {}, programChoices, stats, flash }: Props) {
    const [search, setSearch] = useState(filters.search || "");
    const [roleFilter, setRoleFilter] = useState(filters.role || "all");
    const [statusFilter, setStatusFilter] = useState(filters.status || "all");
    const [programFilter, setProgramFilter] = useState(filters.program_choice || "all");
    const [sort, setSort] = useState(typeof filters.sort === 'string' ? filters.sort : "terbaru");
    const [processingId, setProcessingId] = useState<number | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            router.get(
                route("admin.users.index"),
                { search, role: roleFilter, status: statusFilter, program_choice: programFilter, sort },
                { preserveState: true, preserveScroll: true, replace: true }
            );
        }, 300);

        return () => clearTimeout(timer);
    }, [search, roleFilter, statusFilter, programFilter, sort]);

    const handleToggleStatus = (user: UserData) => {
        if (!confirm(`Apakah Anda yakin ingin ${user.is_active ? 'MENANGGUHKAN (suspend)' : 'MENGAKTIFKAN'} akun ${user.name}?`)) {
            return;
        }

        setProcessingId(user.id);
        router.post(route("admin.users.toggle-status", user.id), {}, {
            preserveScroll: true,
            onFinish: () => setProcessingId(null)
        });
    };

    const statusChartData = [
        { name: 'Kandidat', value: stats.role_distribution.candidate, color: '#f59e0b' },
        { name: 'Mahasiswa', value: stats.role_distribution.student, color: '#3b82f6' },
        { name: 'Staf', value: stats.role_distribution.staff, color: '#6366f1' },
        { name: 'Admin', value: stats.role_distribution.admin, color: '#8b5cf6' },
    ];

    return (
        <>
            <Head title="Manajemen Pengguna" />

            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 font-sans">
                {/* Header Section */}
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-500/30">
                                <i className="fa-solid fa-users text-xl" />
                            </div>
                            <div>
                                <h1 className="font-display text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                                    Manajemen Pengguna
                                </h1>
                                <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                                    Kelola semua akun, hak akses, dan pantau aktivitas pengguna portal.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                        <button className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-700/50">
                            <i className="fa-solid fa-cloud-arrow-down" />
                            <span>Export Data</span>
                        </button>
                        <button className="inline-flex items-center justify-center gap-2 rounded-xl border border-transparent bg-amber-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-amber-500/30 transition-all hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50">
                            <i className="fa-solid fa-user-plus" />
                            <span>Tambah Pengguna</span>
                        </button>
                    </div>
                </div>

                {flash?.success && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400 shadow-sm flex items-center gap-3">
                        <i className="fa-solid fa-circle-check text-emerald-500"></i>
                        <span className="text-sm font-bold">{flash.success}</span>
                    </div>
                )}
                
                {flash?.error && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400 shadow-sm flex items-center gap-3">
                        <i className="fa-solid fa-circle-exclamation text-rose-500"></i>
                        <span className="text-sm font-bold">{flash.error}</span>
                    </div>
                )}

                <UserStatCards stats={stats} />
                
                <UserCharts statusChartData={statusChartData} trendData={stats.registration_trend} />

                {/* Main Table Card */}
                <div className="rounded-2xl border border-slate-200 bg-white shadow-soft dark:border-white/10 dark:bg-slate-900 overflow-hidden flex flex-col">
                    <div className="border-b border-slate-100 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                        <UserFilters 
                            search={search} setSearch={setSearch}
                            roleFilter={roleFilter} setRoleFilter={setRoleFilter}
                            statusFilter={statusFilter} setStatusFilter={setStatusFilter}
                            programFilter={programFilter} setProgramFilter={setProgramFilter}
                            sort={sort} setSort={setSort}
                            programChoices={programChoices}
                        />
                    </div>

                    <UserTable 
                        users={users.data} 
                        processingId={processingId} 
                        handleToggleStatus={handleToggleStatus} 
                    />

                    {users.data.length > 0 && (
                        <div className="border-t border-slate-100 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-900/50 flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                Menampilkan <span className="font-bold text-slate-900 dark:text-white">{users.from}</span> - <span className="font-bold text-slate-900 dark:text-white">{users.to}</span> dari <span className="font-bold text-slate-900 dark:text-white">{users.total}</span> pengguna
                            </span>
                            <Pagination links={users.links} />
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

Users.layout = (page: ReactNode) => <DashboardLayout>{page}</DashboardLayout>;
