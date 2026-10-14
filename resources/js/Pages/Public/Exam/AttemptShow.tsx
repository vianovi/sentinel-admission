import { useCallback, useState, useEffect, useMemo } from "react";
import axios from "axios";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { useExamTimer, useFullscreenEnforcement, useExamNavigation } from "@/hooks/exam";
import PublicQuestionPalette from "@/Components/Exam/Public/PublicQuestionPalette";
import PublicExamQuestionWorkspace from "@/Components/Exam/Public/PublicExamQuestionWorkspace";
import { confirmExamSubmission } from "@/utils/swal";
import type { ExamAttemptState, ExamAnswerState, ExamQuestion, ExamParticipant, ExamMeta, ExamSaveState, ExamSaveResponse } from "@/types/exam";
import type { PageProps } from "@/types";

type Props = {
    participant: ExamParticipant;
    exam: ExamMeta;
    attempt: ExamAttemptState;
    questions: ExamQuestion[];
    answers: Record<string, ExamAnswerState>;
    server_time: string;
};

export default function PublicAttemptShow({ participant, exam, attempt, questions, answers }: Props) {
    const { flash, errors } = usePage<PageProps & { errors: Record<string, string>; flash: { success?: string; error?: string } }>().props;
    const [attemptState, setAttemptState] = useState<ExamAttemptState>(attempt);
    const [saveState, setSaveState] = useState<ExamSaveState>("idle");
    const [saveMessage, setSaveMessage] = useState<string | null>(null);
    const [themeMode, setThemeMode] = useState<"dark" | "light">("dark");

    useEffect(() => {
        const saved = localStorage.getItem("sentinel-theme") as "dark" | "light" | null;
        const initial = saved || (document.documentElement.classList.contains("dark") ? "dark" : "light");
        setThemeMode(initial);
        if (initial === "dark") {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
    }, []);

    const isRunning = attemptState.status === "in_progress" && !attemptState.is_locked && questions.length > 0;

    useEffect(() => {
        if (isRunning && attemptState.expires_at) {
            const sessionInfo = {
                attemptId: attempt.id,
                guestName: participant.name,
                guestSchool: participant.school ?? "",
                sessionTitle: exam.session_title ?? exam.package_title ?? "Ujian Publik",
                subjectName: exam.subject_name ?? "",
                startedAt: attemptState.started_at,
                expiresAt: attemptState.expires_at,
            };
            localStorage.setItem("SENTINEL_PUBLIC_EXAM_ACTIVE_SESSION", JSON.stringify(sessionInfo));
        } else if (!isRunning) {
            localStorage.removeItem("SENTINEL_PUBLIC_EXAM_ACTIVE_SESSION");
        }
    }, [isRunning, attempt.id, participant.name, participant.school, exam.session_title, exam.package_title, exam.subject_name, attemptState.expires_at, attemptState.started_at]);

    const { activeIndex, activeQuestion, answeredCount, answerMap, setActiveIndex, goNext, goPrev, updateAnswer, patchAnswer, saveTimers } = useExamNavigation({
        questions,
        initialAnswers: answers,
    });

    const markedCount = useMemo(() => {
        return questions.filter((q) => answerMap[q.id]?.is_marked_for_review).length;
    }, [questions, answerMap]);

    const { isFullscreen, needsInitialFullscreen, violationsCount, enterFullscreen } = useFullscreenEnforcement({
        isRunning,
        attemptId: attempt.id,
        violationRoute: route("exam.public.attempts.violation", { attempt: attempt.id }),
        initialViolations: attempt.violations_count ?? 0,
    });

    const syncAttempt = useCallback(async () => {
        try {
            const response = await axios.post<{ server_time: string; attempt: ExamAttemptState }>(route("exam.public.attempts.sync", { attempt: attempt.id }));
            setAttemptState(response.data.attempt);

            if (response.data.attempt.status !== "in_progress") {
                setSaveState("locked");
                setSaveMessage("Sesi ujian telah berakhir.");
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
        // Guard: skip stale timers that fired after exam was locked/submitted
        setSaveState((current) => {
            if (current === "locked") return current;
            return "saving";
        });
        setSaveMessage("Menyimpan jawaban...");

        try {
            const response = await axios.post<ExamSaveResponse>(route("exam.public.attempts.save-answer", { attempt: attempt.id }), {
                question_id: answer.question_id,
                selected_option: answer.selected_option,
                is_marked_for_review: answer.is_marked_for_review,
            });

            setAttemptState(response.data.attempt);

            if (response.data.answer) {
                updateAnswer(response.data.answer.question_id, response.data.answer);
            }

            setSaveState("saved");
            setSaveMessage("Jawaban tersimpan");
        } catch (error) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const axiosError = error as any;
            if (axiosError?.isAxiosError && axiosError.response?.data?.attempt) {
                setAttemptState(axiosError.response.data.attempt as ExamAttemptState);

                if (axiosError.response.status === 423) {
                    setSaveState("locked");
                    setSaveMessage(axiosError.response.data.message || "Ujian sudah dikunci.");
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
            // Re-check isRunning at fire time to drop stale timers
            if (attemptState.status !== "in_progress" || attemptState.is_locked) return;
            void persistAnswer(next);
        }, 400);
    };

    const submitAttempt = async () => {
        const confirmed = await confirmExamSubmission({
            answeredCount,
            totalQuestions: questions.length,
        });
        if (!confirmed) return;

        router.post(route("exam.public.attempts.submit", { attempt: attempt.id }), {}, {
            preserveScroll: true,
        });
    };

    const toggleTheme = () => {
        setThemeMode((prev) => {
            const next = prev === "dark" ? "light" : "dark";
            localStorage.setItem("sentinel-theme", next);
            if (next === "dark") {
                document.documentElement.classList.add("dark");
            } else {
                document.documentElement.classList.remove("dark");
            }
            return next;
        });
    };

    if (!isRunning) {
        return (
            <div className={`min-h-screen flex items-center justify-center p-4 transition-colors ${
                themeMode === "dark" ? "bg-slate-950 text-slate-100" : "bg-slate-100 text-slate-800"
            }`}>
                <Head title="Status Ujian Publik" />

                <div className={`w-full max-w-lg rounded-3xl border p-8 text-center shadow-2xl backdrop-blur-xl ${
                    themeMode === "dark" ? "border-white/10 bg-slate-900/90" : "border-slate-300 bg-white"
                }`}>
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 dark:bg-white/5 border border-amber-500/30 p-2 shadow-lg shadow-amber-500/10">
                        <img src="/assets/icons/brand/exam-logo.png" alt="Logo Pondok" className="h-full w-full object-contain" />
                    </div>

                    <h1 className={`mt-4 text-xl sm:text-2xl font-black ${themeMode === "dark" ? "text-white" : "text-slate-900"}`}>
                        Sesi Ujian Selesai
                    </h1>
                    <p className={`mt-1.5 text-xs sm:text-sm ${themeMode === "dark" ? "text-slate-300" : "text-slate-600"}`}>
                        Pondok Modern Sabilurrosyad Muhammadiyah Banjarnegara
                    </p>
                    <p className={`mt-2 text-xs sm:text-sm ${themeMode === "dark" ? "text-slate-400" : "text-slate-600"}`}>
                        Santri: <span className={`font-bold ${themeMode === "dark" ? "text-slate-200" : "text-slate-900"}`}>{participant.name}</span>
                        {participant.school && <span className="text-amber-500 font-semibold ml-1">({participant.school})</span>}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">Status saat ini: {attemptState.status.replaceAll("_", " ")}.</p>

                    {attemptState.score_visible ? (
                        <div className={`mx-auto mt-6 max-w-sm rounded-2xl p-5 border ${
                            themeMode === "dark" ? "bg-slate-950/80 border-white/10" : "bg-slate-50 border-slate-200"
                        }`}>
                            <p className="text-3xl font-black text-amber-500">{attemptState.percentage_score ?? 0}%</p>
                            <p className={`mt-1 text-xs sm:text-sm ${themeMode === "dark" ? "text-slate-400" : "text-slate-600"}`}>
                                Ambang Lulus {attemptState.passing_score ?? exam.passing_score ?? 0}% ·{" "}
                                <span className={`font-bold ${attemptState.passed ? "text-emerald-500" : "text-red-500"}`}>
                                    {attemptState.passed ? "LULUS" : "BELUM LULUS"}
                                </span>
                            </p>
                        </div>
                    ) : (
                        <p className={`mt-4 text-xs sm:text-sm p-4 rounded-2xl border ${
                            themeMode === "dark" ? "bg-slate-950/40 text-slate-300 border-white/5" : "bg-slate-50 text-slate-600 border-slate-200"
                        }`}>
                            Alhamdulillah, seluruh jawaban Anda telah tersimpan dengan aman di server Pondok Modern Sabilurrosyad.
                        </p>
                    )}

                    <div className="mt-8 flex justify-center gap-3">
                        <Link
                            href={route("exam.public.landing")}
                            className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-amber-500 px-6 text-xs sm:text-sm font-bold text-slate-950 hover:bg-amber-400 transition shadow-lg shadow-amber-500/20"
                        >
                            <i className="fa-solid fa-house text-xs" /> Kembali ke Portal Ujian
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const activeAnswer = activeQuestion ? answerMap[activeQuestion.id] : null;

    return (
        <div className={`min-h-screen transition-colors ${
            themeMode === "dark" ? "bg-slate-950 text-slate-100 selection:bg-amber-500 selection:text-white" : "bg-slate-100 text-slate-900 selection:bg-amber-500 selection:text-slate-950"
        }`}>
            <Head title={`Ruang Ujian - ${exam.session_title ?? "Ujian Masuk Santri"} - Pondok Modern Sabilurrosyad`} />

            {/* INITIAL Fullscreen Overlay */}
            {needsInitialFullscreen && isRunning && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-slate-950/95">
                    <div className="w-full max-w-md rounded-2xl border border-amber-500/30 bg-slate-900 p-6 text-center shadow-2xl">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <i className="fa-solid fa-expand text-2xl" />
                        </div>
                        <h2 className="mt-4 text-lg font-black text-white">Mode Layar Penuh Diperlukan</h2>
                        <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                            Untuk menjaga integritas dan keamanan ujian, Anda harus mengerjakan dalam mode layar penuh (Full Screen). Sistem mencatat setiap kali Anda keluar dari mode ini.
                        </p>
                        <button
                            type="button"
                            onClick={enterFullscreen}
                            className="mt-6 w-full inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 text-xs font-bold text-slate-950 hover:bg-amber-400 transition shadow-lg shadow-amber-500/20"
                        >
                            <i className="fa-solid fa-maximize" /> Masuk Mode Layar Penuh &amp; Mulai Ujian
                        </button>
                    </div>
                </div>
            )}

            {/* Sticky Header Bar */}
            <header className={`sticky top-0 z-30 border-b backdrop-blur-md px-4 py-3 sm:px-6 transition-colors ${
                themeMode === "dark" ? "border-white/10 bg-slate-900/90 text-white" : "border-slate-200 bg-white/90 text-slate-900 shadow-sm"
            }`}>
                <div className="mx-auto flex max-w-7xl flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                        <img
                            src="/assets/icons/brand/exam-logo.png"
                            alt="Logo Pondok"
                            className="h-11 w-11 shrink-0 object-contain rounded-xl p-0.5 bg-white/10 dark:bg-white/5 border border-amber-500/30 shadow-sm"
                        />
                        <div className="min-w-0">
                            <span className="font-extrabold text-xs sm:text-sm tracking-wide bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 bg-clip-text text-transparent block truncate max-w-xs sm:max-w-md md:max-w-xl">
                                Pondok Modern Sabilurrosyad Muhammadiyah Banjarnegara
                            </span>
                            <div className="flex flex-wrap items-center gap-2 mt-0.5">
                                <h1 className="text-xs sm:text-sm font-black truncate">
                                    {exam.session_title ?? "Ujian Online"}
                                </h1>
                                <span className={`text-[11px] truncate ${themeMode === "dark" ? "text-slate-400" : "text-slate-600"}`}>
                                    · Santri: <strong className="text-amber-400">{participant.name}</strong>
                                    {exam.subject_name ? ` (${exam.subject_name})` : ""}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between lg:justify-end gap-3">
                        <button
                            type="button"
                            onClick={toggleTheme}
                            className={`rounded-xl px-3 py-2 text-xs font-bold transition-all border flex items-center gap-1.5 ${
                                themeMode === "dark"
                                    ? "bg-slate-800 text-amber-300 border-white/10 hover:bg-slate-700"
                                    : "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200"
                            }`}
                            title="Beralih Mode Tema Tampilan"
                        >
                            <i className={`fa-solid ${themeMode === "dark" ? "fa-sun text-amber-400" : "fa-moon text-indigo-500"}`} />
                            <span className="hidden sm:inline">{themeMode === "dark" ? "Mode Terang" : "Mode Gelap"}</span>
                        </button>

                        <div className={`rounded-xl px-4 py-2 text-center border ${
                            remaining <= 300 
                                ? "bg-red-500/20 border-red-500/40 text-red-500 animate-pulse" 
                                : themeMode === "dark" ? "bg-slate-950 border-white/10 text-white" : "bg-slate-100 border-slate-300 text-slate-900"
                        }`}>
                            <p className={`text-[9px] font-bold uppercase tracking-wider ${themeMode === "dark" ? "text-slate-400" : "text-slate-500"}`}>Sisa Waktu</p>
                            <p className="font-mono text-base font-black text-amber-500">{formatTime(remaining)}</p>
                        </div>

                        <button
                            type="button"
                            onClick={submitAttempt}
                            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-500 px-5 text-xs font-black text-slate-950 hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 shadow-lg shadow-emerald-500/20 transition"
                        >
                            <i className="fa-solid fa-paper-plane text-xs" /> Kumpulkan Ujian
                        </button>
                    </div>
                </div>
                {saveMessage && <p className="mt-1 text-[11px] font-medium text-amber-500 text-right">{saveMessage}</p>}
            </header>

            {/* Main Question & Navigator Body */}
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 pb-6">
                {!isFullscreen && !needsInitialFullscreen && isRunning && (
                    <div className="mb-4 flex items-center gap-3 rounded-xl border border-orange-500/40 bg-orange-500/10 px-4 py-3 text-xs text-orange-400">
                        <i className="fa-solid fa-triangle-exclamation shrink-0" />
                        <span className="flex-1">
                            <span className="font-bold">Peringatan:</span> Anda sedang tidak dalam mode layar penuh.
                            Pelanggaran ini telah tercatat oleh sistem.
                        </span>
                        <button
                            type="button"
                            onClick={enterFullscreen}
                            className="shrink-0 rounded-lg bg-orange-500/20 px-3 py-1.5 text-[10px] font-bold text-orange-300 hover:bg-orange-500/30 transition border border-orange-500/30"
                        >
                            <i className="fa-solid fa-maximize mr-1" /> Kembali Full Screen
                        </button>
                    </div>
                )}

                {(flash.error || errors.exam) && (
                    <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-400">
                        <i className="fa-solid fa-triangle-exclamation mr-2" />
                        {flash.error || errors.exam}
                    </div>
                )}

                <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
                    {activeQuestion && (
                        <PublicExamQuestionWorkspace
                            activeQuestion={activeQuestion}
                            activeAnswer={activeAnswer}
                            activeIndex={activeIndex}
                            totalQuestions={questions.length}
                            themeMode={themeMode}
                            changeAnswer={changeAnswer}
                            goPrev={goPrev}
                            goNext={goNext}
                        />
                    )}

                    {/* Mobile Question Navigator */}
                    <div className="xl:hidden mt-6">
                        <PublicQuestionPalette
                            questions={questions}
                            answerMap={answerMap}
                            activeIndex={activeIndex}
                            answeredCount={answeredCount}
                            markedCount={markedCount}
                            themeMode={themeMode}
                            setActiveIndex={setActiveIndex}
                        />
                    </div>

                    {/* Desktop Question Navigator Sidebar */}
                    <aside className="hidden xl:block">
                        <PublicQuestionPalette
                            questions={questions}
                            answerMap={answerMap}
                            activeIndex={activeIndex}
                            answeredCount={answeredCount}
                            markedCount={markedCount}
                            themeMode={themeMode}
                            setActiveIndex={setActiveIndex}
                        />
                    </aside>
                </div>
            </div>
        </div>
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
