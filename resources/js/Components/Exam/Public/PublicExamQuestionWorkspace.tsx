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
        <main className={`flex flex-col justify-between min-h-[calc(100vh-12rem)] xl:min-h-0 rounded-2xl border p-5 shadow-xl backdrop-blur-xl sm:p-6 transition-colors ${
            isDark ? "border-white/10 bg-slate-900/80" : "border-slate-200 bg-white"
        }`}>
            <div className="flex-1 flex flex-col justify-start">
                <div className={`flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between border-b pb-4 ${
                    isDark ? "border-white/10" : "border-slate-200"
                }`}>
                    <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500">
                            Soal Nomor {activeIndex + 1} dari {totalQuestions}
                        </span>
                        <div className={`mt-2 text-base md:text-lg font-semibold leading-relaxed ${
                            isDark ? "text-white" : "text-slate-900"
                        }`}>
                            <RichExamText text={activeQuestion.question_text} />
                        </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                        <span className={`rounded-lg px-2.5 py-1 text-xs font-bold border ${
                            isDark ? "bg-slate-800 text-slate-300 border-white/5" : "bg-slate-100 text-slate-700 border-slate-200"
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
                                    : isDark
                                        ? "border-white/10 bg-slate-950/60 text-slate-300 hover:border-amber-500/40 hover:bg-slate-950"
                                        : "border-slate-200 bg-slate-50 text-slate-800 hover:border-amber-500/40 hover:bg-slate-100"
                            }`}
                        >
                            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sm font-black ${
                                activeAnswer?.selected_option === key
                                    ? "bg-amber-500 text-slate-950"
                                    : isDark ? "bg-slate-800 text-slate-300" : "bg-slate-200 text-slate-700"
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
                isDark ? "border-white/10" : "border-slate-200"
            }`}>
                <label className={`flex items-center gap-2 text-xs font-semibold cursor-pointer select-none ${
                    isDark ? "text-slate-400" : "text-slate-600"
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
                            isDark ? "border-white/10 bg-slate-950 text-slate-300 hover:bg-slate-800" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                        }`}
                    >
                        <i className="fa-solid fa-arrow-left text-[10px]" /> Sebelum
                    </button>

                    <button
                        type="button"
                        onClick={goNext}
                        disabled={activeIndex === totalQuestions - 1}
                        className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-amber-500 px-4 text-xs font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-lg shadow-amber-500/20"
                    >
                        Berikut <i className="fa-solid fa-arrow-right text-[10px]" />
                    </button>
                </div>
            </div>
        </main>
    );
}
