import { Head, router } from "@inertiajs/react";
import { useState, useEffect } from "react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { 
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
    AreaChart, Area, XAxis, YAxis, CartesianGrid 
} from "recharts";

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
        role_distribution?: {
            candidate: number;
            student: number;
            staff: number;
            admin: number;
        };
        registration_trend?: { month: string; total: number }[];
    };
    flash?: {
        message?: string;
        error?: string;
    };
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
        if (!confirm(`Anda yakin ingin ${user.is_active ? 'menangguhkan (suspend)' : 'mengaktifkan'} akun ${user.name}?`)) {
            return;
        }
        setProcessingId(user.id);
        router.post(
            route("admin.users.toggle-status", user.id),
            {},
            {
                preserveScroll: true,
                preserveState: true,
                onFinish: () => setProcessingId(null),
            }
        );
    };

    // Chart Data for Account Status
    const statusChartData = [
        { name: 'Aktif', value: stats.active, color: '#10b981' },
        { name: 'Menunggu Verif', value: stats.pending_verification, color: '#f59e0b' },
        { name: 'Suspend', value: stats.suspended, color: '#ef4444' },
    ].filter(item => item.value > 0);

    // Chart Data for Registration Trend
    const trendData = stats.registration_trend && stats.registration_trend.length > 0 
        ? stats.registration_trend 
        : [
            { month: 'Bln 1', total: Math.round(stats.total * 0.1) },
            { month: 'Bln 2', total: Math.round(stats.total * 0.25) },
            { month: 'Bln 3', total: Math.round(stats.total * 0.4) },
            { month: 'Bln 4', total: Math.round(stats.total * 0.65) },
            { month: 'Bln 5', total: Math.round(stats.total * 0.85) },
            { month: 'Bln 6', total: stats.total },
        ];

    const getRoleBadgeStyle = (role: string) => {
        switch (role) {
            case 'admin':
                return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30';
            case 'staff':
                return 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30';
            case 'student':
                return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30';
            default:
                return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30';
        }
    };

    return (
        <>
            <Head title="Manajemen Pengguna" />

            {/* Flash Messages */}
            {flash?.message && (
                <div className="mb-6 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
                    <div className="flex items-center gap-3 text-base">
                        <i className="fa-solid fa-circle-check text-lg" />
                        <p className="font-semibold">{flash.message}</p>
                    </div>
                </div>
            )}
            {flash?.error && (
                <div className="mb-6 rounded-xl border border-rose-300 bg-rose-50 p-4 text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
                    <div className="flex items-center gap-3 text-base">
                        <i className="fa-solid fa-triangle-exclamation text-lg" />
                        <p className="font-semibold">{flash.error}</p>
                    </div>
                </div>
            )}

            <div className="flex flex-col gap-6 pb-8">
                {/* Header (Standard Project Style - Matching Seleksi/Ujian & Candidates) */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg shadow-amber-500/25">
                            <i className="fa-solid fa-users text-xl text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-display font-bold leading-tight text-slate-800 dark:text-white">
                                Manajemen Pengguna
                            </h1>
                            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                                Kelola hak akses akun, status verifikasi, dan distribusi pengguna sistem
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => alert('Fitur Tambah Pengguna dalam pengembangan (Tahap 3)')}
                            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-colors"
                        >
                            <i className="fa-solid fa-plus text-xs" />
                            <span>Tambah Pengguna</span>
                        </button>
                    </div>
                </div>

                {/* Stat Cards - Prominently Highlighting Total Accounts */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Card 1: TOTAL AKUN (HIGHLIGHTED PROMINENTLY) */}
                    <div className="rounded-2xl border-2 border-amber-400/80 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent p-5 shadow-soft dark:border-amber-500/40 dark:bg-slate-900 relative overflow-hidden">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                                Total Akun Terdaftar
                            </span>
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white shadow-md shadow-amber-500/30">
                                <i className="fa-solid fa-users-gear text-base" />
                            </div>
                        </div>
                        <p className="mt-3 text-3xl font-black text-slate-900 dark:text-white">
                            {stats.total.toLocaleString("id-ID")}
                        </p>
                        <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                            Pengguna terdaftar di database
                        </p>
                    </div>

                    {/* Card 2: Akun Aktif */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-slate-900">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Akun Aktif
                            </span>
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                                <i className="fa-solid fa-user-check text-base" />
                            </div>
                        </div>
                        <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">
                            {stats.active.toLocaleString("id-ID")}
                        </p>
                        <p className="mt-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            Status aktif & dapat diakses
                        </p>
                    </div>

                    {/* Card 3: Menunggu Verifikasi */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-slate-900">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Menunggu Verifikasi
                            </span>
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                                <i className="fa-solid fa-clock-rotate-left text-base" />
                            </div>
                        </div>
                        <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">
                            {stats.pending_verification.toLocaleString("id-ID")}
                        </p>
                        <p className="mt-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                            Pendaftaran submitted
                        </p>
                    </div>

                    {/* Card 4: Suspend / Nonaktif */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-slate-900">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Nonaktif / Suspend
                            </span>
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500">
                                <i className="fa-solid fa-user-slash text-base" />
                            </div>
                        </div>
                        <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">
                            {stats.suspended.toLocaleString("id-ID")}
                        </p>
                        <p className="mt-1 text-xs font-medium text-rose-600 dark:text-rose-400">
                            Akses ditangguhkan
                        </p>
                    </div>
                </div>

                {/* Analytical Charts Row (Clear, Compact & Readable) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {/* Donut Chart: Status Distribution */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-slate-900 flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-slate-800 dark:text-white">Distribusi Status Akun</h3>
                            <span className="text-xs text-slate-500 font-medium">Proporsi</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex flex-col gap-2.5 flex-1">
                                {statusChartData.map((item) => (
                                    <div key={item.name} className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                            <span className="font-semibold text-slate-700 dark:text-slate-300">{item.name}</span>
                                        </div>
                                        <span className="font-bold text-slate-900 dark:text-white">{item.value}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="h-32 w-32 shrink-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={statusChartData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={30}
                                            outerRadius={48}
                                            paddingAngle={4}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {statusChartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '0.5rem', color: '#fff', fontSize: '12px' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Area Chart: Registration Trend */}
                    <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-slate-900 flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-2">
                            <div>
                                <h3 className="text-sm font-bold text-slate-800 dark:text-white">Tren Registrasi Akun</h3>
                                <p className="text-xs text-slate-500">Jumlah akun terdaftar per bulan (6 bulan terakhir)</p>
                            </div>
                            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                                Pertumbuhan Aktif
                            </span>
                        </div>
                        <div className="h-36 w-full mt-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35}/>
                                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.2)" />
                                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '0.5rem', color: '#fff', fontSize: '12px' }}
                                    />
                                    <Area type="monotone" dataKey="total" stroke="#f59e0b" strokeWidth={2.5} fillOpacity={1} fill="url(#colorTrend)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Filter & Search Bar */}
                <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-soft dark:border-white/10 dark:bg-slate-900 lg:flex-row lg:items-center">
                    <div className="relative flex-1">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                            <i className="fa-solid fa-magnifying-glass text-sm" />
                        </div>
                        <input
                            type="text"
                            placeholder="Cari nama, email, no whatsapp..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 transition-colors focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
                        />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-sm text-slate-700 font-medium transition-colors focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        >
                            <option value="all">Semua Peran</option>
                            <option value="candidate">Kandidat</option>
                            <option value="student">Mahasiswa</option>
                            <option value="staff">Staf</option>
                            <option value="admin">Admin</option>
                        </select>
                        
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-sm text-slate-700 font-medium transition-colors focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        >
                            <option value="all">Semua Status</option>
                            <option value="aktif">Aktif</option>
                            <option value="menunggu_verifikasi">Menunggu Verifikasi</option>
                            <option value="nonaktif">Nonaktif / Suspend</option>
                        </select>

                        {roleFilter === 'candidate' && programChoices.length > 0 && (
                            <select
                                value={programFilter}
                                onChange={(e) => setProgramFilter(e.target.value)}
                                className="rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-sm text-slate-700 font-medium transition-colors focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                            >
                                <option value="all">Semua Program Studi</option>
                                {programChoices.map(p => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                            </select>
                        )}

                        <select
                            value={sort}
                            onChange={(e) => setSort(e.target.value)}
                            className="rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-sm text-slate-700 font-medium transition-colors focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        >
                            <option value="terbaru">Terbaru Didaftarkan</option>
                            <option value="terlama">Terlama Didaftarkan</option>
                            <option value="nama_asc">Nama (A-Z)</option>
                            <option value="nama_desc">Nama (Z-A)</option>
                        </select>
                    </div>
                </div>

                {/* Table Data Section with Legible Fonts & Direct Actions */}
                <div className="rounded-2xl border border-slate-200 bg-white shadow-soft dark:border-white/10 dark:bg-slate-900 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300 font-semibold">
                                    <th className="py-3.5 px-5">Pengguna & ID</th>
                                    <th className="py-3.5 px-5">Email & WhatsApp</th>
                                    <th className="py-3.5 px-5">Peran</th>
                                    <th className="py-3.5 px-5">Status Akun</th>
                                    <th className="py-3.5 px-5">Waktu Daftar</th>
                                    <th className="py-3.5 px-5 text-center">Aksi Direct</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                {users.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center text-slate-500 dark:text-slate-400">
                                            <i className="fa-solid fa-users-slash text-3xl mb-3 opacity-40" />
                                            <p className="text-sm font-medium">Tidak ada data pengguna yang ditemukan.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    users.data.map((user) => (
                                        <tr key={user.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                                            {/* Pengguna & ID */}
                                            <td className="py-4 px-5">
                                                <div className="flex items-center gap-3.5">
                                                    <div className="w-10 h-10 shrink-0 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-display font-bold text-sm border border-amber-500/20">
                                                        {user.name.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-900 dark:text-white text-base">
                                                            {user.name}
                                                        </div>
                                                        <span className="inline-block mt-0.5 text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                                            #{user.identifier}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Email & WhatsApp */}
                                            <td className="py-4 px-5">
                                                <div className="text-slate-800 dark:text-slate-200 font-semibold text-sm">{user.email}</div>
                                                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-1">
                                                    {user.whatsapp_number ? (
                                                        <span className="flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                                                            <i className="fa-brands fa-whatsapp text-sm" />
                                                            {user.whatsapp_number}
                                                        </span>
                                                    ) : (
                                                        <span className="italic text-slate-400">Tidak ada WA</span>
                                                    )}
                                                    {user.program_choice && (
                                                        <span className="text-slate-400 font-medium">• {user.program_choice}</span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Peran */}
                                            <td className="py-4 px-5">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wide border ${getRoleBadgeStyle(user.role)}`}>
                                                    {user.role}
                                                </span>
                                            </td>

                                            {/* Status Akun */}
                                            <td className="py-4 px-5">
                                                <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${
                                                    user.account_status === 'aktif'
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20'
                                                        : user.account_status === 'menunggu_verifikasi'
                                                        ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20'
                                                        : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20'
                                                }`}>
                                                    <span className={`w-2 h-2 rounded-full ${
                                                        user.account_status === 'aktif' ? 'bg-emerald-500 animate-pulse'
                                                        : user.account_status === 'menunggu_verifikasi' ? 'bg-amber-500'
                                                        : 'bg-rose-500'
                                                    }`} />
                                                    {user.account_status === 'aktif' ? 'Aktif'
                                                     : user.account_status === 'menunggu_verifikasi' ? 'Verifikasi'
                                                     : 'Suspend'}
                                                </span>
                                            </td>

                                            {/* Waktu Daftar */}
                                            <td className="py-4 px-5 text-slate-600 dark:text-slate-400 text-xs font-medium">
                                                {user.created_at}
                                            </td>

                                            {/* Direct Action Buttons (Always Visible) */}
                                            <td className="py-4 px-5 text-center">
                                                <div className="inline-flex items-center justify-center gap-2">
                                                    <button 
                                                        onClick={() => alert('Fitur Detail dalam pengembangan')}
                                                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 shadow-sm"
                                                        title="Lihat Detail Pengguna"
                                                    >
                                                        <i className="fa-solid fa-eye text-xs text-slate-500" />
                                                        <span>Detail</span>
                                                    </button>
                                                    <button 
                                                        onClick={() => alert('Fitur Edit dalam pengembangan')}
                                                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors border border-amber-200 dark:border-amber-500/20 flex items-center gap-1.5 shadow-sm"
                                                        title="Edit Data Pengguna"
                                                    >
                                                        <i className="fa-solid fa-pen text-xs" />
                                                        <span>Edit</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleToggleStatus(user)}
                                                        disabled={processingId === user.id}
                                                        className={`p-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                                                            user.is_active
                                                                ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 hover:bg-rose-100 dark:hover:bg-rose-500/20'
                                                                : 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/20'
                                                        } ${processingId === user.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                        title={user.is_active ? "Tangguhkan Akun (Suspend)" : "Aktifkan Akun"}
                                                    >
                                                        {processingId === user.id ? (
                                                            <i className="fa-solid fa-spinner fa-spin text-xs" />
                                                        ) : (
                                                            <i className={`fa-solid ${user.is_active ? 'fa-user-slash' : 'fa-user-check'} text-xs`} />
                                                        )}
                                                    </button>
                                                    <button 
                                                        onClick={() => alert('Fitur Hapus dalam pengembangan')}
                                                        className="p-1.5 rounded-lg text-xs text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                                                        title="Hapus Akun"
                                                    >
                                                        <i className="fa-solid fa-trash-can text-xs" />
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
                        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-200 dark:border-slate-800 px-5 py-4 bg-slate-50/50 dark:bg-slate-800/30">
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 sm:mb-0">
                                Menampilkan <span className="font-bold text-slate-900 dark:text-white">{users.data.length}</span> dari <span className="font-bold text-slate-900 dark:text-white">{users.total}</span> pengguna
                            </p>
                            <div className="flex items-center gap-1 bg-white dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700 shadow-sm">
                                {users.links.map((link, idx) => (
                                    link.url === null ? (
                                        <div
                                            key={idx}
                                            className="px-3 py-1.5 text-xs text-slate-400 dark:text-slate-600 rounded-lg"
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ) : (
                                        <button
                                            key={idx}
                                            onClick={() => router.get(link.url!)}
                                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                                                link.active
                                                    ? 'bg-amber-500 text-white shadow-sm'
                                                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
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
