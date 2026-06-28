import type { ActionTone, SectionState } from "./types";

export const stateClasses: Record<SectionState, string> = {
    complete: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20",
    warning: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20",
    incomplete: "bg-slate-50 text-slate-600 border-slate-200 dark:bg-white/[0.04] dark:text-slate-300 dark:border-white/[0.08]",
};

export const toneClasses: Record<ActionTone, string> = {
    primary: "bg-gold text-navy hover:bg-goldhover",
    warning: "bg-amber-500 text-white hover:bg-amber-600",
    danger: "bg-red-500 text-white hover:bg-red-600",
    neutral: "bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200",
};

export const stateLabel = (state: SectionState): string => {
    const labels: Record<SectionState, string> = {
        complete: "Lengkap",
        warning: "Perlu Dicek",
        incomplete: "Belum Lengkap",
    };

    return labels[state];
};

export const formatRupiah = (amount: number): string =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(amount);
