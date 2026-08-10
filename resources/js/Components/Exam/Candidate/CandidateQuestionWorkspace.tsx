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
        <main className="flex flex-col justify-between min-h-[calc(100vh-10rem)] xl:min-h-0 rounded-lg border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-900 sm:p-4">
            <div className="flex-1 flex flex-col justify-start">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Soal {activeIndex + 1} dari {totalQuestions}</p>
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
            </div>

            <div className="mt-5 flex flex-col gap-3 border-t border-slate-200 pt-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
                <label className="flex items-center gap-3 text-sm font-semibold text-slate-700 dark:text-slate-200 cursor-pointer">
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
                        disabled={activeIndex === totalQuestions - 1}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-amber-500 px-3 text-sm font-bold text-white hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Berikutnya <i className="fa-solid fa-arrow-right text-xs" />
                    </button>
                </div>
            </div>
        </main>
    );
}
