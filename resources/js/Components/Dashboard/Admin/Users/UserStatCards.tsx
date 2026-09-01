import React from 'react';

type Stats = {
    total: number;
    active: number;
    suspended: number;
    pending_verification: number;
};

export default function UserStatCards({ stats }: { stats: Stats }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
    );
}
