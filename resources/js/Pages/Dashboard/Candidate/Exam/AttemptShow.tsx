import { useCallback, useState } from "react";
import axios from "axios";
import { Head, Link, router, usePage } from "@inertiajs/react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { BackLink, FlashMessage, PageHeader, StatusPill } from "@/Components/Dashboard/Candidate/Exam/ExamCandidateUi";
import { useExamTimer, useExamNavigation } from "@/hooks/exam";
import { useTheme } from "@/context/ThemeContext";
import QuestionPaletteNavigator from "@/Components/Exam/Candidate/QuestionPaletteNavigator";
import CandidateQuestionWorkspace from "@/Components/Exam/Candidate/CandidateQuestionWorkspace";
import { confirmExamSubmission } from "@/utils/swal";
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
    const { theme, toggleTheme } = useTheme();

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

    const submitAttempt = async () => {
        const confirmed = await confirmExamSubmission({
            answeredCount,
            totalQuestions: questions.length,
        });
        if (!confirmed) return;

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
                <section className="sticky top-0 z-10 -mx-4 border-b border-slate-200 bg-light px-4 py-2.5 dark:border-white/10 dark:bg-slate-950 sm:-mx-6 sm:px-6">
                    <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
                        <div className="min-w-0 flex items-center gap-3">
                            <img
                                src="/assets/icons/brand/exam-logo.png"
                                alt="Logo Pondok"
                                className="h-10 w-10 shrink-0 object-contain rounded-xl p-0.5 bg-white/10 dark:bg-white/5 border border-amber-500/30 shadow-sm"
                            />
                            <div>
                                <span className="font-extrabold text-xs sm:text-sm tracking-wide bg-gradient-to-r from-amber-500 to-amber-600 bg-clip-text text-transparent block leading-tight">
                                    Pondok Modern Sabilurrosyad Muhammadiyah Banjarnegara
                                </span>
                                <h1 className="text-sm font-black leading-tight text-slate-900 dark:text-white sm:text-base sm:truncate mt-0.5">
                                    {exam.session_title ?? "Ujian Seleksi"}
                                </h1>
                                <p className="hidden sm:block text-xs text-slate-500 dark:text-slate-400">
                                    Santri: <strong>{candidate.full_name ?? "-"}</strong> · Kode: {candidate.candidate_code ?? "-"}
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-end">
                            <div className="flex items-center gap-1.5">
                                <Link href={`/dashboard/seleksi/sesi/${exam.session_id}`} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-2.5 text-xs font-bold text-slate-700 hover:border-amber-300 hover:text-amber-600 dark:border-white/10 dark:text-slate-200">
                                    <i className="fa-solid fa-arrow-left text-[10px]" /> Sesi
                                </Link>

                                <button
                                    type="button"
                                    onClick={toggleTheme}
                                    className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border transition-all ${
                                        theme === "dark"
                                            ? "bg-slate-800 text-amber-300 border-white/10 hover:bg-slate-700"
                                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                                    }`}
                                    title="Beralih Mode Tema Tampilan"
                                >
                                    <i className={`fa-solid ${theme === "dark" ? "fa-sun text-amber-400" : "fa-moon text-indigo-500"}`} />
                                </button>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className={`rounded-lg px-2.5 py-1.5 text-center ${remaining <= 300 ? "bg-red-500 text-white animate-pulse" : "bg-slate-900 text-white dark:bg-white dark:text-slate-950"}`}>
                                    <p className="hidden sm:block text-[8px] font-bold uppercase tracking-wide opacity-75 leading-none mb-0.5">Sisa waktu</p>
                                    <p className="font-mono text-sm font-black leading-none">{formatTime(remaining)}</p>
                                </div>

                                <button
                                    type="button"
                                    onClick={submitAttempt}
                                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-emerald-500 px-3 text-xs font-bold text-white hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                                >
                                    <i className="fa-solid fa-paper-plane text-[10px]" /> Kumpulkan
                                </button>
                            </div>
                        </div>
                    </div>
                    {saveMessage ? <p className="mt-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">{saveMessage}</p> : null}
                </section>

                <FlashMessage value={flash.error ?? errors.exam} />

                <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
                    {activeQuestion && (
                        <CandidateQuestionWorkspace
                            activeQuestion={activeQuestion}
                            activeAnswer={activeAnswer}
                            activeIndex={activeIndex}
                            totalQuestions={questions.length}
                            changeAnswer={changeAnswer}
                            goPrev={goPrev}
                            goNext={goNext}
                        />
                    )}

                    {/* Mobile Navigator */}
                    <div className="xl:hidden mt-6">
                        <QuestionPaletteNavigator
                            questions={questions}
                            answerMap={answerMap}
                            activeIndex={activeIndex}
                            answeredCount={answeredCount}
                            theme={theme}
                            exam={exam}
                            attemptState={attemptState}
                            setActiveIndex={setActiveIndex}
                        />
                    </div>

                    {/* Desktop Sidebar Navigator */}
                    <aside className="hidden xl:block">
                        <QuestionPaletteNavigator
                            questions={questions}
                            answerMap={answerMap}
                            activeIndex={activeIndex}
                            answeredCount={answeredCount}
                            theme={theme}
                            exam={exam}
                            attemptState={attemptState}
                            setActiveIndex={setActiveIndex}
                        />
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
