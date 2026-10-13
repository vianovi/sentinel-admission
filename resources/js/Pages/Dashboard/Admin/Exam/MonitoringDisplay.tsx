import { useEffect, useState } from "react";
import axios from "axios";
import { Head } from "@inertiajs/react";

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
    attempts: AttemptRow[];
};

type AttemptRow = {
    id: number;
    candidate_code: string | null;
    candidate_name: string | null;
    session_title: string | null;
    subject_name: string | null;
    status: string;
    activity_state: "active" | "idle" | "stale" | "finished";
    remaining_seconds: number;
    answered_questions: number;
    total_questions: number;
    progress_percentage: number;
    last_activity_human: string | null;
};

type Props = {
    snapshot: MonitoringSnapshot;
    feed_url: string;
};

export default function MonitoringDisplay({ snapshot, feed_url }: Props) {
    const [data, setData] = useState(snapshot);

    useEffect(() => {
        void requestFullscreen();

        const fetchSnapshot = async () => {
            const response = await axios.get<MonitoringSnapshot>(feed_url);
            setData(response.data);
        };

        const timer = window.setInterval(() => void fetchSnapshot(), 3000);

        return () => window.clearInterval(timer);
    }, [feed_url]);

    return (
        <main className="min-h-screen bg-[#071225] text-white">
            <Head title="Display Monitoring Ujian" />

            <header className="sticky top-0 z-10 border-b border-white/10 bg-[#071225]/95 px-5 py-4 backdrop-blur">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-lg bg-gold px-2.5 py-1 text-xs font-black uppercase tracking-wide text-navy">Live</span>
                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Update {data.generated_at}</span>
                        </div>
                        <h1 className="mt-2 text-2xl font-black">Monitoring Ujian</h1>
                    </div>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                        <HeaderMetric label="Sesi" value={data.summary.sessions} />
                        <HeaderMetric label="Peserta" value={data.summary.assigned_candidates} />
                        <HeaderMetric label="Berjalan" value={data.summary.in_progress} />
                        <HeaderMetric label="Submit" value={data.summary.submitted} />
                        <HeaderMetric label="Idle" value={data.summary.idle} />
                        <HeaderMetric label="Stale" value={data.summary.stale} danger={data.summary.stale > 0} />
                    </div>
                    <button
                        type="button"
                        onClick={() => void requestFullscreen()}
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-white/10 px-3 text-xs font-bold text-slate-200 transition hover:border-gold hover:text-gold"
                    >
                        <i className="fa-solid fa-expand" />
                        Fullscreen
                    </button>
                </div>
            </header>

            <section className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {data.attempts.map((attempt) => (
                    <article key={attempt.id} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <p className="truncate text-base font-black">{attempt.candidate_name ?? "-"}</p>
                                <p className="mt-1 text-xs text-slate-400">{attempt.candidate_code ?? "-"} · {attempt.session_title ?? "-"}</p>
                            </div>
                            <ActivityBadge state={attempt.activity_state} />
                        </div>

                        <div className="mt-4 grid grid-cols-3 gap-2">
                            <CompactMetric label="Status" value={attempt.status.replaceAll("_", " ")} />
                            <CompactMetric label="Sisa" value={formatTime(attempt.remaining_seconds)} mono />
                            <CompactMetric label="Soal" value={`${attempt.answered_questions} dari ${attempt.total_questions}`} />
                        </div>

                        <div className="mt-4">
                            <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
                                <span>{attempt.subject_name ?? "Mapel"}</span>
                                <span>{attempt.progress_percentage}%</span>
                            </div>
                            <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
                                <div className="h-full rounded-full bg-gold" style={{ width: `${attempt.progress_percentage}%` }} />
                            </div>
                            <p className="mt-2 text-xs text-slate-500">Aktivitas {attempt.last_activity_human ?? "-"}</p>
                        </div>
                    </article>
                ))}

                {data.attempts.length === 0 && (
                    <div className="col-span-full rounded-xl border border-dashed border-white/10 px-6 py-16 text-center text-slate-400">
                        Belum ada kandidat yang sedang dipantau.
                    </div>
                )}
            </section>
        </main>
    );
}

async function requestFullscreen() {
    const element = document.documentElement;
    if (!document.fullscreenElement && element.requestFullscreen) {
        await element.requestFullscreen().catch(() => undefined);
    }
}

function HeaderMetric({ label, value, danger = false }: { label: string; value: number; danger?: boolean }) {
    return (
        <div className={`rounded-lg border px-3 py-2 text-center ${danger ? "border-red-500/30 bg-red-500/10" : "border-white/10 bg-white/[0.04]"}`}>
            <p className="text-lg font-black">{value.toLocaleString("id-ID")}</p>
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
        </div>
    );
}

function CompactMetric({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
    return (
        <div className="rounded-lg bg-black/20 px-3 py-2">
            <p className={`truncate text-sm font-black ${mono ? "font-mono" : ""}`}>{value}</p>
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
        </div>
    );
}

function ActivityBadge({ state }: { state: AttemptRow["activity_state"] }) {
    const tone = {
        active: "bg-emerald-500/15 text-emerald-300",
        idle: "bg-amber-500/15 text-amber-300",
        stale: "bg-red-500/15 text-red-300",
        finished: "bg-slate-500/15 text-slate-300",
    }[state];

    return <span className={`rounded-lg px-2.5 py-1 text-[11px] font-black uppercase ${tone}`}>{state}</span>;
}

function formatTime(seconds: number): string {
    const safe = Math.max(0, seconds);
    const hours = Math.floor(safe / 3600);
    const minutes = Math.floor((safe % 3600) / 60);
    const secs = safe % 60;

    return [hours, minutes, secs].map((value) => value.toString().padStart(2, "0")).join(":");
}
