import { Head, router, Link } from "@inertiajs/react";
import { useState, useEffect } from "react";
import DashboardLayout from "@/Layouts/DashboardLayout";

type UserData = {
    id: number;
    identifier: string;
    name: string;
    email: string;
    role: "admin" | "staff" | "candidate";
    whatsapp_number: string | null;
    is_active: boolean;
    account_status: "aktif" | "nonaktif" | "menunggu_verifikasi";
    program_choice: string | null;
    created_at: string;
    avatar_url: string | null;
    initials: string;
};

type Props = {
    users: {
        data: UserData[];
        links: any[];
        total: number;
    };
    filters: {
        search?: string;
        role?: string;
        status?: string;
        program_choice?: string;
        sort?: string;
    };
    programChoices: string[];
    stats: {
        total: number;
        active: number;
        suspended: number;
        pending_verification: number;
    };
    flash?: { success?: string; error?: string };
};

export default function Users({ users, filters, programChoices, stats, flash }: Props) {
    const [search, setSearch] = useState(filters.search || "");
    const [roleFilter, setRoleFilter] = useState(filters.role || "all");
    const [statusFilter, setStatusFilter] = useState(filters.status || "all");
    const [programFilter, setProgramFilter] = useState(filters.program_choice || "all");
    const [sort, setSort] = useState(filters.sort || "terbaru");
    
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
        if (!confirm(`Apakah Anda yakin ingin ${user.is_active ? 'menangguhkan' : 'mengaktifkan'} akun ${user.name}?`)) return;
        setProcessingId(user.id);
        router.post(route("admin.users.toggle-status", user.id), {}, {
            preserveScroll: true,
            onFinish: () => setProcessingId(null)
        });
    };

    return (
        <>
            <Head title="Manajemen Pengguna" />

            <div className="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">
                {/* Header & Stats */}
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Manajemen Pengguna</h1>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Kelola semua akun, hak akses, dan status pendaftar, staf, maupun administrator.
                        </p>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Summary Cards */}
                        <div className="flex gap-4 p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm">
                            <div className="text-center px-4 border-r border-slate-200 dark:border-slate-700">
                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Akun</p>
                                <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{stats.total}</p>
                            </div>
                            <div className="text-center px-4 border-r border-slate-200 dark:border-slate-700">
                                <p className="text-xs font-medium text-emerald-500">Aktif</p>
                                <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{stats.active}</p>
                            </div>
                            <div className="text-center px-4 border-r border-slate-200 dark:border-slate-700">
                                <p className="text-xs font-medium text-amber-500">Menunggu</p>
                                <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{stats.pending_verification}</p>
                            </div>
                            <div className="text-center px-4">
                                <p className="text-xs font-medium text-rose-500">Suspend</p>
                                <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{stats.suspended}</p>
                            </div>
                        </div>

                        {/* Action Tambah */}
                        <button
                            onClick={() => alert('Fitur Tambah Pengguna dalam pengembangan (Tahap 3)')}
                            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 transition-all"
                        >
                            <i className="fa-solid fa-plus" />
                            <span>Tambah Pengguna</span>
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm lg:flex-row lg:items-center">
                    <div className="relative flex-1">
                        <i className="fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari nama, email, ID, atau NIK..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full rounded-xl border-slate-200 bg-slate-50 py-2.5 pl-11 pr-4 text-sm text-slate-800 focus:border-indigo-500 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-200"
                        />
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="rounded-xl border-slate-200 bg-slate-50 py-2.5 pl-4 pr-10 text-sm text-slate-800 focus:border-indigo-500 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-200"
                        >
                            <option value="all">Semua Role</option>
                            <option value="candidate">Candidate</option>
                            <option value="staff">Staff</option>
                            <option value="admin">Admin</option>
                        </select>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="rounded-xl border-slate-200 bg-slate-50 py-2.5 pl-4 pr-10 text-sm text-slate-800 focus:border-indigo-500 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-200"
                        >
                            <option value="all">Semua Status</option>
                            <option value="aktif">Aktif</option>
                            <option value="nonaktif">Nonaktif (Suspend)</option>
                            <option value="menunggu_verifikasi">Menunggu Verifikasi</option>
                        </select>
                        {roleFilter === "candidate" && (
                            <select
                                value={programFilter}
                                onChange={(e) => setProgramFilter(e.target.value)}
                                className="rounded-xl border-slate-200 bg-slate-50 py-2.5 pl-4 pr-10 text-sm text-slate-800 focus:border-indigo-500 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-200"
                            >
                                <option value="all">Semua Program Studi</option>
                                {programChoices.map(prog => (
                                    <option key={prog} value={prog}>{prog}</option>
                                ))}
                            </select>
                        )}
                        <select
                            value={sort}
                            onChange={(e) => setSort(e.target.value)}
                            className="rounded-xl border-slate-200 bg-slate-50 py-2.5 pl-4 pr-10 text-sm text-slate-800 focus:border-indigo-500 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-200"
                        >
                            <option value="terbaru">Pendaftar Terbaru</option>
                            <option value="terlama">Pendaftar Terlama</option>
                            <option value="abjad">Abjad (A-Z)</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm dark:border-slate-700/60 dark:bg-slate-800">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="border-b border-slate-200/60 bg-slate-50/50 dark:border-slate-700/60 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400">
                                <tr>
                                    <th className="px-6 py-4 font-medium">Pengguna</th>
                                    <th className="px-6 py-4 font-medium">Role / Prodi</th>
                                    <th className="px-6 py-4 font-medium">Status</th>
                                    <th className="px-6 py-4 font-medium text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200/60 dark:divide-slate-700/60">
                                {users.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                                            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 mb-3">
                                                <i className="fa-solid fa-users-slash text-xl" />
                                            </div>
                                            <p>Tidak ada pengguna yang ditemukan.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    users.data.map((user) => (
                                        <tr key={user.id} className="transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/50 group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    {user.avatar_url ? (
                                                        <img src={user.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover ring-2 ring-white dark:ring-slate-900 shadow-sm" />
                                                    ) : (
                                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-bold text-white shadow-sm ring-2 ring-white dark:ring-slate-900">
                                                            {user.initials}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="font-semibold text-slate-800 dark:text-slate-200">
                                                            {user.name}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                                            <span className="font-medium text-indigo-500 dark:text-indigo-400">{user.identifier}</span>
                                                            <span>&bull;</span>
                                                            <span>{user.email}</span>
                                                            {user.whatsapp_number && (
                                                                <>
                                                                    <span>&bull;</span>
                                                                    <span><i className="fa-brands fa-whatsapp text-emerald-500 mr-1" />{user.whatsapp_number}</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1 items-start">
                                                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border ${
                                                        user.role === 'admin' ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300' :
                                                        user.role === 'staff' ? 'border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-300' :
                                                        'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300'
                                                    }`}>
                                                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                                    </span>
                                                    {user.program_choice && (
                                                        <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">
                                                            {user.program_choice}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border ${
                                                    user.account_status === 'aktif' 
                                                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300'
                                                    : user.account_status === 'menunggu_verifikasi'
                                                        ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300'
                                                        : 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300'
                                                }`}>
                                                    <i className={`fa-solid ${
                                                        user.account_status === 'aktif' ? 'fa-check-circle' 
                                                        : user.account_status === 'menunggu_verifikasi' ? 'fa-clock' 
                                                        : 'fa-ban'
                                                    }`} />
                                                    {user.account_status === 'aktif' ? 'Aktif' 
                                                     : user.account_status === 'menunggu_verifikasi' ? 'Menunggu Verifikasi' 
                                                     : 'Nonaktif / Suspend'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button 
                                                        onClick={() => alert('Fitur Detail dalam pengembangan')}
                                                        className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
                                                        title="Detail Pengguna"
                                                    >
                                                        <i className="fa-solid fa-eye" />
                                                    </button>
                                                    <button 
                                                        onClick={() => alert('Fitur Edit dalam pengembangan')}
                                                        className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors"
                                                        title="Edit Pengguna"
                                                    >
                                                        <i className="fa-solid fa-pen-to-square" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleToggleStatus(user)}
                                                        disabled={processingId === user.id}
                                                        className={`h-8 w-8 inline-flex items-center justify-center rounded-lg transition-colors ${
                                                            user.is_active
                                                                ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10'
                                                                : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10'
                                                        } ${processingId === user.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                        title={user.is_active ? "Tangguhkan (Suspend)" : "Aktifkan"}
                                                    >
                                                        {processingId === user.id ? (
                                                            <i className="fa-solid fa-spinner fa-spin" />
                                                        ) : (
                                                            <i className={`fa-solid ${user.is_active ? 'fa-user-slash' : 'fa-user-check'}`} />
                                                        )}
                                                    </button>
                                                    <button 
                                                        onClick={() => alert('Fitur Hapus dalam pengembangan')}
                                                        className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                                                        title="Hapus Pengguna"
                                                    >
                                                        <i className="fa-solid fa-trash-can" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {users.links.length > 3 && (
                        <div className="flex items-center justify-between border-t border-slate-200/60 bg-slate-50/50 px-6 py-4 dark:border-slate-700/60 dark:bg-slate-800/80">
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Menampilkan <span className="font-medium text-slate-800 dark:text-slate-200">{users.data.length}</span> dari <span className="font-medium text-slate-800 dark:text-slate-200">{users.total}</span> hasil
                            </p>
                            <div className="flex items-center gap-1">
                                {users.links.map((link, idx) => (
                                    link.url === null ? (
                                        <div
                                            key={idx}
                                            className="px-3 py-1 text-sm text-slate-400 dark:text-slate-600"
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ) : (
                                        <button
                                            key={idx}
                                            onClick={() => router.get(link.url!)}
                                            className={`rounded-lg px-3 py-1 text-sm font-medium transition-colors ${
                                                link.active
                                                    ? 'bg-indigo-500 text-white shadow-sm'
                                                    : 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700'
                                            }`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    )
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

Users.layout = (page: any) => <DashboardLayout>{page}</DashboardLayout>;
