import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";

type Props = {
    statusChartData: { name: string; value: number; color: string }[];
    trendData: { month: string; total: number }[];
};

export default function UserCharts({ statusChartData, trendData }: Props) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
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
                                <Pie data={statusChartData} cx="50%" cy="50%" innerRadius={30} outerRadius={48} paddingAngle={4} dataKey="value" stroke="none">
                                    {statusChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '0.5rem', color: '#fff', fontSize: '12px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

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
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '0.5rem', color: '#fff', fontSize: '12px' }} />
                            <Area type="monotone" dataKey="total" stroke="#f59e0b" strokeWidth={2.5} fillOpacity={1} fill="url(#colorTrend)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
