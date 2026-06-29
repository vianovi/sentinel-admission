import { Head, Link } from "@inertiajs/react";
import DashboardLayout from "@/Layouts/DashboardLayout";

type CandidateSummary = {
    id: number | null;
    candidate_code: string | null;
    full_name: string | null;
    nisn: string | null;
    program_choice?: string | null;
    status?: string | null;
};

type AnswerReview = {
    id: number;
    question_text: string | null;
    options: Record<string, string | null> | null;
    selected_option: string | null;
    correct_answer: string | null;
    is_correct: boolean | null;
    point_awarded: number;
    point: number;
    explanation: string | null;
};

type AttemptDetail = {
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
    started_at: string | null;
    submitted_at: string | null;
    finalized_at: string | null;
    created_at: string | null;
    answers: AnswerReview[];
};

type Props = {
    attempt: AttemptDetail;
};

export default function StaffExamResultShow({ attempt }: Props) {
    const passLabel = attempt.passed === null ? "pending" : attempt.passed ? "lulus" : "belum lulus";

    return (
        <DashboardLayout>
            <Head title={`Hasil ${attempt.candidate.full_name ?? "Kandidat"}`} />

            <div className="space-y-5 pb-8">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-white shadow-sm shadow-emerald-500/25">
                            <i className="fa-solid fa-square-poll-vertical text-sm" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="truncate text-xl font-bold text-slate-900 dark:text-white">{attempt.candidate.full_name ?? "Hasil Kandidat"}</h1>
                            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{attempt.session_title ?? "Tanpa sesi"} · Attempt {attempt.attempt_number}</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Link href="/dashboard/staff/exams/results" className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-bold text-slate-700 hover:border-emerald-300 hover:text-emerald-600 dark:border-white/10 dark:text-slate-200">
                            <i className="fa-solid fa-arrow-left text-xs" /> Kembali
                        </Link>
                        {attempt.candidate.id ? (
                            <Link href={`/dashboard/staff/candidates/${attempt.candidate.id}`} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-bold text-slate-700 hover:border-emerald-300 hover:text-emerald-600 dark:border-white/10 dark:text-slate-200">
                                <i className="fa-solid fa-user text-xs" /> Profil Kandidat
                            </Link>
                        ) : null}
                    </div>
                </div>

                <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
                    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
                        <div>
                            <div className="mb-3 flex flex-wrap items-center gap-2">
                                <StatusPill value={attempt.status} />
                                <StatusPill value={passLabel} />
                            </div>
                            <dl className="grid gap-3 text-sm sm:grid-cols-2">
                                <Info label="Kode kandidat" value={attempt.candidate.candidate_code ?? "-"} />
                                <Info label="NISN" value={attempt.candidate.nisn ?? "-"} />
                                <Info label="Program" value={attempt.candidate.program_choice ?? "-"} />
                                <Info label="Status kandidat" value={attempt.candidate.status ?? "-"} />
                                <Info label="Paket" value={attempt.package_title ?? "-"} />
                                <Info label="Sesi" value={attempt.session_title ?? "-"} />
                            </dl>
                        </div>
                        <div className="rounded-lg bg-slate-50 p-4 dark:bg-white/[0.03]">
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Timeline</p>
                            <div className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                                <p><span className="font-bold">Dibuat:</span> {attempt.created_at ?? "-"}</p>
                                <p><span className="font-bold">Mulai:</span> {attempt.started_at ?? "-"}</p>
                                <p><span className="font-bold">Submit:</span> {attempt.submitted_at ?? "-"}</p>
                                <p><span className="font-bold">Final:</span> {attempt.finalized_at ?? "-"}</p>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="grid gap-3 md:grid-cols-5">
                    <Metric label="Skor" value={attempt.percentage_score === null ? "-" : `${attempt.percentage_score}%`} />
                    <Metric label="Raw Score" value={`${attempt.raw_score}/${attempt.max_score}`} />
                    <Metric label="Terjawab" value={`${attempt.answered_questions}/${attempt.total_questions}`} />
                    <Metric label="Benar" value={attempt.correct_answers} />
                    <Metric label="Salah" value={attempt.wrong_answers} />
                </div>

                <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-sm font-bold text-slate-900 dark:text-white">Review Jawaban</h2>
                        <span className="text-xs font-semibold text-slate-500">{attempt.answers.length.toLocaleString("id-ID")} jawaban tersimpan</span>
                    </div>

                    <div className="space-y-3">
                        {attempt.answers.map((answer, index) => (
                            <article key={answer.id} className="rounded-lg border border-slate-200 p-4 dark:border-white/10">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <p className="text-sm font-bold leading-6 text-slate-900 dark:text-white">{index + 1}. {answer.question_text ?? "Soal tidak tersedia"}</p>
                                    <StatusPill value={answer.is_correct === null ? "kosong" : answer.is_correct ? "benar" : "salah"} />
                                </div>

                                <div className="mt-3 grid gap-2">
                                    {Object.entries(answer.options ?? {}).map(([key, value]) => value ? (
                                        <div
                                            key={key}
                                            className={`rounded-lg px-3 py-2 text-sm ${
                                                answer.correct_answer === key
                                                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                                                    : answer.selected_option === key
                                                        ? "bg-red-500/10 text-red-700 dark:text-red-300"
                                                        : "bg-slate-50 text-slate-600 dark:bg-white/[0.03] dark:text-slate-300"
                                            }`}
                                        >
                                            <span className="font-black">{key}.</span> {value}
                                            {answer.correct_answer === key ? <span className="ml-2 text-xs font-bold">(kunci)</span> : null}
                                            {answer.selected_option === key ? <span className="ml-2 text-xs font-bold">(dipilih)</span> : null}
                                        </div>
                                    ) : null)}
                                </div>

                                <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
                                    <span>Jawaban kandidat: {answer.selected_option ?? "-"}</span>
                                    <span>Kunci: {answer.correct_answer ?? "-"}</span>
                                    <span>Poin: {answer.point_awarded}/{answer.point}</span>
                                </div>

                                {answer.explanation ? (
                                    <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-600 dark:bg-white/[0.03] dark:text-slate-300">{answer.explanation}</p>
                                ) : null}
                            </article>
                        ))}
                    </div>
                </section>
            </div>
        </DashboardLayout>
    );
}

function StatusPill({ value }: { value: string | null | undefined }) {
    const normalized = (value ?? "-").toString();
    const tone = ["submitted", "auto_submitted", "lulus", "benar"].includes(normalized)
        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
        : ["expired", "cancelled", "invalidated", "belum lulus", "salah"].includes(normalized)
            ? "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300"
            : "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300";

    return <span className={`inline-flex rounded-md border px-2 py-1 text-[11px] font-bold uppercase tracking-wide ${tone}`}>{normalized.replaceAll("_", " ")}</span>;
}

function Metric({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
            <p className="text-xl font-black text-slate-900 dark:text-white">{typeof value === "number" ? value.toLocaleString("id-ID") : value}</p>
            <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</p>
        </div>
    );
}

function Info({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <dt className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</dt>
            <dd className="mt-1 font-semibold text-slate-800 dark:text-slate-100">{value}</dd>
        </div>
    );
}
