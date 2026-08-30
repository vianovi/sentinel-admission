import { useEffect, useState } from "react";
import axios from "axios";
import { Head, Link } from "@inertiajs/react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { ExamWorkspace, PageHeader, StatCard, StatusPill, secondaryButtonClass } from "@/Components/Dashboard/Admin/Exam/ExamAdminUi";

type MonitoringSnapshot = {
    generated_at: string;
    summary: {
        sessions: number;
        assigned_candidates: number;
        in_progress: number;
        submitted: number;
        expired: number;
        idle: number;
        stale: number;
    };
    sessions: SessionRow[];
    attempts: AttemptRow[];
};

type SessionRow = {
    id: number;
    title: string | null;
    status: string;
    package_title: string | null;
    subject_name: string | null;
    wave_title: string | null;
    opens_at: string | null;
    closes_at: string | null;
    duration_minutes: number | null;
    assigned_candidates: number;
    in_progress_attempts: number;
    submitted_attempts: number;
    expired_attempts: number;
    is_open_now: boolean;
};

type AttemptRow = {
    id: number;
    candidate_id: number;
    candidate_code: string | null;
    candidate_name: string | null;
    nisn: string | null;
    program_choice: string | null;
    session_title: string | null;
    package_title: string | null;
    subject_name: string | null;
    attempt_number: number;
    status: string;
    started_at: string | null;
    expires_at: string | null;
    submitted_at: string | null;
    last_activity_at: string | null;
    last_activity_human: string | null;
    activity_state: "active" | "idle" | "stale" | "finished";
    remaining_seconds: number;
    answered_questions: number;
    blank_questions: number;
    total_questions: number;
    progress_percentage: number;
    score: number | null;
    passed: boolean | null;
};

type Props = {
    snapshot: MonitoringSnapshot;
    feed_url: string;
    display_url: string;
};

export default function ExamMonitoring({ snapshot, feed_url, display_url }: Props) {
    const [data, setData] = useState(snapshot);
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        const fetchSnapshot = async () => {
            setIsRefreshing(true);
            try {
                const response = await axios.get<MonitoringSnapshot>(feed_url);
                setData(response.data);
            } finally {
                setIsRefreshing(false);
            }
        };

        const timer = window.setInterval(() => void fetchSnapshot(), 5000);

        return () => window.clearInterval(timer);
    }, [feed_url]);

    return (
        <>
            <Head title="Monitoring Ujian" />

            <ExamWorkspace active="sessions">
                <PageHeader
                    title="Monitoring Ujian"
                    description={`Update terakhir ${data.generated_at}${isRefreshing ? " - menyegarkan..." : ""}`}
                    icon="fa-solid fa-satellite-dish"
                    actions={
                        <>
                            <Link href={display_url} className={secondaryButtonClass}>
                                <i className="fa-solid fa-display text-xs" />
                                Display Compact
                            </Link>
                            <Link href="/dashboard/admin/exams/sessions" className={secondaryButtonClass}>
                                <i className="fa-solid fa-calendar-check text-xs" />
                                Sesi Ujian
                            </Link>
                        </>
                    }
                />

                <section className="grid gap-3 md:grid-cols-4 xl:grid-cols-7">
                    <StatCard label="Sesi" value={data.summary.sessions} icon="fa-solid fa-calendar-days" />
                    <StatCard label="Peserta" value={data.summary.assigned_candidates} icon="fa-solid fa-users" tone="text-blue-500" />
                    <StatCard label="Berjalan" value={data.summary.in_progress} icon="fa-solid fa-person-running" tone="text-emerald-500" />
                    <StatCard label="Submit" value={data.summary.submitted} icon="fa-solid fa-paper-plane" tone="text-violet-500" />
                    <StatCard label="Expired" value={data.summary.expired} icon="fa-solid fa-hourglass-end" tone="text-red-500" />
                    <StatCard label="Idle" value={data.summary.idle} icon="fa-solid fa-pause" tone="text-amber-500" />
                    <StatCard label="Stale" value={data.summary.stale} icon="fa-solid fa-triangle-exclamation" tone="text-red-500" />
                </section>

                <section className="grid gap-3 xl:grid-cols-2">
                    {data.sessions.map((session) => (
                        <article key={session.id} className="rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#171f33]">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h2 className="text-sm font-black text-slate-900 dark:text-white">{session.title ?? "Sesi Ujian"}</h2>
                                        <StatusPill value={session.status} />
                                        {session.is_open_now ? <StatusPill value="aktif" /> : null}
                                    </div>
                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                        {session.package_title ?? "-"} · {session.subject_name ?? "-"} · {session.wave_title ?? "-"}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                        {session.opens_at ?? "-"} sampai {session.closes_at ?? "-"} · {session.duration_minutes ?? 0} menit
                                    </p>
                                </div>
                            </div>

                            <div className="mt-4 grid grid-cols-4 gap-2">
                                <MiniMetric label="Peserta" value={session.assigned_candidates} />
                                <MiniMetric label="Berjalan" value={session.in_progress_attempts} />
                                <MiniMetric label="Submit" value={session.submitted_attempts} />
                                <MiniMetric label="Expired" value={session.expired_attempts} />
                            </div>
                        </article>
                    ))}
                    {data.sessions.length === 0 && (
                        <div className="rounded-lg border border-dashed border-slate-200 bg-white px-5 py-10 text-center text-sm text-slate-500 dark:border-white/10 dark:bg-[#171f33] dark:text-slate-400">
                            Tidak ada sesi aktif atau attempt berjalan saat ini.
                        </div>
                    )}
                </section>

                <section className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-white/10 dark:bg-[#171f33]">
                    <div className="border-b border-slate-200 px-4 py-3 dark:border-white/10">
                        <h2 className="text-sm font-black text-slate-900 dark:text-white">Kondisi Kandidat</h2>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{data.attempts.length} attempt terbaru dari sesi yang sedang dipantau.</p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-white/10">
                            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-white/[0.03]">
                                <tr>
                                    <Th>Kandidat</Th>
                                    <Th>Sesi</Th>
                                    <Th>Status</Th>
                                    <Th>Progress</Th>
                                    <Th>Sisa Waktu</Th>
                                    <Th>Aktivitas</Th>
                                    <Th>Skor</Th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                {data.attempts.map((attempt) => (
                                    <tr key={attempt.id} className="align-top">
                                        <Td>
                                            <p className="font-bold text-slate-900 dark:text-white">{attempt.candidate_name ?? "-"}</p>
                                            <p className="mt-1 text-xs text-slate-500">{attempt.candidate_code ?? "-"} · {attempt.nisn ?? "-"}</p>
                                        </Td>
                                        <Td>
                                            <p>{attempt.session_title ?? "-"}</p>
                                            <p className="mt-1 text-xs text-slate-500">{attempt.subject_name ?? "-"}</p>
                                        </Td>
                                        <Td><StatusPill value={attempt.status} /></Td>
                                        <Td>
                                            <p className="font-bold">{attempt.answered_questions}/{attempt.total_questions}</p>
                                            <div className="mt-2 h-2 w-28 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                                                <div className="h-full rounded-full bg-gold" style={{ width: `${attempt.progress_percentage}%` }} />
                                            </div>
                                        </Td>
                                        <Td className="font-mono font-bold">{formatTime(attempt.remaining_seconds)}</Td>
                                        <Td>
                                            <ActivityPill state={attempt.activity_state} />
                                            <p className="mt-1 text-xs text-slate-500">{attempt.last_activity_human ?? "-"}</p>
                                        </Td>
                                        <Td>{attempt.score === null ? "-" : `${attempt.score}%`}</Td>
                                    </tr>
                                ))}
                                {data.attempts.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">Belum ada attempt untuk dipantau.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </ExamWorkspace>
        </>
    );
}

function MiniMetric({ label, value }: { label: string; value: number }) {
    return (
        <div className="rounded-lg bg-slate-50 px-3 py-2 text-center dark:bg-white/[0.03]">
            <p className="text-lg font-black text-slate-900 dark:text-white">{value.toLocaleString("id-ID")}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
        </div>
    );
}

function Th({ children }: { children: React.ReactNode }) {
    return <th className="px-4 py-3 text-left font-black">{children}</th>;
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return <td className={`px-4 py-3 text-slate-700 dark:text-slate-200 ${className}`}>{children}</td>;
}

function ActivityPill({ state }: { state: AttemptRow["activity_state"] }) {
    const tone = {
        active: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
        idle: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
        stale: "bg-red-500/10 text-red-700 dark:text-red-300",
        finished: "bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300",
    }[state];

    return <span className={`inline-flex rounded-md px-2 py-1 text-[11px] font-black uppercase ${tone}`}>{state}</span>;
}

function formatTime(seconds: number): string {
    const safe = Math.max(0, seconds);
    const hours = Math.floor(safe / 3600);
    const minutes = Math.floor((safe % 3600) / 60);
    const secs = safe % 60;

    return [hours, minutes, secs].map((value) => value.toString().padStart(2, "0")).join(":");
}

ExamMonitoring.layout = (page: any) => <DashboardLayout>{page}</DashboardLayout>;
