import type { ExamQuestion, ExamAnswerState } from "@/types/exam";

type Props = {
    questions: ExamQuestion[];
    answerMap: Record<string, ExamAnswerState>;
    activeIndex: number;
    answeredCount: number;
    markedCount: number;
    themeMode: "dark" | "light";
    setActiveIndex: (index: number) => void;
};

export default function PublicQuestionPalette({
    questions,
    answerMap,
    activeIndex,
    answeredCount,
    markedCount,
    themeMode,
    setActiveIndex,
}: Props) {
    const isDark = themeMode === "dark";
    const progressPercent = Math.round((answeredCount / Math.max(1, questions.length)) * 100);

    return (
        <div className="space-y-4">
            {/* Progress */}
            <div className={`rounded-2xl border p-4 shadow-xl backdrop-blur-xl transition-colors ${
                isDark ? "border-white/10 bg-slate-900/80" : "border-slate-200 bg-white"
            }`}>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    Kemajuan Dijawab
                </span>
                <div className="mt-2 flex items-baseline justify-between">
                    <p className={`text-xl font-black ${isDark ? "text-white" : "text-slate-900"}`}>{answeredCount} / {questions.length}</p>
                    <p className="text-xs font-bold text-amber-500">
                        {progressPercent}%
                    </p>
                </div>
                <div className={`mt-2.5 h-1.5 overflow-hidden rounded-full ${isDark ? "bg-slate-950" : "bg-slate-200"}`}>
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
            </div>

            {/* Question Palette Grid */}
            <div className={`rounded-2xl border p-4 shadow-xl backdrop-blur-xl transition-colors ${
                isDark ? "border-white/10 bg-slate-900/80" : "border-slate-200 bg-white"
            }`}>
                <div className="flex items-center justify-between mb-3">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"}`}>Navigasi Soal</span>
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
                                            : isDark
                                                ? "bg-slate-950 text-slate-400 border border-white/5 hover:border-white/20"
                                                : "bg-slate-100 text-slate-700 border border-slate-200 hover:border-slate-300"
                                }`}
                            >
                                {idx + 1}
                                {marked && (
                                    <span className={`absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-violet-500 ring-2 ${
                                        isDark ? "ring-slate-900" : "ring-white"
                                    }`} />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
