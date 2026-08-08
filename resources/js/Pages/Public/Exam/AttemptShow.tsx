import { useCallback, useState, useEffect, useMemo } from "react";
import axios from "axios";
import { Head, Link, router, usePage } from "@inertiajs/react";
import RichExamText from "@/Components/Exam/Shared/RichExamText";
import { useExamTimer, useFullscreenEnforcement, useExamNavigation } from "@/hooks/exam";
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
        setSaveState("saving");
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
        }, 400);
    };

    const submitAttempt = () => {
        if (!window.confirm("Kumpulkan jawaban ujian sekarang? Jawaban yang tersimpan akan dikirimkan dan tidak bisa diubah.")) return;

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

                <div className={`w-full max-w-lg rounded-2xl border p-8 text-center shadow-2xl backdrop-blur-xl ${
                    themeMode === "dark" ? "border-white/10 bg-slate-900/90" : "border-slate-300 bg-white"
                }`}>
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                        <i className="fa-solid fa-lock text-2xl" />
                    </div>

                    <h1 className={`mt-5 text-xl font-black ${themeMode === "dark" ? "text-white" : "text-slate-900"}`}>
                        Sesi Ujian Selesai
                    </h1>
                    <p className={`mt-2 text-xs ${themeMode === "dark" ? "text-slate-400" : "text-slate-600"}`}>
                        Peserta: <span className={`font-bold ${themeMode === "dark" ? "text-slate-200" : "text-slate-900"}`}>{participant.name}</span>
                        {participant.school && <span className="text-amber-500 font-semibold ml-1">({participant.school})</span>}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">Status saat ini: {attemptState.status.replaceAll("_", " ")}.</p>

                    {attemptState.score_visible ? (
                        <div className={`mx-auto mt-6 max-w-sm rounded-xl p-4 border ${
                            themeMode === "dark" ? "bg-slate-950/80 border-white/10" : "bg-slate-50 border-slate-200"
                        }`}>
                            <p className="text-2xl font-black text-amber-500">{attemptState.percentage_score ?? 0}%</p>
                            <p className={`mt-1 text-xs ${themeMode === "dark" ? "text-slate-400" : "text-slate-600"}`}>
                                Ambang Lulus {attemptState.passing_score ?? exam.passing_score ?? 0}% ·{" "}
                                <span className={`font-bold ${attemptState.passed ? "text-emerald-500" : "text-red-500"}`}>
                                    {attemptState.passed ? "LULUS" : "BELUM LULUS"}
                                </span>
                            </p>
                        </div>
                    ) : (
                        <p className={`mt-4 text-xs p-3 rounded-xl border ${
                            themeMode === "dark" ? "bg-slate-950/40 text-slate-400 border-white/5" : "bg-slate-50 text-slate-600 border-slate-200"
                        }`}>
                            Hasil jawaban telah tersimpan dengan aman di server Sentinel.
                        </p>
                    )}

                    <div className="mt-8 flex justify-center gap-3">
                        <Link
                            href={route("exam.public.landing")}
                            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-amber-500 px-5 text-xs font-bold text-slate-950 hover:bg-amber-400 transition shadow-lg shadow-amber-500/20"
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
            <Head title={`Ruang Ujian - ${exam.session_title ?? "Public Exam"}`} />

            {/* INITIAL Fullscreen Overlay — blocks ONLY before user first clicks "Mulai" */}
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
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-500 border border-amber-500/20">
                                PUBLIC SESSION
                            </span>
                            <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-500 border border-emerald-500/20">
                                {saveState === "idle" ? "AUTOSAVE READY" : saveState.toUpperCase()}
                            </span>
                            {violationsCount > 0 && (
                                <span className="rounded bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-500 border border-red-500/20 animate-pulse">
                                    <i className="fa-solid fa-triangle-exclamation mr-1" />
                                    {violationsCount} PELANGGARAN DETEKSI
                                </span>
                            )}
                        </div>
                        <h1 className="mt-1 text-base font-black truncate">{exam.session_title ?? "Ujian Online"}</h1>
                        <p className={`text-xs truncate ${themeMode === "dark" ? "text-slate-400" : "text-slate-600"}`}>
                            Peserta: <span className="font-semibold">{participant.name}</span>
                            {exam.subject_name ? ` · ${exam.subject_name}` : ""}
                        </p>
                    </div>

                    <div className="flex items-center justify-between lg:justify-end gap-3">
                        {/* Theme Toggle Button */}
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
                {/* Non-blocking fullscreen warning — visible only after user has already started */}
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
                    {/* Active Question Display */}
                    <main className={`flex flex-col justify-between min-h-[calc(100vh-12rem)] xl:min-h-0 rounded-2xl border p-5 shadow-xl backdrop-blur-xl sm:p-6 transition-colors ${
                        themeMode === "dark" ? "border-white/10 bg-slate-900/80" : "border-slate-200 bg-white"
                    }`}>
                        {activeQuestion ? (
                            <>
                                <div className="flex-1 flex flex-col justify-start">
                                    <div className={`flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between border-b pb-4 ${
                                        themeMode === "dark" ? "border-white/10" : "border-slate-200"
                                    }`}>
                                        <div>
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500">
                                                Soal Nomor {activeIndex + 1} dari {questions.length}
                                            </span>
                                            <div className={`mt-2 text-base md:text-lg font-semibold leading-relaxed ${
                                                themeMode === "dark" ? "text-white" : "text-slate-900"
                                            }`}>
                                                <RichExamText text={activeQuestion.question_text} />
                                            </div>
                                        </div>
                                        <div className="shrink-0 flex items-center gap-2">
                                            <span className={`rounded-lg px-2.5 py-1 text-xs font-bold border ${
                                                themeMode === "dark" ? "bg-slate-800 text-slate-300 border-white/5" : "bg-slate-100 text-slate-700 border-slate-200"
                                            }`}>
                                                {activeQuestion.point} Poin
                                            </span>
                                        </div>
                                    </div>

                                    {/* Options List */}
                                    <div className="mt-6 space-y-3">
                                        {Object.entries(activeQuestion.options).map(([key, value]) => value ? (
                                            <button
                                                key={key}
                                                type="button"
                                                onClick={() => changeAnswer(activeQuestion.id, {
                                                    selected_option: activeAnswer?.selected_option === key ? null : key,
                                                })}
                                                className={`flex min-h-14 w-full items-start gap-3 rounded-xl border px-4 py-3.5 text-left text-sm md:text-base transition focus:outline-none ${
                                                    activeAnswer?.selected_option === key
                                                        ? "border-amber-500 bg-amber-500/15 text-amber-500 font-bold shadow-md shadow-amber-500/10"
                                                        : themeMode === "dark"
                                                            ? "border-white/10 bg-slate-950/60 text-slate-300 hover:border-amber-500/40 hover:bg-slate-950"
                                                            : "border-slate-200 bg-slate-50 text-slate-800 hover:border-amber-500/40 hover:bg-slate-100"
                                                }`}
                                            >
                                                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sm font-black ${
                                                    activeAnswer?.selected_option === key
                                                        ? "bg-amber-500 text-slate-950"
                                                        : themeMode === "dark" ? "bg-slate-800 text-slate-300" : "bg-slate-200 text-slate-700"
                                                }`}>
                                                    {key}
                                                </span>
                                                <RichExamText text={value} className="leading-relaxed pt-0.5" />
                                            </button>
                                        ) : null)}
                                    </div>
                                </div>

                                {/* Footer Action Controls */}
                                <div className={`mt-8 flex flex-col gap-4 border-t pt-5 sm:flex-row sm:items-center sm:justify-between ${
                                    themeMode === "dark" ? "border-white/10" : "border-slate-200"
                                }`}>
                                    <label className={`flex items-center gap-2 text-xs font-semibold cursor-pointer select-none ${
                                        themeMode === "dark" ? "text-slate-400" : "text-slate-600"
                                    }`}>
                                        <input
                                            type="checkbox"
                                            checked={Boolean(activeAnswer?.is_marked_for_review)}
                                            onChange={(e) => changeAnswer(activeQuestion.id, { is_marked_for_review: e.target.checked })}
                                            className="rounded border-slate-300 bg-slate-950 text-amber-500 focus:ring-amber-500/40"
                                        />
                                        Ragu-ragu / Tandai untuk Ditinjau
                                    </label>

                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={goPrev}
                                            disabled={activeIndex === 0}
                                            className={`inline-flex min-h-10 items-center gap-1.5 rounded-xl border px-4 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed transition ${
                                                themeMode === "dark" ? "border-white/10 bg-slate-950 text-slate-300 hover:bg-slate-800" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                                            }`}
                                        >
                                            <i className="fa-solid fa-arrow-left text-[10px]" /> Sebelum
                                        </button>

                                        <button
                                            type="button"
                                            onClick={goNext}
                                            disabled={activeIndex === questions.length - 1}
                                            className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-amber-500 px-4 text-xs font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-lg shadow-amber-500/20"
                                        >
                                            Berikut <i className="fa-solid fa-arrow-right text-[10px]" />
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : null}
                    </main>

                    {/* Mobile Question Navigator (below main question in normal flow) */}
                    <div className="xl:hidden space-y-4 mt-6">
                        {/* Progress */}
                        <div className={`rounded-2xl border p-4 shadow-xl backdrop-blur-xl transition-colors ${
                            themeMode === "dark" ? "border-white/10 bg-slate-900/80" : "border-slate-200 bg-white"
                        }`}>
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${themeMode === "dark" ? "text-slate-400" : "text-slate-500"}`}>Kemajuan Dijawab</span>
                            <div className="mt-2 flex items-baseline justify-between">
                                <p className={`text-xl font-black ${themeMode === "dark" ? "text-white" : "text-slate-900"}`}>{answeredCount} / {questions.length}</p>
                                <p className="text-xs font-bold text-amber-500">
                                    {Math.round((answeredCount / Math.max(1, questions.length)) * 100)}%
                                </p>
                            </div>
                            <div className={`mt-2.5 h-1.5 overflow-hidden rounded-full ${themeMode === "dark" ? "bg-slate-950" : "bg-slate-200"}`}>
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-300"
                                    style={{ width: `${(answeredCount / Math.max(1, questions.length)) * 100}%` }}
                                />
                            </div>
                        </div>

                        {/* Question Palette Grid */}
                        <div className={`rounded-2xl border p-4 shadow-xl backdrop-blur-xl transition-colors ${
                            themeMode === "dark" ? "border-white/10 bg-slate-900/80" : "border-slate-200 bg-white"
                        }`}>
                            <div className="flex items-center justify-between mb-3">
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${themeMode === "dark" ? "text-slate-400" : "text-slate-500"}`}>Navigasi Soal</span>
                                <span className="text-[10px] font-bold text-violet-500">
                                    {markedCount} Ragu
                                </span>
                            </div>

                            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
                                {questions.map((question, idx) => {
                                    const answer = answerMap[question.id];
                                    const answered = Boolean(answer?.selected_option);
                                    const marked = Boolean(answer?.is_marked_for_review);
                                    const active = idx === activeIndex;

                                    return (
                                        <button
                                            key={question.id}
                                            type="button"
                                            onClick={() => setActiveIndex(idx)}
                                            className={`relative flex h-10 items-center justify-center rounded-xl text-xs font-black transition ${
                                                active
                                                    ? "bg-amber-500 text-slate-950 ring-2 ring-amber-400 shadow-md shadow-amber-500/20"
                                                    : answered
                                                        ? "bg-emerald-500/20 text-emerald-500 border border-emerald-500/30"
                                                        : themeMode === "dark"
                                                            ? "bg-slate-950 text-slate-400 border border-white/5 hover:border-white/20"
                                                            : "bg-slate-100 text-slate-700 border border-slate-200 hover:border-slate-300"
                                            }`}
                                        >
                                            {idx + 1}
                                            {marked && (
                                                <span className={`absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-violet-500 ring-2 ${
                                                    themeMode === "dark" ? "ring-slate-900" : "ring-white"
                                                }`} />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Question Navigator Sidebar */}
                    <aside className="hidden xl:block space-y-4">
                        {/* Progress */}
                        <div className={`rounded-2xl border p-4 shadow-xl backdrop-blur-xl transition-colors ${
                            themeMode === "dark" ? "border-white/10 bg-slate-900/80" : "border-slate-200 bg-white"
                        }`}>
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${themeMode === "dark" ? "text-slate-400" : "text-slate-500"}`}>Kemajuan Dijawab</span>
                            <div className="mt-2 flex items-baseline justify-between">
                                <p className={`text-xl font-black ${themeMode === "dark" ? "text-white" : "text-slate-900"}`}>{answeredCount} / {questions.length}</p>
                                <p className="text-xs font-bold text-amber-500">
                                    {Math.round((answeredCount / Math.max(1, questions.length)) * 100)}%
                                </p>
                            </div>
                            <div className={`mt-2.5 h-1.5 overflow-hidden rounded-full ${themeMode === "dark" ? "bg-slate-950" : "bg-slate-200"}`}>
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-300"
                                    style={{ width: `${(answeredCount / Math.max(1, questions.length)) * 100}%` }}
                                />
                            </div>
                        </div>

                        {/* Question Palette Grid */}
                        <div className={`rounded-2xl border p-4 shadow-xl backdrop-blur-xl transition-colors ${
                            themeMode === "dark" ? "border-white/10 bg-slate-900/80" : "border-slate-200 bg-white"
                        }`}>
                            <div className="flex items-center justify-between mb-3">
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${themeMode === "dark" ? "text-slate-400" : "text-slate-500"}`}>Navigasi Soal</span>
                                <span className="text-[10px] font-bold text-violet-500">
                                    {markedCount} Ragu
                                </span>
                            </div>

                            <div className="grid grid-cols-5 gap-2">
                                {questions.map((question, idx) => {
                                    const answer = answerMap[question.id];
                                    const answered = Boolean(answer?.selected_option);
                                    const marked = Boolean(answer?.is_marked_for_review);
                                    const active = idx === activeIndex;

                                    return (
                                        <button
                                            key={question.id}
                                            type="button"
                                            onClick={() => setActiveIndex(idx)}
                                            className={`relative flex h-10 items-center justify-center rounded-xl text-xs font-black transition ${
                                                active
                                                    ? "bg-amber-500 text-slate-950 ring-2 ring-amber-400 shadow-md shadow-amber-500/20"
                                                    : answered
                                                        ? "bg-emerald-500/20 text-emerald-500 border border-emerald-500/30"
                                                        : themeMode === "dark"
                                                            ? "bg-slate-950 text-slate-400 border border-white/5 hover:border-white/20"
                                                            : "bg-slate-100 text-slate-700 border border-slate-200 hover:border-slate-300"
                                            }`}
                                        >
                                            {idx + 1}
                                            {marked && (
                                                <span className={`absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-violet-500 ring-2 ${
                                                    themeMode === "dark" ? "ring-slate-900" : "ring-white"
                                                }`} />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
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
