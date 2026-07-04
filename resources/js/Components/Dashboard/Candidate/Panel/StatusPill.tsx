export type PillTone = "success" | "warning" | "danger" | "neutral" | "gold" | "muted";

type Props = {
    tone: PillTone;
    label: string;
};

const PILL_CLASS: Record<PillTone, string> = {
    success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    warning: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    danger: "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300",
    neutral: "border-slate-200 bg-slate-50 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300",
    gold: "border-gold/25 bg-gold/10 text-amber-700 dark:text-gold",
    muted: "border-slate-200 bg-slate-50 text-slate-400 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-500",
};

export default function StatusPill({ tone, label }: Props) {
    return (
        <span className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${PILL_CLASS[tone]}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {label}
        </span>
    );
}
