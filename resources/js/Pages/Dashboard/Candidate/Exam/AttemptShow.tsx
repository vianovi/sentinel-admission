import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { Head, Link, router, usePage } from "@inertiajs/react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { BackLink, FlashMessage, PageHeader, StatusPill } from "@/Components/Dashboard/Candidate/Exam/ExamCandidateUi";
import RichExamText from "@/Components/Exam/Shared/RichExamText";
import { useExamTimer, useExamNavigation } from "@/hooks/exam";
import type { ExamAttemptState, ExamAnswerState, ExamQuestion, ExamCandidate, ExamMeta, ExamSaveState, ExamSaveResponse } from "@/types/exam";
import type { PageProps } from "@/types";

type Props = {
    candidate: ExamCandidate;
    exam: ExamMeta;
    attempt: ExamAttemptState;
    questions: ExamQuestion[];
    answers: Record<string, ExamAnswerState>;
    server_time: string;
};

export default function CandidateAttemptShow({ candidate, exam, attempt, questions, answers }: Props) {
    const { flash, errors } = usePage<PageProps & { errors: Record<string, string> }>().props;
    const [attemptState, setAttemptState] = useState<ExamAttemptState>(attempt);
    const [saveState, setSaveState] = useState<ExamSaveState>("idle");
    const [saveMessage, setSaveMessage] = useState<string | null>(null);

    const isRunning = attemptState.status === "in_progress" && !attemptState.is_locked && questions.length > 0;

    const { activeIndex, activeQuestion, answeredCount, answerMap, setActiveIndex, goNext, goPrev, updateAnswer, patchAnswer, saveTimers } = useExamNavigation({
        questions,
        initialAnswers: answers,
    });

    const syncAttempt = useCallback(async () => {
        try {
            const response = await axios.get<{ server_time: string; attempt: ExamAttemptState }>(`/dashboard/seleksi/attempts/${attempt.id}/sync`);
            setAttemptState(response.data.attempt);

            if (response.data.attempt.status !== "in_progress") {
                setSaveState("locked");
                setSaveMessage("Ujian sudah dikunci oleh server.");
            }
        } catch {
            setSaveState((current) => current === "saving" ? "saving" : "failed");
            setSaveMessage("Gagal sinkronisasi waktu server.");
        }
    }, [attempt.id]);

    const { remaining } = useExamTimer({
        attempt: attemptState,
        isRunning,
        onExpired: () => {
            void syncAttempt();
        },
        onSync: syncAttempt,
    });

    const persistAnswer = useCallback(async (answer: ExamAnswerState) => {
        setSaveState("saving");
        setSaveMessage("Menyimpan jawaban...");

        try {
            const response = await axios.post<ExamSaveResponse>(`/dashboard/seleksi/attempts/${attempt.id}/answers`, {
                question_id: answer.question_id,
                selected_option: answer.selected_option,
                is_marked_for_review: answer.is_marked_for_review,
            });

            setAttemptState(response.data.attempt);

            if (response.data.answer) {
                updateAnswer(response.data.answer.question_id, response.data.answer);
            }

            setSaveState("saved");
            setSaveMessage("Tersimpan");
        } catch (error) {
            if (axios.isAxiosError<ExamSaveResponse>(error) && error.response?.data?.attempt) {
                setAttemptState(error.response.data.attempt);

                if (error.response.status === 423) {
                    setSaveState("locked");
                    setSaveMessage(error.response.data.message || "Ujian sudah dikunci.");
                    return;
                }
            }

            setSaveState("failed");
            setSaveMessage("Gagal menyimpan. Coba pilih ulang jawaban.");
        }
    }, [attempt.id, updateAnswer]);

    const changeAnswer = (questionId: number, patch: Partial<ExamAnswerState>) => {
        if (!isRunning) return;

        const next = patchAnswer(questionId, patch);

        if (saveTimers.current[questionId]) {
            window.clearTimeout(saveTimers.current[questionId]);
        }

        saveTimers.current[questionId] = window.setTimeout(() => {
            void persistAnswer(next);
        }, 500);
    };

    const submitAttempt = () => {
        if (!window.confirm("Kumpulkan jawaban sekarang? Setelah dikumpulkan, jawaban tidak bisa diubah.")) return;

        router.post(`/dashboard/seleksi/attempts/${attempt.id}/submit`, {}, {
            preserveScroll: true,
        });
    };

    if (!isRunning) {
        return (
            <>
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
            </>
        );
    }

    const activeAnswer = activeQuestion ? answerMap[activeQuestion.id] : null;

    return (
        <>
            <Head title="Ruang Ujian" />

            <div className="space-y-4 pb-8">
                <section className="sticky top-0 z-10 -mx-4 border-b border-slate-200 bg-light px-4 py-3 dark:border-white/10 dark:bg-slate-950 sm:-mx-6 sm:px-6">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <StatusPill value={attemptState.status} />
                                <StatusPill value={saveState === "idle" ? "autosave siap" : saveState} />
                            </div>
                            <h1 className="mt-2 text-lg font-black leading-tight text-slate-900 dark:text-white sm:truncate">{exam.session_title ?? "Ujian Seleksi"}</h1>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{candidate.full_name ?? "-"} · {candidate.candidate_code ?? "-"}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
                            <Link href={`/dashboard/seleksi/sesi/${exam.session_id}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-bold text-slate-700 hover:border-amber-300 hover:text-amber-600 dark:border-white/10 dark:text-slate-200">
                                <i className="fa-solid fa-arrow-left text-xs" /> Sesi
                            </Link>
                            <div className={`rounded-lg px-3 py-2 text-center sm:px-4 ${remaining <= 300 ? "bg-red-500 text-white" : "bg-slate-900 text-white dark:bg-white dark:text-slate-950"}`}>
                                <p className="text-[10px] font-bold uppercase tracking-wide opacity-75">Sisa waktu</p>
                                <p className="font-mono text-lg font-black">{formatTime(remaining)}</p>
                            </div>
                            <button
                                type="button"
                                onClick={submitAttempt}
                                className="col-span-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 text-sm font-bold text-white hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 sm:col-span-1"
                            >
                                <i className="fa-solid fa-paper-plane text-xs" /> Kumpulkan
                            </button>
                        </div>
                    </div>
                    {saveMessage ? <p className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">{saveMessage}</p> : null}
                </section>

                <FlashMessage value={flash.error ?? errors.exam} />

                <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
                    <main className="rounded-lg border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-900 sm:p-4">
                        {activeQuestion ? (
                            <>
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Soal {activeIndex + 1} dari {questions.length}</p>
                                        <h2 className="mt-2 text-base font-bold leading-7 text-slate-900 dark:text-white">
                                            <RichExamText text={activeQuestion.question_text} />
                                        </h2>
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
                                            className={`flex min-h-12 w-full items-start gap-3 rounded-lg border px-3 py-3 text-left text-sm transition focus:outline-none focus:ring-2 focus:ring-amber-500/20 sm:px-4 ${
                                                activeAnswer?.selected_option === key
                                                    ? "border-amber-400 bg-amber-500/10 text-amber-800 dark:text-amber-200"
                                                    : "border-slate-200 text-slate-700 hover:border-amber-300 dark:border-white/10 dark:text-slate-200"
                                            }`}
                                        >
                                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-black text-slate-700 dark:bg-white/10 dark:text-slate-200">{key}</span>
                                            <RichExamText text={value} className="leading-6" />
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
                                    <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
                                        <button
                                            type="button"
                                            onClick={goPrev}
                                            disabled={activeIndex === 0}
                                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-bold text-slate-700 hover:border-amber-300 hover:text-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:text-slate-200"
                                        >
                                            <i className="fa-solid fa-arrow-left text-xs" /> Sebelumnya
                                        </button>
                                        <button
                                            type="button"
                                            onClick={goNext}
                                            disabled={activeIndex === questions.length - 1}
                                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-amber-500 px-3 text-sm font-bold text-white hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 disabled:cursor-not-allowed disabled:opacity-50"
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
                                            className={`relative flex h-11 items-center justify-center rounded-lg border text-xs font-black focus:outline-none focus:ring-2 focus:ring-amber-500/20 ${
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
        </>
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

CandidateAttemptShow.layout = (page: any) => <DashboardLayout>{page}</DashboardLayout>;
