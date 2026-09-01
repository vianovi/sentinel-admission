import React from 'react';

type Props = {
    search: string;
    setSearch: (val: string) => void;
    roleFilter: string;
    setRoleFilter: (val: string) => void;
    statusFilter: string;
    setStatusFilter: (val: string) => void;
    programFilter: string;
    setProgramFilter: (val: string) => void;
    sort: string;
    setSort: (val: string) => void;
    programChoices: string[];
};

export default function UserFilters({ 
    search, setSearch, roleFilter, setRoleFilter, statusFilter, 
    setStatusFilter, programFilter, setProgramFilter, sort, setSort, programChoices 
}: Props) {
    return (
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
    );
}
