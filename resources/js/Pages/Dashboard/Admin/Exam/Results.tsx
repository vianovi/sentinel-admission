import { FormEvent, useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { BackLink, EmptyState, PageHeader, StatusPill, inputClass, labelClass } from "@/Components/Dashboard/Admin/Exam/ExamAdminUi";

type CandidateSummary = {
    id: number | null;
    candidate_code: string | null;
    full_name: string | null;
    nisn: string | null;
    program_choice?: string | null;
    status?: string | null;
};

type AttemptRow = {
    id: number;
    candidate: CandidateSummary;
    session_title: string | null;
    package_title: string | null;
    status: string;
    attempt_number: number;
    answered_questions: number;
    total_questions: number;
    correct_answers: number;
    wrong_answers: number;
    raw_score: number;
    max_score: number;
    percentage_score: number | null;
    passing_score: number | null;
    passed: boolean | null;
    submitted_at: string | null;
    created_at: string | null;
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
    status?: string | null;
    passed?: string | null;
    search?: string | null;
    session?: string | null;
};

type SessionOption = {
    id: number;
    title: string;
};

type Props = {
    attempts: Paginated<AttemptRow>;
    filters: Filters;
    sessions: SessionOption[];
};

const statusOptions = [
    ["", "Semua status"],
    ["in_progress", "Berlangsung"],
    ["submitted", "Submitted"],
    ["auto_submitted", "Auto-submitted"],
    ["expired", "Expired"],
    ["cancelled", "Cancelled"],
    ["invalidated", "Invalidated"],
];

export default function ExamResults({ attempts, filters, sessions }: Props) {
    const [search, setSearch] = useState(filters.search ?? "");
    const [status, setStatus] = useState(filters.status ?? "");
    const [passed, setPassed] = useState(filters.passed ?? "");
    const [session, setSession] = useState(filters.session ?? "");

    const applyFilters = (event: FormEvent) => {
        event.preventDefault();

        router.get("/dashboard/admin/exams/results", {
            search: search.trim() || undefined,
            status: status || undefined,
            passed: passed || undefined,
            session: session || undefined,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    return (
        <DashboardLayout>
            <Head title="Hasil Ujian" />

            <div className="space-y-5 pb-8">
                <PageHeader
                    title="Hasil Ujian"
                    description="Review attempt, skor, status kelulusan, dan detail jawaban kandidat."
                    icon="fa-solid fa-square-poll-vertical"
                    actions={<BackLink href="/dashboard/admin/exams" label="Dashboard Ujian" />}
                />

                <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
                    <form onSubmit={applyFilters} className="grid gap-3 lg:grid-cols-[1.3fr_1fr_1fr_1fr_auto] lg:items-end">
                        <div>
                            <label className={labelClass} htmlFor="result-search">Cari</label>
                            <input
                                id="result-search"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                className={inputClass}
                                placeholder="Nama, kode, NISN, sesi, paket"
                            />
                        </div>
                        <div>
                            <label className={labelClass} htmlFor="result-status">Status attempt</label>
                            <select id="result-status" value={status} onChange={(event) => setStatus(event.target.value)} className={inputClass}>
                                {statusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass} htmlFor="result-passed">Kelulusan</label>
                            <select id="result-passed" value={passed} onChange={(event) => setPassed(event.target.value)} className={inputClass}>
                                <option value="">Semua hasil</option>
                                <option value="1">Lulus</option>
                                <option value="0">Belum lulus</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelClass} htmlFor="result-session">Sesi</label>
                            <select id="result-session" value={session} onChange={(event) => setSession(event.target.value)} className={inputClass}>
                                <option value="">Semua sesi</option>
                                {sessions.map((item) => (
                                    <option key={item.id} value={item.id}>{item.title}</option>
                                ))}
                            </select>
                        </div>
                        <button type="submit" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-rose-500 px-4 text-sm font-bold text-white hover:bg-rose-400">
                            <i className="fa-solid fa-filter text-xs" /> Terapkan
                        </button>
                    </form>
                </section>

                <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-sm font-bold text-slate-900 dark:text-white">Attempt Kandidat</h2>
                        <span className="text-xs font-semibold text-slate-500">{attempts.total.toLocaleString("id-ID")} attempt</span>
                    </div>

                    {attempts.data.length === 0 ? (
                        <EmptyState icon="fa-solid fa-clipboard-list" title="Belum ada hasil" description="Attempt yang sudah dibuat kandidat akan tampil di sini." />
                    ) : (
                        <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-white/10">
                            <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-white/10">
                                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-white/5 dark:text-slate-400">
                                    <tr>
                                        <th className="px-4 py-3 text-left">Kandidat</th>
                                        <th className="px-4 py-3 text-left">Ujian</th>
                                        <th className="px-4 py-3 text-left">Status</th>
                                        <th className="px-4 py-3 text-right">Skor</th>
                                        <th className="px-4 py-3 text-right">Benar</th>
                                        <th className="px-4 py-3 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                                    {attempts.data.map((attempt) => (
                                        <tr key={attempt.id} className="align-top">
                                            <td className="px-4 py-3">
                                                <p className="font-bold text-slate-900 dark:text-white">{attempt.candidate.full_name ?? "Tanpa nama"}</p>
                                                <p className="mt-1 text-xs text-slate-500">{attempt.candidate.candidate_code ?? "-"} · NISN {attempt.candidate.nisn ?? "-"}</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="font-semibold text-slate-700 dark:text-slate-200">{attempt.session_title ?? "-"}</p>
                                                <p className="mt-1 text-xs text-slate-500">{attempt.package_title ?? "-"} · Attempt {attempt.attempt_number}</p>
                                                <p className="mt-1 text-xs text-slate-400">{attempt.submitted_at ?? attempt.created_at ?? "-"}</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col gap-2">
                                                    <StatusPill value={attempt.status} />
                                                    <StatusPill value={attempt.passed === null ? "pending" : attempt.passed ? "lulus" : "belum lulus"} />
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <p className="font-black text-slate-900 dark:text-white">{attempt.percentage_score === null ? "-" : `${attempt.percentage_score}%`}</p>
                                                <p className="mt-1 text-xs text-slate-500">{attempt.raw_score}/{attempt.max_score}</p>
                                            </td>
                                            <td className="px-4 py-3 text-right font-semibold text-slate-700 dark:text-slate-200">{attempt.correct_answers}/{attempt.total_questions}</td>
                                            <td className="px-4 py-3 text-right">
                                                <Link href={`/dashboard/admin/exams/results/${attempt.id}`} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-700 hover:border-rose-300 hover:text-rose-500 dark:border-white/10 dark:text-slate-200">
                                                    <i className="fa-solid fa-eye" /> Detail
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {attempts.links.length > 3 ? (
                        <div className="mt-4 flex flex-wrap gap-2">
                            {attempts.links.map((link, index) => (
                                <Link
                                    key={`${link.label}-${index}`}
                                    href={link.url ?? "#"}
                                    className={`rounded-lg border px-3 py-2 text-xs font-bold ${link.active ? "border-rose-500 bg-rose-500 text-white" : "border-slate-200 text-slate-600 hover:border-rose-300 hover:text-rose-500 dark:border-white/10 dark:text-slate-300"} ${!link.url ? "pointer-events-none opacity-40" : ""}`}
                                    preserveScroll
                                    preserveState
                                >
                                    {decodePaginationLabel(link.label)}
                                </Link>
                            ))}
                        </div>
                    ) : null}
                </section>
            </div>
        </DashboardLayout>
    );
}

function decodePaginationLabel(label: string): string {
    return label
        .replace("&laquo;", "‹")
        .replace("&raquo;", "›")
        .replace("Previous", "Sebelumnya")
        .replace("Next", "Berikutnya");
}
