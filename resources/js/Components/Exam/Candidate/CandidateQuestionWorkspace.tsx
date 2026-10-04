import RichExamText from "@/Components/Exam/Shared/RichExamText";
import { StatusPill } from "@/Components/Dashboard/Candidate/Exam/ExamCandidateUi";
import type { ExamQuestion, ExamAnswerState } from "@/types/exam";

type Props = {
    activeQuestion: ExamQuestion;
    activeAnswer: ExamAnswerState | null;
    activeIndex: number;
    totalQuestions: number;
    changeAnswer: (questionId: number, patch: Partial<ExamAnswerState>) => void;
    goPrev: () => void;
    goNext: () => void;
};

export default function CandidateQuestionWorkspace({
    activeQuestion,
    activeAnswer,
    activeIndex,
    totalQuestions,
    changeAnswer,
    goPrev,
    goNext,
}: Props) {
    return (
        <main className="flex flex-col justify-between min-h-[calc(100vh-10rem)] xl:min-h-0 rounded-3xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-slate-900 sm:p-8 shadow-xl">
            <div className="flex-1 flex flex-col justify-start">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between border-b border-slate-100 dark:border-white/10 pb-5">
                    <div>
                        <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                            <i className="fa-solid fa-list-ol text-xs" /> Soal Nomor {activeIndex + 1} dari {totalQuestions}
                        </span>
                        <h2 className="mt-3 text-lg sm:text-xl font-bold leading-relaxed text-slate-900 dark:text-white">
                            <RichExamText text={activeQuestion.question_text} />
                        </h2>
                    </div>
                    <div className="flex flex-wrap gap-2 shrink-0">
                        <StatusPill value={`${activeQuestion.point} poin`} />
                        <StatusPill value={activeQuestion.difficulty} />
                    </div>
                </div>

                <div className="mt-6 space-y-3.5">
                    {Object.entries(activeQuestion.options).map(([key, value]) => value ? (
                        <button
                            key={key}
                            type="button"
                            onClick={() => changeAnswer(activeQuestion.id, {
                                selected_option: activeAnswer?.selected_option === key ? null : key,
                            })}
                            className={`flex min-h-16 w-full items-start gap-4 rounded-2xl border px-5 py-4 text-left transition focus:outline-none focus:ring-4 focus:ring-amber-500/20 sm:px-5 ${
                                activeAnswer?.selected_option === key
                                    ? "border-amber-500 bg-amber-500/15 text-amber-900 dark:text-amber-200 font-bold shadow-md shadow-amber-500/10 ring-2 ring-amber-500/30"
                                    : "border-slate-200 text-slate-800 hover:border-amber-400 hover:bg-amber-50/50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/[0.02]"
                            }`}
                        >
                            <span className={`flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl text-base sm:text-lg font-black ${
                                activeAnswer?.selected_option === key
                                    ? "bg-amber-500 text-slate-950 shadow-sm"
                                    : "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200"
                            }`}>{key}</span>
                            <div className="text-base sm:text-lg leading-relaxed pt-1 flex-1 font-medium">
                                <RichExamText text={value} />
                            </div>
                        </button>
                    ) : null)}
                </div>
            </div>

            <div className="mt-8 flex flex-col gap-4 border-t border-slate-200 pt-5 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
                <label className="flex items-center gap-3 text-sm font-bold text-slate-700 dark:text-slate-200 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={Boolean(activeAnswer?.is_marked_for_review)}
                        onChange={(event) => changeAnswer(activeQuestion.id, { is_marked_for_review: event.target.checked })}
                        className="h-5 w-5 rounded-lg border-slate-300 text-amber-500 focus:ring-amber-500"
                    />
                    <span>Tandai untuk ditinjau (Ragu-ragu)</span>
                </label>
                <div className="grid w-full grid-cols-2 gap-3 sm:flex sm:w-auto">
                    <button
                        type="button"
                        onClick={goPrev}
                        disabled={activeIndex === 0}
                        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 px-5 text-sm font-bold text-slate-700 hover:border-amber-400 hover:text-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500/20 disabled:cursor-not-allowed disabled:opacity-30 dark:border-white/10 dark:text-slate-200 transition"
                    >
                        <i className="fa-solid fa-arrow-left text-xs" /> Sebelumnya
                    </button>
                    <button
                        type="button"
                        onClick={goNext}
                        disabled={activeIndex === totalQuestions - 1}
                        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-amber-500 px-6 text-sm font-black text-slate-950 hover:bg-amber-400 focus:outline-none focus:ring-4 focus:ring-amber-500/30 disabled:cursor-not-allowed disabled:opacity-30 transition shadow-lg shadow-amber-500/20"
                    >
                        Berikutnya <i className="fa-solid fa-arrow-right text-xs" />
                    </button>
                </div>
            </div>
        </main>
    );
}
