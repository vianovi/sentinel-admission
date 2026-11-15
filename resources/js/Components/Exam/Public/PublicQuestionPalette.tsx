import type { ExamAnswerState, ExamQuestion } from '@/types/exam';

type Props = {
    questions: ExamQuestion[];
    answerMap: Record<string, ExamAnswerState>;
    activeIndex: number;
    answeredCount: number;
    markedCount: number;
    themeMode: 'dark' | 'light';
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
    const isDark = themeMode === 'dark';
    const progressPercent = Math.round(
        (answeredCount / Math.max(1, questions.length)) * 100,
    );

    return (
        <div className="space-y-4">
            <div
                className={`rounded-3xl border p-5 shadow-xl backdrop-blur-xl transition-colors ${isDark ? 'border-white/10 bg-slate-900/85' : 'border-slate-200 bg-white'}`}
            >
                <div className="flex items-center justify-between">
                    <span
                        className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-600'}`}
                    >
                        Kemajuan Jawaban
                    </span>
                    <span className="text-xs font-black text-amber-500">
                        {progressPercent}%
                    </span>
                </div>
                <div className="mt-2.5 flex items-baseline justify-between">
                    <p
                        className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}
                    >
                        {answeredCount}{' '}
                        <span className="text-sm font-semibold text-slate-400">
                            dari {questions.length} Soal
                        </span>
                    </p>
                    {markedCount > 0 && (
                        <span className="rounded-lg border border-violet-500/20 bg-violet-500/10 px-2 py-0.5 text-xs font-bold text-violet-400">
                            {markedCount} Ragu
                        </span>
                    )}
                </div>
                <div
                    className={`mt-3 h-2 overflow-hidden rounded-full ${isDark ? 'bg-slate-950' : 'bg-slate-200'}`}
                    role="progressbar"
                    aria-label="Kemajuan menjawab soal"
                    aria-valuemin={0}
                    aria-valuemax={questions.length}
                    aria-valuenow={answeredCount}
                >
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-500 transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
            </div>
            <div
                className={`space-y-4 rounded-3xl border p-5 shadow-xl backdrop-blur-xl transition-colors ${isDark ? 'border-white/10 bg-slate-900/85' : 'border-slate-200 bg-white'}`}
            >
                <div className="flex flex-col gap-1 border-b border-slate-200 pb-3 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
                    <span
                        className={`text-xs font-extrabold uppercase tracking-wider ${isDark ? 'text-slate-200' : 'text-slate-800'}`}
                    >
                        <i className="fa-solid fa-table-cells mr-1.5 text-amber-500" />{' '}
                        Nomor Soal
                    </span>
                    <span className="text-xs font-medium text-slate-400">
                        Klik nomor untuk berpindah
                    </span>
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
                                aria-label={`Soal nomor ${index + 1}${active ? ', sedang dibuka' : ''}${answered ? ', sudah dijawab' : ', belum dijawab'}${marked ? ', ditandai ragu-ragu' : ''}`}
                                aria-current={active ? 'step' : undefined}
                                className={`relative z-0 flex h-11 items-center justify-center rounded-2xl text-sm font-black shadow-sm transition-all sm:h-12 sm:text-base ${active && answered ? 'z-10 scale-105 border-2 border-emerald-400 bg-emerald-500/25 text-emerald-300 shadow-lg shadow-emerald-500/20 ring-4 ring-amber-400/40' : active ? 'z-10 scale-105 bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30 ring-4 ring-amber-400/40' : answered ? 'border-2 border-emerald-500/40 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' : isDark ? 'border border-white/10 bg-slate-950 text-slate-300 hover:border-white/30' : 'border border-slate-200 bg-slate-100 text-slate-700 hover:border-amber-300'}`}
                            >
                                {index + 1}
                                {marked && (
                                    <span
                                        className={`absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full bg-violet-500 ring-2 ${isDark ? 'ring-slate-900' : 'ring-white'}`}
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>
                <div className="grid grid-cols-2 gap-2 border-t border-slate-200 pt-2 text-[11px] font-medium text-slate-400 dark:border-white/5">
                    <Legend
                        className="border border-emerald-500/50 bg-emerald-500/30"
                        label="Sudah Dijawab"
                    />
                    <Legend
                        className="bg-amber-500"
                        label="Sedang Dikerjakan"
                    />
                    <Legend
                        className="rounded-full bg-violet-500"
                        label="Ragu-ragu"
                    />
                    <Legend
                        className="border border-slate-600 bg-slate-700 dark:bg-slate-800"
                        label="Belum Dijawab"
                    />
                </div>
            </div>
        </div>
    );
}

function Legend({ className, label }: { className: string; label: string }) {
    return (
        <div className="flex items-center gap-2">
            <span className={`h-3 w-3 rounded-md ${className}`} />
            <span>{label}</span>
        </div>
    );
}
