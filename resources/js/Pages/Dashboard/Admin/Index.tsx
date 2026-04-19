// resources/js/Pages/Dashboard/Admin/Index.tsx

import { useEffect } from "react";
import { Head, Link, usePage } from "@inertiajs/react";
import { animate, stagger } from "animejs";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { PageProps } from "@/types";

type StatusStats = {
    draft: number;
    submitted: number;
    verified: number;
    accepted: number;
    rejected: number;
};

type Stats = {
    total_candidates: number;
    total_staff: number;
    quota_target: number;
    quota_filled: number;
    pending_verify: number;
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
    nisn: string;
    status: "draft" | "submitted" | "verified" | "accepted" | "rejected";
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
    active_wave: ActiveWave;
    recent_candidates: RecentCandidate[];
    staff_list: StaffMember[];
};

const statusConfig: Record<RecentCandidate["status"], { label: string; bg: string; text: string }> = {
    draft: { label: "Draft", bg: "bg-slate-100 dark:bg-white/5", text: "text-slate-500 dark:text-slate-400" },
    submitted: { label: "Menunggu Verifikasi", bg: "bg-amber-50 dark:bg-amber-500/10", text: "text-amber-600 dark:text-amber-400" },
    verified: { label: "Terverifikasi", bg: "bg-blue-50 dark:bg-blue-500/10", text: "text-blue-600 dark:text-blue-400" },
    accepted: { label: "Diterima", bg: "bg-emerald-50 dark:bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400" },
    rejected: { label: "Ditolak", bg: "bg-red-50 dark:bg-red-500/10", text: "text-red-500 dark:text-red-400" },
};

const statCards = (stats: Stats) => [
    {
        label: "Total Kandidat",
        value: stats.total_candidates,
        icon: "fa-solid fa-users",
        bg: "bg-blue-500/10",
        text: "text-blue-600 dark:text-blue-400",
        border: "border-blue-500/20",
    },
    {
        label: "Staff Aktif",
        value: stats.total_staff,
        icon: "fa-solid fa-user-shield",
        bg: "bg-violet-500/10",
        text: "text-violet-600 dark:text-violet-400",
        border: "border-violet-500/20",
    },
    {
        label: "Menunggu Verifikasi",
        value: stats.pending_verify,
        icon: "fa-solid fa-clock",
        bg: "bg-amber-500/10",
        text: "text-amber-600 dark:text-amber-400",
        border: "border-amber-500/20",
    },
    {
        label: "Diterima",
        value: stats.by_status.accepted,
        icon: "fa-solid fa-circle-check",
        bg: "bg-emerald-500/10",
        text: "text-emerald-600 dark:text-emerald-400",
        border: "border-emerald-500/20",
    },
    {
        label: "Ditolak",
        value: stats.by_status.rejected,
        icon: "fa-solid fa-circle-xmark",
        bg: "bg-red-500/10",
        text: "text-red-500 dark:text-red-400",
        border: "border-red-500/20",
    },
];

export default function AdminIndex({ stats, active_wave, recent_candidates, staff_list }: Props) {
    const { auth } = usePage<PageProps>().props;

    useEffect(() => {
        animate(".admin-stat-card", {
            opacity: [0, 1],
            translateY: [18, 0],
            duration: 500,
            delay: stagger(70),
            ease: "outExpo",
        });

        animate(".admin-section", {
            opacity: [0, 1],
            translateY: [22, 0],
            duration: 520,
            delay: stagger(90, { start: 260 }),
            ease: "outExpo",
        });
    }, []);

    const cards = statCards(stats);
    const quotaPct = stats.quota_target > 0
        ? Math.min(100, Math.round((stats.quota_filled / stats.quota_target) * 100))
        : 0;

    return (
        <DashboardLayout>
            <Head title="Dashboard Admin" />

            <div className="flex flex-col gap-6">

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                            <i className="fa-solid fa-user-tie text-violet-500 text-sm"></i>
                        </div>
                        <div>
                            <h1 className="text-xl font-display font-bold text-slate-800 dark:text-white leading-tight">
                                Dashboard Admin
                            </h1>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                Ringkasan sistem pendaftaran, {auth.user.name}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            href="/dashboard/admin/candidates"
                            className="h-10 px-4 rounded-xl text-sm font-semibold bg-violet-500 text-white hover:bg-violet-400 transition inline-flex items-center gap-2"
                        >
                            <i className="fa-solid fa-users-viewfinder text-xs"></i>
                            Kandidat
                        </Link>
                        <Link
                            href="/dashboard/admin/staff-list"
                            className="h-10 px-4 rounded-xl text-sm font-semibold border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:border-violet-500 hover:text-violet-500 transition inline-flex items-center gap-2"
                        >
                            <i className="fa-solid fa-user-gear text-xs"></i>
                            Staff
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {cards.map((card) => (
                        <div
                            key={card.label}
                            className="admin-stat-card opacity-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-4 flex flex-col gap-3 shadow-soft transition hover:shadow-md"
                        >
                            <div className={`w-9 h-9 rounded-xl ${card.bg} border ${card.border} flex items-center justify-center shrink-0`}>
                                <i className={`${card.icon} ${card.text} text-sm`}></i>
                            </div>
                            <div>
                                <p className="text-2xl font-display font-bold text-slate-800 dark:text-white leading-none">
                                    {card.value}
                                </p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-tight">
                                    {card.label}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                    <section className="admin-section opacity-0 lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl shadow-soft p-5">
                        <div className="flex items-center gap-2.5 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                                <i className="fa-solid fa-calendar-check text-cyan-500 text-xs"></i>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-slate-800 dark:text-white">
                                    Gelombang Aktif
                                </p>
                                <p className="text-[11px] text-slate-400">
                                    Monitoring kuota pendaftaran
                                </p>
                            </div>
                        </div>

                        {!active_wave ? (
                            <div className="rounded-xl border border-dashed border-slate-200 dark:border-white/10 px-4 py-6 text-center">
                                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                                    Belum ada gelombang aktif
                                </p>
                                <p className="text-xs text-slate-400 mt-1">
                                    Aktifkan gelombang dari menu manajemen.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                                        {active_wave.title}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                        TA {active_wave.academic_year} · tutup {active_wave.end_date}
                                    </p>
                                </div>

                                <div className="rounded-xl border border-slate-200 dark:border-white/10 p-3">
                                    <div className="flex items-center justify-between text-xs mb-2">
                                        <span className="text-slate-500 dark:text-slate-400">Kuota terisi</span>
                                        <span className="font-semibold text-slate-700 dark:text-slate-200">
                                            {stats.quota_filled}/{stats.quota_target || active_wave.quota_target}
                                        </span>
                                    </div>
                                    <div className="h-2.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all"
                                            style={{ width: `${quotaPct}%` }}
                                        />
                                    </div>
                                    <p className="text-[11px] text-slate-400 mt-2">
                                        {quotaPct}% dari target kuota terpenuhi
                                    </p>
                                </div>

                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { label: "Draft", value: stats.by_status.draft, tone: "text-slate-600 dark:text-slate-300" },
                                        { label: "Submit", value: stats.by_status.submitted, tone: "text-amber-600 dark:text-amber-400" },
                                        { label: "Verified", value: stats.by_status.verified, tone: "text-blue-600 dark:text-blue-400" },
                                    ].map((item) => (
                                        <div key={item.label} className="rounded-lg bg-slate-50 dark:bg-white/5 px-2 py-2 text-center">
                                            <p className={`text-sm font-bold ${item.tone}`}>{item.value}</p>
                                            <p className="text-[10px] text-slate-400 mt-0.5">{item.label}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </section>

                    <section className="admin-section opacity-0 lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl shadow-soft overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/5">
                            <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                                    <i className="fa-solid fa-user-plus text-blue-500 text-xs"></i>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-800 dark:text-white">Kandidat Terbaru</p>
                                    <p className="text-[11px] text-slate-400">Update terakhir pendaftar</p>
                                </div>
                            </div>
                            <Link
                                href="/dashboard/admin/candidates"
                                className="text-xs font-semibold text-violet-500 hover:text-violet-400 transition inline-flex items-center gap-1"
                            >
                                Lihat semua
                                <i className="fa-solid fa-arrow-right text-[10px]"></i>
                            </Link>
                        </div>

                        {recent_candidates.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-3">
                                    <i className="fa-solid fa-inbox text-slate-400 text-lg"></i>
                                </div>
                                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Belum ada kandidat baru</p>
                                <p className="text-xs text-slate-400 mt-1">Data kandidat akan muncul setelah ada pendaftaran.</p>
                            </div>
                        ) : (
                            <ul className="divide-y divide-slate-100 dark:divide-white/5">
                                {recent_candidates.map((item) => {
                                    const cfg = statusConfig[item.status];
                                    return (
                                        <li key={item.id}>
                                            <Link
                                                href={`/dashboard/admin/candidates?search=${encodeURIComponent(item.full_name)}`}
                                                className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-white/5 transition group"
                                            >
                                                <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                                                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                                                        {item.full_name.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate group-hover:text-violet-600 dark:group-hover:text-violet-400 transition">
                                                        {item.full_name}
                                                    </p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                                        {item.nisn ? `NISN ${item.nisn}` : "NISN belum diisi"} · {item.created_at}
                                                    </p>
                                                </div>

                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold ${cfg.bg} ${cfg.text}`}>
                                                    {cfg.label}
                                                </span>

                                                <i className="fa-solid fa-chevron-right text-[10px] text-slate-300 dark:text-slate-600 group-hover:text-violet-500 group-hover:translate-x-0.5 transition-all shrink-0"></i>
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </section>
                </div>

                <section className="admin-section opacity-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl shadow-soft overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/5">
                        <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                                <i className="fa-solid fa-users-gear text-violet-500 text-xs"></i>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-slate-800 dark:text-white">Staff Management</p>
                                <p className="text-[11px] text-slate-400">Monitoring status akun staff</p>
                            </div>
                        </div>
                        <Link
                            href="/dashboard/admin/staff-list"
                            className="text-xs font-semibold text-violet-500 hover:text-violet-400 transition inline-flex items-center gap-1"
                        >
                            Kelola staff
                            <i className="fa-solid fa-arrow-right text-[10px]"></i>
                        </Link>
                    </div>

                    {staff_list.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-3">
                                <i className="fa-solid fa-user-slash text-slate-400 text-lg"></i>
                            </div>
                            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Belum ada staff terdaftar</p>
                            <p className="text-xs text-slate-400 mt-1">Tambahkan akun staff untuk mulai proses verifikasi.</p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-slate-100 dark:divide-white/5">
                            {staff_list.slice(0, 6).map((staff) => (
                                <li key={staff.id} className="px-5 py-3.5 flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                                        <span className="text-xs font-bold text-violet-600 dark:text-violet-400">
                                            {staff.name.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                                            {staff.name}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                            {staff.email} · dibuat {staff.created_at}
                                        </p>
                                    </div>
                                    <span
                                        className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold ${
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
        </DashboardLayout>
    );
}
