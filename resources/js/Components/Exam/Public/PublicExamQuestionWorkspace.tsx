import RichExamText from "@/Components/Exam/Shared/RichExamText";
import type { ExamQuestion, ExamAnswerState } from "@/types/exam";

type Props = {
    activeQuestion: ExamQuestion;
    activeAnswer: ExamAnswerState | null;
    activeIndex: number;
    totalQuestions: number;
    themeMode: "dark" | "light";
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
    const isDark = themeMode === "dark";

    return (
        <main className={`flex flex-col justify-between min-h-[calc(100vh-12rem)] xl:min-h-0 rounded-3xl border p-6 sm:p-8 shadow-xl backdrop-blur-xl transition-colors ${
            isDark ? "border-white/10 bg-slate-900/85" : "border-slate-200 bg-white"
        }`}>
            <div className="flex-1 flex flex-col justify-start">
                <div className={`flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between border-b pb-5 ${
                    isDark ? "border-white/10" : "border-slate-200"
                }`}>
                    <div>
                        <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                            <i className="fa-solid fa-list-ol text-xs" /> Soal Nomor {activeIndex + 1} dari {totalQuestions}
                        </span>
                        <div className={`mt-3 text-lg sm:text-xl font-bold leading-relaxed ${
                            isDark ? "text-white" : "text-slate-900"
                        }`}>
                            <RichExamText text={activeQuestion.question_text} />
                        </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                        <span className={`rounded-xl px-3.5 py-1.5 text-xs sm:text-sm font-black border shadow-sm ${
                            isDark ? "bg-slate-800 text-amber-400 border-amber-500/20" : "bg-amber-50 text-amber-700 border-amber-300"
                        }`}>
                            {activeQuestion.point} Poin
                        </span>
                    </div>
                </div>

                {/* Options List */}
                <div className="mt-6 space-y-3.5">
                    {Object.entries(activeQuestion.options).map(([key, value]) => value ? (
                        <button
                            key={key}
                            type="button"
                            onClick={() => changeAnswer(activeQuestion.id, {
                                selected_option: activeAnswer?.selected_option === key ? null : key,
                            })}
                            className={`flex min-h-16 w-full items-start gap-4 rounded-2xl border px-5 py-4 text-left transition focus:outline-none ${
                                activeAnswer?.selected_option === key
                                    ? "border-amber-500 bg-amber-500/20 text-amber-500 font-bold shadow-lg shadow-amber-500/10 ring-2 ring-amber-500/40"
                                    : isDark
                                        ? "border-white/10 bg-slate-950/60 text-slate-200 hover:border-amber-500/50 hover:bg-slate-950"
                                        : "border-slate-200 bg-slate-50 text-slate-800 hover:border-amber-400 hover:bg-amber-500/5"
                            }`}
                        >
                            <span className={`flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl text-base sm:text-lg font-black shadow-sm ${
                                activeAnswer?.selected_option === key
                                    ? "bg-amber-500 text-slate-950"
                                    : isDark ? "bg-slate-800 text-slate-200 border border-white/10" : "bg-slate-200 text-slate-700 border border-slate-300"
                            }`}>
                                {key}
                            </span>
                            <div className="text-base sm:text-lg leading-relaxed pt-1 flex-1 font-medium">
                                <RichExamText text={value} />
                            </div>
                        </button>
                    ) : null)}
                </div>
            </div>

            {/* Footer Action Controls */}
            <div className={`mt-10 flex flex-col gap-4 border-t pt-6 sm:flex-row sm:items-center sm:justify-between ${
                isDark ? "border-white/10" : "border-slate-200"
            }`}>
                <label className={`flex items-center gap-2.5 text-sm font-bold cursor-pointer select-none ${
                    isDark ? "text-slate-300" : "text-slate-700"
                }`}>
                    <input
                        type="checkbox"
                        checked={Boolean(activeAnswer?.is_marked_for_review)}
                        onChange={(e) => changeAnswer(activeQuestion.id, { is_marked_for_review: e.target.checked })}
                        className="h-5 w-5 rounded-lg border-slate-400 bg-slate-950 text-amber-500 focus:ring-amber-500/40"
                    />
                    <span>Ragu-ragu / Tandai Ditinjau</span>
                </label>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={goPrev}
                        disabled={activeIndex === 0}
                        className={`inline-flex min-h-12 items-center gap-2 rounded-2xl border px-5 text-sm font-bold disabled:opacity-30 disabled:cursor-not-allowed transition ${
                            isDark ? "border-white/15 bg-slate-950 text-slate-200 hover:bg-slate-800" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                        }`}
                    >
                        <i className="fa-solid fa-arrow-left text-xs" /> Soal Sebelumnya
                    </button>

                    <button
                        type="button"
                        onClick={goNext}
                        disabled={activeIndex === totalQuestions - 1}
                        className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-amber-500 px-6 text-sm font-black text-slate-950 hover:bg-amber-400 disabled:opacity-30 disabled:cursor-not-allowed transition shadow-lg shadow-amber-500/25"
                    >
                        Soal Berikutnya <i className="fa-solid fa-arrow-right text-xs" />
                    </button>
                </div>
            </div>
        </main>
    );
}
