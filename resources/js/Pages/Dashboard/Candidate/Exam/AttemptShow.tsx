import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { Head, Link, router, usePage } from "@inertiajs/react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { BackLink, FlashMessage, PageHeader, StatusPill } from "@/Components/Dashboard/Candidate/Exam/ExamCandidateUi";
import type { PageProps } from "@/types";

type Candidate = {
    id: number;
    candidate_code: string | null;
    full_name: string | null;
    nisn: string | null;
    program_choice: string | null;
    status: string | null;
};

type ExamMeta = {
    session_id: number;
    session_title: string | null;
    package_title: string | null;
    subject_name: string | null;
    duration_minutes: number | null;
    passing_score: number | null;
    show_result_to_candidate: boolean;
};

type AttemptState = {
    id: number;
    status: string;
    attempt_number: number;
    started_at: string | null;
    started_at_iso: string | null;
    expires_at: string | null;
    expires_at_iso: string | null;
    submitted_at: string | null;
    remaining_seconds: number;
    is_locked: boolean;
    total_questions: number;
    answered_questions: number;
    blank_questions: number;
    score_visible: boolean;
    percentage_score: number | null;
    passing_score: number | null;
    passed: boolean | null;
};

type Question = {
    id: number;
    question_text: string;
    options: Record<string, string | null>;
    point: number;
    difficulty: string;
};

type AnswerState = {
    question_id: number;
    selected_option: string | null;
    is_marked_for_review: boolean;
    saved_at: string | null;
};

type SaveResponse = {
    message: string;
    server_time: string;
    attempt: AttemptState;
    answer?: AnswerState;
};

type Props = {
    candidate: Candidate;
    exam: ExamMeta;
    attempt: AttemptState;
    questions: Question[];
    answers: Record<string, AnswerState>;
    server_time: string;
};

type SaveState = "idle" | "saving" | "saved" | "failed" | "locked";

export default function CandidateAttemptShow({ candidate, exam, attempt, questions, answers }: Props) {
    const { flash, errors } = usePage<PageProps & { errors: Record<string, string> }>().props;
    const [attemptState, setAttemptState] = useState(attempt);
    const [remaining, setRemaining] = useState(attempt.remaining_seconds);
    const [activeIndex, setActiveIndex] = useState(0);
    const [saveState, setSaveState] = useState<SaveState>("idle");
    const [saveMessage, setSaveMessage] = useState<string | null>(null);
    const saveTimers = useRef<Record<number, number>>({});
    const expiredSyncTriggered = useRef(false);

    const [answerMap, setAnswerMap] = useState<Record<number, AnswerState>>(() => {
        const entries = Object.entries(answers).map(([key, value]) => [Number(key), value] as const);
        return Object.fromEntries(entries);
    });

    const isRunning = attemptState.status === "in_progress" && !attemptState.is_locked && questions.length > 0;
    const activeQuestion = questions[activeIndex] ?? null;
    const answeredCount = useMemo(
        () => questions.filter((question) => Boolean(answerMap[question.id]?.selected_option)).length,
        [answerMap, questions],
    );

    const syncAttempt = useCallback(async () => {
        try {
            const response = await axios.get<{ server_time: string; attempt: AttemptState }>(`/dashboard/seleksi/attempts/${attempt.id}/sync`);
            setAttemptState(response.data.attempt);
            setRemaining(response.data.attempt.remaining_seconds);

            if (response.data.attempt.status !== "in_progress") {
                setSaveState("locked");
                setSaveMessage("Ujian sudah dikunci oleh server.");
            }
        } catch {
            setSaveState((current) => current === "saving" ? "saving" : "failed");
            setSaveMessage("Gagal sinkronisasi waktu server.");
        }
    }, [attempt.id]);

    useEffect(() => {
        setAttemptState(attempt);
        setRemaining(attempt.remaining_seconds);
    }, [attempt]);

    useEffect(() => {
        if (!isRunning) return;

        const timer = window.setInterval(() => {
            setRemaining((current) => {
                if (current <= 1) {
                    if (!expiredSyncTriggered.current) {
                        expiredSyncTriggered.current = true;
                        void syncAttempt();
                    }
                    return 0;
                }

                return current - 1;
            });
        }, 1000);

        return () => window.clearInterval(timer);
    }, [isRunning, syncAttempt]);

    useEffect(() => {
        if (!isRunning) return;

        const timer = window.setInterval(() => {
            void syncAttempt();
        }, 20000);

        return () => window.clearInterval(timer);
    }, [isRunning, syncAttempt]);

    useEffect(() => {
        return () => {
            Object.values(saveTimers.current).forEach((timer) => window.clearTimeout(timer));
        };
    }, []);

    const persistAnswer = useCallback(async (answer: AnswerState) => {
        setSaveState("saving");
        setSaveMessage("Menyimpan jawaban...");

        try {
            const response = await axios.post<SaveResponse>(`/dashboard/seleksi/attempts/${attempt.id}/answers`, {
                question_id: answer.question_id,
                selected_option: answer.selected_option,
                is_marked_for_review: answer.is_marked_for_review,
            });

            setAttemptState(response.data.attempt);
            setRemaining(response.data.attempt.remaining_seconds);

            if (response.data.answer) {
                setAnswerMap((current) => ({
                    ...current,
                    [response.data.answer!.question_id]: response.data.answer!,
                }));
            }

            setSaveState("saved");
            setSaveMessage("Tersimpan");
        } catch (error) {
            if (axios.isAxiosError<SaveResponse>(error) && error.response?.data?.attempt) {
                setAttemptState(error.response.data.attempt);
                setRemaining(error.response.data.attempt.remaining_seconds);

                if (error.response.status === 423) {
                    setSaveState("locked");
                    setSaveMessage(error.response.data.message || "Ujian sudah dikunci.");
                    return;
                }
            }

            setSaveState("failed");
            setSaveMessage("Gagal menyimpan. Coba pilih ulang jawaban.");
        }
    }, [attempt.id]);

    const changeAnswer = (questionId: number, patch: Partial<AnswerState>) => {
        if (!isRunning) return;

        setAnswerMap((current) => {
            const next: AnswerState = {
                question_id: questionId,
                selected_option: current[questionId]?.selected_option ?? null,
                is_marked_for_review: current[questionId]?.is_marked_for_review ?? false,
                saved_at: current[questionId]?.saved_at ?? null,
                ...patch,
            };

            if (saveTimers.current[questionId]) {
                window.clearTimeout(saveTimers.current[questionId]);
            }

            saveTimers.current[questionId] = window.setTimeout(() => {
                void persistAnswer(next);
            }, 500);

            return {
                ...current,
                [questionId]: next,
            };
        });
    };

    const submitAttempt = () => {
        if (!window.confirm("Kumpulkan jawaban sekarang? Setelah dikumpulkan, jawaban tidak bisa diubah.")) return;

        router.post(`/dashboard/seleksi/attempts/${attempt.id}/submit`, {}, {
            preserveScroll: true,
        });
    };

    if (!isRunning) {
        return (
            <DashboardLayout>
                <Head title="Status Ujian" />

                <div className="space-y-5 pb-8">
                    <PageHeader
                        title={exam.session_title ?? "Ujian Seleksi"}
                        description={`${exam.package_title ?? "-"} · Attempt ${attemptState.attempt_number}`}
                        icon="fa-solid fa-file-pen"
                        actions={<BackLink href={`/dashboard/seleksi/sesi/${exam.session_id}`} />}
                    />

                    <FlashMessage value={flash.success} type="success" />
                    <FlashMessage value={flash.error ?? errors.exam} />

                    <section className="rounded-lg border border-slate-200 bg-white p-6 text-center dark:border-white/10 dark:bg-slate-900">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-300">
                            <i className="fa-solid fa-lock text-xl" />
                        </div>
                        <h1 className="mt-4 text-lg font-black text-slate-900 dark:text-white">Attempt ujian sudah dikunci</h1>
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Status saat ini: {attemptState.status.replaceAll("_", " ")}.</p>
                        {attemptState.score_visible ? (
                            <div className="mx-auto mt-5 max-w-sm rounded-lg bg-slate-50 p-4 dark:bg-white/[0.03]">
                                <p className="text-sm font-bold text-slate-900 dark:text-white">Skor {attemptState.percentage_score ?? 0}%</p>
                                <p className="mt-1 text-xs text-slate-500">Ambang lulus {attemptState.passing_score ?? exam.passing_score ?? 0}% · {attemptState.passed ? "Lulus" : "Belum lulus"}</p>
                            </div>
                        ) : (
                            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Hasil detail belum ditampilkan untuk kandidat.</p>
                        )}
                        <Link href={`/dashboard/seleksi/sesi/${exam.session_id}`} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg bg-amber-500 px-4 text-sm font-bold text-white hover:bg-amber-400">
                            <i className="fa-solid fa-arrow-left text-xs" /> Kembali ke sesi
                        </Link>
                    </section>
                </div>
            </DashboardLayout>
        );
    }

    const activeAnswer = activeQuestion ? answerMap[activeQuestion.id] : null;

    return (
        <DashboardLayout>
            <Head title="Ruang Ujian" />

            <div className="space-y-4 pb-8">
                <section className="sticky top-0 z-10 -mx-4 border-b border-slate-200 bg-light px-4 py-3 dark:border-white/10 dark:bg-slate-950 sm:-mx-6 sm:px-6">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <StatusPill value={attemptState.status} />
                                <StatusPill value={saveState === "idle" ? "autosave siap" : saveState} />
                            </div>
                            <h1 className="mt-2 truncate text-lg font-black text-slate-900 dark:text-white">{exam.session_title ?? "Ujian Seleksi"}</h1>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{candidate.full_name ?? "-"} · {candidate.candidate_code ?? "-"}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <div className={`rounded-lg px-4 py-2 text-center ${remaining <= 300 ? "bg-red-500 text-white" : "bg-slate-900 text-white dark:bg-white dark:text-slate-950"}`}>
                                <p className="text-[10px] font-bold uppercase tracking-wide opacity-75">Sisa waktu</p>
                                <p className="font-mono text-lg font-black">{formatTime(remaining)}</p>
                            </div>
                            <button
                                type="button"
                                onClick={submitAttempt}
                                className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-emerald-500 px-4 text-sm font-bold text-white hover:bg-emerald-400"
                            >
                                <i className="fa-solid fa-paper-plane text-xs" /> Kumpulkan
                            </button>
                        </div>
                    </div>
                    {saveMessage ? <p className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">{saveMessage}</p> : null}
                </section>

                <FlashMessage value={flash.error ?? errors.exam} />

                <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
                    <main className="rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
                        {activeQuestion ? (
                            <>
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Soal {activeIndex + 1} dari {questions.length}</p>
                                        <h2 className="mt-2 text-base font-bold leading-7 text-slate-900 dark:text-white">{activeQuestion.question_text}</h2>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <StatusPill value={`${activeQuestion.point} poin`} />
                                        <StatusPill value={activeQuestion.difficulty} />
                                    </div>
                                </div>

                                <div className="mt-5 space-y-3">
                                    {Object.entries(activeQuestion.options).map(([key, value]) => value ? (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => changeAnswer(activeQuestion.id, {
                                                selected_option: activeAnswer?.selected_option === key ? null : key,
                                            })}
                                            className={`flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-left text-sm transition ${
                                                activeAnswer?.selected_option === key
                                                    ? "border-amber-400 bg-amber-500/10 text-amber-800 dark:text-amber-200"
                                                    : "border-slate-200 text-slate-700 hover:border-amber-300 dark:border-white/10 dark:text-slate-200"
                                            }`}
                                        >
                                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-black text-slate-700 dark:bg-white/10 dark:text-slate-200">{key}</span>
                                            <span className="leading-6">{value}</span>
                                        </button>
                                    ) : null)}
                                </div>

                                <div className="mt-5 flex flex-col gap-3 border-t border-slate-200 pt-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
                                    <label className="flex items-center gap-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
                                        <input
                                            type="checkbox"
                                            checked={Boolean(activeAnswer?.is_marked_for_review)}
                                            onChange={(event) => changeAnswer(activeQuestion.id, { is_marked_for_review: event.target.checked })}
                                            className="rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                                        />
                                        Tandai untuk ditinjau
                                    </label>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setActiveIndex((current) => Math.max(0, current - 1))}
                                            disabled={activeIndex === 0}
                                            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-bold text-slate-700 hover:border-amber-300 hover:text-amber-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:text-slate-200"
                                        >
                                            <i className="fa-solid fa-arrow-left text-xs" /> Sebelumnya
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setActiveIndex((current) => Math.min(questions.length - 1, current + 1))}
                                            disabled={activeIndex === questions.length - 1}
                                            className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-amber-500 px-3 text-sm font-bold text-white hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            Berikutnya <i className="fa-solid fa-arrow-right text-xs" />
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : null}
                    </main>

                    <aside className="space-y-4">
                        <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Progress</p>
                            <div className="mt-3 flex items-end justify-between">
                                <p className="text-2xl font-black text-slate-900 dark:text-white">{answeredCount}/{questions.length}</p>
                                <p className="text-xs font-semibold text-slate-500">{Math.round((answeredCount / Math.max(1, questions.length)) * 100)}%</p>
                            </div>
                            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                                <div className="h-full rounded-full bg-amber-500" style={{ width: `${(answeredCount / Math.max(1, questions.length)) * 100}%` }} />
                            </div>
                        </section>

                        <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
                            <div className="mb-3 flex items-center justify-between">
                                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Navigasi soal</p>
                                <span className="text-xs font-semibold text-slate-500">{questions.filter((question) => answerMap[question.id]?.is_marked_for_review).length} ditandai</span>
                            </div>
                            <div className="grid grid-cols-5 gap-2">
                                {questions.map((question, index) => {
                                    const answer = answerMap[question.id];
                                    const answered = Boolean(answer?.selected_option);
                                    const marked = Boolean(answer?.is_marked_for_review);
                                    const active = index === activeIndex;

                                    return (
                                        <button
                                            key={question.id}
                                            type="button"
                                            onClick={() => setActiveIndex(index)}
                                            className={`relative flex h-10 items-center justify-center rounded-lg border text-xs font-black ${
                                                active
                                                    ? "border-amber-500 bg-amber-500 text-white"
                                                    : answered
                                                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                                                        : "border-slate-200 text-slate-500 dark:border-white/10 dark:text-slate-300"
                                            }`}
                                            aria-label={`Soal ${index + 1}`}
                                        >
                                            {index + 1}
                                            {marked ? <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-violet-500 ring-2 ring-white dark:ring-slate-900" /> : null}
                                        </button>
                                    );
                                })}
                            </div>
                        </section>

                        <section className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300">
                            <p className="font-bold text-slate-900 dark:text-white">Ringkasan sesi</p>
                            <dl className="mt-3 space-y-2">
                                <Info label="Paket" value={exam.package_title ?? "-"} />
                                <Info label="Mapel" value={exam.subject_name ?? "-"} />
                                <Info label="Mulai" value={attemptState.started_at ?? "-"} />
                                <Info label="Berakhir" value={attemptState.expires_at ?? "-"} />
                            </dl>
                        </section>
                    </aside>
                </div>
            </div>
        </DashboardLayout>
    );
}

function formatTime(seconds: number): string {
    const safe = Math.max(0, seconds);
    const hours = Math.floor(safe / 3600);
    const minutes = Math.floor((safe % 3600) / 60);
    const secs = safe % 60;

    return [hours, minutes, secs]
        .map((value) => value.toString().padStart(2, "0"))
        .join(":");
}

function Info({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-start justify-between gap-3">
            <dt className="text-xs text-slate-500 dark:text-slate-400">{label}</dt>
            <dd className="text-right text-xs font-semibold text-slate-800 dark:text-slate-100">{value}</dd>
        </div>
    );
}
