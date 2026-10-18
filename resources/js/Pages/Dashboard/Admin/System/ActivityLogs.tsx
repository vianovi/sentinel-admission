import { useState, FormEvent } from "react";
import { Head, Link, router } from "@inertiajs/react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import {
    PageHeader,
    StatCard,
    EmptyState,
    cardClass,
    inputClass,
} from "@/Components/Dashboard/Admin/Exam/ExamAdminUi";
import SystemWorkspaceTabs from "@/Components/Dashboard/Admin/System/SystemWorkspaceTabs";
import ActivityLogTable from "@/Components/Dashboard/Admin/System/ActivityLogTable";
import ActivityLogModal from "@/Components/Dashboard/Admin/System/ActivityLogModal";

export type ActivityLog = {
    id: number;
    actor_id: number | null;
    actor_name: string;
    actor_role: string;
    action: string;
    module: string;
    target_type: string | null;
    target_id: string | null;
    target_label: string | null;
    description: string;
    metadata: Record<string, any> | null;
    ip_address: string | null;
    user_agent: string | null;
    created_at: string;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type Props = {
    logs: {
        data: ActivityLog[];
        links: PaginationLink[];
        total: number;
    };
    filters: {
        search: string;
        module: string;
        period: string;
    };
    stats: {
        total_30_days: number;
        media_activities: number;
        candidate_activities: number;
        total_in_trash: number;
    };
};

export default function ActivityLogs({ logs, filters, stats }: Props) {
    const [search, setSearch] = useState(filters.search || "");
    const [module, setModule] = useState(filters.module || "all");
    const [period, setPeriod] = useState(filters.period || "all");
    const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);

    const handleFilter = (e?: FormEvent) => {
        if (e) e.preventDefault();
        router.get(
            route("admin.system.activity-logs.index"),
            { search, module, period },
            { preserveState: true, replace: true }
        );
    };

    const getActionBadge = (action: string) => {
        if (action.includes("deleted_to_trash") || action.includes("delete")) {
            return { bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20", icon: "fa-solid fa-trash-can", label: "Ke Sampah" };
        }
        if (action.includes("restored")) {
            return { bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20", icon: "fa-solid fa-rotate-left", label: "Dipulihkan" };
        }
        if (action.includes("purged") || action.includes("emptied")) {
            return { bg: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20", icon: "fa-solid fa-skull-crossbones", label: "Hapus Permanen" };
        }
        if (action.includes("uploaded")) {
            return { bg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20", icon: "fa-solid fa-cloud-arrow-up", label: "Unggah Media" };
        }
        return { bg: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20", icon: "fa-solid fa-shield-halved", label: "Aktivitas" };
    };

    return (
        <DashboardLayout>
            <Head title="Riwayat Aktivitas & Audit Sistem" />
            <div className="space-y-6">
                <PageHeader
                    title="Riwayat Aktivitas & Audit Sistem"
                    badge="LOG OPERASIONAL TERPADU"
                    description="Pantau seluruh jejak operasional, riwayat pemindahan ke tempat sampah, dan eksekusi sistem secara human-readable."
                    icon="fa-solid fa-clock-rotate-left"
                    actions={
                        <Link
                            href="/dashboard/admin/system/trash/media"
                            className="inline-flex items-center gap-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 px-4 py-2 text-xs font-extrabold hover:bg-amber-500/30 transition shadow-lg shadow-amber-500/10"
                        >
                            <i className="fa-solid fa-trash-can" /> Kelola Tempat Sampah
                        </Link>
                    }
                />
                <SystemWorkspaceTabs active="activity-logs" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard label="Aktivitas 30 Hari Terakhir" value={stats.total_30_days} icon="fa-solid fa-chart-line" tone="text-blue-400" />
                    <StatCard label="Aktivitas Bank Media" value={stats.media_activities} icon="fa-solid fa-photo-film" tone="text-amber-400" />
                    <StatCard label="Aktivitas Draft Pendaftaran" value={stats.candidate_activities} icon="fa-solid fa-user-xmark" tone="text-indigo-400" />
                    <StatCard label="Total Data di Tempat Sampah" value={stats.total_in_trash} icon="fa-solid fa-recycle" tone="text-emerald-400" />
                </div>
                <div className={`${cardClass} p-4`}>
                    <form onSubmit={handleFilter} className="flex flex-col md:flex-row items-center gap-3">
                        <div className="relative flex-1 w-full">
                            <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari nama admin, target data, atau narasi aktivitas..."
                                className={`${inputClass} pl-9`}
                            />
                        </div>
                        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                            <select
                                value={module}
                                onChange={(e) => {
                                    setModule(e.target.value);
                                    router.get(route("admin.system.activity-logs.index"), { search, module: e.target.value, period }, { preserveState: true, replace: true });
                                }}
                                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none dark:border-white/10 dark:bg-[#060e20] dark:text-white"
                            >
                                <option value="all">Semua Modul</option>
                                <option value="exam_media">Bank Media</option>
                                <option value="candidate_draft">Draft Pendaftaran</option>
                                <option value="system">Sistem Otomatis</option>
                            </select>
                            <select
                                value={period}
                                onChange={(e) => {
                                    setPeriod(e.target.value);
                                    router.get(route("admin.system.activity-logs.index"), { search, module, period: e.target.value }, { preserveState: true, replace: true });
                                }}
                                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none dark:border-white/10 dark:bg-[#060e20] dark:text-white"
                            >
                                <option value="all">Semua Waktu</option>
                                <option value="today">Hari Ini</option>
                                <option value="7days">7 Hari Terakhir</option>
                                <option value="30days">30 Hari Terakhir</option>
                            </select>
                            <button type="submit" className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3.5 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 transition">
                                <i className="fa-solid fa-filter text-xs" /> Filter
                            </button>
                        </div>
                    </form>
                </div>
                <ActivityLogTable logs={logs} onSelectLog={setSelectedLog} />
                {selectedLog && <ActivityLogModal log={selectedLog} onClose={() => setSelectedLog(null)} />}
            </div>
        </DashboardLayout>
    );
}
