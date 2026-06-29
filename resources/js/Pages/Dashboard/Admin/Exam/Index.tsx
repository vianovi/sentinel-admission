import { Head, Link } from "@inertiajs/react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { ExamSectionNav } from "@/Components/Dashboard/Admin/Exam/ExamAdminUi";

type Stats = {
    subjects: number;
    packages: number;
    published_packages: number;
    sessions: number;
    open_sessions: number;
    questions: number;
    attempts_in_progress: number;
    attempts_submitted: number;
};

type ImportRow = {
    id: number;
    package_title: string | null;
    uploaded_by: string | null;
    original_filename: string;
    status: string;
    total_rows: number;
    imported_rows: number;
    failed_rows: number;
    created_at: string | null;
};

type SessionRow = {
    id: number;
    title: string;
    package_title: string | null;
    status: string;
    opens_at: string | null;
    closes_at: string | null;
    duration_minutes: number;
};

type Props = {
    stats: Stats;
    recent_imports: ImportRow[];
    upcoming_sessions: SessionRow[];
};

const cards = (stats: Stats) => [
    { label: "Kategori", value: stats.subjects, icon: "fa-solid fa-layer-group", tone: "text-cyan-500", bg: "bg-cyan-500/10" },
    { label: "Paket", value: stats.packages, icon: "fa-solid fa-box-archive", tone: "text-violet-500", bg: "bg-violet-500/10" },
    { label: "Paket Publish", value: stats.published_packages, icon: "fa-solid fa-circle-check", tone: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Sesi", value: stats.sessions, icon: "fa-solid fa-calendar-check", tone: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Sesi Aktif", value: stats.open_sessions, icon: "fa-solid fa-stopwatch", tone: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Soal Aktif", value: stats.questions, icon: "fa-solid fa-list-ol", tone: "text-rose-500", bg: "bg-rose-500/10" },
    { label: "Berlangsung", value: stats.attempts_in_progress, icon: "fa-solid fa-person-running", tone: "text-orange-500", bg: "bg-orange-500/10" },
    { label: "Terkumpul", value: stats.attempts_submitted, icon: "fa-solid fa-clipboard-check", tone: "text-teal-500", bg: "bg-teal-500/10" },
];

function StatusPill({ value }: { value: string }) {
    const tone = value === "completed" || value === "published"
        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
        : value === "failed" || value === "closed"
            ? "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-300"
            : "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-300";

    return <span className={`rounded-md border px-2 py-1 text-[11px] font-bold uppercase tracking-wide ${tone}`}>{value}</span>;
}

export default function ExamAdminIndex({ stats, recent_imports, upcoming_sessions }: Props) {
    return (
        <DashboardLayout>
            <Head title="Ujian Seleksi" />

            <div className="space-y-5 pb-8">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Ujian Seleksi</h1>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Pusat kendali paket, sesi, import soal, dan hasil ujian.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Link href="/dashboard/admin/exams/packages/create" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-rose-500 px-4 text-sm font-bold text-white hover:bg-rose-400">
                            <i className="fa-solid fa-plus text-xs" /> Paket
                        </Link>
                        <Link href="/dashboard/admin/exams/sessions/create" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-bold text-slate-700 hover:border-rose-400 hover:text-rose-500 dark:border-white/10 dark:text-slate-200">
                            <i className="fa-solid fa-calendar-plus text-xs" /> Sesi
                        </Link>
                    </div>
                </div>

                <ExamSectionNav active="overview" />

                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    {cards(stats).map((card) => (
                        <div key={card.label} className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft dark:border-white/10 dark:bg-slate-900">
                            <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg ${card.bg}`}>
                                <i className={`${card.icon} ${card.tone} text-sm`} />
                            </div>
                            <p className="text-2xl font-black text-slate-900 dark:text-white">{card.value.toLocaleString("id-ID")}</p>
                            <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">{card.label}</p>
                        </div>
                    ))}
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                    <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Sesi Terdekat</h2>
                            <Link href="/dashboard/admin/exams/sessions" className="text-xs font-bold text-rose-500">Kelola</Link>
                        </div>
                        <div className="space-y-3">
                            {upcoming_sessions.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">Belum ada sesi ujian.</p>}
                            {upcoming_sessions.map((session) => (
                                <div key={session.id} className="rounded-lg border border-slate-100 p-3 dark:border-white/10">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <Link href={`/dashboard/admin/exams/sessions/${session.id}`} className="text-sm font-bold text-slate-900 hover:text-rose-500 dark:text-white">{session.title}</Link>
                                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{session.package_title ?? "-"} · {session.duration_minutes} menit</p>
                                            <p className="mt-1 text-xs text-slate-400">{session.opens_at ?? "-"} - {session.closes_at ?? "-"}</p>
                                        </div>
                                        <StatusPill value={session.status} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Import Terakhir</h2>
                            <Link href="/dashboard/admin/exams/packages" className="text-xs font-bold text-rose-500">Paket</Link>
                        </div>
                        <div className="space-y-3">
                            {recent_imports.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">Belum ada import soal.</p>}
                            {recent_imports.map((item) => (
                                <Link key={item.id} href={`/dashboard/admin/exams/imports/${item.id}`} className="block rounded-lg border border-slate-100 p-3 hover:border-rose-300 dark:border-white/10">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-bold text-slate-900 dark:text-white">{item.original_filename}</p>
                                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.package_title ?? "-"} · {item.created_at ?? "-"}</p>
                                            <p className="mt-1 text-xs text-slate-400">{item.imported_rows} berhasil · {item.failed_rows} gagal</p>
                                        </div>
                                        <StatusPill value={item.status} />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </DashboardLayout>
    );
}
