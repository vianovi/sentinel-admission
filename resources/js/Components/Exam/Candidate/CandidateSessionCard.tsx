import { memo, useState } from "react";
import { Link, router } from "@inertiajs/react";
import { Metric, StatusPill } from "@/Components/Dashboard/Candidate/Exam/ExamCandidateUi";

export type CandidateMeta = {
    id: number;
    candidate_code: string | null;
    full_name: string | null;
    nisn: string | null;
    program_choice: string | null;
    status: string | null;
    admission_wave: { title: string; academic_year: string | null } | null;
};

export type CandidateAssignment = {
    id: number;
    status: string;
    can_start: boolean;
    block_reason: string | null;
    attempts_remaining: number;
    active_attempt_url: string | null;
    session: {
        id: number;
        title: string;
        description: string | null;
        instructions: string | null;
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
        duration_minutes: number | null;
        passing_score: number | null;
        max_attempts: number | null;
        status: string | null;
    };
};

type Props = {
    candidate: CandidateMeta;
    assignment: CandidateAssignment;
};

export const CandidateSessionCard = memo(function CandidateSessionCard({ candidate, assignment }: Props) {
    const [processing, setProcessing] = useState(false);

    const startExam = () => {
        if (!assignment.can_start || processing) return;

        const confirmed = window.confirm("Mulai ujian sekarang? Timer akan berjalan berdasarkan waktu server.");
        if (!confirmed) return;

        setProcessing(true);
        router.post(`/dashboard/seleksi/sesi/${assignment.session.id}/start`, {}, {
            preserveScroll: true,
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <div className="space-y-5">
            <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
                <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
                    <div>
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                            <StatusPill value={assignment.session.schedule_state} />
                            <StatusPill value={assignment.status} />
                            <StatusPill value={assignment.package.status} />
                        </div>
                        <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                            {assignment.session.description || "Sesi ujian seleksi online. Pastikan koneksi stabil dan semua jawaban tersimpan sebelum mengumpulkan."}
                        </p>
                        {assignment.session.instructions ? (
                            <div className="mt-4 rounded-lg bg-slate-50 p-4 text-sm leading-6 text-slate-600 dark:bg-white/[0.03] dark:text-slate-300">
                                {assignment.session.instructions}
                            </div>
                        ) : null}
                    </div>

                    <div className="rounded-lg bg-slate-50 p-4 dark:bg-white/[0.03]">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Identitas</p>
                        <h2 className="mt-2 text-base font-black text-slate-900 dark:text-white">{candidate.full_name ?? "-"}</h2>
                        <p className="mt-1 text-sm text-slate-500">{candidate.candidate_code ?? "-"} · NISN {candidate.nisn ?? "-"}</p>
                        <p className="mt-1 text-sm text-slate-500">{candidate.program_choice ?? "Program belum dipilih"}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                            <StatusPill value={candidate.status} />
                            <StatusPill value={candidate.admission_wave?.title ?? "tanpa gelombang"} />
                        </div>
                    </div>
                </div>
            </section>

            <div className="grid gap-3 md:grid-cols-4">
                <Metric label="Dibuka" value={assignment.session.opens_at ?? "-"} icon="fa-solid fa-door-open" />
                <Metric label="Ditutup" value={assignment.session.closes_at ?? "-"} icon="fa-solid fa-door-closed" />
                <Metric label="Durasi" value={`${assignment.session.duration_minutes} menit`} icon="fa-solid fa-clock" />
                <Metric label="Sisa Attempt" value={assignment.attempts_remaining} icon="fa-solid fa-repeat" />
            </div>

            <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h2 className="text-sm font-bold text-slate-900 dark:text-white">Mulai atau lanjutkan ujian</h2>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            {assignment.block_reason ?? "Sesi siap dimulai. Setelah menekan mulai, timer berjalan sampai durasi atau sesi ditutup."}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {assignment.active_attempt_url ? (
                            <Link href={assignment.active_attempt_url} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-amber-500 px-4 text-sm font-bold text-white hover:bg-amber-400">
                                <i className="fa-solid fa-play text-xs" /> Lanjutkan
                            </Link>
                        ) : (
                            <button
                                type="button"
                                onClick={startExam}
                                disabled={!assignment.can_start || processing}
                                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 text-sm font-bold text-white hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {processing ? <i className="fa-solid fa-spinner fa-spin text-xs" /> : <i className="fa-solid fa-play text-xs" />}
                                Mulai Ujian
                            </button>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
});

export default CandidateSessionCard;
