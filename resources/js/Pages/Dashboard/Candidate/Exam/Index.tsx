import { Head, Link, usePage } from "@inertiajs/react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { EmptyState, FlashMessage, Metric, PageHeader, StatusPill } from "@/Components/Dashboard/Candidate/Exam/ExamCandidateUi";
import type { PageProps } from "@/types";

type Candidate = {
    id: number;
    candidate_code: string | null;
    full_name: string | null;
    nisn: string | null;
    program_choice: string | null;
    status: string | null;
    admission_wave: { title: string; academic_year: string | null } | null;
} | null;

type AttemptSummary = {
    id: number;
    status: string;
    attempt_number: number;
    started_at: string | null;
    expires_at: string | null;
    submitted_at: string | null;
    remaining_seconds: number;
    total_questions: number;
    answered_questions: number;
    score_visible: boolean;
    percentage_score: number | null;
    passing_score: number | null;
    passed: boolean | null;
};

type Assignment = {
    id: number;
    status: string;
    can_start: boolean;
    block_reason: string | null;
    attempts_remaining: number;
    latest_attempt: AttemptSummary | null;
    active_attempt_url: string | null;
    session: {
        id: number;
        title: string;
        description: string | null;
        status: string;
        schedule_state: string;
        opens_at: string | null;
        closes_at: string | null;
        duration_minutes: number;
        passing_score: number | null;
        max_attempts: number;
        show_result_to_candidate: boolean;
    };
    package: {
        title: string | null;
        subject_name: string | null;
        status: string | null;
    };
};

type Props = {
    candidate: Candidate;
    sessions: Assignment[];
    gate: { allowed: boolean; locked: boolean; reason: string | null; reasons: string[] } | null;
    server_time: string;
};

export default function CandidateExamIndex({ candidate, sessions, gate }: Props) {
    const { flash } = usePage<PageProps>().props;
    const locked = !!gate?.locked;
    const activeCount = sessions.filter((item) => item.active_attempt_url).length;
    const openCount = sessions.filter((item) => item.session.schedule_state === "open").length;
    const completedCount = sessions.filter((item) => ["submitted", "auto_submitted"].includes(item.latest_attempt?.status ?? "")).length;

    return (
        <>
            <Head title="Ujian Seleksi" />

            <div className="space-y-5 pb-8">
                <PageHeader
                    title="Ujian Seleksi"
                    description="Akses sesi ujian yang sudah ditugaskan oleh panitia."
                    icon="fa-solid fa-file-pen"
                />

                <FlashMessage value={flash.success} type="success" />
                <FlashMessage value={flash.error} />

                {!candidate ? (
                    <EmptyState icon="fa-solid fa-user-slash" title="Data kandidat belum tersedia" description="Akun ini belum memiliki data kandidat aktif untuk mengikuti ujian seleksi." />
                ) : locked ? (
                    <>
                        <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
                            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Kandidat</p>
                                    <h2 className="mt-1 text-lg font-black text-slate-900 dark:text-white">{candidate.full_name ?? "-"}</h2>
                                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                        {candidate.candidate_code ?? "-"} · NISN {candidate.nisn ?? "-"} · {candidate.program_choice ?? "Program belum dipilih"}
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <StatusPill value={candidate.status} />
                                    <StatusPill value={candidate.admission_wave?.title ?? "tanpa gelombang"} />
                                </div>
                            </div>
                        </section>

                        <EmptyState
                            icon="fa-solid fa-lock"
                            title="Ujian seleksi masih terkunci"
                            description={gate?.reason ?? "Selesaikan tahapan pendaftaran sebelum mengakses ujian seleksi."}
                        />
                    </>
                ) : (
                    <>
                        <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
                            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Kandidat</p>
                                    <h2 className="mt-1 text-lg font-black text-slate-900 dark:text-white">{candidate.full_name ?? "-"}</h2>
                                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                        {candidate.candidate_code ?? "-"} · NISN {candidate.nisn ?? "-"} · {candidate.program_choice ?? "Program belum dipilih"}
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <StatusPill value={candidate.status} />
                                    <StatusPill value={candidate.admission_wave?.title ?? "tanpa gelombang"} />
                                </div>
                            </div>
                        </section>

                        <div className="grid gap-3 md:grid-cols-3">
                            <Metric label="Sesi Ditugaskan" value={sessions.length} icon="fa-solid fa-calendar-check" />
                            <Metric label="Sesi Terbuka" value={openCount} icon="fa-solid fa-door-open" />
                            <Metric label="Selesai" value={completedCount} icon="fa-solid fa-circle-check" />
                        </div>

                        {activeCount > 0 ? (
                            <section className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-4 text-amber-800 dark:text-amber-100">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex items-start gap-3">
                                        <i className="fa-solid fa-stopwatch mt-1 text-amber-500" />
                                        <div>
                                            <p className="text-sm font-bold">Ada ujian yang sedang berlangsung</p>
                                            <p className="mt-1 text-sm">Lanjutkan pengerjaan sebelum waktu berakhir.</p>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        ) : null}

                        {sessions.length === 0 ? (
                            <EmptyState icon="fa-solid fa-calendar-xmark" title="Belum ada sesi ujian" description="Jika kamu sudah lolos verifikasi administrasi, pantau halaman ini untuk jadwal seleksi berikutnya." />
                        ) : (
                            <div className="grid gap-4 xl:grid-cols-2">
                                {sessions.map((assignment) => (
                                    <ExamSessionCard key={assignment.id} assignment={assignment} />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </>
    );
}

function ExamSessionCard({ assignment }: { assignment: Assignment }) {
    const latest = assignment.latest_attempt;
    const href = `/dashboard/seleksi/sesi/${assignment.session.id}`;

    return (
        <article className="rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                        <StatusPill value={assignment.session.schedule_state} />
                        <StatusPill value={assignment.status} />
                    </div>
                    <Link href={href} className="text-base font-black text-slate-900 hover:text-amber-600 dark:text-white">
                        {assignment.session.title}
                    </Link>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {assignment.package.subject_name ?? "-"} · {assignment.package.title ?? "-"}
                    </p>
                </div>
                <div className="flex gap-2">
                    {assignment.active_attempt_url ? (
                        <Link href={assignment.active_attempt_url} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-amber-500 px-3 text-sm font-bold text-white hover:bg-amber-400">
                            <i className="fa-solid fa-play text-xs" /> Lanjut
                        </Link>
                    ) : (
                        <Link href={href} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-bold text-slate-700 hover:border-amber-300 hover:text-amber-600 dark:border-white/10 dark:text-slate-200">
                            <i className="fa-solid fa-eye text-xs" /> Detail
                        </Link>
                    )}
                </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <MiniMetric label="Dibuka" value={assignment.session.opens_at ?? "-"} />
                <MiniMetric label="Ditutup" value={assignment.session.closes_at ?? "-"} />
                <MiniMetric label="Durasi" value={`${assignment.session.duration_minutes} menit`} />
                <MiniMetric label="Sisa Attempt" value={assignment.attempts_remaining} />
            </div>

            {assignment.block_reason ? (
                <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500 dark:bg-white/[0.03] dark:text-slate-400">
                    {assignment.block_reason}
                </p>
            ) : null}

            {latest ? (
                <div className="mt-3 rounded-lg border border-slate-200 p-3 dark:border-white/10">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Attempt terakhir</p>
                            <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">Attempt {latest.attempt_number} · {latest.submitted_at ?? latest.started_at ?? "-"}</p>
                        </div>
                        <StatusPill value={latest.status} />
                    </div>
                    {latest.score_visible ? (
                        <p className="mt-2 text-sm font-bold text-slate-800 dark:text-slate-100">
                            Skor {latest.percentage_score ?? 0}% · {latest.passed ? "Lulus" : "Belum lulus"}
                        </p>
                    ) : (
                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Hasil detail belum ditampilkan untuk kandidat.</p>
                    )}
                </div>
            ) : null}
        </article>
    );
}

function MiniMetric({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="rounded-lg bg-slate-50 px-3 py-3 dark:bg-white/[0.03]">
            <p className="text-xs font-bold text-slate-900 dark:text-white">{typeof value === "number" ? value.toLocaleString("id-ID") : value}</p>
            <p className="mt-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">{label}</p>
        </div>
    );
}

CandidateExamIndex.layout = (page: any) => <DashboardLayout>{page}</DashboardLayout>;
