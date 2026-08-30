import { useEffect } from "react";
import { Head, Link } from "@inertiajs/react";
import { animate, stagger } from "animejs";
import DashboardLayout from "@/Layouts/DashboardLayout";
import GoldPageHeader from "@/Components/Dashboard/Candidate/Panel/GoldPageHeader";
import GoldStatCard from "@/Components/Dashboard/Candidate/Panel/GoldStatCard";
import StatusPill from "@/Components/Dashboard/Candidate/Panel/StatusPill";
import EmptyState from "@/Components/Dashboard/Candidate/Panel/EmptyState";

type AttemptSummary = {
    id: number;
    attempt_number: number;
    status_label: string;
    started_at: string | null;
    submitted_at: string | null;
    total_questions: number | null;
    answered_questions: number | null;
};

type SelectionSession = {
    id: number;
    status_label: string;
    assigned_at: string | null;
    schedule_label: string;
    attempts_count: number;
    attempts_remaining: number;
    can_start: boolean;
    start_url: string | null;
    active_attempt_url: string | null;
    block_reason: string | null;
    session: {
        title: string | null;
        description: string | null;
        opens_at: string | null;
        closes_at: string | null;
        duration_minutes: number | null;
    };
    package: {
        title: string | null;
        subject_name: string | null;
        subject_code: string | null;
    };
    latest_attempt: AttemptSummary | null;
};

type Props = {
    selection_status: {
        gate: {
            allowed: boolean;
            locked: boolean;
            reason: string | null;
        };
        summary: {
            assignments_total: number;
            open_sessions: number;
            completed_attempts: number;
            in_progress_attempts: number;
            status_label: string;
            next_action: {
                label: string;
                description: string;
                href: string;
            };
        };
        sessions: SelectionSession[];
    };
};

export default function CandidateSelectionStatus({ selection_status }: Props) {
    useEffect(() => {
        animate(".candidate-panel-entry", {
            opacity: [0, 1],
            translateY: [14, 0],
            duration: 520,
            delay: stagger(45),
            ease: "outExpo",
        });
    }, []);

    return (
        <>
            <Head title="Status Seleksi" />

            <div className="flex flex-col gap-5 pb-8">
                <GoldPageHeader
                    eyebrow="Selection Access"
                    title="Status Seleksi"
                    description="Pantau akses ujian, sesi yang diberikan panitia, batas percobaan, dan aksi seleksi yang sedang relevan."
                    icon="fa-solid fa-clock-rotate-left"
                    action={{
                        label: selection_status.summary.next_action.label,
                        href: selection_status.summary.next_action.href,
                        icon: "fa-solid fa-arrow-right",
                    }}
                />

                <section className="candidate-panel-entry rounded-2xl border border-gold/20 bg-white p-5 shadow-sm dark:border-gold/15 dark:bg-slate-900 sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <StatusPill tone={selection_status.gate.allowed ? "gold" : "muted"} label={selection_status.summary.status_label} />
                            <h2 className="mt-3 text-lg font-display font-bold text-slate-900 dark:text-white">
                                {selection_status.summary.next_action.label}
                            </h2>
                            <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                                {selection_status.summary.next_action.description}
                            </p>
                            {selection_status.gate.reason && (
                                <p className="mt-2 text-sm font-semibold text-amber-700 dark:text-gold">{selection_status.gate.reason}</p>
                            )}
                        </div>
                        <Link
                            href={selection_status.summary.next_action.href}
                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gold px-4 text-sm font-bold text-navy transition hover:bg-goldhover"
                        >
                            Buka
                            <i className="fa-solid fa-arrow-right text-xs" />
                        </Link>
                    </div>
                </section>

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <GoldStatCard label="Sesi" value={String(selection_status.summary.assignments_total)} icon="fa-solid fa-calendar-check" />
                    <GoldStatCard label="Sedang Dibuka" value={String(selection_status.summary.open_sessions)} icon="fa-solid fa-door-open" />
                    <GoldStatCard label="Attempt Selesai" value={String(selection_status.summary.completed_attempts)} icon="fa-solid fa-circle-check" />
                    <GoldStatCard label="Berlangsung" value={String(selection_status.summary.in_progress_attempts)} icon="fa-solid fa-spinner" />
                </section>

                {selection_status.sessions.length === 0 ? (
                    <EmptyState
                        icon="fa-solid fa-calendar-xmark"
                        title="Belum ada sesi seleksi"
                        description="Sesi ujian akan muncul setelah panitia menugaskan kandidat ke sesi yang sesuai."
                        actionLabel="Buka Status Pendaftaran"
                        actionHref="/dashboard/status-pendaftaran"
                    />
                ) : (
                    <section className="grid gap-4 xl:grid-cols-2">
                        {selection_status.sessions.map((session) => (
                            <article key={session.id} className="candidate-panel-entry rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap gap-2">
                                            <StatusPill tone={session.can_start ? "gold" : "neutral"} label={session.schedule_label} />
                                            <StatusPill tone="neutral" label={session.status_label} />
                                        </div>
                                        <h2 className="mt-3 text-base font-bold text-slate-900 dark:text-white">{session.session.title ?? "Sesi Seleksi"}</h2>
                                        <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                                            {session.package.subject_name ?? "-"} {session.package.title ? `- ${session.package.title}` : ""}
                                        </p>
                                    </div>
                                    {(session.active_attempt_url || session.start_url) && (
                                        <Link
                                            href={session.active_attempt_url ?? session.start_url ?? "#"}
                                            className="inline-flex min-h-10 items-center justify-center rounded-lg bg-gold px-3 text-xs font-bold text-navy transition hover:bg-goldhover"
                                        >
                                            {session.active_attempt_url ? "Lanjutkan" : "Buka Sesi"}
                                        </Link>
                                    )}
                                </div>

                                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                                    <Info label="Dibuka" value={session.session.opens_at ?? "-"} />
                                    <Info label="Ditutup" value={session.session.closes_at ?? "-"} />
                                    <Info label="Sisa Attempt" value={String(session.attempts_remaining)} />
                                </div>

                                {session.block_reason && (
                                    <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-200">
                                        {session.block_reason}
                                    </div>
                                )}

                                {session.latest_attempt && (
                                    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/[0.03]">
                                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Attempt Terakhir</p>
                                        <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
                                            #{session.latest_attempt.attempt_number} - {session.latest_attempt.status_label}
                                        </p>
                                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                            {session.latest_attempt.answered_questions ?? 0}/{session.latest_attempt.total_questions ?? 0} soal terjawab
                                            {session.latest_attempt.submitted_at ? ` - Submit ${session.latest_attempt.submitted_at}` : ""}
                                        </p>
                                    </div>
                                )}
                            </article>
                        ))}
                    </section>
                )}
            </div>
        </>
    );
}

function Info({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 dark:border-white/10 dark:bg-white/[0.03]">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
            <p className="mt-1 truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{value}</p>
        </div>
    );
}

CandidateSelectionStatus.layout = (page: any) => <DashboardLayout>{page}</DashboardLayout>;
