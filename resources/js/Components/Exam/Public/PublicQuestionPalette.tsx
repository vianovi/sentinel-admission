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
            {/* Progress Card */}
            <div className={`rounded-3xl border p-5 shadow-xl backdrop-blur-xl transition-colors ${
                isDark ? "border-white/10 bg-slate-900/85" : "border-slate-200 bg-white"
            }`}>
                <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                        Kemajuan Jawaban
                    </span>
                    <span className="text-xs font-black text-amber-500">
                        {progressPercent}%
                    </span>
                </div>
                <div className="mt-2.5 flex items-baseline justify-between">
                    <p className={`text-2xl font-black ${isDark ? "text-white" : "text-slate-900"}`}>
                        {answeredCount} <span className="text-sm font-semibold text-slate-400">dari {questions.length} Soal</span>
                    </p>
                    {markedCount > 0 && (
                        <span className="text-xs font-bold text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-lg border border-violet-500/20">
                            {markedCount} Ragu
                        </span>
                    )}
                </div>
                <div className={`mt-3 h-2 overflow-hidden rounded-full ${isDark ? "bg-slate-950" : "bg-slate-200"}`}>
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-500 transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
            </div>

            {/* Question Palette Grid */}
            <div className={`rounded-3xl border p-5 shadow-xl backdrop-blur-xl transition-colors space-y-4 ${
                isDark ? "border-white/10 bg-slate-900/85" : "border-slate-200 bg-white"
            }`}>
                <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-white/10">
                    <span className={`text-xs font-extrabold uppercase tracking-wider ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                        <i className="fa-solid fa-table-cells mr-1.5 text-amber-500" /> Nomor Soal
                    </span>
                    <span className="text-xs font-medium text-slate-400">
                        Klik nomor untuk berpindah
                    </span>
                </div>

                <div className="grid grid-cols-5 gap-2.5">
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
                                className={`relative flex h-11 sm:h-12 items-center justify-center rounded-2xl text-sm sm:text-base font-black transition-all shadow-sm ${
                                    active
                                        ? "bg-amber-500 text-slate-950 ring-4 ring-amber-400/40 shadow-lg shadow-amber-500/30 scale-105 z-10"
                                        : answered
                                            ? "bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500/40 hover:bg-emerald-500/30"
                                            : isDark
                                                ? "bg-slate-950 text-slate-300 border border-white/10 hover:border-white/30"
                                                : "bg-slate-100 text-slate-700 border border-slate-200 hover:border-amber-300"
                                }`}
                                title={`Soal nomor ${idx + 1}`}
                            >
                                {idx + 1}
                                {marked && (
                                    <span className={`absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-violet-500 ring-2 ${
                                        isDark ? "ring-slate-900" : "ring-white"
                                    }`} />
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Legend Guide */}
                <div className="pt-2 border-t border-slate-200 dark:border-white/5 grid grid-cols-2 gap-2 text-[11px] font-medium text-slate-400">
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-md bg-emerald-500/30 border border-emerald-500/50" />
                        <span>Sudah Dijawab</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-md bg-amber-500" />
                        <span>Sedang Dikerjakan</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-violet-500" />
                        <span>Ragu-ragu</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-md bg-slate-700 dark:bg-slate-800 border border-slate-600" />
                        <span>Belum Dijawab</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
