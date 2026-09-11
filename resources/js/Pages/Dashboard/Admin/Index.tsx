// resources/js/Pages/Dashboard/Admin/Index.tsx

import { useEffect } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { animate, stagger } from "animejs";
import DashboardLayout from "@/Layouts/DashboardLayout";
import echo from "@/echo";
import { PageProps } from "@/types";
import PipelineDistributionChart from "@/Components/Dashboard/Admin/Index/PipelineDistributionChart";
import RegistrationTrendChart from "@/Components/Dashboard/Admin/Index/RegistrationTrendChart";
import PaymentBreakdownChart from "@/Components/Dashboard/Admin/Index/PaymentBreakdownChart";
import AdminStatCards from "@/Components/Dashboard/Admin/Index/AdminStatCards";

type StatusStats = {
    draft: number;
    submitted: number;
    verified: number;
    accepted: number;
    rejected: number;
};

type Stats = {
    total_users: number;
    total_candidates: number;
    total_staff: number;
    quota_target: number;
    quota_filled: number;
    pending_verify: number;
    paid_count: number;
    total_revenue: number;
    by_status: StatusStats;
};

type ActiveWave = {
    id: number;
    title: string;
    academic_year: string;
    end_date: string;
    quota_target: number;
} | null;

type RecentCandidate = {
    id: number;
    full_name: string;
    candidate_code: string | null;
    nisn: string;
    status: "draft" | "submitted" | "verified" | "accepted" | "rejected";
    wave: string;
    created_at: string;
};

type StaffMember = {
    id: number;
    name: string;
    email: string;
    is_active: boolean;
    created_at: string;
};

type Props = {
    stats: Stats;
    registration_trend: Array<{ date: string; count: number }>;
    payment_stats: {
        gateway: number;
        transfer: number;
        cash: number;
    };
    active_wave: ActiveWave;
    recent_candidates: RecentCandidate[];
    staff_list: StaffMember[];
};

const statusConfig: Record<RecentCandidate["status"], { label: string; bg: string; text: string }> = {
    draft: { label: "Draft", bg: "bg-slate-100 dark:bg-white/5", text: "text-slate-500 dark:text-slate-400" },
    submitted: { label: "Submitted", bg: "bg-amber-50 dark:bg-amber-500/10", text: "text-amber-600 dark:text-amber-400" },
    verified: { label: "Verified", bg: "bg-blue-50 dark:bg-blue-500/10", text: "text-blue-600 dark:text-blue-400" },
    accepted: { label: "Accepted", bg: "bg-emerald-50 dark:bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400" },
    rejected: { label: "Rejected", bg: "bg-red-50 dark:bg-red-500/10", text: "text-red-500 dark:text-red-400" },
};

export default function AdminIndex({
    stats,
    registration_trend,
    payment_stats,
    active_wave,
    recent_candidates,
    staff_list,
}: Props) {
    const { auth } = usePage<PageProps>().props;

    useEffect(() => {
        animate(".admin-stat-card", {
            opacity: [0, 1],
            translateY: [18, 0],
            duration: 500,
            delay: stagger(60),
            ease: "outExpo",
        });

        animate(".admin-section", {
            opacity: [0, 1],
            translateY: [20, 0],
            duration: 520,
            delay: stagger(80, { start: 200 }),
            ease: "outExpo",
        });

        // Real-time WebSocket listener
        const channel = echo.channel("dashboard.metrics");
        channel.listen(".DashboardMetricsUpdated", () => {
            router.reload({
                only: ['stats', 'registration_trend', 'payment_stats', 'recent_candidates', 'staff_list'],
            });
        });

        return () => {
            echo.leaveChannel("dashboard.metrics");
        };
    }, []);

    const quotaPct = active_wave && (stats.quota_target || active_wave.quota_target) > 0
        ? Math.min(100, Math.round((stats.quota_filled / (stats.quota_target || active_wave.quota_target)) * 100))
        : 0;

    return (
        <>
            <Head title="Dashboard Admin" />

            <div className="flex flex-col gap-6 pb-8">

                {/* Top Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                            <i className="fa-solid fa-user-tie text-violet-500 text-sm"></i>
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-display font-bold text-slate-800 dark:text-white leading-tight">
                                    Dashboard Admin
                                </h1>
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                    Live Stream
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                Monitoring sistem pendaftaran & arus data, {auth.user.name}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            href="/dashboard/admin/candidates"
                            className="h-9 px-3.5 rounded-xl text-xs font-semibold bg-violet-500 text-white hover:bg-violet-400 transition inline-flex items-center gap-1.5 shadow-sm"
                        >
                            <i className="fa-solid fa-users-viewfinder text-xs"></i>
                            Kandidat
                        </Link>
                        <Link
                            href="/dashboard/admin/staff-list"
                            className="h-9 px-3.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:border-violet-500 hover:text-violet-500 transition inline-flex items-center gap-1.5"
                        >
                            <i className="fa-solid fa-user-gear text-xs"></i>
                            Staff
                        </Link>
                    </div>
                </div>

                {/* 5 Top Stat Cards with Micro-Interactions & Trends */}
                <AdminStatCards stats={stats} registrationTrend={registration_trend} />

                {/* Charts Row 1: Pipeline Distribution + Daily Inflow */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="admin-section opacity-0">
                        <PipelineDistributionChart byStatus={stats.by_status} />
                    </div>
                    <div className="admin-section opacity-0">
                        <RegistrationTrendChart data={registration_trend} />
                    </div>
                </div>

                {/* Charts Row 2: Payment Breakdown + Live Recent Candidates */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="admin-section opacity-0">
                        <PaymentBreakdownChart
                            paymentStats={payment_stats}
                            paidCount={stats.paid_count}
                            totalRevenue={stats.total_revenue}
                        />
                    </div>

                    {/* Active Wave & Live Candidate Feed */}
                    <div className="admin-section opacity-0 flex flex-col gap-4">
                        {/* Wave Card */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl shadow-soft p-5">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                                        <i className="fa-solid fa-calendar-check text-cyan-500 text-xs"></i>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-800 dark:text-white">
                                            {active_wave ? active_wave.title : "Tidak Ada Gelombang Aktif"}
                                        </p>
                                        <p className="text-[10px] text-slate-400">
                                            {active_wave ? `TA ${active_wave.academic_year} · Tutup ${active_wave.end_date}` : "Aktifkan gelombang dari menu gelombang"}
                                        </p>
                                    </div>
                                </div>
                                <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400">
                                    {quotaPct}%
                                </span>
                            </div>

                            <div className="h-2 rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
                                    style={{ width: `${quotaPct}%` }}
                                />
                            </div>
                            <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1.5">
                                <span>{stats.quota_filled} Diterima</span>
                                <span>Target: {stats.quota_target || active_wave?.quota_target || 0} Kuota</span>
                            </div>
                        </div>

                        {/* Recent Candidates List */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl shadow-soft flex-1 overflow-hidden flex flex-col">
                            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-white/5">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
                                    <p className="text-xs font-bold text-slate-800 dark:text-white">Aktivitas Pendaftar Terbaru</p>
                                </div>
                                <Link
                                    href="/dashboard/admin/candidates"
                                    className="text-[11px] font-semibold text-violet-500 hover:text-violet-400 transition"
                                >
                                    Semua ({stats.total_candidates})
                                </Link>
                            </div>

                            {recent_candidates.length === 0 ? (
                                <div className="p-6 text-center text-xs text-slate-400">
                                    Belum ada kandidat masuk
                                </div>
                            ) : (
                                <ul className="divide-y divide-slate-100 dark:divide-white/5 flex-1">
                                    {recent_candidates.map((cand) => {
                                        const cfg = statusConfig[cand.status];
                                        return (
                                            <li key={cand.id}>
                                                <Link
                                                    href={`/dashboard/admin/candidates/${cand.id}`}
                                                    className="flex items-center justify-between px-5 py-2.5 hover:bg-slate-50 dark:hover:bg-white/5 transition"
                                                >
                                                    <div className="min-w-0 pr-2">
                                                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                                                            {cand.full_name}
                                                        </p>
                                                        <p className="text-[10px] text-slate-400 truncate">
                                                            {cand.candidate_code ?? `NISN ${cand.nisn}`} · {cand.wave} · {cand.created_at}
                                                        </p>
                                                    </div>
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold shrink-0 ${cfg.bg} ${cfg.text}`}>
                                                        {cfg.label}
                                                    </span>
                                                </Link>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>

                {/* Section 3: Staff Management */}
                <section className="admin-section opacity-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl shadow-soft overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/5">
                        <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                                <i className="fa-solid fa-users-gear text-violet-500 text-xs"></i>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-slate-800 dark:text-white">Staff Management</p>
                                <p className="text-[11px] text-slate-400">Monitoring status akun staff dan verifikator</p>
                            </div>
                        </div>
                        <Link
                            href="/dashboard/admin/staff-list"
                            className="text-xs font-semibold text-violet-500 hover:text-violet-400 transition inline-flex items-center gap-1"
                        >
                            Kelola Staff
                            <i className="fa-solid fa-arrow-right text-[10px]"></i>
                        </Link>
                    </div>

                    {staff_list.length === 0 ? (
                        <div className="py-8 text-center px-6">
                            <p className="text-sm text-slate-500">Belum ada akun staff terdaftar.</p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-slate-100 dark:divide-white/5">
                            {staff_list.slice(0, 4).map((staff) => (
                                <li
                                    key={staff.id}
                                    className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 dark:hover:bg-white/5 transition"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                                            <span className="text-xs font-bold text-violet-600 dark:text-violet-400">
                                                {staff.name.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                                                {staff.name}
                                            </p>
                                            <p className="text-[10px] text-slate-400">
                                                {staff.email}
                                            </p>
                                        </div>
                                    </div>
                                    <span
                                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                                            staff.is_active
                                                ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                                : "bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400"
                                        }`}
                                    >
                                        {staff.is_active ? "Aktif" : "Suspend"}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

            </div>
        </>
    );
}

AdminIndex.layout = (page: React.ReactNode) => <DashboardLayout>{page}</DashboardLayout>;
