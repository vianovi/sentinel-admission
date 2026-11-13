import { Fragment, useState, type FormEvent, type ReactNode } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import {
    ExamWorkspace,
    FlashMessage,
    PageHeader,
    EmptyState,
    StatusPill,
    cardClass,
    inputClass,
    labelClass,
    primaryButtonClass,
    secondaryButtonClass,
    BackLink,
} from "@/Components/Dashboard/Admin/Exam/ExamAdminUi";
import type { PageProps } from "@/types";

type Participant = {
    id: number;
    participant_code: string;
    name: string;
    school_origin: string;
    status: string;
    average_score: number | null;
    is_passed: boolean | null;
    completed_at: string | null;
    exam_public_session_id: number;
    session_title: string;
    subjects: {
        name: string;
        package: string;
        threshold: number | null;
        allow_retry: boolean;
        best: number | null;
        passed: boolean | null;
        note: string | null;
        attempts: { number: number; type: string; status: string; score: number | null }[];
    }[];
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
    total: number;
    links: PaginationLink[];
};

type Filters = {
    session: number | null;
    status: string;
    passed: string;
    search: string;
};

type SessionOption = {
    id: number;
    title: string;
};

type Props = {
    participants: Paginated<Participant>;
    sessions: SessionOption[];
    filters: Filters;
    stats: {
        total: number;
        passed: number;
        failed: number;
        average_score: number;
    };
};

const statusOptions = [
    ["", "Semua status"],
    ["in_progress", "Sedang Mengerjakan"],
    ["completed", "Selesai"],
];

export default function PublicResults({ participants, sessions, filters, stats }: Props) {
    const { flash } = usePage<PageProps>().props;

    const [search, setSearch] = useState(filters.search ?? "");
    const [status, setStatus] = useState(filters.status ?? "");
    const [passed, setPassed] = useState(filters.passed ?? "");
    const [session, setSession] = useState(filters.session ? String(filters.session) : "");
    const [expanded, setExpanded] = useState<number | null>(null);

    const applyFilters = (event: FormEvent) => {
        event.preventDefault();

        router.get(
            "/dashboard/admin/public-exams/results",
            {
                search: search.trim() || undefined,
                status: status || undefined,
                passed: passed || undefined,
                session: session || undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
            }
        );
    };

    const resetFilters = () => {
        setSearch("");
        setStatus("");
        setPassed("");
        setSession("");
        router.get("/dashboard/admin/public-exams/results", {}, { preserveState: true, preserveScroll: true });
    };

    const formatDate = (isoString: string | null) => {
        if (!isoString) return "—";
        try {
            return new Date(isoString).toLocaleString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            });
        } catch {
            return isoString;
        }
    };

    return (
        <>
            <Head title="Hasil Ujian Publik" />

            <ExamWorkspace active="sessions">
                <PageHeader
                    title="Hasil Ujian Publik"
                    badge="REKAP & EVALUASI KELULUSAN"
                    description="Review agregat skor seluruh mata pelajaran sesi, status kelulusan (passing grade > 65), dan hasil remedial peserta ujian publik."
                    icon="fa-solid fa-square-poll-vertical"
                    actions={
                        <div className="flex flex-wrap items-center gap-2.5">
                            {session && (
                                <a
                                    href={route("admin.exams.public-sessions.results.export", { session: Number(session) })}
                                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 transition-all shadow-md shadow-emerald-600/20"
                                >
                                    <i className="fa-solid fa-file-csv text-xs" /> Unduh CSV Sesi Ini
                                </a>
                            )}
                            <BackLink href="/dashboard/admin/public-exams/sessions" label="Kembali ke Sesi" />
                        </div>
                    }
                />

                <FlashMessage value={flash.success} type="success" />

                {/* 4 Stat Cards */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-4 shadow-sm">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Peserta</span>
                        <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{stats.total}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-4 shadow-sm">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Peserta Lulus (&gt; 65)</span>
                        <p className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.passed}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-4 shadow-sm">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400">Belum Lulus (≤ 65)</span>
                        <p className="mt-1 text-2xl font-black text-red-600 dark:text-red-400">{stats.failed}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-4 shadow-sm">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-500">Rata-rata Skor</span>
                        <p className="mt-1 text-2xl font-black text-amber-500">{stats.average_score}</p>
                    </div>
                </div>

                {/* Filter Toolbar Section */}
                <section className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
                    <form onSubmit={applyFilters} className="grid gap-3 lg:grid-cols-[1.3fr_1fr_1fr_1fr_auto] lg:items-end">
                        <div>
                            <label className={labelClass} htmlFor="result-search">Cari Peserta</label>
                            <input
                                id="result-search"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className={inputClass}
                                placeholder="Nama siswa, kode peserta, asal sekolah..."
                            />
                        </div>

                        <div>
                            <label className={labelClass} htmlFor="result-status">Status Pengerjaan</label>
                            <select
                                id="result-status"
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className={inputClass}
                            >
                                {statusOptions.map(([val, lbl]) => (
                                    <option key={val} value={val}>{lbl}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className={labelClass} htmlFor="result-passed">Status Kelulusan</label>
                            <select
                                id="result-passed"
                                value={passed}
                                onChange={(e) => setPassed(e.target.value)}
                                className={inputClass}
                            >
                                <option value="">Semua kelulusan</option>
                                <option value="1">Lulus (&gt; 65)</option>
                                <option value="0">Belum Lulus (≤ 65)</option>
                            </select>
                        </div>

                        <div>
                            <label className={labelClass} htmlFor="result-session">Sesi Ujian</label>
                            <select
                                id="result-session"
                                value={session}
                                onChange={(e) => setSession(e.target.value)}
                                className={inputClass}
                            >
                                <option value="">Semua sesi publik</option>
                                {sessions.map((item) => (
                                    <option key={item.id} value={item.id}>{item.title}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center gap-2">
                            <button type="submit" className={`${primaryButtonClass} min-h-10 px-4`}>
                                <i className="fa-solid fa-filter text-xs" /> Terapkan
                            </button>
                            <button
                                type="button"
                                onClick={resetFilters}
                                className={`${secondaryButtonClass} min-h-10 px-3`}
                                title="Reset Filter"
                            >
                                <i className="fa-solid fa-rotate-left text-xs" />
                            </button>
                        </div>
                    </form>
                </section>

                {/* Results Table Section */}
                <section className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-sm overflow-hidden space-y-4">
                    <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
                        <div>
                            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <i className="fa-solid fa-users-rectangle text-amber-500" />
                                <span>Daftar Evaluasi Peserta Ujian Publik</span>
                                <span className="rounded-full bg-slate-100 dark:bg-white/10 px-2 py-0.5 text-xs font-bold text-slate-600 dark:text-slate-300">
                                    {participants.total}
                                </span>
                            </h2>
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                Skor akhir dihitung dari jumlah nilai efektif dibagi jumlah paket dalam sesi. Lulus jika rata-rata lebih dari 65.
                            </p>
                        </div>
                    </div>

                    <div className="p-4 sm:p-5 pt-0">
                        {participants.data.length === 0 ? (
                            <EmptyState
                                icon="fa-solid fa-chart-simple"
                                title="Belum ada data hasil ujian"
                                description="Peserta yang menyelesaikan ujian publik akan muncul di sini."
                            />
                        ) : (
                            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10">
                                <table className="min-w-full text-left text-xs dark:text-white">
                                    <thead className="bg-slate-50 dark:bg-white/5 text-slate-500 uppercase font-bold tracking-wider">
                                        <tr>
                                            <th className="p-3">Kode Peserta</th>
                                            <th className="p-3">Nama Siswa & Sekolah</th>
                                            <th className="p-3">Sesi Ujian</th>
                                            <th className="p-3 text-center">Rata-rata Skor</th>
                                            <th className="p-3 text-center">Kelulusan</th>
                                            <th className="p-3 text-center">Status</th>
                                            <th className="p-3">Waktu Selesai</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                        {participants.data.map((p) => {
                                            const isPassed = p.is_passed;
                                            return (
                                                <Fragment key={p.id}>
                                                <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-all">
                                                    <td className="p-3 font-mono font-bold text-amber-600 dark:text-amber-400">
                                                        <button type="button" onClick={() => setExpanded(expanded === p.id ? null : p.id)} aria-expanded={expanded === p.id} aria-label={`Rincian nilai ${p.name}`} className="rounded-md text-left underline focus:outline-none focus:ring-2 focus:ring-amber-500/20">
                                                            {p.participant_code} <i className={`fa-solid ${expanded === p.id ? "fa-chevron-up" : "fa-chevron-down"}`} aria-hidden="true" />
                                                        </button>
                                                    </td>
                                                    <td className="p-3">
                                                        <div className="font-semibold text-slate-900 dark:text-white">{p.name}</div>
                                                        <div className="text-[11px] text-slate-400">{p.school_origin}</div>
                                                    </td>
                                                    <td className="p-3 font-medium text-slate-600 dark:text-slate-300">
                                                        {p.session_title}
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        {p.average_score !== null ? (
                                                            <span className={`text-base font-black ${
                                                                p.average_score > 65 ? "text-emerald-500" : "text-red-500"
                                                            }`}>
                                                                {p.average_score}
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-400 font-bold">—</span>
                                                        )}
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        {isPassed === true ? (
                                                            <span className="inline-flex items-center rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                                                                <i className="fa-solid fa-circle-check mr-1 text-[10px]" /> Lulus
                                                            </span>
                                                        ) : isPassed === false ? (
                                                            <span className="inline-flex items-center rounded-md border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-red-700 dark:text-red-300">
                                                                <i className="fa-solid fa-circle-xmark mr-1 text-[10px]" /> Belum Lulus
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-400 text-xs">Dalam Proses</span>
                                                        )}
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        <StatusPill value={p.status} />
                                                    </td>
                                                    <td className="p-3 text-slate-400">
                                                        {formatDate(p.completed_at)}
                                                    </td>
                                                </tr>
                                                {expanded === p.id && <tr key={`${p.id}-details`}><td colSpan={7} className="bg-slate-50 p-4 dark:bg-slate-950">
                                                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                                        {p.subjects.map((subject, index) => <section key={index} className="rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-900">
                                                            <h3 className="font-bold text-slate-900 dark:text-white">{subject.name} · {subject.package}</h3>
                                                            <p className="text-slate-600 dark:text-slate-300">Nilai dipakai: {subject.best ?? "—"} · Ambang: {subject.threshold ?? "—"}</p>
                                                            <p className={subject.passed === false ? "font-bold text-red-600 dark:text-red-400" : "font-bold text-emerald-600 dark:text-emerald-400"}>{subject.passed === null ? "Belum dikerjakan" : subject.passed ? "Lulus mapel" : "Tidak lulus mapel"}</p>
                                                            <ul className="mt-2 space-y-1 text-slate-600 dark:text-slate-300">{subject.attempts.map(attempt => <li key={attempt.number}>Attempt {attempt.number}: {attempt.score ?? "—"} ({attempt.status})</li>)}</ul>
                                                            {subject.note && <p className="mt-2 text-amber-700 dark:text-amber-300">{subject.note} {!subject.allow_retry && subject.attempts.length === 1 ? "Pertimbangkan ujian ulang melalui kebijakan sekolah." : ""}</p>}
                                                        </section>)}
                                                    </div>
                                                </td></tr>}
                                                </Fragment>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Pagination Links */}
                        {participants.links && participants.links.length > 3 && (
                            <nav aria-label="Navigasi halaman" className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
                                {participants.links.map((link, idx) => (
                                    link.url ? (
                                        <Link
                                            key={idx}
                                            href={link.url}
                                            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                                                link.active
                                                    ? "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold"
                                                    : "border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                                            }`}
                                        >
                                            {link.label.replace(/&laquo;|&raquo;/g, "") || (idx === 0 ? "«" : "»")}
                                        </Link>
                                    ) : (
                                        <span
                                            key={idx}
                                            className="rounded-lg border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-400 opacity-60"
                                        >
                                            {link.label.replace(/&laquo;|&raquo;/g, "") || (idx === 0 ? "«" : "»")}
                                        </span>
                                    )
                                ))}
                            </nav>
                        )}
                    </div>
                </section>
            </ExamWorkspace>
        </>
    );
}

PublicResults.layout = (page: ReactNode) => <DashboardLayout>{page}</DashboardLayout>;
