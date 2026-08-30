import { Head } from "@inertiajs/react";
import DashboardLayout from "@/Layouts/DashboardLayout";

type Props = {
    summary: {
        candidates: {
            total: number;
            draft: number;
            verified: number;
            accepted: number;
            rejected: number;
        };
        payments: {
            total_revenue: number;
            breakdown: any[];
        };
    };
    charts: {
        trend: { date: string; total: number }[];
    };
};

export default function Reports({ summary, charts }: Props) {
    return (
        <>
            <Head title="Rekap & Laporan - Admin" />

            <div className="flex flex-col gap-8 pb-12">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25">
                            <i className="fa-solid fa-chart-pie text-lg text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-display font-bold leading-tight text-slate-800 dark:text-white">
                                Rekapitulasi & Laporan
                            </h1>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                Ringkasan statistik pendaftaran dan laporan keuangan secara keseluruhan.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Candidate Stats */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-3xl border border-slate-200/60 bg-white p-5 shadow-sm dark:border-slate-700/60 dark:bg-slate-800/50">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Pendaftar</p>
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700">
                                <i className="fa-solid fa-users text-xs text-slate-600 dark:text-slate-300"></i>
                            </div>
                        </div>
                        <p className="mt-2 text-2xl font-bold text-slate-800 dark:text-white">{summary.candidates.total}</p>
                    </div>
                    <div className="rounded-3xl border border-blue-200/60 bg-blue-50/50 p-5 shadow-sm dark:border-blue-700/30 dark:bg-blue-900/10">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Terverifikasi</p>
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50">
                                <i className="fa-solid fa-user-check text-xs text-blue-600 dark:text-blue-400"></i>
                            </div>
                        </div>
                        <p className="mt-2 text-2xl font-bold text-blue-700 dark:text-blue-300">{summary.candidates.verified}</p>
                    </div>
                    <div className="rounded-3xl border border-emerald-200/60 bg-emerald-50/50 p-5 shadow-sm dark:border-emerald-700/30 dark:bg-emerald-900/10">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Diterima</p>
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50">
                                <i className="fa-solid fa-graduation-cap text-xs text-emerald-600 dark:text-emerald-400"></i>
                            </div>
                        </div>
                        <p className="mt-2 text-2xl font-bold text-emerald-700 dark:text-emerald-300">{summary.candidates.accepted}</p>
                    </div>
                    <div className="rounded-3xl border border-rose-200/60 bg-rose-50/50 p-5 shadow-sm dark:border-rose-700/30 dark:bg-rose-900/10">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-rose-600 dark:text-rose-400">Ditolak</p>
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/50">
                                <i className="fa-solid fa-user-xmark text-xs text-rose-600 dark:text-rose-400"></i>
                            </div>
                        </div>
                        <p className="mt-2 text-2xl font-bold text-rose-700 dark:text-rose-300">{summary.candidates.rejected}</p>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Revenue Card */}
                    <div className="flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm dark:border-slate-700/60 dark:bg-slate-800/50">
                        <div>
                            <h2 className="font-display text-lg font-bold text-slate-800 dark:text-white">
                                Estimasi Pendapatan
                            </h2>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                Total pendapatan dari pembayaran sukses (settlement).
                            </p>
                            <p className="mt-6 text-4xl font-bold text-indigo-600 dark:text-indigo-400">
                                Rp {new Intl.NumberFormat('id-ID').format(summary.payments.total_revenue)}
                            </p>
                        </div>
                        <div className="mt-8">
                            <h3 className="mb-3 text-sm font-medium text-slate-700 dark:text-slate-300">Rincian Pembayaran</h3>
                            <div className="space-y-3">
                                {summary.payments.breakdown.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-700/50">
                                        <span className="text-sm uppercase text-slate-600 dark:text-slate-400">{item.status}</span>
                                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                            Rp {new Intl.NumberFormat('id-ID').format(item.total_amount)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Trend Chart (Visual Simulation) */}
                    <div className="flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm dark:border-slate-700/60 dark:bg-slate-800/50">
                        <div>
                            <h2 className="font-display text-lg font-bold text-slate-800 dark:text-white">
                                Tren Pendaftar Harian (30 Hari)
                            </h2>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                Grafik jumlah pendaftar baru per hari.
                            </p>
                        </div>
                        
                        <div className="mt-6 flex h-64 items-end gap-1 overflow-x-auto pb-2">
                            {charts.trend.length === 0 ? (
                                <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">
                                    Belum ada data pendaftar dalam 30 hari terakhir.
                                </div>
                            ) : (
                                charts.trend.map((t, idx) => {
                                    const maxVal = Math.max(...charts.trend.map(x => x.total));
                                    const height = maxVal === 0 ? 0 : (t.total / maxVal) * 100;
                                    return (
                                        <div key={idx} className="group relative flex flex-1 flex-col items-center justify-end">
                                            <div 
                                                className="w-full rounded-t-md bg-indigo-500 transition-all group-hover:bg-indigo-400 dark:bg-indigo-600" 
                                                style={{ height: `${height}%`, minHeight: '4px' }}
                                            ></div>
                                            <div className="absolute bottom-full mb-2 hidden w-auto whitespace-nowrap rounded bg-slate-800 px-2 py-1 text-xs text-white group-hover:block dark:bg-slate-700">
                                                {t.date}: {t.total}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

Reports.layout = (page: any) => <DashboardLayout>{page}</DashboardLayout>;
