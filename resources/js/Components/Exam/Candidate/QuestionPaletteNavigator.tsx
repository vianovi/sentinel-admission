import type { ExamQuestion, ExamAnswerState, ExamMeta, ExamAttemptState } from "@/types/exam";

type Props = {
    questions: ExamQuestion[];
    answerMap: Record<string, ExamAnswerState>;
    activeIndex: number;
    answeredCount: number;
    theme: string;
    exam: ExamMeta;
    attemptState: ExamAttemptState;
    setActiveIndex: (index: number) => void;
};

export default function QuestionPaletteNavigator({
    questions,
    answerMap,
    activeIndex,
    answeredCount,
    theme,
    exam,
    attemptState,
    setActiveIndex,
}: Props) {
    const isDark = theme === "dark";
    const markedCount = questions.filter((question) => answerMap[question.id]?.is_marked_for_review).length;
    const progressPercent = Math.round((answeredCount / Math.max(1, questions.length)) * 100);

    return (
        <div className="space-y-4">
            {/* Progress */}
            <div className={`rounded-lg border p-4 transition-colors ${
                isDark ? "border-white/10 bg-slate-900" : "border-slate-200 bg-white"
            }`}>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Progress</p>
                <div className="mt-3 flex items-end justify-between">
                    <p className="text-2xl font-black text-slate-900 dark:text-white">{answeredCount}/{questions.length}</p>
                    <p className="text-xs font-semibold text-slate-500">{progressPercent}%</p>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                    <div className="h-full rounded-full bg-amber-500" style={{ width: `${progressPercent}%` }} />
                </div>
            </div>

            {/* Question Palette Grid */}
            <div className={`rounded-lg border p-4 transition-colors ${
                isDark ? "border-white/10 bg-slate-900" : "border-slate-200 bg-white"
            }`}>
                <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Navigasi soal</p>
                    <span className="text-xs font-semibold text-slate-500">{markedCount} ditandai</span>
                </div>
                <div className="grid grid-cols-5 gap-2.5">
                    {questions.map((question, index) => {
                        const answer = answerMap[question.id];
                        const answered = Boolean(answer?.selected_option);
                        const marked = Boolean(answer?.is_marked_for_review);
                        const active = index === activeIndex;

                        return (
                            <button
                                key={question.id}
                                type="button"
                                onClick={() => setActiveIndex(index)}
                                className={`relative flex h-11 sm:h-12 items-center justify-center rounded-2xl text-sm sm:text-base font-black transition-all shadow-sm ${
                                    active
                                        ? "bg-amber-500 text-slate-950 ring-4 ring-amber-400/40 shadow-lg shadow-amber-500/30 scale-105 z-10"
                                        : answered
                                            ? "bg-emerald-500/20 text-emerald-500 border-2 border-emerald-500/40 hover:bg-emerald-500/30"
                                            : isDark
                                                ? "bg-slate-950 text-slate-300 border border-white/10 hover:border-white/30"
                                                : "bg-slate-100 text-slate-700 border border-slate-200 hover:border-amber-300"
                                }`}
                                aria-label={`Soal ${index + 1}`}
                            >
                                {index + 1}
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
                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-white/5 grid grid-cols-2 gap-2 text-[11px] font-medium text-slate-500 dark:text-slate-400">
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
                        <span className="w-3 h-3 rounded-md bg-slate-200 dark:bg-slate-800 border border-slate-400/30" />
                        <span>Belum Dijawab</span>
                    </div>
                </div>
            </div>

            {/* Summary Info Card */}
            <div className={`rounded-lg border p-4 text-sm transition-colors ${
                isDark ? "border-white/10 bg-slate-900 text-slate-300" : "border-slate-200 bg-white text-slate-600"
            }`}>
                <p className="font-bold text-slate-900 dark:text-white">Ringkasan sesi</p>
                <dl className="mt-3 space-y-2">
                    <Info label="Paket" value={exam.package_title ?? "-"} />
                    <Info label="Mapel" value={exam.subject_name ?? "-"} />
                    <Info label="Mulai" value={attemptState.started_at ?? "-"} />
                    <Info label="Berakhir" value={attemptState.expires_at ?? "-"} />
                </dl>
            </div>
        </div>
    );
}

function Info({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-start justify-between gap-3">
            <dt className="text-xs text-slate-500 dark:text-slate-400">{label}</dt>
            <dd className="text-right text-xs font-semibold text-slate-800 dark:text-slate-100">{value}</dd>
        </div>
    );
}
