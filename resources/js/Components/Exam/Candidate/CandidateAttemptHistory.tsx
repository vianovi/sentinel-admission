import { memo } from "react";
import { Link } from "@inertiajs/react";
import { StatusPill } from "@/Components/Dashboard/Candidate/Exam/ExamCandidateUi";

export type AttemptSummary = {
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

type Props = {
    attempts: AttemptSummary[];
};

export const CandidateAttemptHistory = memo(function CandidateAttemptHistory({ attempts }: Props) {
    return (
        <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Riwayat Attempt</h2>
                <span className="text-xs font-semibold text-slate-500">{attempts.length.toLocaleString("id-ID")} attempt</span>
            </div>

            {attempts.length === 0 ? (
                <p className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
                    Belum ada attempt untuk sesi ini.
                </p>
            ) : (
                <div className="grid gap-3">
                    {attempts.map((attempt) => (
                        <div key={attempt.id} className="rounded-lg border border-slate-200 p-3 dark:border-white/10">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">Attempt {attempt.attempt_number}</p>
                                        <StatusPill value={attempt.status} />
                                    </div>
                                    <p className="mt-1 text-xs text-slate-500">Mulai {attempt.started_at ?? "-"} · Submit {attempt.submitted_at ?? "-"}</p>
                                    <p className="mt-1 text-xs text-slate-500">Terjawab {attempt.answered_questions} dari {attempt.total_questions}</p>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    {attempt.score_visible ? (
                                        <StatusPill value={`${attempt.percentage_score ?? 0}% ${attempt.passed ? "lulus" : "belum lulus"}`} />
                                    ) : null}
                                    {attempt.status === "in_progress" ? (
                                        <Link href={`/dashboard/seleksi/attempts/${attempt.id}`} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-700 hover:border-amber-300 hover:text-amber-600 dark:border-white/10 dark:text-slate-200">
                                            <i className="fa-solid fa-play" /> Buka
                                        </Link>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
});

export default CandidateAttemptHistory;
