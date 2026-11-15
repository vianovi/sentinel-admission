import RichExamText from '@/Components/Exam/Shared/RichExamText';
import type { ExamAnswerState, ExamQuestion } from '@/types/exam';

type Props = {
    activeQuestion: ExamQuestion;
    activeAnswer: ExamAnswerState | null;
    activeIndex: number;
    totalQuestions: number;
    themeMode: 'dark' | 'light';
    changeAnswer: (questionId: number, patch: Partial<ExamAnswerState>) => void;
    goPrev: () => void;
    goNext: () => void;
};

export default function PublicExamQuestionWorkspace({
    activeQuestion,
    activeAnswer,
    activeIndex,
    totalQuestions,
    themeMode,
    changeAnswer,
    goPrev,
    goNext,
}: Props) {
    const isDark = themeMode === 'dark';
    const isLastQuestion = activeIndex === totalQuestions - 1;

    return (
        <article
            aria-label={`Soal nomor ${activeIndex + 1} dari ${totalQuestions}`}
            className={`flex min-h-[calc(100vh-12rem)] flex-col justify-between rounded-3xl border p-6 shadow-xl backdrop-blur-xl transition-colors sm:p-8 xl:min-h-0 ${isDark ? 'border-white/10 bg-slate-900/85' : 'border-slate-200 bg-white'}`}
        >
            <div className="flex flex-1 flex-col justify-start">
                <div
                    className={`flex flex-col gap-3 border-b pb-5 sm:flex-row sm:items-start sm:justify-between ${isDark ? 'border-white/10' : 'border-slate-200'}`}
                >
                    <div>
                        <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-amber-500 sm:text-sm">
                            <i className="fa-solid fa-list-ol text-xs" /> Soal
                            Nomor {activeIndex + 1} dari {totalQuestions}
                        </span>
                        <div
                            className={`mt-3 text-lg font-bold leading-relaxed sm:text-xl ${isDark ? 'text-white' : 'text-slate-900'}`}
                        >
                            <RichExamText text={activeQuestion.question_text} />
                        </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                        <span
                            className={`rounded-xl border px-3.5 py-1.5 text-xs font-black shadow-sm sm:text-sm ${isDark ? 'border-amber-500/20 bg-slate-800 text-amber-400' : 'border-amber-300 bg-amber-50 text-amber-700'}`}
                        >
                            {activeQuestion.point} Poin
                        </span>
                    </div>
                </div>
                <div className="mt-6 space-y-3.5">
                    {Object.entries(activeQuestion.options).map(
                        ([key, value]) =>
                            value ? (
                                <button
                                    key={key}
                                    type="button"
                                    aria-pressed={activeAnswer?.selected_option === key}
                                    onClick={() =>
                                        changeAnswer(activeQuestion.id, {
                                            selected_option:
                                                activeAnswer?.selected_option ===
                                                key
                                                    ? null
                                                    : key,
                                        })
                                    }
                                    className={`flex min-h-16 w-full items-start gap-4 rounded-2xl border px-5 py-4 text-left transition focus:outline-none focus:ring-4 focus:ring-amber-500/20 ${activeAnswer?.selected_option === key ? 'border-amber-500 bg-amber-500/20 font-bold text-amber-500 shadow-lg shadow-amber-500/10 ring-2 ring-amber-500/40' : isDark ? 'border-white/10 bg-slate-950/60 text-slate-200 hover:border-amber-500/50 hover:bg-slate-950' : 'border-slate-200 bg-slate-50 text-slate-800 hover:border-amber-400 hover:bg-amber-500/5'}`}
                                >
                                    <span
                                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base font-black shadow-sm sm:h-10 sm:w-10 sm:text-lg ${activeAnswer?.selected_option === key ? 'bg-amber-500 text-slate-950' : isDark ? 'border border-white/10 bg-slate-800 text-slate-200' : 'border border-slate-300 bg-slate-200 text-slate-700'}`}
                                    >
                                        {key}
                                    </span>
                                    <div className="flex-1 pt-1 text-base font-medium leading-relaxed sm:text-lg">
                                        <RichExamText text={value} />
                                    </div>
                                </button>
                            ) : null,
                    )}
                </div>
            </div>
            <div
                className={`mt-10 flex flex-col gap-4 border-t pt-6 sm:flex-row sm:items-center sm:justify-between ${isDark ? 'border-white/10' : 'border-slate-200'}`}
            >
                <label
                    className={`flex cursor-pointer select-none items-center gap-2.5 text-sm font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}
                >
                    <input
                        type="checkbox"
                        checked={Boolean(activeAnswer?.is_marked_for_review)}
                        onChange={(event) =>
                            changeAnswer(activeQuestion.id, {
                                is_marked_for_review: event.target.checked,
                            })
                        }
                        className="h-5 w-5 rounded-lg border-slate-400 bg-slate-950 text-amber-500 focus:ring-amber-500/40"
                    />
                    <span>Ragu-ragu / Tandai Ditinjau</span>
                </label>
                <div className="flex w-full items-center gap-3 sm:w-auto">
                    <button
                        type="button"
                        onClick={goPrev}
                        disabled={activeIndex === 0}
                        className={`inline-flex min-h-12 min-w-0 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-2xl border px-3 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-30 sm:flex-none sm:px-5 sm:text-sm ${isDark ? 'border-white/15 bg-slate-950 text-slate-200 hover:bg-slate-800' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'}`}
                    >
                        <i className="fa-solid fa-arrow-left text-xs" />
                        <span className="sm:hidden">Sebelum</span>
                        <span className="hidden sm:inline">Soal Sebelumnya</span>
                    </button>
                    {isLastQuestion ? (
                        <div className={`flex min-h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-2xl border px-3 text-center text-xs font-bold sm:flex-none sm:px-5 sm:text-sm ${isDark ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-emerald-300 bg-emerald-50 text-emerald-800'}`}>
                            <i className="fa-solid fa-list-check text-xs" />
                            <span>Soal terakhir · periksa ringkasan lalu kumpulkan</span>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={goNext}
                            className="inline-flex min-h-12 min-w-0 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-2xl bg-amber-500 px-3 text-xs font-black text-slate-950 shadow-lg shadow-amber-500/25 transition hover:bg-amber-400 sm:flex-none sm:px-6 sm:text-sm"
                        >
                            <span className="sm:hidden">Berikutnya</span>
                            <span className="hidden sm:inline">Soal Berikutnya</span>
                            <i className="fa-solid fa-arrow-right text-xs" />
                        </button>
                    )}
                </div>
            </div>
        </article>
    );
}
