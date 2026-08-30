import { Head, usePage, router } from "@inertiajs/react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import type { PageProps } from "@/types";
import { useState, useEffect } from "react";

type UserRow = {
    id: number;
    name: string;
    email: string;
    role: "admin" | "staff" | "candidate";
    whatsapp_number: string | null;
    is_active: boolean;
    created_at: string;
    avatar_url: string;
    initials: string;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type Paginated<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: PaginationLink[];
};

type Stats = {
    total: number;
    active: number;
    suspended: number;
    admin: number;
    staff: number;
    candidate: number;
};

type Props = {
    users: Paginated<UserRow>;
    filters: {
        search?: string;
        role?: string;
        status?: string;
    };
    stats: Stats;
};

export default function Users({ users, filters, stats }: Props) {
    const { flash } = usePage<PageProps>().props;
    const [search, setSearch] = useState(filters.search || "");
    const [role, setRole] = useState(filters.role || "");
    const [status, setStatus] = useState(filters.status || "");
    const [processingId, setProcessingId] = useState<number | null>(null);

    // Filter effect with debounce for search
    useEffect(() => {
        const timeout = setTimeout(() => {
            const rawQuery = { search, role, status };
            const query = Object.fromEntries(
                Object.entries(rawQuery).filter(([_, v]) => v !== "" && v !== undefined && v !== null)
            );
            if (
                search !== (filters.search || "") ||
                role !== (filters.role || "") ||
                status !== (filters.status || "")
            ) {
                router.get("/dashboard/admin/users", query, {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                });
            }
        }, 300);

        return () => clearTimeout(timeout);
    }, [search, role, status]);

    const handleToggleStatus = (user: UserRow) => {
        if (!confirm(`Apakah Anda yakin ingin ${user.is_active ? 'menangguhkan (suspend)' : 'mengaktifkan'} pengguna ${user.name}?`)) {
            return;
        }

        setProcessingId(user.id);
        router.post(`/dashboard/admin/users/${user.id}/toggle-status`, {}, {
            preserveScroll: true,
            onFinish: () => setProcessingId(null)
        });
    };

    return (
        <>
            <Head title="Manajemen Pengguna - Admin" />

            <div className="flex flex-col gap-8 pb-12">
                {/* Header Section */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25">
                            <i className="fa-solid fa-users-gear text-lg text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-display font-bold leading-tight text-slate-800 dark:text-white">
                                Manajemen Pengguna
                            </h1>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                Kelola seluruh akun yang terdaftar pada sistem Sentinel Admission.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Notifications */}
                {flash.success && (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200 flex items-center gap-2">
                        <i className="fa-solid fa-circle-check" /> {flash.success}
                    </div>
                )}
                {flash.error && (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200 flex items-center gap-2">
                        <i className="fa-solid fa-circle-exclamation" /> {flash.error}
                    </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-3xl border border-slate-200/60 bg-white p-5 shadow-sm dark:border-slate-700/60 dark:bg-slate-800/50">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Akun</p>
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700">
                                <i className="fa-solid fa-users text-xs text-slate-600 dark:text-slate-300"></i>
                            </div>
                        </div>
                        <p className="mt-2 text-2xl font-bold text-slate-800 dark:text-white">{stats.total}</p>
                        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {stats.admin} Admin &bull; {stats.staff} Staff
                        </div>
                    </div>

                    <div className="rounded-3xl border border-emerald-200/60 bg-emerald-50/50 p-5 shadow-sm dark:border-emerald-700/30 dark:bg-emerald-900/10">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Akun Aktif</p>
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50">
                                <i className="fa-solid fa-user-check text-xs text-emerald-600 dark:text-emerald-400"></i>
                            </div>
                        </div>
                        <p className="mt-2 text-2xl font-bold text-emerald-700 dark:text-emerald-300">{stats.active}</p>
                    </div>

                    <div className="rounded-3xl border border-rose-200/60 bg-rose-50/50 p-5 shadow-sm dark:border-rose-700/30 dark:bg-rose-900/10">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-rose-600 dark:text-rose-400">Ditangguhkan</p>
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/50">
                                <i className="fa-solid fa-user-slash text-xs text-rose-600 dark:text-rose-400"></i>
                            </div>
                        </div>
                        <p className="mt-2 text-2xl font-bold text-rose-700 dark:text-rose-300">{stats.suspended}</p>
                    </div>

                    <div className="rounded-3xl border border-blue-200/60 bg-blue-50/50 p-5 shadow-sm dark:border-blue-700/30 dark:bg-blue-900/10">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Kandidat</p>
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50">
                                <i className="fa-solid fa-graduation-cap text-xs text-blue-600 dark:text-blue-400"></i>
                            </div>
                        </div>
                        <p className="mt-2 text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.candidate}</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="relative flex-1">
                        <i className="fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari nama, email, atau no WhatsApp..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full rounded-2xl border-slate-200 bg-white py-2.5 pl-11 pr-4 text-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="rounded-2xl border-slate-200 bg-white py-2.5 pl-4 pr-10 text-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        >
                            <option value="">Semua Peran</option>
                            <option value="admin">Admin</option>
                            <option value="staff">Staff</option>
                            <option value="candidate">Kandidat</option>
                        </select>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="rounded-2xl border-slate-200 bg-white py-2.5 pl-4 pr-10 text-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        >
                            <option value="">Semua Status</option>
                            <option value="active">Aktif</option>
                            <option value="suspended">Ditangguhkan</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-hidden rounded-3xl border border-slate-200/60 bg-white shadow-sm dark:border-slate-700/60 dark:bg-slate-800/50">
                    <div className="overflow-x-auto">
                        <table className="w-full whitespace-nowrap text-left text-sm">
                            <thead className="border-b border-slate-200/60 bg-slate-50/50 text-slate-500 dark:border-slate-700/60 dark:bg-slate-800/80 dark:text-slate-400">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">Pengguna</th>
                                    <th className="px-6 py-4 font-semibold">Peran</th>
                                    <th className="px-6 py-4 font-semibold">Status</th>
                                    <th className="px-6 py-4 font-semibold">Terdaftar</th>
                                    <th className="px-6 py-4 font-semibold text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                {users.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 mb-3">
                                                <i className="fa-solid fa-magnifying-glass text-slate-400"></i>
                                            </div>
                                            <p>Tidak ada pengguna yang ditemukan.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    users.data.map((user) => (
                                        <tr key={user.id} className="transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    {user.avatar_url ? (
                                                        <img src={user.avatar_url} alt={user.name} className="h-10 w-10 rounded-full object-cover" />
                                                    ) : (
                                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 font-bold">
                                                            {user.initials}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="font-semibold text-slate-800 dark:text-slate-200">{user.name}</p>
                                                        <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
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
                                                <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border ${
                                                    user.role === 'admin' ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300' :
                                                    user.role === 'staff' ? 'border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-300' :
                                                    'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300'
                                                }`}>
                                                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border ${
                                                    user.is_active 
                                                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300'
                                                        : 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300'
                                                }`}>
                                                    <i className={`fa-solid ${user.is_active ? 'fa-check-circle' : 'fa-ban'}`} />
                                                    {user.is_active ? 'Aktif' : 'Suspended'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                                                {user.created_at}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleToggleStatus(user)}
                                                    disabled={processingId === user.id}
                                                    className={`inline-flex h-9 items-center justify-center rounded-xl px-4 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-slate-900 ${
                                                        user.is_active
                                                            ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 focus:ring-rose-500 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20'
                                                            : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 focus:ring-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20'
                                                    } ${processingId === user.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    title={user.is_active ? "Tangguhkan (Suspend)" : "Aktifkan"}
                                                >
                                                    {processingId === user.id ? (
                                                        <i className="fa-solid fa-spinner fa-spin" />
                                                    ) : (
                                                        <i className={`fa-solid ${user.is_active ? 'fa-user-slash' : 'fa-user-check'}`} />
                                                    )}
                                                    <span className="ml-2 hidden sm:inline">{user.is_active ? 'Suspend' : 'Aktifkan'}</span>
                                                </button>
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
