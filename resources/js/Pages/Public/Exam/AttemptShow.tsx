import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { Head, Link, router, usePage } from "@inertiajs/react";
import RichExamText from "@/Components/Dashboard/Exam/RichExamText";
import type { PageProps } from "@/types";

type Participant = {
    name: string;
    email: string | null;
    is_guest: boolean;
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
    participant: Participant;
    exam: ExamMeta;
    attempt: AttemptState;
    questions: Question[];
    answers: Record<string, AnswerState>;
    server_time: string;
};

type SaveState = "idle" | "saving" | "saved" | "failed" | "locked";

export default function PublicAttemptShow({ participant, exam, attempt, questions, answers }: Props) {
    const { flash, errors } = usePage<PageProps & { errors: Record<string, string>; flash: { success?: string; error?: string } }>().props;
    const [attemptState, setAttemptState] = useState(attempt);
    const [remaining, setRemaining] = useState(attempt.remaining_seconds);
    const [activeIndex, setActiveIndex] = useState(0);
    const [saveState, setSaveState] = useState<SaveState>("idle");
    const [saveMessage, setSaveMessage] = useState<string | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [violationsCount, setViolationsCount] = useState((attempt as AttemptState & { violations_count?: number }).violations_count ?? 0);
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

    const enterFullscreen = () => {
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch(() => {});
        }
    };

    const reportViolation = useCallback(async (type: string) => {
        setViolationsCount((count) => count + 1);
        try {
            await axios.post(route("exam.public.attempts.violation", { attempt: attempt.id }), { type });
        } catch {
            // silent fail
        }
    }, [attempt.id]);

    useEffect(() => {
        if (!isRunning) return;

        const handleFullscreenChange = () => {
            const isFS = Boolean(document.fullscreenElement);
            setIsFullscreen(isFS);

            if (!isFS) {
                void reportViolation("exit_fullscreen");
            }
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === "hidden") {
                void reportViolation("tab_switch");
            }
        };

        document.addEventListener("fullscreenchange", handleFullscreenChange);
        document.addEventListener("visibilitychange", handleVisibilityChange);

        setIsFullscreen(Boolean(document.fullscreenElement));

        return () => {
            document.removeEventListener("fullscreenchange", handleFullscreenChange);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [isRunning, reportViolation]);

    const syncAttempt = useCallback(async () => {
        try {
            const response = await axios.post<{ server_time: string; attempt: AttemptState }>(route("exam.public.attempts.sync", { attempt: attempt.id }));
            setAttemptState(response.data.attempt);
            setRemaining(response.data.attempt.remaining_seconds);

            if (response.data.attempt.status !== "in_progress") {
                setSaveState("locked");
                setSaveMessage("Sesi ujian telah berakhir.");
            }
        } catch {
            setSaveState((current) => current === "saving" ? "saving" : "failed");
            setSaveMessage("Gagal sinkronisasi waktu server.");
        }
    }, [attempt.id]);

    const calcClientRemaining = useCallback((expiresIso: string | null, fallbackSec: number) => {
        if (!expiresIso) return fallbackSec;
        const expiresMs = new Date(expiresIso).getTime();
        if (isNaN(expiresMs)) return fallbackSec;
        return Math.max(0, Math.floor((expiresMs - Date.now()) / 1000));
    }, []);

    useEffect(() => {
        setAttemptState(attempt);
        setRemaining(calcClientRemaining(attempt.expires_at_iso, attempt.remaining_seconds));
    }, [attempt, calcClientRemaining]);

    useEffect(() => {
        if (!isRunning) return;

        const timer = window.setInterval(() => {
            const currentRemaining = calcClientRemaining(attemptState.expires_at_iso, remaining);
            setRemaining(currentRemaining);

            if (currentRemaining <= 0) {
                if (!expiredSyncTriggered.current) {
                    expiredSyncTriggered.current = true;
                    void syncAttempt();
                }
            }
        }, 1000);

        return () => window.clearInterval(timer);
    }, [isRunning, syncAttempt, attemptState.expires_at_iso, calcClientRemaining, remaining]);

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
            const response = await axios.post<SaveResponse>(route("exam.public.attempts.save-answer", { attempt: attempt.id }), {
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
            setSaveMessage("Jawaban tersimpan");
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
            }, 400);

            return {
                ...current,
                [questionId]: next,
            };
        });
    };

    const submitAttempt = () => {
        if (!window.confirm("Kumpulkan jawaban ujian sekarang? Jawaban yang tersimpan akan dikirimkan dan tidak bisa diubah.")) return;

        router.post(route("exam.public.attempts.submit", { attempt: attempt.id }), {}, {
            preserveScroll: true,
        });
    };

    if (!isRunning) {
        return (
            <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
                <Head title="Status Ujian Publik" />

                <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900/90 p-8 text-center shadow-2xl backdrop-blur-xl">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <i className="fa-solid fa-lock text-2xl" />
                    </div>

                    <h1 className="mt-5 text-xl font-black text-white">Sesi Ujian Selesai</h1>
                    <p className="mt-2 text-xs text-slate-400">
                        Peserta: <span className="font-bold text-slate-200">{participant.name}</span>
                    </p>
                    <p className="mt-1 text-xs text-slate-500">Status saat ini: {attemptState.status.replaceAll("_", " ")}.</p>

                    {attemptState.score_visible ? (
                        <div className="mx-auto mt-6 max-w-sm rounded-xl bg-slate-950/80 p-4 border border-white/10">
                            <p className="text-2xl font-black text-amber-400">{attemptState.percentage_score ?? 0}%</p>
                            <p className="mt-1 text-xs text-slate-400">
                                Ambang Lulus {attemptState.passing_score ?? exam.passing_score ?? 0}% ·{" "}
                                <span className={`font-bold ${attemptState.passed ? "text-emerald-400" : "text-red-400"}`}>
                                    {attemptState.passed ? "LULUS" : "BELUM LULUS"}
                                </span>
                            </p>
                        </div>
                    ) : (
                        <p className="mt-4 text-xs text-slate-400 bg-slate-950/40 p-3 rounded-xl border border-white/5">
                            Hasil jawaban telah tersimpan dengan aman di server Sentinel.
                        </p>
                    )}

                    <div className="mt-8">
                        <Link
                            href={route("exam.public.landing")}
                            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-amber-500 px-5 text-xs font-bold text-slate-950 hover:bg-amber-400 transition"
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
        <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-amber-500 selection:text-white">
            <Head title={`Ruang Ujian - ${exam.session_title ?? "Public Exam"}`} />

            {/* Fullscreen Overlay Prompt */}
            {!isFullscreen && isRunning && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-md p-4">
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
                            className="mt-6 w-full inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 text-xs font-bold text-slate-950 hover:bg-amber-400 transition"
                        >
                            <i className="fa-solid fa-maximize" /> Masuk Mode Layar Penuh & Lanjutkan
                        </button>
                    </div>
                </div>
            )}

            {/* Sticky Header Bar */}
            <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-900/90 backdrop-blur-md px-4 py-3 sm:px-6">
                <div className="mx-auto flex max-w-7xl flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/20">
                                PUBLIC SESSION
                            </span>
                            <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                                {saveState === "idle" ? "AUTOSAVE READY" : saveState.toUpperCase()}
                            </span>
                            {violationsCount > 0 && (
                                <span className="rounded bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-400 border border-red-500/20 animate-pulse">
                                    <i className="fa-solid fa-triangle-exclamation mr-1" />
                                    {violationsCount} PELANGGARAN DETEKSI
                                </span>
                            )}
                        </div>
                        <h1 className="mt-1 text-base font-black text-white truncate">{exam.session_title ?? "Ujian Online"}</h1>
                        <p className="text-xs text-slate-400 truncate">
                            Peserta: <span className="font-semibold text-slate-200">{participant.name}</span>
                            {exam.subject_name ? ` · ${exam.subject_name}` : ""}
                        </p>
                    </div>

                    <div className="flex items-center justify-between lg:justify-end gap-3">
                        <div className={`rounded-xl px-4 py-2 text-center border ${
                            remaining <= 300 
                                ? "bg-red-500/20 border-red-500/40 text-red-300 animate-pulse" 
                                : "bg-slate-950 border-white/10 text-white"
                        }`}>
                            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Sisa Waktu</p>
                            <p className="font-mono text-base font-black text-amber-400">{formatTime(remaining)}</p>
                        </div>

                        <button
                            type="button"
                            onClick={submitAttempt}
                            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-500 px-5 text-xs font-bold text-slate-950 hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 shadow-lg shadow-emerald-500/20 transition"
                        >
                            <i className="fa-solid fa-paper-plane text-xs" /> Kumpulkan Ujian
                        </button>
                    </div>
                </div>
                {saveMessage && <p className="mt-1 text-[11px] font-medium text-amber-400/90 text-right">{saveMessage}</p>}
            </header>

            {/* Main Question & Navigator Body */}
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
                {(flash.error || errors.exam) && (
                    <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-300">
                        <i className="fa-solid fa-triangle-exclamation mr-2" />
                        {flash.error || errors.exam}
                    </div>
                )}

                <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
                    {/* Active Question Display */}
                    <main className="rounded-2xl border border-white/10 bg-slate-900/80 p-5 shadow-xl backdrop-blur-xl sm:p-6">
                        {activeQuestion ? (
                            <>
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between border-b border-white/10 pb-4">
                                    <div>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                                            Soal Nomor {activeIndex + 1} dari {questions.length}
                                        </span>
                                        <div className="mt-2 text-sm sm:text-base font-semibold leading-relaxed text-white">
                                            <RichExamText text={activeQuestion.question_text} />
                                        </div>
                                    </div>
                                    <div className="shrink-0 flex items-center gap-2">
                                        <span className="rounded-lg bg-slate-800 px-2.5 py-1 text-xs font-bold text-slate-300 border border-white/5">
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
                                            className={`flex min-h-12 w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-xs sm:text-sm transition focus:outline-none ${
                                                activeAnswer?.selected_option === key
                                                    ? "border-amber-500 bg-amber-500/15 text-amber-300 shadow-md shadow-amber-500/10"
                                                    : "border-white/10 bg-slate-950/60 text-slate-300 hover:border-amber-500/40 hover:bg-slate-950"
                                            }`}
                                        >
                                            <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-black ${
                                                activeAnswer?.selected_option === key
                                                    ? "bg-amber-500 text-slate-950"
                                                    : "bg-slate-800 text-slate-300"
                                            }`}>
                                                {key}
                                            </span>
                                            <RichExamText text={value} className="leading-relaxed pt-0.5" />
                                        </button>
                                    ) : null)}
                                </div>

                                {/* Footer Action Controls */}
                                <div className="mt-8 flex flex-col gap-4 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
                                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-400 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={Boolean(activeAnswer?.is_marked_for_review)}
                                            onChange={(e) => changeAnswer(activeQuestion.id, { is_marked_for_review: e.target.checked })}
                                            className="rounded border-white/20 bg-slate-950 text-amber-500 focus:ring-amber-500/40"
                                        />
                                        Ragu-ragu / Tandai untuk Ditinjau
                                    </label>

                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setActiveIndex((curr) => Math.max(0, curr - 1))}
                                            disabled={activeIndex === 0}
                                            className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-white/10 bg-slate-950 px-4 text-xs font-bold text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
                                        >
                                            <i className="fa-solid fa-arrow-left text-[10px]" /> Sebelum
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setActiveIndex((curr) => Math.min(questions.length - 1, curr + 1))}
                                            disabled={activeIndex === questions.length - 1}
                                            className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-amber-500 px-4 text-xs font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed transition"
                                        >
                                            Berikut <i className="fa-solid fa-arrow-right text-[10px]" />
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : null}
                    </main>

                    {/* Question Navigator Sidebar */}
                    <aside className="space-y-4">
                        {/* Progress */}
                        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 shadow-xl backdrop-blur-xl">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Kemajuan Dijawab</span>
                            <div className="mt-2 flex items-baseline justify-between">
                                <p className="text-xl font-black text-white">{answeredCount} / {questions.length}</p>
                                <p className="text-xs font-bold text-amber-400">
                                    {Math.round((answeredCount / Math.max(1, questions.length)) * 100)}%
                                </p>
                            </div>
                            <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-slate-950">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-300"
                                    style={{ width: `${(answeredCount / Math.max(1, questions.length)) * 100}%` }}
                                />
                            </div>
                        </div>

                        {/* Question Palette Grid */}
                        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 shadow-xl backdrop-blur-xl">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Navigasi Soal</span>
                                <span className="text-[10px] font-bold text-violet-400">
                                    {questions.filter((q) => answerMap[q.id]?.is_marked_for_review).length} Ragu
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
                                                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                                        : "bg-slate-950 text-slate-400 border border-white/5 hover:border-white/20"
                                            }`}
                                        >
                                            {idx + 1}
                                            {marked && (
                                                <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-violet-500 ring-2 ring-slate-900" />
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
