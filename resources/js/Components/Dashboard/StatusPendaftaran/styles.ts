import type { StatusTone } from "./types";

export const tonePillClass: Record<StatusTone, string> = {
    success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    warning: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    danger: "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300",
    primary: "border-gold/25 bg-gold/10 text-amber-700 dark:text-gold",
    neutral: "border-slate-300 bg-slate-100 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300",
    muted: "border-slate-200 bg-slate-50 text-slate-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-400",
};

export const toneIconClass: Record<StatusTone, string> = {
    success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
    warning: "bg-amber-500/10 text-amber-600 dark:text-amber-300",
    danger: "bg-red-500/10 text-red-600 dark:text-red-300",
    primary: "bg-gold/10 text-amber-600 dark:text-gold",
    neutral: "bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300",
    muted: "bg-slate-50 text-slate-400 dark:bg-white/[0.03] dark:text-slate-500",
};
